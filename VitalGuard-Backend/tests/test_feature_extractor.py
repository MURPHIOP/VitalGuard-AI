from app.core.feature_extractor import extract_feature_vector


def test_extract_feature_vector_returns_expected_stats() -> None:
    window = [
        {"me": 10, "dd": 100, "se": 5},
        {"me": 20, "dd": 120, "se": 7},
        {"me": 30, "dd": 140, "se": 9},
    ]

    features = extract_feature_vector(window)

    assert round(features.mean_moving_energy, 2) == 20.0
    assert round(features.max_moving_energy, 2) == 30.0
    assert round(features.range_moving_energy, 2) == 20.0
    assert round(features.mean_stationary_energy, 2) == 7.0
    assert features.var_moving_energy > 0
    assert features.var_detection_distance > 0
