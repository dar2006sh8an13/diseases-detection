# AI-Powered Early Disease Detection

A Node.js and Express prototype exploring an image-assisted disease screening workflow. The demo accepts medical images and optional symptom or EHR context, then returns a structured prediction response.

> [!WARNING]
> **Research prototype only — not for clinical use.** This project is not a medical device and must not be used to diagnose, treat, or rule out disease. Outputs may be simulated when a trained model is not configured. Always consult a qualified healthcare professional.

## Capabilities

- Image upload for supported demonstration inputs (for example, X-ray, skin, or retina images).
- Optional symptom and EHR context.
- Image preprocessing with OpenCV when the optional native dependency is available.
- TensorFlow.js inference when model artifacts are configured; otherwise, a deterministic fallback is used.
- Placeholder heatmap output for UI and API integration testing.
- JSONL audit logging.

## Technology

- Node.js 18+
- Express
- TensorFlow.js Node (optional)
- OpenCV integration (optional)
- HTML, CSS, and JavaScript frontend

## Requirements

- Node.js 18 or later
- npm
- Optional native dependencies for accelerated image processing and model inference

## Install and Run

```bash
npm install
npm start
```

For development with automatic reload, if the script is available:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configure a Model (Optional)

Convert a compatible TensorFlow/Keras model to TensorFlow.js Layers format and place the generated `model.json` and weight shard files in:

```text
server/inference/model_artifacts/
```

The expected model file is `model.json`; weight files should remain alongside it. Confirm the loader's expected input shape, preprocessing, and output labels before evaluating a model.

## API

### `POST /api/predict`

Send a `multipart/form-data` request containing:

| Field | Type | Description |
|---|---|---|
| `image` | File | Input image |
| `ehr_json` | String (optional) | JSON-encoded context fields |

The prototype response may include a request identifier, score, label, thresholds, calibration metadata, heatmap data, and processing metadata. Treat all outputs as experimental.

## Implementation Notes

- CLAHE and resizing to 224 × 224 are used when the OpenCV preprocessing path is available.
- The fallback path uses TensorFlow.js image decoding and resizing where supported.
- The current heatmap is a placeholder overlay, not a validated Grad-CAM explanation.
- Audit records are written to `server/logs/audit.jsonl`.

## Security and Privacy

Do not upload real patient data to an unreviewed development instance. Before any external deployment, review authentication, authorization, file validation, upload limits, retention, logging, rate limiting, dependency vulnerabilities, and data-protection requirements. Avoid storing identifiable health information in logs.

## Development Roadmap

- Replace fallback predictions with a validated model.
- Implement a genuine explainability method and verify its outputs.
- Add automated tests for upload validation and inference behavior.
- Document model provenance, evaluation datasets, limitations, and intended use.

## Contributing

Submit focused pull requests with test steps and a clear explanation of model or preprocessing changes. Never present unvalidated model results as clinical evidence.

## License

No license is specified in this repository yet.
