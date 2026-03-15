from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.user import RoleEnum, EnrollmentStatus


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: RoleEnum
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[RoleEnum] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: RoleEnum
    is_active: bool
    is_verified: bool
    profile_picture: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class UserListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    first_name: str
    last_name: str
    role: RoleEnum
    is_active: bool
    created_at: datetime


# Student schemas
class StudentProfileBase(BaseModel):
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    address: Optional[str] = None
    enrollment_status: Optional[EnrollmentStatus] = EnrollmentStatus.active
    program_id: Optional[int] = None
    cohort_id: Optional[int] = None
    academic_year_id: Optional[int] = None
    promotion_year: Optional[int] = None
    specialty: Optional[str] = None


class StudentCreate(UserCreate):
    role: RoleEnum = RoleEnum.student
    profile: Optional[StudentProfileBase] = None


class StudentUpdate(UserUpdate):
    profile: Optional[StudentProfileBase] = None


class StudentProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: str
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    address: Optional[str] = None
    enrollment_status: EnrollmentStatus
    program_id: Optional[int] = None
    cohort_id: Optional[int] = None
    academic_year_id: Optional[int] = None
    promotion_year: Optional[int] = None
    specialty: Optional[str] = None


class StudentResponse(UserResponse):
    student_profile: Optional[StudentProfileResponse] = None


# Teacher schemas
class TeacherProfileBase(BaseModel):
    specialization: Optional[str] = None
    grade: Optional[str] = None
    office: Optional[str] = None
    hire_date: Optional[date] = None
    department_id: Optional[int] = None


class TeacherCreate(UserCreate):
    role: RoleEnum = RoleEnum.teacher
    profile: Optional[TeacherProfileBase] = None


class TeacherUpdate(UserUpdate):
    profile: Optional[TeacherProfileBase] = None


class TeacherProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    teacher_id: str
    specialization: Optional[str] = None
    grade: Optional[str] = None
    office: Optional[str] = None
    hire_date: Optional[date] = None
    department_id: Optional[int] = None


class TeacherResponse(UserResponse):
    teacher_profile: Optional[TeacherProfileResponse] = None


# Audit log
class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime


class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    per_page: int
    pages: int
