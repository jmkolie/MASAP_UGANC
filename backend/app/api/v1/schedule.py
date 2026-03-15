from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, StudentProfile, RoleEnum
from app.models.academic import Schedule
from app.core.deps import get_current_user, get_dept_head_or_admin
from app.schemas.academic import ScheduleCreate, ScheduleUpdate, ScheduleResponse

router = APIRouter()

DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]


@router.get("", response_model=list)
async def list_schedules(
    cohort_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    module_id: Optional[int] = None,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Schedule)
    if cohort_id:
        query = query.filter(Schedule.cohort_id == cohort_id)
    if teacher_id:
        query = query.filter(Schedule.teacher_id == teacher_id)
    if module_id:
        query = query.filter(Schedule.module_id == module_id)
    if academic_year_id:
        query = query.filter(Schedule.academic_year_id == academic_year_id)
    query = query.order_by(Schedule.day_of_week, Schedule.start_time)
    return [ScheduleResponse.model_validate(s) for s in query.all()]


@router.get("/my", response_model=list)
async def get_my_schedule(
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the schedule for the current user (student or teacher)."""
    query = db.query(Schedule)

    if current_user.role == RoleEnum.student:
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if not profile or not profile.cohort_id:
            return []
        query = query.filter(Schedule.cohort_id == profile.cohort_id)
    elif current_user.role == RoleEnum.teacher:
        query = query.filter(Schedule.teacher_id == current_user.id)
    else:
        return []

    if academic_year_id:
        query = query.filter(Schedule.academic_year_id == academic_year_id)

    query = query.order_by(Schedule.day_of_week, Schedule.start_time)
    results = []
    for s in query.all():
        item = ScheduleResponse.model_validate(s).model_dump()
        item["day_name"] = DAYS[s.day_of_week] if 0 <= s.day_of_week < 7 else "N/A"
        results.append(item)
    return results


@router.post("", response_model=ScheduleResponse, status_code=201)
async def create_schedule(
    payload: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_dept_head_or_admin),
):
    schedule = Schedule(**payload.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: int,
    payload: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_dept_head_or_admin),
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Séance non trouvée")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(schedule, k, v)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}", status_code=204)
async def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_dept_head_or_admin),
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Séance non trouvée")
    db.delete(schedule)
    db.commit()
