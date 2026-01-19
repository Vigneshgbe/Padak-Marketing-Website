// config/constants.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3306,
  JWT_SECRET: process.env.JWT_SECRET || 'your-fallback-secret-key',
  NODE_ENV: process.env.NODE_ENV || 'development',
  ALLOWED_ORIGINS: [
    'https://padak.onrender.com',
    'http://localhost:8080'
  ]
};