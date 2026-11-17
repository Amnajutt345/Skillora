import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from models import Profile, ProfileSkill, Skill
from schemas import (
    ProfileIn,
    ProfileUpdate,
    ProfileOut,
    SkillOut,
    SkillAdd,
    SkillAddResponse,
    CVUploadResponse,
    MessageBase
)
from dependencies import require_role
from services.cv_parser import extract_text_from_pdf
from services.matcher import extract_skills

router = APIRouter(prefix="/profile", tags=["Profile"])


def get_or_create_skill(db: Session, raw_name: str):
    name = " ".join(raw_name.strip().split())

    standard_names = {
        "python": "Python",
        "java": "Java",
        "javascript": "JavaScript",
        "typescript": "TypeScript",
        "c++": "C++",
        "c#": "C#",
        "sql": "SQL",
        "html": "HTML",
        "css": "CSS",
        "react": "React",
        "node.js": "Node.js",
        "firebase": "Firebase",
        "kotlin": "Kotlin",
        "figma": "Figma",
        "ui/ux": "UI/UX"
    }

    name = standard_names.get(name.casefold(), name)

    skill = db.query(Skill).filter(
        Skill.name.ilike(name)
    ).first()

    if skill:
        if skill.merged_into_id is not None:
            skill = db.query(Skill).filter_by(
                id=skill.merged_into_id
            ).first()
        if skill.status == "rejected":
            raise HTTPException(
                status_code=400,
                detail=f"The skill '{skill.name}' has been rejected by admin"
            )
        return skill

    skill = Skill(name=name, status="pending")
    db.add(skill)
    db.flush()

    return skill


@router.post("", response_model=ProfileOut, status_code=201)
def create_profile(
    data: ProfileIn,
    user=Depends(require_role("developer")),
    db: Session = Depends(get_db)
):
    existing_profile = db.query(Profile).filter_by(user_id=user.id).first()

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Profile already exists"
        )

    profile = Profile(
        user_id=user.id,
        **data.model_dump()
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


@router.get("", response_model=ProfileOut)
def get_profile(
    user=Depends(require_role("developer")),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter_by(user_id=user.id).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Create your profile first"
        )

    return profile


@router.put("", response_model=ProfileOut)
def update_profile(
    data: ProfileUpdate,
    user=Depends(require_role("developer")),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter_by(user_id=user.id).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Create your profile first"
        )

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if key == "name" and value is None:
            raise HTTPException(
                status_code=422,
                detail="Name cannot be empty"
            )
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)

    return profile


@router.get("/skills", response_model=list[SkillOut])
def get_skills(
    user=Depends(require_role("developer")),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter_by(user_id=user.id).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Create your profile first"
        )

    profile_skills = db.query(ProfileSkill).filter_by(
        profile_id=profile.id
    ).all()

    return [
        SkillOut(
            name=ps.skill.name,
            source=ps.source,
            verified=ps.verified
        )
        for ps in profile_skills
    ]


@router.post("/skills", status_code=201, response_model=SkillAddResponse)
def add_skill(
    data: SkillAdd,
    user=Depends(require_role("developer")),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter_by(user_id=user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Create your profile first")

    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Skill name cannot be empty")

    skill = get_or_create_skill(db, data.name)

    existing = db.query(ProfileSkill).filter_by(
        profile_id=profile.id,
        skill_id=skill.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="This skill already exists in your profile")

    new_profile_skill = ProfileSkill(
        profile_id=profile.id,
        skill_id=skill.id,
        source="manual",
        verified=False
    )
    db.add(new_profile_skill)
    db.commit()

    return {
        "message": "Skill added successfully",
        "skill": skill.name,
        "source": "manual",
        "verified": False
    }


@router.delete("/skills/{skill_name}", response_model=MessageBase)
def remove_skill(
    skill_name: str,
    user=Depends(require_role("developer")),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter_by(user_id=user.id).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    skill = db.query(Skill).filter(
        Skill.name.ilike(skill_name)
    ).first()

    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    profile_skill = db.query(ProfileSkill).filter_by(
        profile_id=profile.id,
        skill_id=skill.id
    ).first()

    if not profile_skill:
        raise HTTPException(status_code=404, detail="Skill not found in your profile")

    db.delete(profile_skill)
    db.commit()

    return {"message": "Skill removed successfully"}


@router.post("/cv", status_code=200, response_model=CVUploadResponse)
def upload_cv(
    file: UploadFile = File(...),
    user=Depends(require_role("developer")),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter_by(user_id=user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Create your profile first")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    os.makedirs("uploads", exist_ok=True)
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join("uploads", unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())

        text = extract_text_from_pdf(file_path)

        if not text:
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from CV"
            )

        # Get only approved skills from database
        known_skills = [
            skill.name
            for skill in db.query(Skill).filter(
                Skill.status == "approved"
            ).all()
        ]

        # Extract matching skills
        found_skills = extract_skills(text, known_skills)

        # Add extracted skills to developer profile
        added_skills = []
        for skill_name in found_skills:
            skill = db.query(Skill).filter_by(name=skill_name).first()
            if skill:
                # Handle merged skills during CV upload as well if needed
                if skill.merged_into_id is not None:
                    skill = db.query(Skill).filter_by(
                        id=skill.merged_into_id
                    ).first()

                if skill and skill.status != "rejected":
                    existing = db.query(ProfileSkill).filter_by(
                        profile_id=profile.id,
                        skill_id=skill.id
                    ).first()
                    if not existing:
                        new_profile_skill = ProfileSkill(
                            profile_id=profile.id,
                            skill_id=skill.id,
                            source="cv",
                            verified=False
                        )
                        db.add(new_profile_skill)
                        added_skills.append(skill.name)

        # Save CV path
        profile.cv_path = file_path
        db.commit()

        return {
            "message": "CV uploaded successfully",
            "extracted_skills": found_skills,
            "added_skills": added_skills,
            "cv_path": file_path
        }

    except Exception as e:
        db.rollback()
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))