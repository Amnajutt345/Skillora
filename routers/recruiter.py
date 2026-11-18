from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import RecruiterProfile
from schemas import (
    RecruiterProfileIn,
    RecruiterProfileUpdate,
    RecruiterProfileOut
)
from dependencies import require_role


router = APIRouter(
    prefix="/recruiter",
    tags=["Recruiter"]
)


# CREATE RECRUITER PROFILE
@router.post("/profile", response_model=RecruiterProfileOut, status_code=201)
def create_recruiter_profile(
    data: RecruiterProfileIn,
    user=Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    existing_profile = db.query(RecruiterProfile).filter_by(
        user_id=user.id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Recruiter profile already exists"
        )

    profile = RecruiterProfile(
        user_id=user.id,
        **data.model_dump()
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


# GET RECRUITER PROFILE
@router.get("/profile", response_model=RecruiterProfileOut)
def get_recruiter_profile(
    user=Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    profile = db.query(RecruiterProfile).filter_by(
        user_id=user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Create your recruiter profile first"
        )

    return profile


# UPDATE RECRUITER PROFILE
@router.put("/profile", response_model=RecruiterProfileOut)
def update_recruiter_profile(
    data: RecruiterProfileUpdate,
    user=Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    profile = db.query(RecruiterProfile).filter_by(
        user_id=user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Create your recruiter profile first"
        )

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if key == "company_name" and (
            value is None or not value.strip()
        ):
            raise HTTPException(
                status_code=422,
                detail="Company name cannot be empty"
            )

        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)

    return profile