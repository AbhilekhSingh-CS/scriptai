const crypto = require('crypto');

const apiKeyAuth = (req, res, next) => {
  const providedKey = req.headers['x-api-key'];

  if (!providedKey) {
    return res.status(401).json({ message: 'API key required' });
  }

  const expectedKey = process.env.API_KEY;

  const providedBuffer = Buffer.from(providedKey);
  const expectedBuffer = Buffer.from(expectedKey);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return res.status(401).json({ message: 'Invalid API key' });
  }

  next();
};

module.exports = { apiKeyAuth };