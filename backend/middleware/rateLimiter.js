const rateLimit = require('express-rate-limit');

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    message: 'Too many requests. Please wait a minute before generating again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generateLimiter };