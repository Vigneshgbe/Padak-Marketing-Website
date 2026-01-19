// middleware/auth.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const { db } = require('../config/firebase');

// JWT Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth check - Token present:', !!token);

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded - userId:', decoded.userId);
    
    // Get user from Firestore to verify they still exist and are active
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      console.log('User not found in database');
      return res.status(401).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    const user = userDoc.data();
    if (user.is_active === false) {
      console.log('User account deactivated');
      return res.status(401).json({ 
        success: false,
        error: 'Account deactivated' 
      });
    }

    req.user = {
      id: decoded.userId,
      userId: decoded.userId, // Add both for compatibility
      ...user
    };
    
    console.log('Auth successful for user:', req.user.email);
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(403).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
};

// Admin Authorization Middleware
const requireAdmin = (req, res, next) => {
  console.log('Admin check - Account type:', req.user?.account_type);
  
  if (!req.user || req.user.account_type !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: 'Admin access required' 
    });
  }
  next();
};

// Optional authentication middleware - doesn't block request if no token
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userDoc = await db.collection('users').doc(decoded.userId).get();
      
      if (userDoc.exists) {
        req.user = {
          id: decoded.userId,
          ...userDoc.data()
        };
      }
    } catch (error) {
      console.log('Optional auth failed, continuing as guest:', error.message);
    }
  }
  
  next(); // Always continue, even without valid token
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};