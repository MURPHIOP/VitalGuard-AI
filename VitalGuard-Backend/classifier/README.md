# Classifier Artifacts

This directory stores serialized ML models used by the inference engine.

- fall_model.pkl: RandomForest-based multiclass classifier (NORMAL, EMPTY, FALL)

To regenerate:

1. Ensure Python dependencies are installed.
2. Run:

python scripts/generate_mock_model.py

The generated artifact is loaded at startup from MODEL_PATH in environment config.
