from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from fastapi.security import HTTPAuthorizationCredentials

from database import get_db
from models import User, RevokedToken
from schemas import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    UserResponse
)
from security import hash_password, verify_password, create_access_token
from dependencies import get_current_user, bearer_scheme, require_role


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    status_code=201,
    response_model=RegisterResponse
)
def register(data: RegisterRequest, db: Session = Depends(get_db)):

    email = str(data.email).lower()

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        name=data.name,
        email=email,
        hashed_password=hash_password(data.password),
        role=data.role
    )

    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    return {
        "message": "Account created successfully",
        "user_id": new_user.id,
        "role": new_user.role
    }


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):

    email = str(data.email).lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role
    })

    return {
        "message": "Login successful",
        "user_id": user.id,
        "name": user.name,
        "role": user.role,
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }


@router.post("/logout")
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    revoked_token = RevokedToken(token=token)

    db.add(revoked_token)
    db.commit()

    return {
        "message": "Logout successful"
    }


# Temporary Role Testing Endpoints
@router.get("/developer-test")
def developer_test(
    current_user: User = Depends(require_role("developer"))
):
    return {"message": "Developer access granted"}


@router.get("/recruiter-test")
def recruiter_test(
    current_user: User = Depends(require_role("recruiter"))
):
    return {"message": "Recruiter access granted"}


@router.get("/admin-test")
def admin_test(
    current_user: User = Depends(require_role("admin"))
):
    return {"message": "Admin access granted"}
