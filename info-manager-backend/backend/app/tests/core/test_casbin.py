"""Tests for Casbin RBAC enforcer."""

from app.core.casbin_enforcer import check_permission, get_casbin_enforcer
from app.models import UserRole


def test_get_casbin_enforcer():
    """Test that enforcer is created successfully."""
    enforcer = get_casbin_enforcer()
    assert enforcer is not None


def test_user_role_permissions():
    """Test that user role has appropriate permissions."""
    # Users can GET their items
    assert check_permission(UserRole.USER.value, "/api/v1/items", "GET")
    assert check_permission(UserRole.USER.value, "/api/v1/items", "POST")
    assert check_permission(UserRole.USER.value, "/api/v1/items/:id", "PATCH")
    assert check_permission(UserRole.USER.value, "/api/v1/items/:id", "DELETE")
    
    # Users can access their own profile
    assert check_permission(UserRole.USER.value, "/api/v1/users/me", "GET")
    assert check_permission(UserRole.USER.value, "/api/v1/users/me", "PATCH")
    
    # Users cannot access admin endpoints
    assert not check_permission(UserRole.USER.value, "/api/v1/users", "GET")
    assert not check_permission(UserRole.USER.value, "/api/v1/users", "POST")
    
    # Users cannot access private endpoints
    assert not check_permission(UserRole.USER.value, "/api/v1/private", "GET")


def test_member_role_permissions():
    """Test that member role has appropriate permissions."""
    # Members have all user permissions
    assert check_permission(UserRole.MEMBER.value, "/api/v1/items", "GET")
    assert check_permission(UserRole.MEMBER.value, "/api/v1/items", "POST")
    assert check_permission(UserRole.MEMBER.value, "/api/v1/users/me", "GET")
    
    # Members can access private endpoints
    assert check_permission(UserRole.MEMBER.value, "/api/v1/private", "GET")
    
    # Members cannot access admin endpoints
    assert not check_permission(UserRole.MEMBER.value, "/api/v1/users", "GET")
    assert not check_permission(UserRole.MEMBER.value, "/api/v1/users", "POST")


def test_admin_role_permissions():
    """Test that admin role has full permissions."""
    # Admins can access all user endpoints
    assert check_permission(UserRole.ADMIN.value, "/api/v1/items", "GET")
    assert check_permission(UserRole.ADMIN.value, "/api/v1/items", "POST")
    assert check_permission(UserRole.ADMIN.value, "/api/v1/users/me", "GET")
    
    # Admins can access private endpoints
    assert check_permission(UserRole.ADMIN.value, "/api/v1/private", "GET")
    
    # Admins can access admin endpoints
    assert check_permission(UserRole.ADMIN.value, "/api/v1/users", "GET")
    assert check_permission(UserRole.ADMIN.value, "/api/v1/users", "POST")
    assert check_permission(UserRole.ADMIN.value, "/api/v1/users/:id", "GET")
    assert check_permission(UserRole.ADMIN.value, "/api/v1/users/:id", "PATCH")
    assert check_permission(UserRole.ADMIN.value, "/api/v1/users/:id", "DELETE")


def test_role_hierarchy():
    """Test that role hierarchy is properly enforced."""
    # Admin should have more permissions than member
    admin_perms = [
        check_permission(UserRole.ADMIN.value, "/api/v1/users", "GET"),
        check_permission(UserRole.ADMIN.value, "/api/v1/users", "POST"),
    ]
    assert all(admin_perms)
    
    # Member should have more permissions than user
    member_private = check_permission(UserRole.MEMBER.value, "/api/v1/private", "GET")
    user_private = check_permission(UserRole.USER.value, "/api/v1/private", "GET")
    assert member_private
    assert not user_private
