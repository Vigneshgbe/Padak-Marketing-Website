// server.js - Main Entry Point (Refactored Version)
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Configuration
const { PORT } = require('./config/constants');
const { firebase } = require('./config/firebase');

// Middleware
const { corsMiddleware, corsOptions } = require('./middleware/cors');
const { multerErrorHandler, notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

// Initialize Express
const app = express();

// ==================== MIDDLEWARE SETUP ====================

// CORS (must be first)
app.use(corsMiddleware);
app.use(corsOptions);

// Body parsers
app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads', 'avatars')));

// Logging middleware for uploads
app.use('/uploads', (req, res, next) => {
  console.log(`📸 Image request: ${req.method} ${req.url}`);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// ==================== ROUTES ====================

// Public routes (no authentication required)
app.use('/api', require('./routes/auth.routes'));
app.use('/api', require('./routes/contact.routes'));

// Protected routes (authentication required)
app.use('/api', require('./routes/social.routes'));
app.use('/api', require('./routes/dashboard.routes'));
app.use('/api', require('./routes/calendar.routes'));
app.use('/api', require('./routes/courses.routes'));
app.use('/api', require('./routes/enrollments.routes'));
app.use('/api', require('./routes/assignments.routes'));
app.use('/api', require('./routes/certificates.routes'));
app.use('/api', require('./routes/resources.routes'));
app.use('/api', require('./routes/internships.routes'));
app.use('/api', require('./routes/services.routes'));

// Admin routes (admin authentication required)
app.use('/api/admin', require('./routes/admin/dashboard.routes'));
app.use('/api/admin/payments', require('./routes/admin/payments.routes'));
app.use('/api/admin/resource', require('./routes/admin/resource.routes'));
app.use('/api/admin/users', require('./routes/admin/users.routes'));
app.use('/api/admin/courses', require('./routes/admin/courses.routes'));
app.use('/api/admin/assignments', require('./routes/admin/assignments.routes'));
app.use('/api/admin/enrollments', require('./routes/admin/enrollments.routes'));
app.use('/api/admin/certificates', require('./routes/admin/certificates.routes'));
app.use('/api/admin/services', require('./routes/admin/services.routes'));
app.use('/api/admin/internships', require('./routes/admin/internships.routes'));
app.use('/api/admin/calendar', require('./routes/admin/calendar.routes'));
app.use('/api/admin/contacts', require('./routes/admin/contacts.routes'));

// ==================== UTILITY ROUTES ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug routes endpoint (only in development)
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({ 
    total: routes.length,
    routes 
  });
});

// ==================== ERROR HANDLING ====================

// Multer error handling (for file uploads)
app.use(multerErrorHandler);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(globalErrorHandler);

// ==================== SERVER STARTUP ====================

// Graceful shutdown handler
process.on('SIGINT', () => {
  console.log('\n🛑 Performing graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Performing graceful shutdown...');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to exit here
  // process.exit(1);
});

// Start the server
app.listen(PORT, () => {
  console.log(`📡 Server running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

// Export app for testing
module.exports = app;