from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cost import ProductCostVersion
from app.models.ingredient import Ingredient, IngredientPriceHistory
from app.models.product import Product, ProductVariant
from app.repositories.tenant import business_scope_clause

CONTEXT_ROW_LIMIT = 20


class AIContextRepository:
    async def snapshot(
        self,
        session: AsyncSession,
        *,
        business_id: UUID,
    ) -> dict[str, object]:
        product_rows = (
            await session.execute(
                select(
                    Product.name,
                    ProductVariant.name,
                    ProductVariant.selling_price,
                    ProductVariant.packaging_cost,
                    ProductVariant.direct_cost,
                    ProductVariant.target_margin_override,
                )
                .join(ProductVariant, ProductVariant.product_id == Product.id)
                .where(
                    business_scope_clause(Product.business_id, business_id),
                    Product.status == "ACTIVE",
                )
                .order_by(Product.name, ProductVariant.name)
                .limit(CONTEXT_ROW_LIMIT)
            )
        ).all()
        hpp_rows = (
            await session.execute(
                select(
                    Product.name,
                    ProductVariant.name,
                    ProductCostVersion.full_hpp,
                    ProductCostVersion.ingredient_cost,
                    ProductCostVersion.packaging_cost,
                    ProductCostVersion.direct_cost,
                    ProductCostVersion.overhead_cost,
                    ProductCostVersion.price_as_of,
                    ProductCostVersion.calculated_at,
                )
                .join(
                    ProductVariant,
                    ProductVariant.id == ProductCostVersion.product_variant_id,
                )
                .join(Product, Product.id == ProductVariant.product_id)
                .where(business_scope_clause(Product.business_id, business_id))
                .order_by(ProductCostVersion.calculated_at.desc())
                .limit(CONTEXT_ROW_LIMIT)
            )
        ).all()
        ingredient_rows = (
            await session.execute(
                select(
                    Ingredient.name,
                    Ingredient.base_unit,
                    Ingredient.current_unit_cost,
                    Ingredient.updated_at,
                )
                .where(
                    business_scope_clause(Ingredient.business_id, business_id),
                    Ingredient.archived_at.is_(None),
                )
                .order_by(Ingredient.updated_at.desc(), Ingredient.name)
                .limit(CONTEXT_ROW_LIMIT)
            )
        ).all()
        price_rows = (
            await session.execute(
                select(
                    Ingredient.name,
                    IngredientPriceHistory.unit_cost,
                    IngredientPriceHistory.purchase_unit,
                    IngredientPriceHistory.effective_at,
                )
                .join(Ingredient, Ingredient.id == IngredientPriceHistory.ingredient_id)
                .where(
                    business_scope_clause(Ingredient.business_id, business_id),
                    Ingredient.archived_at.is_(None),
                )
                .order_by(IngredientPriceHistory.effective_at.desc())
                .limit(CONTEXT_ROW_LIMIT)
            )
        ).all()

        return {
            "products": [
                {
                    "product": product_name,
                    "variant": variant_name,
                    "sellingPrice": str(selling_price),
                    "packagingCost": str(packaging_cost),
                    "directCost": str(direct_cost),
                    "targetMargin": str(target_margin) if target_margin is not None else None,
                }
                for (
                    product_name,
                    variant_name,
                    selling_price,
                    packaging_cost,
                    direct_cost,
                    target_margin,
                ) in product_rows
            ],
            "hppHistory": [
                {
                    "product": product_name,
                    "variant": variant_name,
                    "fullHpp": str(full_hpp),
                    "ingredientCost": str(ingredient_cost),
                    "packagingCost": str(packaging_cost),
                    "directCost": str(direct_cost),
                    "overheadCost": str(overhead_cost),
                    "priceAsOf": price_as_of.isoformat(),
                    "calculatedAt": calculated_at.isoformat(),
                }
                for (
                    product_name,
                    variant_name,
                    full_hpp,
                    ingredient_cost,
                    packaging_cost,
                    direct_cost,
                    overhead_cost,
                    price_as_of,
                    calculated_at,
                ) in hpp_rows
            ],
            "ingredients": [
                {
                    "name": name,
                    "baseUnit": base_unit,
                    "currentUnitCost": str(current_unit_cost)
                    if current_unit_cost is not None
                    else None,
                    "updatedAt": updated_at.isoformat(),
                }
                for name, base_unit, current_unit_cost, updated_at in ingredient_rows
            ],
            "ingredientPriceHistory": [
                {
                    "name": name,
                    "unitCost": str(unit_cost),
                    "purchaseUnit": purchase_unit,
                    "effectiveAt": effective_at.isoformat(),
                }
                for name, unit_cost, purchase_unit, effective_at in price_rows
            ],
        }
