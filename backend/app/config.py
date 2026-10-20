import pathlib

# Resolve paths dynamically
APP_DIR = pathlib.Path(__file__).resolve().parent
PROJECT_ROOT = APP_DIR.parent.parent
MODEL_PATH = PROJECT_ROOT / "artifacts" / "chest_xray_cnn.keras"

# Model image specifications
IMAGE_SIZE = (224, 224)
DECISION_THRESHOLD = 0.50

# Clinical Triage Boundaries
TRIAGE_THRESHOLDS = {
    "NORMAL_MAX": 0.35,
    "REVIEW_MAX": 0.65
}