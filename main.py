from fastapi import FastAPI

from database import Base, engine
from routers import auth, profile, admin

app = FastAPI(title="Skillora API")

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(admin.router)


@app.get("/")
def home():
    return {
        "message": "Welcome to Skillora Backend!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "API is running"
    }