
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Job, Company
from schemas import JobCreate, JobOut
from dependencies import require_role


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


# CREATE JOB
@router.post("", response_model=JobOut, status_code=201)
def create_job(
    data: JobCreate,
    user=Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter_by(
        recruiter_id=user.id
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
