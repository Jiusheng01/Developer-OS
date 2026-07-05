from fastapi import APIRouter

from app.api.v1.endpoints import ai_planner, ai_providers, auth, goals, health, learning, notes, todos

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(ai_providers.router)
api_router.include_router(ai_planner.router)
api_router.include_router(todos.router)
api_router.include_router(learning.router)
api_router.include_router(notes.router)
api_router.include_router(goals.router)
