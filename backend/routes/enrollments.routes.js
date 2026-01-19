// backend/routes/enrollments.routes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const firebase = require('firebase-admin');
const { db } = require('../config/firebase');
const { paymentScreenshotUpload } = require('../middlewares/upload.middleware');
const { JWT_SECRET } = require('../config/keys');
const app = express(); 



// ==================== COURSE ENROLLMENT REQUESTS (FIXED) ====================

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

app.post('/api/enroll-request', 
  optionalAuth,  // ✅ OPTIONAL AUTH - allows guest users
  paymentScreenshotUpload.single('paymentScreenshot'), 
  async (req, res) => {
    try {
      const userId = req.user ? req.user.id : null; // Can be null for guests
      const {
        courseId,
        fullName,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        paymentMethod,
        transactionId
      } = req.body;

      console.log('📝 Enrollment request received:', {
        userId: userId || 'GUEST',
        courseId,
        fullName,
        email,
        hasFile: !!req.file
      });

      // Validate required fields
      const requiredFields = ['courseId', 'fullName', 'email', 'phone', 'address', 
                             'city', 'state', 'pincode', 'paymentMethod', 'transactionId'];
      
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: `Missing required fields: ${missingFields.join(', ')}`, 
          missingFields
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Payment screenshot is required' });
      }

      // Create enrollment request
      const requestRef = db.collection('course_enroll_requests').doc();
      await requestRef.set({
        user_id: userId, // Can be null for guest enrollments
        course_id: courseId,
        full_name: fullName,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        payment_screenshot: `/uploads/payments/${req.file.filename}`,
        status: 'pending',
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        is_guest: !userId // Flag to identify guest enrollments
      });

      console.log('✅ Enrollment request created:', requestRef.id);

      res.status(201).json({
        success: true,
        message: 'Enrollment request submitted successfully',
        requestId: requestRef.id,
        isGuest: !userId
      });

    } catch (error) {
      console.error('❌ Enrollment request error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }); 
    }
  }
);