from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import SessionDep, require_role
from app.core.security import get_password_hash
from app.models import (
    User,
    UserPublic,
    UserRole,
)

router = APIRouter(tags=["private"], prefix="/private")


@router.get("/", dependencies=[Depends(require_role(UserRole.MEMBER, UserRole.ADMIN))])
def read_private_info() -> Any:
    """
    Get private information.
    
    This endpoint is only accessible to members and admins.
    """
    return {"message": "This is private information accessible to members and admins"}


class PrivateUserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    is_verified: bool = False


@router.post("/users/", response_model=UserPublic, dependencies=[Depends(require_role(UserRole.MEMBER, UserRole.ADMIN))])
def create_user(user_in: PrivateUserCreate, session: SessionDep) -> Any:
    """
    Create a new user.
    
    Requires member or admin role.
    """

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
    )

    session.add(user)
    session.commit()

    return user
