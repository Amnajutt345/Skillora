from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Job, RecruiterProfile
from schemas import JobCreate, JobOut
from dependencies import require_role


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


# GET ALL RECRUITER JOBS
@router.get("", response_model=list[JobOut])
def get_recruiter_jobs(
    user=Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    jobs = db.query(Job).filter(
        Job.recruiter_id == user.id
    ).all()
    return jobs


# CREATE JOB
@router.post("", response_model=JobOut, status_code=201)
def create_job(
    data: JobCreate,
    user=Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    company = db.query(RecruiterProfile).filter_by(
        user_id=user.id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Create your company first"
        )

    job = Job(
        recruiter_id=user.id,
        company_id=company.id,
        **data.model_dump()
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job