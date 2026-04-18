from pathlib import Path

import joblib
import numpy as np

from app.core.feature_extractor import FeatureVector
from app.core.inference_engine import InferenceEngine


class StubModel:
    classes_ = np.array(["NORMAL", "EMPTY", "FALL"], dtype=object)

    def predict(self, x):
        return np.array([2])

    def predict_proba(self, x):
        return np.array([[0.02, 0.08, 0.9]])


class ClassOrderMismatchStubModel:
    # Simulate a fitted model class order where FALL is index 0.
    classes_ = np.array(["FALL", "EMPTY", "NORMAL"], dtype=object)

    def predict(self, x):
        # Return FALL index according to fitted classes_ ordering.
        return np.array([0], dtype=np.int64)

    def predict_proba(self, x):
        # Probability order follows classes_: FALL, EMPTY, NORMAL
        return np.array([[0.98, 0.01, 0.01]])


def test_inference_engine_fallback_when_missing_model(tmp_path: Path) -> None:
    engine = InferenceEngine(model_path=tmp_path / "missing.pkl", use_mock_if_missing=True)
    engine.load()

    result = engine.infer(
        FeatureVector(
            mean_moving_energy=2,
            var_moving_energy=0.4,
            max_moving_energy=4,
            range_moving_energy=2,
            var_detection_distance=1,
            mean_stationary_energy=1,
        )
    )

    assert result.label == "EMPTY"


def test_inference_engine_uses_loaded_model(tmp_path: Path) -> None:
    model_path = tmp_path / "model.pkl"
    joblib.dump({"model": StubModel(), "classes": ["NORMAL", "EMPTY", "FALL"]}, model_path)

    engine = InferenceEngine(model_path=model_path, use_mock_if_missing=False)
    engine.load()

    result = engine.infer(
        FeatureVector(
            mean_moving_energy=85,
            var_moving_energy=40,
            max_moving_energy=140,
            range_moving_energy=70,
            var_detection_distance=31,
            mean_stationary_energy=15,
        )
    )

    assert result.label == "FALL"
    assert result.confidence >= 0.89


def test_inference_engine_uses_fitted_class_order_over_exported_list(tmp_path: Path) -> None:
    model_path = tmp_path / "mismatch_model.pkl"
    # Intentionally mismatched manual/exported class list.
    joblib.dump(
        {
            "model": ClassOrderMismatchStubModel(),
            "classes": ["NORMAL", "EMPTY", "FALL"],
        },
        model_path,
    )

    engine = InferenceEngine(model_path=model_path, use_mock_if_missing=False)
    engine.load()

    result = engine.infer(
        FeatureVector(
            mean_moving_energy=160,
            var_moving_energy=82,
            max_moving_energy=220,
            range_moving_energy=110,
            var_detection_distance=64,
            mean_stationary_energy=22,
        )
    )

    assert result.label == "FALL"
    assert result.label != "NORMAL"
    assert result.confidence >= 0.98
