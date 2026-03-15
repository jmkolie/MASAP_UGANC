import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api.v1.router import api_router

# Import all models to ensure they're registered with SQLAlchemy
import app.models  # noqa: F401

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Portail étudiant universitaire — Master en Santé Publique",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directories exist
upload_dir = settings.UPLOAD_DIR
for sub in ["documents", "profiles", "assignments", "theses", "internships"]:
    os.makedirs(os.path.join(upload_dir, sub), exist_ok=True)

# Serve uploaded files (for development; use nginx in production)
if os.path.exists(upload_dir):
    app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "ok", "version": settings.APP_VERSION, "app": settings.APP_NAME}


@app.get("/")
def root():
    return {"message": f"Welcome to {settings.APP_NAME}", "docs": "/api/docs"}
