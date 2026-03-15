from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

from app.models.grades import ComponentType, ThesisStatus, InternshipStatus


class GradeComponentBase(BaseModel):
    module_id: int
    name: str
    weight: Decimal
    component_type: ComponentType


class GradeComponentCreate(GradeComponentBase):
    pass


class GradeComponentUpdate(BaseModel):
    name: Optional[str] = None
    weight: Optional[Decimal] = None
    component_type: Optional[ComponentType] = None


class GradeComponentResponse(GradeComponentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class GradeBase(BaseModel):
    student_id: int
    module_id: int
    component_id: int
    score: Optional[Decimal] = None
    max_score: Decimal = Decimal("20")
    academic_year_id: int
    semester_id: Optional[int] = None
    notes: Optional[str] = None


class GradeCreate(GradeBase):
    pass


class GradeUpdate(BaseModel):
    score: Optional[Decimal] = None
    notes: Optional[str] = None


class GradeResponse(GradeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_validated: bool
    validated_by: Optional[int] = None
    validated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class BulkGradeCreate(BaseModel):
    module_id: int
    component_id: int
    academic_year_id: int
    semester_id: Optional[int] = None
    grades: List[dict]  # [{"student_id": 1, "score": 15.5}, ...]


class ModuleResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    module_id: int
    academic_year_id: int
    average: Optional[Decimal] = None
    is_validated: bool
    validated_by: Optional[int] = None
    validated_at: Optional[datetime] = None
    is_passed: Optional[bool] = None
    credits_earned: int
    created_at: datetime


class ThesisBase(BaseModel):
    title: str
    supervisor_id: Optional[int] = None
    co_supervisor: Optional[str] = None
    status: ThesisStatus = ThesisStatus.proposed
    description: Optional[str] = None
    academic_year_id: Optional[int] = None


class ThesisCreate(ThesisBase):
    student_id: int


class ThesisUpdate(BaseModel):
    title: Optional[str] = None
    supervisor_id: Optional[int] = None
    co_supervisor: Optional[str] = None
    status: Optional[ThesisStatus] = None
    description: Optional[str] = None
    grade: Optional[Decimal] = None


class ThesisResponse(ThesisBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    file_path: Optional[str] = None
    submitted_at: Optional[datetime] = None
    defended_at: Optional[datetime] = None
    grade: Optional[Decimal] = None
    created_at: datetime


class InternshipBase(BaseModel):
    company_name: str
    supervisor_name: Optional[str] = None
    supervisor_contact: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None
    status: InternshipStatus = InternshipStatus.planned
    academic_year_id: Optional[int] = None


class InternshipCreate(InternshipBase):
    student_id: int


class InternshipUpdate(BaseModel):
    company_name: Optional[str] = None
    status: Optional[InternshipStatus] = None
    grade: Optional[Decimal] = None
    description: Optional[str] = None


class InternshipResponse(InternshipBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    report_path: Optional[str] = None
    grade: Optional[Decimal] = None
    created_at: datetime


class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    module_id: int
    due_date: Optional[datetime] = None
    max_score: Decimal = Decimal("20")
    is_active: bool = True


class AssignmentCreate(AssignmentBase):
    teacher_id: int


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class AssignmentResponse(AssignmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    teacher_id: int
    file_path: Optional[str] = None
    created_at: datetime


class AssignmentSubmissionCreate(BaseModel):
    assignment_id: int
    student_id: int


class AssignmentSubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    assignment_id: int
    student_id: int
    file_path: Optional[str] = None
    submitted_at: datetime
    score: Optional[Decimal] = None
    feedback: Optional[str] = None
    graded_at: Optional[datetime] = None


class TranscriptData(BaseModel):
    student_id: int
    student_name: str
    student_matricule: str
    program: str
    academic_year: str
    modules: List[dict]
    overall_average: Optional[float] = None
    total_credits: int
    credits_earned: int
