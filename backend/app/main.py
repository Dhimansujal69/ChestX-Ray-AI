from fastapi import FastAPI, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import HealthResponse, PredictResponse
from app.services.image_service import validate_and_preprocess_image
from app.services.model_service import model_engine
from app.config import MODEL_PATH

app = FastAPI(
    title="PulmonaryLens API",
    description="REST API serving CNN deep learning model for chest X-ray screening.",
    version="1.0.0"
)

# Allow React frontend (Vite port 5173) to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_class=HTMLResponse, tags=["Home"])
def home():
    is_loaded = model_engine.model is not None
    status_color = "#10B981" if is_loaded else "#EF4444"
    status_text = "Operational & Model Loaded" if is_loaded else "Model Failed to Load"

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PulmonaryLens API Status</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background-color: #0F172A;
                color: #F8FAFC;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }}
            .card {{
                background-color: #1E293B;
                border: 1px solid #334155;
                border-radius: 12px;
                padding: 32px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
            }}
            h1 {{
                margin-top: 0;
                font-size: 24px;
                display: flex;
                align-items: center;
                gap: 10px;
            }}
            .badge {{
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: #0F172A;
                padding: 6px 12px;
                border-radius: 9999px;
                font-size: 14px;
                font-weight: 500;
                color: {status_color};
                border: 1px solid {status_color}40;
                margin-bottom: 20px;
            }}
            .dot {{
                width: 8px;
                height: 8px;
                background-color: {status_color};
                border-radius: 50%;
                box-shadow: 0 0 8px {status_color};
            }}
            p {{
                color: #94A3B8;
                line-height: 1.5;
                font-size: 15px;
            }}
            .links {{
                display: flex;
                gap: 12px;
                margin-top: 24px;
            }}
            a {{
                flex: 1;
                text-align: center;
                text-decoration: none;
                font-weight: 600;
                font-size: 14px;
                padding: 10px 16px;
                border-radius: 8px;
                transition: opacity 0.2s;
            }}
            .primary {{
                background-color: #3B82F6;
                color: #FFFFFF;
            }}
            .secondary {{
                background-color: #334155;
                color: #F8FAFC;
            }}
            a:hover {{
                opacity: 0.9;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <h1>🫁 PulmonaryLens API</h1>
            <div class="badge">
                <span class="dot"></span>
                <span>{status_text}</span>
            </div>
            <p>The chest X-ray deep learning inference server is running and ready to process requests from the React frontend.</p>
            <div class="links">
                <a class="primary" href="/docs">Interactive Docs (Swagger)</a>
                <a class="secondary" href="/api/v1/health">JSON Health Check</a>
            </div>
        </div>
    </body>
    </html>
    """

@app.get("/api/v1/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model_engine.model is not None,
        "model_path": str(MODEL_PATH)
    }

@app.post("/api/v1/predict", response_model=PredictResponse, tags=["Inference"])
async def predict_xray(file: UploadFile = File(...)):
    contents = await file.read()
    img_batch = validate_and_preprocess_image(file, contents)
    result = model_engine.predict(file.filename, img_batch)
    return result