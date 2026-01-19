// middleware/errorHandler.js
const multer = require('multer');

// Error handling middleware for multer
const multerErrorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ error: error.message });
  }
  next(error);
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }

  if (err.message === 'Only image files are allowed for avatar') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

module.exports = {
  multerErrorHandler,
  notFoundHandler,
  globalErrorHandler
};