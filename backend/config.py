import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DATABASE_PATH = os.path.join(BASE_DIR, "landsafe.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

ML_DIR = os.path.join(BASE_DIR, "app", "ml")
MODEL_PATH = os.path.join(ML_DIR, "landsafe_model.joblib")
DATASET_PATH = os.path.join(ML_DIR, "synthetic_dataset.csv")

RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
SOIL_TYPES = ["CLAY", "SANDY", "LOAMY", "ROCKY", "SILTY"]
VEGETATION_LEVELS = ["DENSE", "MODERATE", "SPARSE", "NONE"]

APP_NAME = "LANDSAFE AI"
APP_DESCRIPTION = "AI-Powered Landslide Early Warning & Disaster Intelligence System (SIH26001)"
PROTOTYPE_NOTICE = "Prototype Mode — Data is simulated for demonstration."
