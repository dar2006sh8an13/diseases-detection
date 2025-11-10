# AI-Powered Early Disease Detection (Node.js prototype)

Engineering demo of a multi-modal disease detection system using Node.js (Express) for API + HTML/CSS/JS frontend. It supports:
- Image upload (X-ray / skin lesion / retina)
- Optional EHR/symptom fields
- OpenCV-based preprocessing if available
- TensorFlow.js model inference if a model is provided; otherwise a deterministic stub
- Heatmap placeholder (simulates Grad-CAM overlay)
- JSONL audit logging

Important: Not for clinical use.

## Requirements
- Node.js >= 18
- Optional native deps: OpenCV (for `opencv4nodejs`) and TensorFlow C libs (for `@tensorflow/tfjs-node`). If these are missing, the app still runs using fallbacks.

## Install

```bash
npm install
```

If you want dev auto-reload:

```bash
npm run dev
```

## Run

```bash
npm start
```

Then open http://localhost:3000/

## Provide a real model (optional)
1. Convert your Keras/TF model to TF.js Layers format (model.json + weights.bin files).
2. Place them under:

```
server/inference/model_artifacts/model.json
server/inference/model_artifacts/group1-shard1of1.bin (or multiple shards)
```

The server will attempt to load it automatically.

## API
- POST /api/predict
  - multipart/form-data: `image` (file)
  - form field: `ehr_json` (JSON string for EHR fields)
  - Response: `{ requestId, score, label, thresholds, calibration, heatmap_base64, meta }`

## Notes
- The heatmap is a placeholder colored overlay scaled by the predicted score. Replace `server/inference/gradcam.js` with a proper Grad-CAM implementation if your model is available.
- Preprocessing uses CLAHE on grayscale and resize to 224x224 via OpenCV when available; otherwise uses TF.js image decode + resize.
- Logging goes to `server/logs/audit.jsonl`.

## Security
- Basic rate limiting and security headers are enabled. Do not expose this prototype directly to the internet without further hardening.
