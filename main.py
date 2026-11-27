from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
import models
from routers import auth, profile, admin, recruiter, jobs

app = FastAPI(title="Skillora API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(admin.router)
app.include_router(recruiter.router)
app.include_router(jobs.router)


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