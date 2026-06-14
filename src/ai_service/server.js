const express = require('express');
const app = express();
const PORT = process.env.PORT || 4010;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ai-vision-mock' });
});

app.post('/predict', (req, res) => {
  res.json({ predictions: [{ class: 'person', confidence: 0.95 }] });
});

app.listen(PORT, () => {
  console.log(`AI Vision Mock running on port ${PORT}`);
});