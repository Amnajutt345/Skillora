from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from fastapi.security import HTTPAuthorizationCredentials

from database import get_db
from models import User, RevokedToken, PasswordResetToken
from schemas import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    UserResponse,
    LogoutResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest
)
from security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_reset_token,
    hash_reset_token
)
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


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    print("FORGOT PASSWORD ENDPOINT HIT", flush=True)

    email = str(data.email).lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )
    print("USER FOUND:", bool(user), flush=True)

    if user:
        reset_token = generate_reset_token()

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_reset_token(reset_token),
            expires_at=datetime.utcnow() + timedelta(minutes=30),
            used=False
        )

        db.add(reset_record)
        db.commit()

        # Development only: email integration is not configured yet.
        print(f"Password reset token: {reset_token}", flush=True)

    return {
        "message": "If an account with that email exists, a password reset link has been sent."
    }


@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    token_hash = hash_reset_token(data.token)

    reset_record = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False
        )
    )

    if not reset_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )

    if reset_record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )

    user = db.get(User, reset_record.user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.hashed_password = hash_password(data.new_password)
    reset_record.used = True
    user.token_version += 1

    db.commit()

    return {
        "message": "Password reset successfully"
    }


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(
        data.current_password,
        current_user.hashed_password
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    current_user.hashed_password = hash_password(data.new_password)
    current_user.token_version += 1
    db.commit()

    return {
        "message": "Password changed successfully"
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
        "role": user.role,
        "token_version": user.token_version
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


@router.post("/logout", response_model=LogoutResponse)
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