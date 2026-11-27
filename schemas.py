from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Literal


# REUSABLE BASE MODELS

class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MessageBase(BaseModel):
    message: str


class CredentialsBase(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserIdentityBase(BaseModel):
    user_id: int
    name: str
    role: str


class ProfileFieldsBase(BaseModel):
    name: str
    description: str | None = None
    qualification: str | None = None
    location: str | None = None


class SkillNameBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)


# AUTHENTICATION REQUEST MODELS

class RegisterRequest(CredentialsBase):
    name: str = Field(min_length=2, max_length=100)
    role: Literal["developer", "recruiter"]


class LoginRequest(CredentialsBase):
    pass


# AUTHENTICATION RESPONSE MODELS

class RegisterResponse(MessageBase):
    user_id: int
    role: str


class LoginResponse(MessageBase, UserIdentityBase):
    access_token: str
    token_type: str


class UserResponse(UserIdentityBase):
    email: EmailStr


class LogoutResponse(MessageBase):
    pass


# PROFILE MODELS

class ProfileIn(ProfileFieldsBase):
    pass


class ProfileUpdate(ProfileFieldsBase):
    name: str | None = None


class ProfileOut(ORMBase):
    id: int
    name: str
    description: str | None = None
    qualification: str | None = None
    location: str | None = None
    github_username: str | None = None


# RECRUITER PROFILE MODELS

class RecruiterProfileFieldsBase(BaseModel):
    company_name: str = Field(min_length=2, max_length=150)
    company_website: str | None = Field(default=None, max_length=255)
    company_description: str | None = None
    company_location: str | None = Field(default=None, max_length=150)


class RecruiterProfileIn(RecruiterProfileFieldsBase):
    pass


class RecruiterProfileUpdate(BaseModel):
    company_name: str | None = Field(default=None, min_length=2, max_length=150)
    company_website: str | None = Field(default=None, max_length=255)
    company_description: str | None = None
    company_location: str | None = Field(default=None, max_length=150)


class RecruiterProfileOut(ORMBase):
    id: int
    company_name: str
    company_website: str | None = None
    company_description: str | None = None
    company_location: str | None = None
    company_logo: str | None = None


# SKILL MODELS

class SkillOut(BaseModel):
    name: str
    source: str
    verified: bool


class SkillCreate(SkillNameBase):
    name: str = Field(min_length=2, max_length=100)


class SkillAdd(SkillNameBase):
    name: str = Field(min_length=1, max_length=50)


class SkillMasterOut(ORMBase):
    id: int
    name: str
    status: str
    merged_into_id: int | None = None


class SkillPaginationOut(BaseModel):
    items: list[SkillMasterOut]
    total: int
    page: int
    limit: int
    total_pages: int


class BulkSkillStatusUpdate(BaseModel):
    skill_ids: list[int] = Field(min_length=1)
    status: Literal["approved", "rejected"]


class MergeSkillRequest(BaseModel):
    source_skill_id: int = Field(gt=0)
    target_skill_id: int = Field(gt=0)


# SKILL RESPONSE MODELS

class SkillAddResponse(MessageBase):
    skill: str
    source: str
    verified: bool


class SkillStatusResponse(MessageBase):
    skill: str
    status: Literal["approved", "rejected"]


class BulkSkillStatusResponse(MessageBase):
    updated_count: int
    status: Literal["approved", "rejected"]


class MergeSkillResponse(MessageBase):
    source_skill: str
    target_skill: str
    merged_into_id: int


# CV RESPONSE MODEL

class CVUploadResponse(MessageBase):
    extracted_skills: list[str]
    added_skills: list[str]
    cv_path: str


# PASSWORD RESET REQUEST MODELS

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=32)
    new_password: str = Field(min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


# JOB MODELS

class JobCreate(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    description: str = Field(min_length=10)
    location: str | None = Field(default=None, max_length=150)
    job_type: Literal["full-time", "part-time", "internship", "contract"]
    salary: str | None = Field(default=None, max_length=100)


class JobOut(ORMBase):
    id: int
    recruiter_id: int
    company_id: int
    title: str
    description: str
    location: str | None = None
    job_type: str
    salary: str | None = None
    status: str