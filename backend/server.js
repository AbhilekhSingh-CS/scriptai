const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api/script', require('./routes/scriptRoutes'));

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'ScriptAI API is live',
    model: 'llama-3.3-70b-versatile',
  });
});

app.listen(process.env.PORT || 5002, () => {
  console.log(`ScriptAI server running on port ${process.env.PORT || 5002}`);
});