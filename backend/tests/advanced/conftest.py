"""
Advanced test configuration for MASAP-UGANC backend.

This module provides fixtures and utilities for advanced testing scenarios including:
- Database transaction management
- Test data factories
- Authentication helpers
- API client wrappers
"""

import pytest
from typing import Generator, Dict, Any
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.config import settings
from app.db.session import Base, get_db


# Test database URL (in-memory SQLite for fast tests)
TEST_DATABASE_URL = "sqlite:///./test.db"


@pytest.fixture(scope="session")
def test_engine():
    """Create a test database engine."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(test_engine) -> Generator:
    """Create a fresh database session for each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    SessionLocal = sessionmaker(
        autocommit=False, 
        autoflush=False, 
        bind=connection
    )
    
    session = SessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope="function")
def client(db_session) -> Generator[TestClient, None, None]:
    """Create a test client with overridden database dependency."""
    
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client: TestClient, db_session) -> Dict[str, str]:
    """Create authentication headers for a test user."""
    from app.core.security import create_access_token
    
    # Create a test user
    test_user_data = {
        "email": "test@example.com",
        "full_name": "Test User",
        "role": "user"
    }
    
    # Generate token
    access_token = create_access_token(
        data={"sub": test_user_data["email"], "role": test_user_data["role"]}
    )
    
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def admin_headers(client: TestClient, db_session) -> Dict[str, str]:
    """Create authentication headers for an admin user."""
    from app.core.security import create_access_token
    
    # Generate admin token
    access_token = create_access_token(
        data={"sub": "admin@example.com", "role": "admin"}
    )
    
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def test_user_factory(db_session):
    """Factory for creating test users."""
    from app.models.user import User
    from app.core.security import get_password_hash
    
    def create_user(
        email: str = None,
        password: str = "Test123!@#",
        full_name: str = "Test User",
        role: str = "user",
        is_active: bool = True
    ) -> User:
        import uuid
        user = User(
            id=str(uuid.uuid4()),
            email=email or f"test_{uuid.uuid4().hex[:8]}@example.com",
            hashed_password=get_password_hash(password),
            full_name=full_name,
            role=role,
            is_active=is_active
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    
    return create_user


@pytest.fixture
def test_data_factory(db_session):
    """Factory for creating various test data."""
    import uuid
    from datetime import date, datetime
    
    def create_academic_year(
        name: str = "2024-2025",
        start_date: date = None,
        end_date: date = None,
        is_current: bool = True
    ):
        from app.models.academic_year import AcademicYear
        
        academic_year = AcademicYear(
            id=str(uuid.uuid4()),
            name=name,
            start_date=start_date or date(2024, 9, 1),
            end_date=end_date or date(2025, 6, 30),
            is_current=is_current
        )
        db_session.add(academic_year)
        db_session.commit()
        db_session.refresh(academic_year)
        return academic_year
    
    def create_faculty(
        name: str = "Faculté des Sciences",
        code: str = "FS",
        description: str = None
    ):
        from app.models.faculty import Faculty
        
        faculty = Faculty(
            id=str(uuid.uuid4()),
            name=name,
            code=code,
            description=description or f"Description for {name}"
        )
        db_session.add(faculty)
        db_session.commit()
        db_session.refresh(faculty)
        return faculty
    
    def create_department(
        faculty_id: str = None,
        name: str = "Département d'Informatique",
        code: str = "DI"
    ):
        from app.models.department import Department
        
        department = Department(
            id=str(uuid.uuid4()),
            faculty_id=faculty_id,
            name=name,
            code=code
        )
        db_session.add(department)
        db_session.commit()
        db_session.refresh(department)
        return department
    
    return {
        "academic_year": create_academic_year,
        "faculty": create_faculty,
        "department": create_department
    }


class APIClient:
    """Wrapper class for API testing with convenience methods."""
    
    def __init__(self, client: TestClient, headers: Dict[str, str] = None):
        self.client = client
        self.headers = headers or {}
        self.base_url = "/api/v1"
    
    def _make_request(self, method: str, endpoint: str, **kwargs):
        """Make an API request with default headers."""
        if "headers" not in kwargs:
            kwargs["headers"] = {}
        kwargs["headers"].update(self.headers)
        
        url = f"{self.base_url}{endpoint}"
        response = getattr(self.client, method)(url, **kwargs)
        return response
    
    def get(self, endpoint: str, **kwargs):
        return self._make_request("get", endpoint, **kwargs)
    
    def post(self, endpoint: str, **kwargs):
        return self._make_request("post", endpoint, **kwargs)
    
    def put(self, endpoint: str, **kwargs):
        return self._make_request("put", endpoint, **kwargs)
    
    def patch(self, endpoint: str, **kwargs):
        return self._make_request("patch", endpoint, **kwargs)
    
    def delete(self, endpoint: str, **kwargs):
        return self._make_request("delete", endpoint, **kwargs)


@pytest.fixture
def api_client(client: TestClient) -> APIClient:
    """Create an API client wrapper."""
    return APIClient(client)


@pytest.fixture
def authenticated_api_client(client: TestClient, auth_headers) -> APIClient:
    """Create an authenticated API client wrapper."""
    return APIClient(client, headers=auth_headers)


@pytest.fixture
def admin_api_client(client: TestClient, admin_headers) -> APIClient:
    """Create an admin API client wrapper."""
    return APIClient(client, headers=admin_headers)
