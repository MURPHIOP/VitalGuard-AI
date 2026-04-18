from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier


def build_dataset(n: int = 4000):
    rng = np.random.default_rng(42)

    normal = np.column_stack(
        [
            rng.normal(45, 12, n),
            rng.normal(28, 10, n),
            rng.normal(80, 18, n),
            rng.normal(36, 9, n),
            rng.normal(25, 10, n),
            rng.normal(16, 5, n),
        ]
    )

    empty = np.column_stack(
        [
            rng.normal(2, 1, n),
            rng.normal(0.8, 0.5, n),
            rng.normal(6, 2, n),
            rng.normal(3, 1.5, n),
            rng.normal(3, 1.5, n),
            rng.normal(1.6, 0.8, n),
        ]
    )

    fall = np.column_stack(
        [
            rng.normal(130, 30, n),
            rng.normal(85, 28, n),
            rng.normal(180, 45, n),
            rng.normal(95, 24, n),
            rng.normal(70, 24, n),
            rng.normal(22, 9, n),
        ]
    )

    x = np.vstack([normal, empty, fall])
    y = np.concatenate([
        np.full(n, "NORMAL", dtype=object),
        np.full(n, "EMPTY", dtype=object),
        np.full(n, "FALL", dtype=object),
    ])

    return x, y


def main() -> None:
    x, y = build_dataset()

    model = RandomForestClassifier(
        n_estimators=250,
        max_depth=12,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced_subsample",
    )
    model.fit(x, y)

    output_path = Path(__file__).resolve().parents[1] / "classifier" / "fall_model.pkl"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump({"model": model, "classes": ["NORMAL", "EMPTY", "FALL"]}, output_path)
    print(f"Model exported to {output_path}")


if __name__ == "__main__":
    main()
