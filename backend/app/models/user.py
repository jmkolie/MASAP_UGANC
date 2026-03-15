import enum
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey,
    Integer, String, Text, Date
)
from sqlalchemy.orm import relationship

from app.database import Base


class RoleEnum(str, enum.Enum):
    super_admin = "super_admin"
    dept_head = "dept_head"
    teacher = "teacher"
    student = "student"
    scolarite = "scolarite"


class EnrollmentStatus(str, enum.Enum):
    active = "active"
    suspended = "suspended"
    graduated = "graduated"
    abandoned = "abandoned"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(Enum(RoleEnum), nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    profile_picture = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    teacher_profile = relationship("TeacherProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")
    sent_messages = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    received_messages = relationship("Message", back_populates="recipient", foreign_keys="Message.recipient_id")
    notifications = relationship("Notification", back_populates="user")
    announcements = relationship("Announcement", back_populates="author")
    uploaded_documents = relationship("CourseDocument", back_populates="uploaded_by_user")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. SP-2024-0001
    date_of_birth = Column(Date, nullable=True)
    nationality = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    enrollment_status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.active)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    cohort_id = Column(Integer, ForeignKey("cohorts.id"), nullable=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=True)
    promotion_year = Column(Integer, nullable=True)
    specialty = Column(String(100), nullable=True)  # spécialité Master 2
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    program = relationship("Program", back_populates="students")
    cohort = relationship("Cohort", back_populates="students")
    academic_year = relationship("AcademicYear", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student_profile")
    grades = relationship("Grade", back_populates="student", foreign_keys="Grade.student_id")
    module_results = relationship("ModuleResult", back_populates="student", foreign_keys="ModuleResult.student_id")
    thesis = relationship("Thesis", back_populates="student", uselist=False)
    internships = relationship("Internship", back_populates="student")
    assignment_submissions = relationship("AssignmentSubmission", back_populates="student")


class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    teacher_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. ENS-2024-0001
    specialization = Column(String(255), nullable=True)
    grade = Column(String(100), nullable=True)  # Title like Professeur, MCF, etc.
    office = Column(String(100), nullable=True)
    hire_date = Column(Date, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="teacher_profile")
    department = relationship("Department", back_populates="teachers")
    teaching_assignments = relationship(
        "TeachingAssignment",
        primaryjoin="TeacherProfile.user_id == foreign(TeachingAssignment.teacher_id)",
        viewonly=True,
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs", foreign_keys=[user_id])
