import os
import joblib
import numpy as np
import pandas as pd

from app.core.config import MODEL_PATH, RISK_LEVELS

_model_bundle = None


def _load_bundle():
    global _model_bundle
    if _model_bundle is None:
        if not os.path.exists(MODEL_PATH):
            from app.ml.train import train_model
            train_model()
        _model_bundle = joblib.load(MODEL_PATH)
    return _model_bundle


def _contributing_factors(payload: dict) -> list:
    factors = []
    if payload["rainfall_24h"] > 120:
        factors.append("Very high rainfall in the last 24 hours")
    elif payload["rainfall_24h"] > 70:
        factors.append("Elevated rainfall in the last 24 hours")

    if payload["rainfall_72h"] > 280:
        factors.append("Sustained heavy rainfall over 72 hours")

    if payload["slope_deg"] > 35:
        factors.append("Steep slope gradient increases instability")
    elif payload["slope_deg"] > 25:
        factors.append("Moderate-to-steep slope gradient")

    if payload["soil_moisture"] > 75:
        factors.append("Soil moisture near saturation")
    elif payload["soil_moisture"] > 55:
        factors.append("Elevated soil moisture levels")

    if payload["soil_type"] in ("CLAY", "SILTY"):
        factors.append(f"{payload['soil_type'].title()} soil retains water and reduces stability")

    if payload["vegetation_level"] in ("SPARSE", "NONE"):
        factors.append("Low vegetation cover reduces slope anchoring")

    if payload["history_landslide"]:
        factors.append("Prior landslide history recorded at this location")

    if not factors:
        factors.append("No major destabilizing factors detected")

    return factors


def _recommended_actions(risk_level: str) -> list:
    mapping = {
        "LOW": [
            "Continue routine slope and rainfall monitoring",
            "No immediate action required",
        ],
        "MEDIUM": [
            "Increase monitoring frequency of slope sensors",
            "Advise residents in the zone to stay alert",
            "Inspect drainage systems near the slope",
        ],
        "HIGH": [
            "Deploy field teams to inspect vulnerable slopes and roads",
            "Prepare evacuation shelters and emergency supplies",
            "Issue a public advisory for the affected area",
        ],
        "CRITICAL": [
            "Initiate immediate evacuation of at-risk households",
            "Position rescue and medical teams near the zone",
            "Close or reroute traffic on nearby roads",
            "Issue an emergency alert through all available channels",
        ],
    }
    return mapping.get(risk_level, mapping["MEDIUM"])


def predict_risk(payload: dict) -> dict:
    bundle = _load_bundle()
    pipeline = bundle["pipeline"]
    features = bundle["features"]

    row = pd.DataFrame([{k: payload[k] for k in features}])
    probs = pipeline.predict_proba(row)[0]
    classes = list(pipeline.classes_)

    prob_map = {cls: round(float(p) * 100, 2) for cls, p in zip(classes, probs)}
    # ensure all 4 classes present
    for lvl in RISK_LEVELS:
        prob_map.setdefault(lvl, 0.0)

    predicted = max(prob_map, key=prob_map.get)
    confidence = prob_map[predicted]

    return {
        "risk_level": predicted,
        "confidence": confidence,
        "probabilities": {lvl: prob_map[lvl] for lvl in RISK_LEVELS},
        "contributing_factors": _contributing_factors(payload),
        "recommended_actions": _recommended_actions(predicted),
    }
