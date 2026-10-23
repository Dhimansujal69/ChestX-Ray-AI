import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Clock, 
  FileText, 
  RefreshCw, 
  ShieldAlert, 
  Stethoscope 
} from 'lucide-react';
import { checkHealth, predictXray } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [serverHealth, setServerHealth] = useState({ online: false, checking: true });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const verifyBackend = async () => {
      try {
        const data = await checkHealth();
        setServerHealth({ online: data.status === 'healthy', checking: false });
      } catch (err) {
        setServerHealth({ online: false, checking: false });
      }
    };
    verifyBackend();
  }, []);

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Please upload a valid JPEG, JPG, or PNG image.');
      return;
    }
    setError(null);
    setResult(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const data = await predictXray(selectedFile);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Inference failed. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30 text-blue-400">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-wide">PulmonaryLens</span>
              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full ml-2">CNN CAD</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <nav className="flex space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-sm">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Screening Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('about')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${activeTab === 'about' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                About & Instructions
              </button>
            </nav>

            <div className="flex items-center space-x-2 text-xs border border-slate-800 bg-slate-900 px-3 py-1.5 rounded-full">
              <span className={`w-2 h-2 rounded-full ${serverHealth.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-slate-300 font-medium">{serverHealth.online ? 'API Online' : 'API Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Chest Radiograph Pneumonia Classifier</h1>
              <p className="text-sm text-slate-400 mt-1">Upload a frontal chest X-ray to run deep learning inference.</p>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl flex items-center space-x-3 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-4">
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => !previewUrl && fileInputRef.current.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center min-h-[380px] bg-slate-900/40 relative overflow-hidden ${
                    previewUrl ? 'border-slate-800' : 'border-slate-700 hover:border-blue-500 cursor-pointer'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => handleFileSelect(e.target.files[0])} 
                    accept="image/png, image/jpeg, image/jpg" 
                    className="hidden" 
                  />

                  {previewUrl ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <img 
                        src={previewUrl} 
                        alt="Radiograph preview" 
                        className="max-h-[320px] w-auto object-contain rounded-lg border border-slate-800 shadow-xl"
                      />
                      <span className="text-xs text-slate-400 mt-3 font-mono">{selectedFile?.name}</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-200">Click to upload or drag & drop</p>
                        <p className="text-xs text-slate-400">Accepted formats: JPEG, PNG (Max 10 MB)</p>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                        className="mt-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700"
                      >
                        Browse Files
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAnalyze}
                    disabled={!selectedFile || loading || !serverHealth.online}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed font-medium text-sm py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
                        <span>Evaluating Features...</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4" />
                        <span>Run Model Screening</span>
                      </>
                    )}
                  </button>

                  {selectedFile && (
                    <button
                      onClick={resetAll}
                      disabled={loading}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-700 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-6">
                {result ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Triage Classification</span>
                        <div className="text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
                          {result.prediction === 'PNEUMONIA' ? (
                            <span className="text-rose-400">Pneumonia Pattern Detected</span>
                          ) : (
                            <span className="text-emerald-400">Normal Radiograph</span>
                          )}
                        </div>
                      </div>

                      <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        result.triage.urgency === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        result.triage.urgency === 'MODERATE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {result.triage.urgency} Urgency
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-300">Pneumonia Probability:</span>
                          <span className="text-slate-200">{(result.raw_probabilities.PNEUMONIA * 100).toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${result.raw_probabilities.PNEUMONIA * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-300">Normal Clearance Probability:</span>
                          <span className="text-slate-200">{(result.raw_probabilities.NORMAL * 100).toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${result.raw_probabilities.NORMAL * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                        <Info className="w-4 h-4 text-blue-400" />
                        <span>System Recommendation</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {result.triage.recommendation}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 text-xs border-t border-slate-800">
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>Latency: <strong className="text-slate-200">{result.inference_time_ms} ms</strong></span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-400">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span>Target: <strong className="text-slate-200">Binary 224x224</strong></span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full border border-slate-800/80 bg-slate-900/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[380px]">
                    <Activity className="w-10 h-10 text-slate-600 stroke-[1.5]" />
                    <h3 className="font-semibold text-slate-300">Awaiting Radiograph Analysis</h3>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Upload an X-ray scan on the left and click "Run Model Screening" to calculate feature distributions and confidence outputs.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start space-x-3 text-xs text-amber-200/80">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
              <p>
                <strong>Academic / Research Disclaimer:</strong> This deep learning interface is built strictly for computational demonstration and academic research. It is not an FDA- or CE-cleared diagnostic device.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 py-4">
            <div>
              <h2 className="text-2xl font-bold text-white">About PulmonaryLens</h2>
              <p className="text-sm text-slate-400 mt-1">
                An end-to-end computer vision platform designed for automated pneumonia triage in chest radiography.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">1</div>
                <h3 className="font-semibold text-slate-200 text-sm">Select Radiograph</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Choose a chest X-ray image from your machine or pick one from the project's test set.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">2</div>
                <h3 className="font-semibold text-slate-200 text-sm">Automated Pipeline</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  FastAPI validates byte signatures, resizes to 224x224, and executes a forward pass on the 4-block CNN model.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">3</div>
                <h3 className="font-semibold text-slate-200 text-sm">Review Triage Tier</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Inspect the computed probability scores, triage urgency tiers (Low, Moderate, High), and execution latency.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                Technical Specifications & Architecture
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-white block">Convolutional Neural Network</span>
                  <p>• 4 Conv2D blocks (32, 64, 128, 256 filters) with Batch Normalization.</p>
                  <p>• Global Average Pooling + Dropout (0.4) to suppress overfitting.</p>
                  <p>• <strong>Sensitivity (Recall): 96.92%</strong> on unseen Kaggle test set.</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-white block">Backend Serving Engine</span>
                  <p>• Built with FastAPI & Uvicorn ASGI server.</p>
                  <p>• Memory-resident model caching yielding &lt;50ms inference times.</p>
                  <p>• Pydantic schema validation for strict type safety.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}