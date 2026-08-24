from __future__ import annotations

from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ErrorCode
from app.models.ingredient import Ingredient
from app.models.recipe import RecipeItem, RecipeVersion
from app.repositories.recipe import RecipeRepository
from app.schemas.recipe import RecipeCreateRequest, RecipeItemInput, RecipeUpdateRequest
from app.utils.types import RecipeStatus, new_id, utc_now


class RecipeService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        repository: RecipeRepository | None = None,
    ) -> None:
        self.session = session
        self.repository = repository or RecipeRepository()

    async def list_versions(
        self,
        *,
        business_id: UUID,
        variant_id: UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[RecipeVersion], int]:
        from app.schemas.pagination import PaginationParams

        return await self.repository.list_versions(
            self.session,
            business_id=business_id,
            variant_id=variant_id,
            pagination=PaginationParams(page=page, page_size=page_size),
        )

    async def create_version(
        self,
        *,
        business_id: UUID,
        variant_id: UUID,
        payload: RecipeCreateRequest,
    ) -> RecipeVersion:
        try:
            async with self.session.begin():
                variant = await self.repository.find_variant(
                    self.session,
                    business_id=business_id,
                    variant_id=variant_id,
                )
                if variant is None:
                    raise self._not_found("Product variant")
                recipe_version = RecipeVersion(
                    id=new_id(),
                    product_variant_id=variant.id,
                    version=await self.repository.next_version(
                        self.session,
                        variant_id=variant.id,
                    ),
                    status=RecipeStatus.DRAFT,
                    change_reason=payload.change_reason,
                )
                recipe_version.items = []
                self.repository.add_version(self.session, recipe_version)
                await self.session.flush()
                items = await self._build_items(
                    business_id=business_id,
                    recipe_version_id=recipe_version.id,
                    inputs=payload.items,
                )
                for item in items:
                    recipe_version.items.append(item)
                    self.repository.add_item(self.session, item)
                await self.session.flush()
        except IntegrityError as error:
            raise self._conflict() from error
        created = await self.repository.find_version(
            self.session,
            business_id=business_id,
            recipe_version_id=recipe_version.id,
        )
        if created is None:
            raise self._not_found("Recipe version")
        return created

    async def update_draft(
        self,
        *,
        business_id: UUID,
        recipe_version_id: UUID,
        payload: RecipeUpdateRequest,
    ) -> RecipeVersion:
        try:
            async with self.session.begin():
                recipe_version = await self.repository.find_version(
                    self.session,
                    business_id=business_id,
                    recipe_version_id=recipe_version_id,
                    lock=True,
                )
                if recipe_version is None:
                    raise self._not_found("Recipe version")
                if recipe_version.status != RecipeStatus.DRAFT:
                    raise self._invalid_state("Only draft recipes can be edited.")
                if "change_reason" in payload.model_fields_set:
                    recipe_version.change_reason = payload.change_reason
                if payload.items is not None:
                    items = await self._build_items(
                        business_id=business_id,
                        recipe_version_id=recipe_version.id,
                        inputs=payload.items,
                    )
                    recipe_version.items.clear()
                    for item in items:
                        recipe_version.items.append(item)
                        self.repository.add_item(self.session, item)
                await self.session.flush()
        except IntegrityError as error:
            raise self._conflict() from error
        return recipe_version

    async def activate(
        self,
        *,
        business_id: UUID,
        recipe_version_id: UUID,
    ) -> RecipeVersion:
        try:
            async with self.session.begin():
                recipe_version = await self.repository.find_version(
                    self.session,
                    business_id=business_id,
                    recipe_version_id=recipe_version_id,
                    lock=True,
                )
                if recipe_version is None:
                    raise self._not_found("Recipe version")
                if recipe_version.status == RecipeStatus.ARCHIVED:
                    raise self._invalid_state("Archived recipes cannot be activated.")
                if not recipe_version.items:
                    raise self._invalid_state("An active recipe must contain at least one item.")

                variant = await self.repository.lock_variant(
                    self.session,
                    business_id=business_id,
                    variant_id=recipe_version.product_variant_id,
                )
                if variant is None:
                    raise self._not_found("Product variant")
                active_versions = await self.repository.list_active_versions(
                    self.session,
                    variant_id=variant.id,
                    lock=True,
                )
                for active_version in active_versions:
                    if active_version.id != recipe_version.id:
                        active_version.status = RecipeStatus.ARCHIVED
                recipe_version.status = RecipeStatus.ACTIVE
                recipe_version.activated_at = utc_now()
                await self.session.flush()
        except IntegrityError as error:
            raise self._conflict() from error
        return recipe_version

    async def _build_items(
        self,
        *,
        business_id: UUID,
        recipe_version_id: UUID,
        inputs: list[RecipeItemInput],
    ) -> list[RecipeItem]:
        items: list[RecipeItem] = []
        for item_input in inputs:
            ingredient = await self.repository.find_ingredient(
                self.session,
                business_id=business_id,
                ingredient_id=item_input.ingredient_id,
            )
            if ingredient is None:
                raise self._not_found("Ingredient")
            await self._validate_unit(ingredient, item_input.unit)
            items.append(
                RecipeItem(
                    id=new_id(),
                    recipe_version_id=recipe_version_id,
                    ingredient_id=ingredient.id,
                    quantity=item_input.quantity,
                    unit=item_input.unit,
                    ingredient=ingredient,
                )
            )
        return items

    async def _validate_unit(self, ingredient: Ingredient, unit: str) -> None:
        if unit == ingredient.base_unit:
            return
        direct = await self.repository.find_conversion(
            self.session,
            ingredient_id=ingredient.id,
            from_unit=unit,
            to_unit=ingredient.base_unit,
        )
        if direct is not None:
            return
        reverse = await self.repository.find_conversion(
            self.session,
            ingredient_id=ingredient.id,
            from_unit=ingredient.base_unit,
            to_unit=unit,
        )
        if reverse is None:
            raise AppError(
                ErrorCode.INVALID_UNIT_CONVERSION,
                "A direct conversion to or from the ingredient base unit is required.",
                status_code=422,
            )

    @staticmethod
    def _not_found(resource: str) -> AppError:
        return AppError(
            ErrorCode.RESOURCE_NOT_FOUND,
            f"{resource} not found.",
            status_code=404,
        )

    @staticmethod
    def _invalid_state(message: str) -> AppError:
        return AppError(ErrorCode.INVALID_RECIPE_STATE, message, status_code=422)

    @staticmethod
    def _conflict() -> AppError:
        return AppError(
            ErrorCode.CALCULATION_CONFLICT,
            "Recipe version changed concurrently. Please retry.",
            status_code=409,
        )
