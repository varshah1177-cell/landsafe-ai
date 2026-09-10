"""
Generates a synthetic dataset for landslide risk classification.

IMPORTANT: This dataset is entirely synthetic and generated using rule-based
relationships plus noise. It is intended for prototype/demo purposes only and
does NOT represent real-world landslide statistics or measurements.
"""
import numpy as np
import pandas as pd

from app.core.config import SOIL_TYPES, VEGETATION_LEVELS, DATASET_PATH

N_SAMPLES = 3500
SEED = 42


def _risk_score(rainfall_24h, rainfall_72h, slope_deg, elevation_m, soil_moisture,
                 soil_type, vegetation_level, history_landslide):
    score = 0.0
    score += (rainfall_24h / 250.0) * 28
    score += (rainfall_72h / 500.0) * 22
    score += (slope_deg / 60.0) * 20
    score += (soil_moisture / 100.0) * 18

    soil_factor = {"CLAY": 8, "SILTY": 6, "LOAMY": 3, "SANDY": 1, "ROCKY": -4}
    score += soil_factor.get(soil_type, 0)

    veg_factor = {"NONE": 9, "SPARSE": 6, "MODERATE": 2, "DENSE": -5}
    score += veg_factor.get(vegetation_level, 0)

    score += 12 if history_landslide else 0

    # Elevation has a mild non-linear contribution (very high or very low = slightly less risk)
    score += max(0, (elevation_m - 400) / 1600) * 4

    return score


def generate_dataset(n_samples: int = N_SAMPLES, seed: int = SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    rainfall_24h = np.clip(rng.gamma(shape=2.0, scale=45, size=n_samples), 0, 260)
    rainfall_72h = np.clip(rainfall_24h * rng.uniform(1.6, 2.6, n_samples) + rng.normal(0, 20, n_samples), 0, 550)
    slope_deg = np.clip(rng.normal(28, 12, n_samples), 2, 60)
    elevation_m = np.clip(rng.normal(850, 350, n_samples), 50, 2200)
    soil_moisture = np.clip(rng.normal(55, 20, n_samples), 5, 100)
    soil_type = rng.choice(SOIL_TYPES, size=n_samples)
    vegetation_level = rng.choice(VEGETATION_LEVELS, size=n_samples)
    history_landslide = rng.choice([0, 1], size=n_samples, p=[0.72, 0.28])

    rows = []
    for i in range(n_samples):
        score = _risk_score(
            rainfall_24h[i], rainfall_72h[i], slope_deg[i], elevation_m[i],
            soil_moisture[i], soil_type[i], vegetation_level[i], bool(history_landslide[i]),
        )
        score += rng.normal(0, 6)  # noise

        if score < 25:
            risk = "LOW"
        elif score < 45:
            risk = "MEDIUM"
        elif score < 65:
            risk = "HIGH"
        else:
            risk = "CRITICAL"

        rows.append({
            "rainfall_24h": round(float(rainfall_24h[i]), 1),
            "rainfall_72h": round(float(rainfall_72h[i]), 1),
            "slope_deg": round(float(slope_deg[i]), 1),
            "elevation_m": round(float(elevation_m[i]), 1),
            "soil_moisture": round(float(soil_moisture[i]), 1),
            "soil_type": soil_type[i],
            "vegetation_level": vegetation_level[i],
            "history_landslide": int(history_landslide[i]),
            "risk_level": risk,
        })

    return pd.DataFrame(rows)


if __name__ == "__main__":
    df = generate_dataset()
    df.to_csv(DATASET_PATH, index=False)
    print(f"Synthetic dataset generated: {len(df)} rows -> {DATASET_PATH}")
    print(df["risk_level"].value_counts())
