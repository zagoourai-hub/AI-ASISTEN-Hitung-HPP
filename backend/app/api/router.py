from fastapi import APIRouter

from app.api.routes.ai import router as ai_router
from app.api.routes.auth import router as auth_router
from app.api.routes.business import router as business_router
from app.api.routes.cash import router as cash_router
from app.api.routes.discount import router as discount_router
from app.api.routes.health import router as health_router
from app.api.routes.hpp import router as hpp_router
from app.api.routes.ingredients import router as ingredients_router
from app.api.routes.pricing import router as pricing_router
from app.api.routes.products import category_router as product_category_router
from app.api.routes.products import router as products_router
from app.api.routes.recipes import router as recipes_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(ai_router)
api_router.include_router(business_router)
api_router.include_router(cash_router)
api_router.include_router(health_router)
api_router.include_router(hpp_router)
api_router.include_router(ingredients_router)
api_router.include_router(product_category_router)
api_router.include_router(products_router)
api_router.include_router(recipes_router)
api_router.include_router(pricing_router)
api_router.include_router(discount_router)
