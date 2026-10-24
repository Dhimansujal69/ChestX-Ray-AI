# PulmonaryLens: Deep Learning Chest X-Ray Screening System

PulmonaryLens is an end-to-end medical imaging application designed for automated pneumonia triage in pediatric anterior-posterior (AP/PA) chest radiographs. 

The system pairs a custom 4-block Convolutional Neural Network (CNN) trained with inverse-frequency class weighting alongside a high-throughput **FastAPI** inference microservice and an interactive **React (Vite + Tailwind CSS)** clinical screening dashboard.

---

## Key Features

- **Automated Feature Extraction:** Custom 4-block deep convolutional network with batch normalization and global average pooling.
- **Sensitivity-Optimized Clinical Triage:** Calibrated three-tier urgency assignment (**LOW**, **MODERATE**, **HIGH**) designed to prioritize patient safety and minimize dangerous False Negatives (FN).
- **Sub-50ms Inference Latency:** In-memory model caching via an ASGI singleton engine avoiding cold-start prediction latency.
- **Strict Byte-Level Validation:** MIME-type verification, dimension homogenization (RGB $224 \times 224$), and image integrity checks using Pillow.
- **Interactive Web Dashboard:** Clean clinical UI with drag-and-drop file ingestion, live preview, probability distribution bars, and responsive triage metrics.

---

## System Architecture

```text
       [ User Upload: Frontal Radiograph (.jpeg, .png) ]
                              │
                              ▼
        ┌───────────────────────────────────────────┐
        │        React.js + Tailwind CSS UI         │
        │  - Drag-and-drop file input & preview     │
        │  - Client-side validation (<10MB)         │
        └─────────────────────┬─────────────────────┘
                              │ POST /api/v1/predict (multipart/form-data)
                              ▼
        ┌───────────────────────────────────────────┐
        │              FastAPI Gateway              │
        │  - CORS validation & route routing        │
        │  - Pillow byte verification & RGB convert │
        │  - Resizing to (1, 224, 224, 3) tensor    │
        └─────────────────────┬─────────────────────┘
                              │
                              ▼
        ┌───────────────────────────────────────────┐
        │     Keras / TensorFlow Engine (Cached)    │
        │  - Conv2D (32 -> 64 -> 128 -> 256)        │
        │  - GlobalAveragePooling2D + Dropout(0.4)  │
        │  - Dense(1, sigmoid) inference            │
        └─────────────────────┬─────────────────────┘
                              │
                              ▼
        ┌───────────────────────────────────────────┐
        │          Calibrated Triage Logic          │
        │  - P(Pneumonia) < 0.50 -> LOW Urgency     │
        │  - 0.50 <= P <= 0.80  -> MODERATE Urgency │
        │  - P(Pneumonia) > 0.80 -> HIGH Urgency    │
        └─────────────────────┬─────────────────────┘


Model Architecture & ValidationThe model is trained on the Kermany et al. Chest X-Ray dataset (5,232 training images, 624 holdout test images).Network TopologyInput: $224 \times 224 \times 3$ RGB radiograph tensor.Feature Backbone: 4 sequential blocks:Conv2D(3x3) $\rightarrow$ BatchNormalization $\rightarrow$ MaxPooling2D(2x2)Filter scaling: $32 \rightarrow 64 \rightarrow 128 \rightarrow 256$Classification Head: GlobalAveragePooling2D $\rightarrow$ Dense(128, activation='relu') $\rightarrow$ Dropout(0.4) $\rightarrow$ Dense(1, activation='sigmoid').Class Imbalance CompensationDue to the ~3:1 infection-to-normal distribution in the dataset, inverse-frequency class weights were applied during gradient optimization:Class 0 (Normal): Weight $\approx 1.94$Class 1 (Pneumonia): Weight $\approx 0.67$Evaluation on Unseen Test Set ($N=624$)MetricScoreClinical ContextSensitivity (Recall)96.92%378 / 390 true pneumonia cases identified. Maximizes detection to avoid false discharges.Specificity54.70%128 / 234 normal cases cleared. Borderline anatomical overlaps are conservatively flagged for secondary review.Accuracy81.09%Overall correct classification rate on untouched holdout test data.ROC-AUC0.985Strong separability across varying decision boundaries.Project StructurePlaintextCNN_Project/
├── artifacts/
│   └── chest_xray_cnn.keras         # Serialized Keras CNN weights
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   ├── image_service.py     # Pillow validation & preprocessing
│   │   │   └── model_service.py     # Inference singleton & triage rules
│   │   ├── config.py                # Hyperparameters, paths & thresholds
│   │   ├── main.py                  # FastAPI server routes & CORS
│   │   └── schemas.py               # Pydantic request/response schemas
│   └── requirements.txt             # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── api.js                   # Axios HTTP interface
│   │   ├── App.jsx                  # Main dashboard component
│   │   ├── index.css                # Tailwind directives & theme
│   │   └── main.jsx                 # React root mount
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── sample_test_images/              # Lightweight verification images
│   ├── NORMAL/
│   └── PNEUMONIA/
├── .gitignore
└── README.md
Installation & SetupPrerequisitesPython 3.10+Node.js 18+ and npmGit1. Repository SetupBashgit clone [https://github.com/](https://github.com/)<your-username>/pulmonary-lens.git
cd pulmonary-lens
2. Backend ServiceBash# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
# source .venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Start FastAPI ASGI server
uvicorn app.main:app --reload --port 8000
API Home: http://127.0.0.1:8000/Interactive OpenAPI Docs: http://127.0.0.1:8000/docs3. Frontend ClientBash# Open a second terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
Open http://localhost:5173/ in your browser.API SpecificationPOST /api/v1/predictAccepts a chest radiograph file upload (multipart/form-data) and returns structured screening telemetry.Sample Request:Bashcurl -X POST "[http://127.0.0.1:8000/api/v1/predict](http://127.0.0.1:8000/api/v1/predict)" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample_test_images/PNEUMONIA/pneumonia_sample_1.jpeg"
Sample Response (200 OK):JSON{
  "filename": "pneumonia_sample_1.jpeg",
  "prediction": "PNEUMONIA",
  "confidence": 0.9812,
  "raw_probabilities": {
    "NORMAL": 0.0188,
    "PNEUMONIA": 0.9812
  },
  "triage": {
    "urgency": "HIGH",
    "recommendation": "High-probability consolidation detected. Prioritize clinical examination."
  },
  "inference_time_ms": 34.62,
  "disclaimer": "RESEARCH PROTOTYPE: This tool is not an FDA-cleared diagnostic medical device."
}
Medical DisclaimerRESEARCH USE ONLY: This software is an engineering proof-of-concept developed solely for academic research and computational demonstration. It has not received clearance or approval from the U.S. Food and Drug Administration (FDA) or any regulatory body for medical diagnosis. It must not be used as a primary diagnostic tool, and all algorithmic findings require validation by a licensed radiologist or healthcare provider.
---

### How to Add It to GitHub

1. In VS Code, create a file named `README.md` in your project root (`C:\Users\DELL\Desktop\CNN_Project\README.md`).
2. Paste the contents above and save (`Ctrl + S`).
3. Commit and push:
   ```powershell
   git add README.md
   git commit -m "docs: add comprehensive project README with architecture and benchmarks"
   git push origin main

                              │
                              ▼
        [ Structured Pydantic JSON Telemetry Response ]
