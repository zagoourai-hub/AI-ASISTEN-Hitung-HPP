from __future__ import annotations

from collections.abc import AsyncIterable
from dataclasses import dataclass
from pathlib import Path
from uuid import UUID, uuid4

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ErrorCode
from app.models.product import Product
from app.repositories.product import ProductRepository

ALLOWED_IMAGE_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
IMAGE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


@dataclass(frozen=True)
class StoredProductImage:
    key: str
    media_type: str
    size_bytes: int


class ProductImageStorage:
    def __init__(self, root: str | Path) -> None:
        self.root = Path(root).resolve()

    async def store(
        self,
        *,
        content_type: str,
        chunks: AsyncIterable[bytes],
        max_bytes: int,
    ) -> StoredProductImage:
        media_type = content_type.split(";", 1)[0].strip().lower()
        if media_type not in ALLOWED_IMAGE_TYPES:
            raise self._invalid_image("Format gambar harus JPG, PNG, atau WebP.")

        key = f"products/{uuid4().hex}{IMAGE_EXTENSIONS[media_type]}"
        destination = self.path_for(key)
        destination.parent.mkdir(parents=True, exist_ok=True)
        total = 0
        signature = b""

        try:
            with destination.open("wb") as output:
                async for chunk in chunks:
                    if not chunk:
                        continue
                    if len(signature) < 16:
                        signature = (signature + chunk)[:16]
                    total += len(chunk)
                    if total > max_bytes:
                        raise self._invalid_image("Ukuran gambar maksimal 5 MB.")
                    output.write(chunk)
        except Exception:
            self.delete(key)
            raise

        if total == 0 or not self._matches_signature(media_type, signature):
            self.delete(key)
            raise self._invalid_image("Isi file bukan gambar yang valid.")

        return StoredProductImage(key=key, media_type=media_type, size_bytes=total)

    def path_for(self, key: str) -> Path:
        candidate = (self.root / key).resolve()
        try:
            candidate.relative_to(self.root)
        except ValueError as error:
            raise AppError(
                ErrorCode.INTERNAL_ERROR,
                "Product image path is invalid.",
                status_code=500,
            ) from error
        return candidate

    def delete(self, key: str) -> None:
        try:
            self.path_for(key).unlink()
        except FileNotFoundError:
            return

    @staticmethod
    def _matches_signature(media_type: str, signature: bytes) -> bool:
        if media_type == "image/jpeg":
            return signature.startswith(b"\xff\xd8\xff")
        if media_type == "image/png":
            return signature.startswith(b"\x89PNG\r\n\x1a\n")
        return len(signature) >= 12 and signature[:4] == b"RIFF" and signature[8:12] == b"WEBP"

    @staticmethod
    def _invalid_image(message: str) -> AppError:
        return AppError(ErrorCode.VALIDATION_ERROR, message, status_code=422)


class ProductImageService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        storage: ProductImageStorage,
        repository: ProductRepository | None = None,
    ) -> None:
        self.session = session
        self.storage = storage
        self.repository = repository or ProductRepository()

    async def upload(
        self,
        *,
        business_id: UUID,
        product_id: UUID,
        content_type: str,
        chunks: AsyncIterable[bytes],
        max_bytes: int,
    ) -> Product:
        existing = await self.repository.find_product(
            self.session,
            business_id=business_id,
            product_id=product_id,
            include_archived=False,
        )
        if existing is None:
            raise self._not_found()
        await self.session.commit()

        stored = await self.storage.store(
            content_type=content_type,
            chunks=chunks,
            max_bytes=max_bytes,
        )
        old_key: str | None = None
        try:
            async with self.session.begin():
                product = await self.repository.find_product(
                    self.session,
                    business_id=business_id,
                    product_id=product_id,
                    include_archived=False,
                )
                if product is None:
                    raise self._not_found()
                old_key = product.image_key
                product.image_key = stored.key
                product.image_media_type = stored.media_type
                product.image_size_bytes = stored.size_bytes
                await self.session.flush()
        except (IntegrityError, AppError):
            self.storage.delete(stored.key)
            raise
        except Exception:
            self.storage.delete(stored.key)
            raise

        if old_key is not None:
            self.storage.delete(old_key)
        return product

    async def remove(self, *, business_id: UUID, product_id: UUID) -> None:
        old_key: str | None = None
        async with self.session.begin():
            product = await self.repository.find_product(
                self.session,
                business_id=business_id,
                product_id=product_id,
            )
            if product is None:
                raise self._not_found()
            old_key = product.image_key
            product.image_key = None
            product.image_media_type = None
            product.image_size_bytes = None
            await self.session.flush()
        if old_key is not None:
            self.storage.delete(old_key)

    async def resolve(
        self,
        *,
        business_id: UUID,
        product_id: UUID,
    ) -> tuple[Path, str]:
        product = await self.repository.find_product(
            self.session,
            business_id=business_id,
            product_id=product_id,
        )
        if product is None or product.image_key is None or product.image_media_type is None:
            raise self._not_found()
        path = self.storage.path_for(product.image_key)
        if not path.is_file():
            raise AppError(
                ErrorCode.INTERNAL_ERROR,
                "Product image is unavailable.",
                status_code=500,
            )
        return path, product.image_media_type

    @staticmethod
    def _not_found() -> AppError:
        return AppError(
            ErrorCode.RESOURCE_NOT_FOUND,
            "Product not found.",
            status_code=404,
        )
