const form = document.getElementById('predict-form');
const imageInput = document.getElementById('image');
const preview = document.getElementById('preview');
const resultsSection = document.getElementById('results');
const scoreEl = document.getElementById('score');
const labelEl = document.getElementById('label');
const metaEl = document.getElementById('meta');
const heatmapEl = document.getElementById('heatmap');


// ✅ Preview uploaded image (CORRECT POSITION)
imageInput.addEventListener('change', () => {
  preview.innerHTML = "";

  const file = imageInput.files[0];
  if (!file) return;

  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);

  img.style.maxWidth = "100%";
  img.style.maxHeight = "220px";
  img.style.objectFit = "contain";
  img.style.borderRadius = "8px";

  img.onload = () => URL.revokeObjectURL(img.src);

  preview.appendChild(img);
});


// ✅ Submit prediction form
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Predicting...';

  try {
    const fd = new FormData();
    const file = imageInput.files[0];
    if (!file) {
      alert('Please choose an image.');
      return;
    }
    fd.append('image', file, file.name);

    // EHR / Symptoms JSON
    const age = document.getElementById('age').value;
    const sex = document.getElementById('sex').value;
    const symptoms = document.getElementById('symptoms').value;
    const fever = form.querySelector('input[name="fever"]').checked;
    const cough = form.querySelector('input[name="cough"]').checked;
    const diabetes = form.querySelector('input[name="diabetes"]').checked;

    fd.append('ehr_json', JSON.stringify({ age, sex, symptoms, fever, cough, diabetes }));

    // Send to backend
    const resp = await fetch('/api/predict', { method: 'POST', body: fd });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'unknown' }));
      throw new Error(err.detail || err.error || 'Request failed');
    }

    const data = await resp.json();

    // Display prediction
    scoreEl.textContent = `Score: ${data.score?.toFixed(3) || 'N/A'}`;
    labelEl.textContent = `Label: ${data.label || 'Unknown'}`;
    metaEl.textContent = `Request: ${data.requestId || '-'}\nModel: ${data.meta?.model || '-'}\nProcessing: ${data.meta?.processing_ms || 0} ms`;

    // Display heatmap if available
    if (data.heatmap_base64) {
      heatmapEl.src = `data:image/png;base64,${data.heatmap_base64}`;
      heatmapEl.style.display = 'block';
      heatmapEl.style.maxWidth = '300px';
      heatmapEl.style.borderRadius = '8px';
    } else {
      heatmapEl.style.display = 'none';
    }

    resultsSection.hidden = false;

  } catch (err) {
    alert('Prediction failed: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Predict';
  }
});
