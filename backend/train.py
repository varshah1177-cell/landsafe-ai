import os
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.core.config import DATASET_PATH, MODEL_PATH, RISK_LEVELS
from app.ml.dataset import generate_dataset

NUMERIC_FEATURES = ["rainfall_24h", "rainfall_72h", "slope_deg", "elevation_m", "soil_moisture"]
CATEGORICAL_FEATURES = ["soil_type", "vegetation_level"]
BINARY_FEATURES = ["history_landslide"]
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES + BINARY_FEATURES


def train_model():
    if not os.path.exists(DATASET_PATH):
        df = generate_dataset()
        df.to_csv(DATASET_PATH, index=False)
    else:
        df = pd.read_csv(DATASET_PATH)

    X = df[ALL_FEATURES]
    y = df["risk_level"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
            ("bin", "passthrough", BINARY_FEATURES),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=14,
        class_weight="balanced",
        random_state=42,
    )

    pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("classifier", model)])
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, labels=RISK_LEVELS, zero_division=0)

    print(f"Synthetic Dataset Test Accuracy: {accuracy * 100:.2f}%")
    print(report)

    joblib.dump({"pipeline": pipeline, "features": ALL_FEATURES, "classes": list(pipeline.classes_),
                 "accuracy": accuracy}, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    return accuracy


if __name__ == "__main__":
    train_model()
