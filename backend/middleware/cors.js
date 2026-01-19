// middleware/cors.js
const cors = require('cors');
const { ALLOWED_ORIGINS } = require('../config/constants');

// CRITICAL: Handle CORS BEFORE anything else
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight immediately
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
};

// Backup CORS configuration
const corsOptions = {
  origin: ALLOWED_ORIGINS,
  credentials: true
};

module.exports = {
  corsMiddleware,
  corsOptions: cors(corsOptions)
};