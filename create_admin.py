from getpass import getpass
from sqlalchemy import select

from database import SessionLocal
from models import User
from security import hash_password

db = SessionLocal()

try:
    email = input("Enter admin email: ").strip().lower()

    admin = db.scalar(
        select(User).where(User.email == email)
    )

    if admin is None:
        print("Admin account not found.")

    elif admin.role != "admin":
        print("This email does not belong to an admin account.")

    else:
        password = getpass("Enter new password: ")
        confirm_password = getpass("Confirm new password: ")

        if len(password) < 8:
            print("Password must be at least 8 characters.")

        elif password != confirm_password:
            print("Passwords do not match.")

        else:
            admin.hashed_password = hash_password(password)
            db.commit()
            print("Admin password updated successfully!")

finally:
    db.close()