from pydantic import BaseModel
from typing import Dict

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_path: str

class TriageInfo(BaseModel):
    urgency: str
    recommendation: str

class PredictResponse(BaseModel):
    filename: str
    prediction: str
    confidence: float
    raw_probabilities: Dict[str, float]
    triage: TriageInfo
    inference_time_ms: float
    disclaimer: str