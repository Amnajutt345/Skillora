from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Skill, ProfileSkill
from schemas import (
    SkillCreate,
    SkillMasterOut,
    SkillPaginationOut,
    BulkSkillStatusUpdate,
    MergeSkillRequest
)
from dependencies import require_role

router = APIRouter(prefix="/admin", tags=["Admin"])


def normalize_skill_name(name: str):
    name = " ".join(name.split())

    standard_names = {
        "python": "Python",
        "java": "Java",
        "javascript": "JavaScript",
        "typescript": "TypeScript",
        "c++": "C++",
        "c#": "C#",
        "c": "C",
        "sql": "SQL",
        "html": "HTML",
        "css": "CSS",
        "react": "React",
        "node.js": "Node.js",
        "firebase": "Firebase",
        "kotlin": "Kotlin",
        "figma": "Figma",
        "ui/ux": "UI/UX",
        "machine learning": "Machine Learning",
        "artificial intelligence": "Artificial Intelligence"
    }

    return standard_names.get(name.casefold(), name.title())


@router.post("/skills", response_model=SkillMasterOut, status_code=201)
def create_skill(
    data: SkillCreate,
    user=Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    skill_name = normalize_skill_name(data.name)

    existing_skill = db.query(Skill).filter(
        func.lower(Skill.name) == skill_name.lower()
    ).first()

    if existing_skill:
        raise HTTPException(
            status_code=400,
            detail="This skill already exists"
        )

    skill = Skill(
        name=skill_name,
        status="approved"
    )

    db.add(skill)
    db.commit()
    db.refresh(skill)

    return skill


@router.patch("/skills/{skill_id}/status")
def update_skill_status(
    skill_id: int,
    status: str,
    user=Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    if status not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be approved or rejected"
        )

    skill = db.query(Skill).filter_by(id=skill_id).first()

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found"
        )

    skill.status = status
    db.commit()

    return {
        "message": f"Skill {status} successfully",
        "skill": skill.name,
        "status": skill.status
    }


@router.get("/skills", response_model=SkillPaginationOut)
def get_skills(
    status: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 10,
    user=Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    if status and status not in ["pending", "approved", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Use pending, approved, or rejected"
        )
    if page < 1 or limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Page must be at least 1 and limit must be between 1 and 100"
        )
    query = db.query(Skill)
    if status:
        query = query.filter(Skill.status == status)
    if search:
        query = query.filter(Skill.name.ilike(f"%{search.strip()}%"))
    total = query.count()
    skills = query.order_by(Skill.name).offset(
        (page - 1) * limit
    ).limit(limit).all()
    total_pages = (total + limit - 1) // limit
    return {
        "items": skills,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


@router.patch("/skills/bulk-status")
def bulk_update_skill_status(
    data: BulkSkillStatusUpdate,
    user=Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    if data.status not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be approved or rejected"
        )
    skill_ids = set(data.skill_ids)
    skills = db.query(Skill).filter(
        Skill.id.in_(skill_ids)
    ).all()
    if len(skills) != len(skill_ids):
        raise HTTPException(
            status_code=404,
            detail="One or more skills not found"
        )
    for skill in skills:
        skill.status = data.status
    db.commit()
    return {
        "message": f"{len(skills)} skills {data.status} successfully",
        "updated_count": len(skills),
        "status": data.status
    }


@router.post("/skills/merge")
def merge_skills(
    data: MergeSkillRequest,
    user=Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    if data.source_skill_id == data.target_skill_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot merge a skill into itself"
        )

    source_skill = db.query(Skill).filter_by(
        id=data.source_skill_id
    ).first()

    target_skill = db.query(Skill).filter_by(
        id=data.target_skill_id
    ).first()

    if not source_skill or not target_skill:
        raise HTTPException(
            status_code=404,
            detail="Source or target skill not found"
        )

    if source_skill.merged_into_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Source skill is already merged"
        )

    if target_skill.merged_into_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Target skill is already merged"
        )

    source_associations = db.query(ProfileSkill).filter_by(
        skill_id=source_skill.id
    ).all()

    for association in source_associations:
        existing = db.query(ProfileSkill).filter_by(
            profile_id=association.profile_id,
            skill_id=target_skill.id
        ).first()

        if existing:
            db.delete(association)
        else:
            association.skill_id = target_skill.id

    source_skill.merged_into_id = target_skill.id
    source_skill.status = "rejected"

    db.commit()

    return {
        "message": "Skills merged successfully",
        "source_skill": source_skill.name,
        "target_skill": target_skill.name,
        "merged_into_id": target_skill.id
    }


@router.delete("/skills/{skill_id}")
def delete_skill(
    skill_id: int,
    user=Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter_by(id=skill_id).first()

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found"
        )

    assigned_skill = db.query(ProfileSkill).filter_by(
        skill_id=skill_id
    ).first()

    if assigned_skill:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a skill assigned to a developer"
        )

    db.delete(skill)
    db.commit()

    return {"message": "Skill deleted successfully"}