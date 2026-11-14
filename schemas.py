from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Literal, Optional


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)
    role: Literal["developer", "recruiter", "admin"]


class RegisterResponse(BaseModel):
    message: str
    user_id: int
    role: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class LoginResponse(BaseModel):
    message: str
    user_id: int
    name: str
    role: str
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    role: str


class ProfileIn(BaseModel):
    name: str
    description: Optional[str] = None
    qualification: Optional[str] = None
    location: Optional[str] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    qualification: Optional[str] = None
    location: Optional[str] = None


class SkillOut(BaseModel):
    name: str
    source: str
    verified: bool


class ProfileOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    qualification: Optional[str] = None
    location: Optional[str] = None
    github_username: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SkillCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)


class SkillMasterOut(BaseModel):
    id: int
    name: str
    status: str
    merged_into_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class SkillPaginationOut(BaseModel):
    items: list[SkillMasterOut]
    total: int
    page: int
    limit: int
    total_pages: int


class BulkSkillStatusUpdate(BaseModel):
    skill_ids: list[int] = Field(min_length=1)
    status: str


class MergeSkillRequest(BaseModel):
    source_skill_id: int
    target_skill_id: int


class SkillAdd(BaseModel):
    name: str = Field(min_length=1, max_length=50)