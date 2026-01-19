// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db, firebase } = require('../config/firebase');
const { JWT_SECRET } = require('../config/constants');
const { authenticateToken } = require('../middleware/auth');
const { avatarUpload } = require('../config/multer');

// Register endpoint
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, phone, password, confirmPassword, accountType } = req.body;

  try {
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword || !accountType) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide a valid email address' 
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Passwords do not match' 
      });
    }

    // Validate password strength
    const passwordErrors = [];
    if (password.length < 6) passwordErrors.push("Password must be at least 6 characters long");
    if (!/[A-Z]/.test(password)) passwordErrors.push("Password must contain at least one uppercase letter");
    if (!/[a-z]/.test(password)) passwordErrors.push("Password must contain at least one lowercase letter");
    if (!/[0-9]/.test(password)) passwordErrors.push("Password must contain at least one number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) passwordErrors.push("Password must contain at least one special character");

    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: passwordErrors[0] 
      });
    }

    // Check if email exists
    const existingUsers = await db.collection('users').where('email', '==', email.toLowerCase()).get();
    if (!existingUsers.empty) {
      return res.status(400).json({ 
        success: false,
        error: 'Email already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user in Firestore
    const userRef = db.collection('users').doc();
    const userData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '',
      password_hash: hashedPassword,
      account_type: accountType,
      is_active: true,
      email_verified: false,
      company: '',
      website: '',
      bio: '',
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(userData);

    // Create user stats entry
    await db.collection('user_stats').doc(userRef.id).set({
      user_id: userRef.id,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: new Date().toISOString()
    });

    console.log('User registered successfully:', { userId: userRef.id, email });
    
    // Generate JWT token for immediate login
    const token = jwt.sign(
      {
        userId: userRef.id,
        email: email,
        accountType: accountType
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: userRef.id,
      token: token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during registration' 
    });
  }
});

// Login endpoint - ENHANCED WITH AUTO-LINKING
router.post('/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Check if user exists in Firestore
    const users = await db.collection('users').where('email', '==', email.toLowerCase()).get();

    if (users.empty) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    const userDoc = users.docs[0];
    const user = userDoc.data();
    const userId = userDoc.id;

    console.log('=== LOGIN DEBUG ===');
    console.log('User ID:', userId);
    console.log('User Email:', email.toLowerCase());

    // Check if user is active
    if (user.is_active === false) {
      return res.status(401).json({ 
        success: false,
        error: 'Account deactivated. Please contact administrator.' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const tokenExpiry = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      {
        userId: userId,
        email: user.email,
        accountType: user.account_type
      },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // ✅ AUTO-LINK GUEST ENROLLMENTS
    try {
      console.log('🔍 Checking for approved enrollment requests...');
      
      const allRequestsSnap = await db.collection('course_enroll_requests')
        .where('email', '==', email.toLowerCase())
        .get();

      console.log(`📋 Found ${allRequestsSnap.size} total enrollment requests for this email`);

      const approvedRequestsSnap = await db.collection('course_enroll_requests')
        .where('email', '==', email.toLowerCase())
        .where('status', '==', 'approved')
        .get();

      console.log(`✅ Found ${approvedRequestsSnap.size} APPROVED enrollment requests`);

      let linkedCount = 0;

      for (const doc of approvedRequestsSnap.docs) {
        const request = doc.data();

        if (request.user_id === userId) {
          console.log(`  ⏭️  Already linked to user ${userId}`);
          continue;
        }

        const existingEnrollment = await db.collection('enrollments')
          .where('user_id', '==', userId)
          .where('course_id', '==', request.course_id)
          .get();

        if (existingEnrollment.empty) {
          const enrollmentRef = db.collection('enrollments').doc();
          await enrollmentRef.set({
            user_id: userId,
            course_id: request.course_id,
            enrollment_date: request.created_at || firebase.firestore.Timestamp.now(),
            progress: 0,
            status: 'active',
            completion_date: null
          });

          linkedCount++;
        }

        await db.collection('course_enroll_requests').doc(doc.id).update({
          user_id: userId
        });
      }

      if (linkedCount > 0) {
        const userStatsRef = db.collection('user_stats').doc(userId);
        const userStatsDoc = await userStatsRef.get();
        
        if (userStatsDoc.exists) {
          await userStatsRef.update({
            courses_enrolled: firebase.firestore.FieldValue.increment(linkedCount)
          });
        } else {
          await userStatsRef.set({
            courses_enrolled: linkedCount,
            courses_completed: 0,
            certificates_earned: 0,
            learning_streak: 0,
            last_activity: new Date().toISOString()
          });
        }
      }

      console.log('=== END LOGIN DEBUG ===\n');

    } catch (linkError) {
      console.error('❌ Error auto-linking guest enrollments:', linkError);
    }

    // Update last login timestamp
    await db.collection('users').doc(userId).update({
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ User logged in successfully:', { userId, email: user.email });

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: userId,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        accountType: user.account_type,
        profileImage: user.profile_image || '',
        company: user.company || '',
        website: user.website || '',
        bio: user.bio || '',
        isActive: user.is_active,
        emailVerified: user.email_verified
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during login' 
    });
  }
});

// Get current user profile
router.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      accountType: user.account_type,
      profileImage: user.profile_image,
      company: user.company,
      website: user.website,
      bio: user.bio,
      isActive: user.is_active,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, company, website, bio } = req.body;
    const userId = req.user.id;

    await db.collection('users').doc(userId).update({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      company: company,
      website: website,
      bio: bio,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    const updatedUserDoc = await db.collection('users').doc(userId).get();
    const user = updatedUserDoc.data();

    res.json({
      id: userId,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      accountType: user.account_type,
      profileImage: user.profile_image,
      company: user.company,
      website: user.website,
      bio: user.bio,
      isActive: user.is_active,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload Avatar
router.post('/auth/avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.userId;
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    
    await db.collection('users').doc(userId).update({
      profile_image: avatarPath,
      updated_at: new Date().toISOString()
    });

    console.log(`✅ Avatar uploaded for user ${userId}: ${avatarPath}`);
    
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    res.json({
      success: true,
      profile_image: avatarPath,
      user: {
        id: userId,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        profile_image: avatarPath,
        account_type: userData.account_type
      }
    });
  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload avatar' });
  }
});

// Link guest enrollments
router.post('/link-guest-enrollments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    console.log(`\n🔗 Manual linking for user ${userId} (${userEmail})`);

    const requestsSnap = await db.collection('course_enroll_requests')
      .where('email', '==', userEmail.toLowerCase())
      .where('status', '==', 'approved')
      .get();

    let linked = 0;
    let existing = 0;

    for (const doc of requestsSnap.docs) {
      const request = doc.data();

      const enrollmentSnap = await db.collection('enrollments')
        .where('user_id', '==', userId)
        .where('course_id', '==', request.course_id)
        .get();

      if (enrollmentSnap.empty) {
        const enrollmentRef = db.collection('enrollments').doc();
        await enrollmentRef.set({
          user_id: userId,
          course_id: request.course_id,
          enrollment_date: request.created_at || firebase.firestore.Timestamp.now(),
          progress: 0,
          status: 'active',
          completion_date: null
        });
        
        linked++;
      } else {
        existing++;
      }

      await db.collection('course_enroll_requests').doc(doc.id).update({
        user_id: userId
      });
    }

    res.json({
      success: true,
      message: `Linked ${linked} new enrollments`,
      linked,
      existing,
      total: requestsSnap.size
    });

  } catch (error) {
    console.error('❌ Link error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to link enrollments' 
    });
  }
});

module.exports = router;