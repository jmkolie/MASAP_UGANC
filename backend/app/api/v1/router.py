from fastapi import APIRouter

from app.api.v1 import auth, users, academic, grades, documents, announcements, schedule, pdf

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(academic.router, prefix="/academic", tags=["Academic"])
api_router.include_router(grades.router, prefix="/grades", tags=["Grades"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(announcements.router, prefix="/announcements", tags=["Announcements"])
api_router.include_router(schedule.router, prefix="/schedule", tags=["Schedule"])
api_router.include_router(pdf.router, prefix="/pdf", tags=["PDF"])
