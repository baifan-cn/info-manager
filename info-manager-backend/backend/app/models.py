import uuid
from datetime import datetime
from enum import Enum

from pydantic import EmailStr
from sqlalchemy import Column, DateTime, func
from sqlmodel import Field, Relationship, SQLModel


# Item Tag Enum
class ItemTag(Enum):
    DEFAULT = "DEFAULT"
    ECONOMIST = "ECONOMIST"
    WSJ = "WSJ"


# User Role Enum
class UserRole(str, Enum):
    USER = "user"
    MEMBER = "member"
    ADMIN = "admin"


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    role: UserRole = Field(default=UserRole.USER, index=True)
    full_name: str | None = Field(default=None, max_length=255)
    created_at: datetime = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True), server_default=func.now(), nullable=False
        ),
    )
    updated_at: datetime = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        ),
    )
    deleted_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    is_deleted: bool = Field(default=False, index=True)


# Properties to receive via API on creation
class UserCreate(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


class SuperUserCreate(UserCreate):
    is_superuser: bool = True
    role: UserRole = UserRole.ADMIN


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None
    role: UserRole | None = None


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(SQLModel):
    id: uuid.UUID
    email: EmailStr = Field(max_length=255)
    is_active: bool
    is_superuser: bool
    role: UserRole
    full_name: str | None = Field(default=None, max_length=255)
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    context: str | None = Field(default=None, description="Long article content")
    tag: ItemTag = Field(default=ItemTag.DEFAULT, index=True)
    created_at: datetime = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True), server_default=func.now(), nullable=False
        ),
    )
    updated_at: datetime = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        ),
    )
    deleted_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    is_deleted: bool = Field(default=False, index=True)


# Properties to receive on item creation
class ItemCreate(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    context: str | None = Field(default=None, description="Long article content")
    tag: ItemTag = Field(default=ItemTag.DEFAULT)


# Properties to receive on item update
class ItemUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    context: str | None = Field(default=None, description="Long article content")
    tag: ItemTag | None = None


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(max_length=255)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(SQLModel):
    id: uuid.UUID
    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=255)
    context: str | None = Field(default=None, description="Long article content")
    tag: ItemTag
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)
