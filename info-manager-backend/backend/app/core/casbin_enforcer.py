"""Casbin RBAC enforcer module for authorization."""

import os
from functools import lru_cache

import casbin
from casbin import Enforcer

from app.core.config import settings


@lru_cache()
def get_casbin_enforcer() -> Enforcer:
    """
    Get Casbin enforcer instance with RBAC model and policies.
    
    This enforcer is cached to avoid reloading the model and policies on every request.
    The RBAC model defines the access control rules:
    - Users are assigned to roles (user, member, admin)
    - Roles have permissions on resources
    - Admin role has full access
    - Member role has extended access including private endpoints
    - User role has basic access to own resources
    
    Returns:
        Enforcer: Casbin enforcer instance
    """
    # Get the absolute path to the model and policy files
    current_dir = os.path.dirname(os.path.abspath(__file__))
    app_dir = os.path.dirname(current_dir)
    
    model_path = os.path.join(app_dir, "rbac_model.conf")
    policy_path = os.path.join(app_dir, "rbac_policy.csv")
    
    # Create enforcer with model and policy
    enforcer = casbin.Enforcer(model_path, policy_path)
    
    return enforcer


def check_permission(role: str, resource: str, action: str) -> bool:
    """
    Check if a role has permission to perform an action on a resource.
    
    Args:
        role: User role (user, member, admin)
        resource: Resource path (e.g., /api/v1/items)
        action: HTTP method (GET, POST, PATCH, DELETE)
        
    Returns:
        bool: True if permission is granted, False otherwise
    """
    enforcer = get_casbin_enforcer()
    return enforcer.enforce(role, resource, action)
