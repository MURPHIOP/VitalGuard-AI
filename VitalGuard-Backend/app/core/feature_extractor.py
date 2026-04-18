from dataclasses import dataclass

import numpy as np


FEATURE_ORDER = (
    "mean_moving_energy",
    "var_moving_energy",
    "max_moving_energy",
    "range_moving_energy",
    "var_detection_distance",
    "mean_stationary_energy",
)


@dataclass(frozen=True)
class FeatureVector:
    mean_moving_energy: float
    var_moving_energy: float
    max_moving_energy: float
    range_moving_energy: float
    var_detection_distance: float
    mean_stationary_energy: float

    def as_numpy(self) -> np.ndarray:
        return np.array(
            [
                self.mean_moving_energy,
                self.var_moving_energy,
                self.max_moving_energy,
                self.range_moving_energy,
                self.var_detection_distance,
                self.mean_stationary_energy,
            ],
            dtype=np.float64,
        )


def _arr(window: list[dict], key: str) -> np.ndarray:
    return np.array([float(item[key]) for item in window], dtype=np.float64)


def extract_feature_vector(window: list[dict]) -> FeatureVector:
    if not window:
        raise ValueError("Telemetry window is empty")

    me = _arr(window, "me")
    dd = _arr(window, "dd")
    se = _arr(window, "se")

    return FeatureVector(
        mean_moving_energy=float(np.mean(me)),
        var_moving_energy=float(np.var(me)),
        max_moving_energy=float(np.max(me)),
        range_moving_energy=float(np.max(me) - np.min(me)),
        var_detection_distance=float(np.var(dd)),
        mean_stationary_energy=float(np.mean(se)),
    )
