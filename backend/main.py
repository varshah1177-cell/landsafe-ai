import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import APP_NAME, APP_DESCRIPTION, MODEL_PATH
from app.db.database import Base, engine
from app.db.seed import seed_database
from app.api.routes import router as api_router

app = FastAPI(title=APP_NAME, description=APP_DESCRIPTION, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

    from app.db.database import SessionLocal
    from app.db.models import LandslideZone

    db = SessionLocal()
    try:
        count = db.query(LandslideZone).count()
    finally:
        db.close()

    if count == 0:
        seed_database()

    if not os.path.exists(MODEL_PATH):
        from app.ml.train import train_model
        train_model()


app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {"message": APP_NAME, "description": APP_DESCRIPTION, "docs": "/docs"}
