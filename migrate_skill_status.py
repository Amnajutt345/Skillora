
import sqlite3

conn = sqlite3.connect("skillora.db")
cursor = conn.cursor()

try:
    conn.execute("BEGIN")

    # Save existing profile skill count
    cursor.execute("SELECT COUNT(*) FROM profile_skills")
    old_profile_skills = cursor.fetchone()[0]

    # Add status column
    cursor.execute("""
        ALTER TABLE skills
        ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'
    """)

    # Add merge reference column
    cursor.execute("""
        ALTER TABLE skills
        ADD COLUMN merged_into_id INTEGER REFERENCES skills(id)
    """)

    # Add creation date column
    cursor.execute("""
        ALTER TABLE skills
        ADD COLUMN created_at DATETIME
    """)

    # Transfer old approval values
    cursor.execute("""
        UPDATE skills
        SET status = CASE
            WHEN is_approved = 1 THEN 'approved'
            ELSE 'pending'
        END
    """)

    # Set creation date for existing skills
    cursor.execute("""
        UPDATE skills
        SET created_at = CURRENT_TIMESTAMP
        WHERE created_at IS NULL
    """)

    # Verify profile skill count
    cursor.execute("SELECT COUNT(*) FROM profile_skills")
    new_profile_skills = cursor.fetchone()[0]

    if old_profile_skills != new_profile_skills:
        raise Exception("Profile skill records changed!")

    conn.commit()

    print("Migration completed successfully!")

    cursor.execute("""
        SELECT status, COUNT(*)
        FROM skills
        GROUP BY status
    """)

    print("\nSkill Status Summary:")
    for status, count in cursor.fetchall():
        print(f"{status}: {count}")

    print("\nProfile skill records preserved:", new_profile_skills)

except Exception as e:
    conn.rollback()
    print("Migration failed:", e)

finally:
    conn.close()
