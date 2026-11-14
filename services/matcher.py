
import re


def extract_skills(text: str, known_skills: list[str]):
    found_skills = []

    for skill in known_skills:
        pattern = (
            r"(?<![a-zA-Z0-9])"
            + re.escape(skill)
            + r"(?![a-zA-Z0-9])"
        )

        if re.search(pattern, text, re.IGNORECASE):
            found_skills.append(skill)

    return found_skills
