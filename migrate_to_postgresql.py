import sqlite3
from datetime import datetime

from sqlalchemy import text
from database import engine


def convert_datetime(value):
    if value is None or isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value)


source = sqlite3.connect("skillora.db")
source.row_factory = sqlite3.Row

tables = [
    "users",
    "skills",
    "profiles",
    "profile_skills",
    "revoked_tokens"
]

data = {}

try:
    for table in tables:
        data[table] = [
            dict(row)
            for row in source.execute(f"SELECT * FROM {table}")
        ]

    with engine.begin() as connection:
        for table in tables:
            count = connection.execute(
                text(f"SELECT COUNT(*) FROM {table}")
            ).scalar()

            if count != 0:
                raise Exception(
                    f"Target table {table} is not empty. Migration stopped."
                )

        for row in data["users"]:
            connection.execute(
                text("""
                    INSERT INTO users
                    (id, name, email, hashed_password, role)
                    VALUES (:id, :name, :email, :hashed_password, :role)
                """),
                row
            )

        for row in data["skills"]:
            row["created_at"] = convert_datetime(row["created_at"])

            connection.execute(
                text("""
                    INSERT INTO skills
                    (id, name, status, merged_into_id, created_at)
                    VALUES (:id, :name, :status, NULL, :created_at)
                """),
                row
            )

        for row in data["profiles"]:
            row["created_at"] = convert_datetime(row["created_at"])

            connection.execute(
                text("""
                    INSERT INTO profiles
                    (id, user_id, name, description, qualification,
                     location, cv_path, github_username, created_at)
                    VALUES
                    (:id, :user_id, :name, :description, :qualification,
                     :location, :cv_path, :github_username, :created_at)
                """),
                row
            )

        for row in data["profile_skills"]:
            row["verified"] = bool(row["verified"])
            connection.execute(
                text("""
                    INSERT INTO profile_skills
                    (id, profile_id, skill_id, source, verified)
                    VALUES
                    (:id, :profile_id, :skill_id, :source, :verified)
                """),
                row
            )

        for row in data["revoked_tokens"]:
            connection.execute(
                text("""
                    INSERT INTO revoked_tokens (id, token)
                    VALUES (:id, :token)
                """),
                row
            )

        for row in data["skills"]:
            if row["merged_into_id"] is not None:
                connection.execute(
                    text("""
                        UPDATE skills
                        SET merged_into_id = :merged_into_id
                        WHERE id = :id
                    """),
                    {
                        "id": row["id"],
                        "merged_into_id": row["merged_into_id"]
                    }
                )

        for table in tables:
            connection.execute(
                text(f"""
                    SELECT setval(
                        pg_get_serial_sequence('{table}', 'id'),
                        COALESCE((SELECT MAX(id) FROM {table}), 1),
                        (SELECT COUNT(*) > 0 FROM {table})
                    )
                """)
            )

    print("Migration completed successfully!")

finally:
    source.close()