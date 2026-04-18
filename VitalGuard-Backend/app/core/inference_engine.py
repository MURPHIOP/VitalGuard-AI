from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import joblib
import numpy as np
from loguru import logger

from app.core.feature_extractor import FeatureVector


class PredictModel(Protocol):
    def predict(self, x: np.ndarray) -> np.ndarray: ...

    def predict_proba(self, x: np.ndarray) -> np.ndarray: ...


@dataclass(frozen=True)
class InferenceResult:
    label: str
    confidence: float


class InferenceEngine:
    def __init__(self, model_path: Path, use_mock_if_missing: bool = True) -> None:
        self.model_path = model_path
        self.use_mock_if_missing = use_mock_if_missing
        self.model: PredictModel | None = None
        self.class_names: list[str] = ["NORMAL", "EMPTY", "FALL"]

    def load(self) -> None:
        if not self.model_path.exists():
            if self.use_mock_if_missing:
                logger.warning("Model file not found at {}, using deterministic fallback inference", self.model_path)
                self.model = None
                return
            raise FileNotFoundError(f"Model not found: {self.model_path}")

        loaded = joblib.load(self.model_path)
        if isinstance(loaded, dict) and "model" in loaded:
            self.model = loaded["model"]
            model_classes = getattr(self.model, "classes_", None)
            if model_classes is not None:
                self.class_names = [str(item) for item in model_classes]
            else:
                maybe_classes = loaded.get("classes")
                if maybe_classes:
                    self.class_names = list(maybe_classes)
        else:
            self.model = loaded
            maybe_classes = getattr(loaded, "classes_", None)
            if maybe_classes is not None:
                self.class_names = [str(x) for x in maybe_classes]

        logger.info("Inference model loaded from {}", self.model_path)

    def infer(self, features: FeatureVector) -> InferenceResult:
        x = features.as_numpy().reshape(1, -1)

        if self.model is None:
            return self._fallback_infer(features)

        try:
            pred_idx = int(self.model.predict(x)[0]) if np.issubdtype(type(self.model.predict(x)[0]), np.integer) else None
            probabilities = self.model.predict_proba(x)[0]
            best_idx = int(np.argmax(probabilities))

            if pred_idx is not None and pred_idx < len(self.class_names):
                label = self.class_names[pred_idx]
                confidence = float(probabilities[pred_idx])
            else:
                label = self.class_names[best_idx] if best_idx < len(self.class_names) else "NORMAL"
                confidence = float(probabilities[best_idx])

            return InferenceResult(label=label, confidence=round(confidence, 4))
        except Exception as exc:
            logger.exception("Inference failed, switching to fallback: {}", exc)
            return self._fallback_infer(features)

    def _fallback_infer(self, features: FeatureVector) -> InferenceResult:
        if features.mean_moving_energy < 5 and features.mean_stationary_energy < 3:
            return InferenceResult(label="EMPTY", confidence=0.92)

        risk_score = (
            0.34 * features.mean_moving_energy
            + 0.22 * features.var_moving_energy
            + 0.18 * features.range_moving_energy
            + 0.16 * features.var_detection_distance
            + 0.1 * features.max_moving_energy
        )

        if risk_score > 120:
            confidence = min(0.99, 0.75 + (risk_score - 120) / 300)
            return InferenceResult(label="FALL", confidence=round(confidence, 4))

        return InferenceResult(label="NORMAL", confidence=0.82)
