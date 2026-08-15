const express = require('express');
const router = express.Router();
const { generateScript } = require('../controllers/scriptController');
const { generateLimiter } = require('../middleware/rateLimiter');

router.post('/generate', generateLimiter, generateScript);

module.exports = router;