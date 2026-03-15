from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from app.models.academic import DegreeType, ScheduleType


class FacultyBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class FacultyCreate(FacultyBase):
    pass


class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None


class FacultyResponse(FacultyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class DepartmentBase(BaseModel):
    name: str
    code: str
    faculty_id: int
    head_id: Optional[int] = None
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    faculty_id: Optional[int] = None
    head_id: Optional[int] = None
    description: Optional[str] = None


class DepartmentResponse(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class ProgramBase(BaseModel):
    name: str
    code: str
    department_id: int
    degree_type: DegreeType
    duration_years: int = 2
    level: Optional[int] = None  # 1=M1, 2=M2
    description: Optional[str] = None
    is_active: bool = True


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    department_id: Optional[int] = None
    degree_type: Optional[DegreeType] = None
    duration_years: Optional[int] = None
    level: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ProgramResponse(ProgramBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class AcademicYearBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    is_current: bool = False


class AcademicYearCreate(AcademicYearBase):
    pass


class AcademicYearUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None


class AcademicYearResponse(AcademicYearBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class SemesterBase(BaseModel):
    name: str
    academic_year_id: int
    number: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool = False


class SemesterCreate(SemesterBase):
    pass


class SemesterUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None


class SemesterResponse(SemesterBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class CohortBase(BaseModel):
    name: str
    program_id: int
    academic_year_id: int
    max_students: int = 50
    description: Optional[str] = None


class CohortCreate(CohortBase):
    pass


class CohortUpdate(BaseModel):
    name: Optional[str] = None
    max_students: Optional[int] = None
    description: Optional[str] = None


class CohortResponse(CohortBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class ModuleBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    credits: int = 3
    coefficient: int = 1
    semester_id: Optional[int] = None
    program_id: Optional[int] = None
    specialty: Optional[str] = None  # spécialité (null = tronc commun)
    is_active: bool = True


class ModuleCreate(ModuleBase):
    pass


class ModuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = None
    coefficient: Optional[int] = None
    semester_id: Optional[int] = None
    specialty: Optional[str] = None
    is_active: Optional[bool] = None


class ModuleResponse(ModuleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class TeachingAssignmentCreate(BaseModel):
    teacher_id: int
    module_id: int
    academic_year_id: int
    is_primary: bool = True


class TeachingAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    teacher_id: int
    module_id: int
    academic_year_id: int
    is_primary: bool
    created_at: datetime


class EnrollmentCreate(BaseModel):
    student_id: int
    cohort_id: int
    academic_year_id: int


class EnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    cohort_id: int
    academic_year_id: int
    enrolled_at: datetime
    status: str


class ScheduleBase(BaseModel):
    module_id: int
    teacher_id: int
    cohort_id: int
    academic_year_id: int
    day_of_week: int
    start_time: time
    end_time: time
    room: Optional[str] = None
    meeting_link: Optional[str] = None
    schedule_type: ScheduleType = ScheduleType.course


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    day_of_week: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room: Optional[str] = None
    meeting_link: Optional[str] = None
    schedule_type: Optional[ScheduleType] = None


class ScheduleResponse(ScheduleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class DashboardStats(BaseModel):
    total_students: int
    total_teachers: int
    total_programs: int
    total_modules: int
    total_cohorts: int
    active_academic_year: Optional[str] = None
    enrollments_count: int
