
from services.cv_parser import extract_text_from_pdf
from services.matcher import extract_skills

file_path = "scanned_cv.pdf"

text = extract_text_from_pdf(file_path)

known_skills = [
    "Python",
    "JavaScript",
    "C++",
    "FastAPI",
    "SQLAlchemy",
    "Firebase",
    "Android Studio",
    "Git",
    "SQLite",
    "PostgreSQL",
    "Figma",
    "HTML",
    "CSS"
]

skills = extract_skills(text, known_skills)

print("Extracted CV Text:")
print(text)

print("\nSkills Found:")
print(skills)
