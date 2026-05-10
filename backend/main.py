"""
Run with:
    uvicorn main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import create_db_and_tables
from routers.messages import router as messages_router
from routers.auth import router as auth_router
from routers.requests import router as requests_router
from routers.items import router as items_router
from routers.notifications import router as notifications_router
from routers.uploads import router as uploads_router
from routers.forum import router as forum_router
from routers.impact import router as impact_router
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(
    title="ShareLine",
    description="A donation matching platform for college students.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Register routers
# ---------------------------------------------------------------------------

app.include_router(auth_router)
app.include_router(items_router)
app.include_router(messages_router)
app.include_router(requests_router)
app.include_router(notifications_router)
app.include_router(uploads_router)
app.include_router(forum_router)
app.include_router(impact_router)

@app.get("/")
def root():
    return {"status": "ShareLine is running"}