"""Integration tests for role-based access control."""

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import User, UserRole
from app.tests.utils.user import create_random_user


def test_private_endpoint_user_denied(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    """Test that regular users cannot access private endpoints."""
    r = client.get(
        f"{settings.API_V1_STR}/private/", headers=normal_user_token_headers
    )
    assert r.status_code == 403
    assert "not authorized" in r.json()["detail"].lower()


def test_private_endpoint_member_allowed(client: TestClient, db: Session) -> None:
    """Test that members can access private endpoints."""
    # Create a member user
    member_user, password = create_random_user(db, role=UserRole.MEMBER)
    
    # Get token for member
    login_data = {
        "username": member_user.email,
        "password": password,
    }
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    tokens = r.json()
    member_token_headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    
    # Access private endpoint
    r = client.get(f"{settings.API_V1_STR}/private/", headers=member_token_headers)
    assert r.status_code == 200
    assert "private information" in r.json()["message"].lower()


def test_private_endpoint_admin_allowed(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test that admins can access private endpoints."""
    r = client.get(f"{settings.API_V1_STR}/private/", headers=superuser_token_headers)
    assert r.status_code == 200
    assert "private information" in r.json()["message"].lower()


def test_admin_endpoints_user_denied(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    """Test that regular users cannot access admin endpoints."""
    # Try to list all users
    r = client.get(f"{settings.API_V1_STR}/users/", headers=normal_user_token_headers)
    assert r.status_code == 403
    assert "enough privileges" in r.json()["detail"].lower()


def test_admin_endpoints_member_denied(client: TestClient, db: Session) -> None:
    """Test that members cannot access admin endpoints."""
    # Create a member user
    member_user, password = create_random_user(db, role=UserRole.MEMBER)
    
    # Get token for member
    login_data = {
        "username": member_user.email,
        "password": password,
    }
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    tokens = r.json()
    member_token_headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    
    # Try to list all users
    r = client.get(f"{settings.API_V1_STR}/users/", headers=member_token_headers)
    assert r.status_code == 403
    assert "enough privileges" in r.json()["detail"].lower()


def test_admin_endpoints_admin_allowed(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test that admins can access admin endpoints."""
    r = client.get(f"{settings.API_V1_STR}/users/", headers=superuser_token_headers)
    assert r.status_code == 200
    assert "data" in r.json()
    assert "count" in r.json()


def test_user_role_default_on_registration(
    client: TestClient, db: Session
) -> None:
    """Test that newly registered users get the USER role by default."""
    from app.tests.utils.utils import random_email, random_lower_string
    
    email = random_email()
    password = random_lower_string()
    data = {"email": email, "password": password}
    
    r = client.post(f"{settings.API_V1_STR}/users/signup", json=data)
    assert r.status_code == 200
    created_user = r.json()
    assert created_user["role"] == UserRole.USER.value
    assert created_user["is_superuser"] is False
