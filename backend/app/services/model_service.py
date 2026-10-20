import time
import tensorflow as tf
from app.config import MODEL_PATH, DECISION_THRESHOLD, TRIAGE_THRESHOLDS
from app.schemas import PredictResponse, TriageInfo

class ModelEngine:
    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Keras model not found at: {MODEL_PATH}")
        print(f"Loading model from: {MODEL_PATH} ...")
        self.model = tf.keras.models.load_model(str(MODEL_PATH))
        print("Model loaded successfully.")

    def predict(self, filename: str, img_batch) -> PredictResponse:
        start_time = time.perf_counter()
        raw_pred = self.model.predict(img_batch, verbose=0)
        inference_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Extract Sigmoid probability P(Pneumonia)
        prob_pneumonia = float(raw_pred[0][0])
        prob_normal = round(1.0 - prob_pneumonia, 4)
        prob_pneumonia = round(prob_pneumonia, 4)

        if prob_pneumonia >= DECISION_THRESHOLD:
            prediction = "PNEUMONIA"
            confidence = prob_pneumonia
        else:
            prediction = "NORMAL"
            confidence = prob_normal

        # Categorize into clinical triage levels
        if prob_pneumonia < TRIAGE_THRESHOLDS["NORMAL_MAX"]:
            triage = TriageInfo(
                urgency="LOW",
                recommendation="Features align with Normal radiograph. Follow routine medical observation."
            )
        elif prob_pneumonia <= TRIAGE_THRESHOLDS["REVIEW_MAX"]:
            triage = TriageInfo(
                urgency="MODERATE",
                recommendation="Borderline radiological patterns. Second clinical review recommended."
            )
        else:
            triage = TriageInfo(
                urgency="HIGH",
                recommendation="High-probability consolidation detected. Prioritize clinical examination."
            )

        return PredictResponse(
            filename=filename,
            prediction=prediction,
            confidence=confidence,
            raw_probabilities={"NORMAL": prob_normal, "PNEUMONIA": prob_pneumonia},
            triage=triage,
            inference_time_ms=inference_time_ms,
            disclaimer="RESEARCH PROTOTYPE: This tool is not an FDA-cleared diagnostic medical device."
        )

model_engine = ModelEngine()