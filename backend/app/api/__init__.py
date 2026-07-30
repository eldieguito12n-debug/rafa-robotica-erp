from fastapi import APIRouter
from .routes.auth import router as auth_router
from .routes.dashboard import router as dashboard_router
from .routes.users import router as users_router
from .routes.projects import router as projects_router
from .routes.inventory import router as inventory_router
from .routes.financial import router as financial_router
from .routes.chat import router as chat_router
from .routes.clients import router as clients_router
from .routes.labs import router as labs_router
from .routes.calendar import router as calendar_router
from .routes.uploads import router as uploads_router
from .routes.reports import router as reports_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(users_router)
api_router.include_router(projects_router)
api_router.include_router(inventory_router)
api_router.include_router(financial_router)
api_router.include_router(chat_router)
api_router.include_router(clients_router)
api_router.include_router(labs_router)
api_router.include_router(calendar_router)
api_router.include_router(uploads_router)
api_router.include_router(reports_router)
