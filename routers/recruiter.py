from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import RecruiterProfile, Company
from schemas import (
    RecruiterProfileIn,
    RecruiterProfileUpdate,
    RecruiterProfileOut,
    CompanyIn,
    CompanyUpdate,
    CompanyOut
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


# ==========================================
# COMPANY MANAGEMENT
# ==========================================

# CREATE COMPANY
@router.post("/company", response_model=CompanyOut, status_code=201)
def create_company(
    data: CompanyIn,
    user=Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    existing_company = db.query(Company).filter_by(
        recruiter_id=user.id
    ).first()

    if existing_company:
        raise HTTPException(
            status_code=400,
            detail="Company already exists"
        )

    company = Company(
        recruiter_id=user.id,
        **data.model_dump()
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    return company


# GET COMPANY
@router.get("/company", response_model=CompanyOut)
def get_company(
    user=Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter_by(
        recruiter_id=user.id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found. Create your company first."
        )

    return company


# UPDATE COMPANY
@router.put("/company", response_model=CompanyOut)
def update_company(
    data: CompanyUpdate,
    user=Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter_by(
        recruiter_id=user.id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found. Create your company first."
        )

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if key == "name" and (value is None or not value.strip()):
            raise HTTPException(
                status_code=422,
                detail="Company name cannot be empty"
            )
        setattr(company, key, value)

    db.commit()
    db.refresh(company)

    return company