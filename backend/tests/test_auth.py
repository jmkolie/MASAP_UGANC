import pytest
from fastapi.testclient import TestClient

from tests.conftest import get_token


def test_login_success(client, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "Admin@test1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "WrongPassword"},
    )
    assert response.status_code == 401


def test_login_unknown_email(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "unknown@test.com", "password": "password123"},
    )
    assert response.status_code == 401


def test_get_me_authenticated(client, admin_user):
    token = get_token(client, "admin@test.com", "Admin@test1")
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@test.com"
    assert data["role"] == "super_admin"


def test_get_me_unauthenticated(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_change_password(client, admin_user):
    token = get_token(client, "admin@test.com", "Admin@test1")
    response = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "Admin@test1", "new_password": "NewAdmin@test1"},
    )
    assert response.status_code == 200

    # Verify old password no longer works
    response2 = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "Admin@test1"},
    )
    assert response2.status_code == 401


def test_forgot_password(client):
    """Forgot password always returns 200 to prevent email enumeration."""
    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "any@email.com"},
    )
    assert response.status_code == 200
