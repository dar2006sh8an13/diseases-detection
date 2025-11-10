require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { preprocessImage } = require('./inference/preprocess');
const { predict } = require('./inference/model');
const { generateGradCAM } = require('./inference/gradcam');
const { auditLog } = require('./inference/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// Rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});
app.use(limiter);

// Static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// JSON parsing for small payloads
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Multer setup for uploads
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${Date.now()}_${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage });

app.post('/api/predict', upload.single('image'), async (req, res) => {
  const requestId = uuidv4();
  const startTs = Date.now();
  let uploadedImageBase64 = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'image file is required under key "image"' });
    }
    // Read uploaded image into base64 for returning to client (Option A)
    try {
      const imgBuf = fs.readFileSync(req.file.path);
      const mime = req.file.mimetype || 'image/png';
      uploadedImageBase64 = `data:${mime};base64,${imgBuf.toString('base64')}`;
    } catch (e) {
      uploadedImageBase64 = null;
    }

    // EHR payload can be JSON string or fields
    let ehr = {};
    if (req.body.ehr_json) {
      try { ehr = JSON.parse(req.body.ehr_json); } catch (e) { ehr = {}; }
    } else {
      ehr = { ...req.body };
      delete ehr.image; // ensure no file field mixed in
    }

    // Preprocess
    const preproc = await preprocessImage(req.file.path);

    // Predict
    const pred = await predict(preproc.tensor, ehr);

    // GradCAM or heatmap placeholder
    const heatmapBase64 = await generateGradCAM(preproc, pred);

    const durationMs = Date.now() - startTs;

    // Audit log
    await auditLog({
      requestId,
      ts: new Date().toISOString(),
      clientIp: req.ip,
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      },
      ehrMeta: Object.keys(ehr),
      output: pred,
      durationMs
    });

    // Respond
    res.json({
      requestId,
      score: pred.score,
      label: pred.label,
      thresholds: pred.thresholds,
      calibration: pred.calibration,
      heatmap_base64: heatmapBase64,
      image_base64: uploadedImageBase64, // original uploaded image as data URL
      meta: {
        processing_ms: durationMs,
        width: preproc.width,
        height: preproc.height,
        model: pred.modelInfo
      }
    });
  } catch (err) {
    console.error('Prediction failed', err);
    res.status(500).json({ error: 'internal_error', detail: err.message });
  } finally {
    // Cleanup temp file
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
