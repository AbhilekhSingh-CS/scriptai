const express = require('express');
const router = express.Router();
const { generateScript } = require('../controllers/scriptController');
const { generateLimiter } = require('../middleware/rateLimiter');
const { apiKeyAuth } = require('../middleware/apiKeyAuth');

router.post('/generate', apiKeyAuth, generateLimiter, generateScript);

module.exports = router;