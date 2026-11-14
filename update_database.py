import sqlite3

conn = sqlite3.connect("skillora.db")
cursor = conn.cursor()

cursor.execute("""
ALTER TABLE skills
ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT 1
""")

conn.commit()
conn.close()

print("Database updated successfully!")