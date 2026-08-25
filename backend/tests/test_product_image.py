from collections.abc import AsyncIterator
from pathlib import Path

import pytest

from app.core.exceptions import AppError
from app.models.product import Product
from app.services.product_image import ProductImageStorage

PNG_1X1 = bytes.fromhex(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
    "1f15c4890000000d49444154789c6360f8cf00000004000101c9"
    "2b0000000049454e44ae426082"
)


async def image_chunks(payload: bytes, chunk_size: int = 5) -> AsyncIterator[bytes]:
    for offset in range(0, len(payload), chunk_size):
        yield payload[offset : offset + chunk_size]


@pytest.mark.asyncio
async def test_product_image_storage_validates_signature_and_writes_random_key(
    tmp_path: Path,
) -> None:
    storage = ProductImageStorage(tmp_path)

    stored = await storage.store(
        content_type="image/png",
        chunks=image_chunks(PNG_1X1),
        max_bytes=1024,
    )

    image_path = storage.path_for(stored.key)
    assert stored.media_type == "image/png"
    assert stored.size_bytes == len(PNG_1X1)
    assert stored.key.startswith("products/")
    assert image_path.read_bytes() == PNG_1X1

    storage.delete(stored.key)
    assert not image_path.exists()


@pytest.mark.asyncio
async def test_product_image_storage_rejects_mismatch_and_oversize(tmp_path: Path) -> None:
    storage = ProductImageStorage(tmp_path)

    with pytest.raises(AppError, match="Isi file"):
        await storage.store(
            content_type="image/png",
            chunks=image_chunks(b"\xff\xd8\xffinvalid"),
            max_bytes=1024,
        )

    with pytest.raises(AppError, match="maksimal 5 MB"):
        await storage.store(
            content_type="image/png",
            chunks=image_chunks(PNG_1X1),
            max_bytes=4,
        )

    assert list(tmp_path.rglob("*.png")) == []


def test_product_image_storage_rejects_path_escape(tmp_path: Path) -> None:
    storage = ProductImageStorage(tmp_path)

    with pytest.raises(AppError, match="path is invalid"):
        storage.path_for("../outside.png")


def test_product_image_metadata_exposes_versioned_relative_image_url() -> None:
    product = Product()
    assert product.image_url is None

    product.image_key = "products/example.png"
    assert product.image_url == f"/api/v1/products/{product.id}/image?v=example.png"
