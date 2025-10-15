// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT; // || 5000;

// Firebase Client SDK with compat mode
const firebase = require('firebase/compat/app');
require('firebase/compat/auth');
require('firebase/compat/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyA4uHspTDS-8kIT2HsmPFGL9JNNBvI6NI4",
  authDomain: "startup-dbs-1.firebaseapp.com",
  databaseURL: "https://startup-dbs-1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "startup-dbs-1",
  storageBucket: "startup-dbs-1.firebasestorage.app",
  messagingSenderId: "70939047801",
  appId: "1:70939047801:web:08a6a9d17f6b63af9261a8",
  measurementId: "G-KQ59313LSD"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Create necessary directories
const assignmentsDir = path.join(__dirname, 'uploads', 'assignments');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });

const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const paymentsDir = path.join(__dirname, 'uploads', 'payments');
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

// ===== AVATAR MULTER CONFIGURATION  =====
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatars'));
    }
  }
});

// ===== ASSIGNMENT MULTER CONFIGURATION =====
const assignmentStorage = path.join(__dirname, 'uploads', 'assignments');
const assignmentUpload = multer({
  storage: assignmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.zip', '.rar'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, ZIP, RAR files are allowed.'));
    }
  }
});

// ===== PAYMENT SCREENSHOT MULTER CONFIGURATION =====
const paymentScreenshotStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads', 'payments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `payment-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const paymentScreenshotUpload = multer({
  storage: paymentScreenshotStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// ===== PAYMENT PROOF RESOURCES NEW MULTER CONFIGURATION =====
const paymentProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'payments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `payment-proof-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const paymentProofUpload = multer({
  storage: paymentProofStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

// ===== CORS configuration =====
const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

app.use(cors({
  origin: [process.env.FRONTEND_URL], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==================== STATIC FILE SERVING ====================

// Serve static files from uploads directory with proper headers
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for images
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // Set proper content-type based on file extension
  const ext = path.extname(req.path).toLowerCase();
  const contentTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  
  if (contentTypes[ext]) {
    res.setHeader('Content-Type', contentTypes[ext]);
  }
  
  next();
});

// Serve the static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Cache images for better performance
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
  }
}));

// Log all upload requests for debugging
app.use('/uploads', (req, res, next) => {
  console.log(`📸 Image request: ${req.method} ${req.url}`);
  next();
});

// ==================== MIDDLEWARE ====================
app.use(express.json())
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads', 'avatars')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

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

// ==================== AUTH ROUTES ====================

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, phone, password, confirmPassword, accountType } = req.body;

  try {
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword || !accountType) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Validate password strength (matching frontend requirements)
    const validatePassword = (password) => {
      const errors = [];
      if (password.length < 6) errors.push("Password must be at least 6 characters long");
      if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
      if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
      if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number");
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Password must contain at least one special character");
      return errors;
    };

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ error: passwordErrors[0] });
    }

    // Check if email exists
    const existingUsers = await db.collection('users').where('email', '==', email).get();
    if (!existingUsers.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user in Firebase Auth (optional, for authentication)
    let firebaseUser;
    try {
      firebaseUser = await auth.createUserWithEmailAndPassword(email, password);
    } catch (firebaseError) {
      console.log('Firebase auth creation skipped, using Firestore only:', firebaseError.message);
    }

    // Insert new user in Firestore
    const userRef = db.collection('users').doc();
    const userData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
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
      message: 'User registered successfully',
      userId: userRef.id,
      token: token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login endpoint
// Login endpoint - ENHANCED WITH DEBUGGING
app.post('/api/login', async (req, res) => {
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

    // ✅ AUTO-LINK GUEST ENROLLMENTS - ENHANCED WITH DEBUGGING
    try {
      console.log('🔍 Checking for approved enrollment requests...');
      
      // Find ALL enrollment requests with this email (not just approved ones initially)
      const allRequestsSnap = await db.collection('course_enroll_requests')
        .where('email', '==', email.toLowerCase())
        .get();

      console.log(`📋 Found ${allRequestsSnap.size} total enrollment requests for this email`);

      // Log details of each request
      allRequestsSnap.forEach(doc => {
        const req = doc.data();
        console.log(`  - Request ID: ${doc.id}`);
        console.log(`    Status: ${req.status}`);
        console.log(`    User ID: ${req.user_id || 'null'}`);
        console.log(`    Course ID: ${req.course_id}`);
        console.log(`    Is Guest: ${req.is_guest}`);
      });

      // Now process only approved requests
      const approvedRequestsSnap = await db.collection('course_enroll_requests')
        .where('email', '==', email.toLowerCase())
        .where('status', '==', 'approved')
        .get();

      console.log(`✅ Found ${approvedRequestsSnap.size} APPROVED enrollment requests`);

      let linkedCount = 0;
      let skippedCount = 0;

      for (const doc of approvedRequestsSnap.docs) {
        const request = doc.data();

        console.log(`\n🔗 Processing request ${doc.id}...`);

        // Skip if already linked to this user
        if (request.user_id === userId) {
          console.log(`  ⏭️  Already linked to user ${userId}`);
          skippedCount++;
          continue;
        }

        // Check if already enrolled
        const existingEnrollment = await db.collection('enrollments')
          .where('user_id', '==', userId)
          .where('course_id', '==', request.course_id)
          .get();

        if (existingEnrollment.empty) {
          console.log(`  ➕ Creating new enrollment...`);
          
          // Create enrollment
          const enrollmentRef = db.collection('enrollments').doc();
          await enrollmentRef.set({
            user_id: userId,
            course_id: request.course_id,
            enrollment_date: request.created_at || firebase.firestore.Timestamp.now(),
            progress: 0,
            status: 'active',
            completion_date: null
          });

          console.log(`  ✅ Enrollment created: ${enrollmentRef.id}`);
          linkedCount++;
        } else {
          console.log(`  ⚠️  Already enrolled in course ${request.course_id}`);
          console.log(`     Existing enrollment ID: ${existingEnrollment.docs[0].id}`);
        }

        // Update request to link user_id
        await db.collection('course_enroll_requests').doc(doc.id).update({
          user_id: userId
        });
        console.log(`  🔗 Request linked to user ${userId}`);
      }

      console.log(`\n📊 Summary:`);
      console.log(`   - Linked: ${linkedCount} new enrollments`);
      console.log(`   - Skipped: ${skippedCount} already linked`);

      if (linkedCount > 0) {
        console.log(`\n📈 Updating user stats...`);
        
        // Update user stats
        const userStatsRef = db.collection('user_stats').doc(userId);
        const userStatsDoc = await userStatsRef.get();
        
        if (userStatsDoc.exists) {
          await userStatsRef.update({
            courses_enrolled: firebase.firestore.FieldValue.increment(linkedCount)
          });
          console.log(`   ✅ User stats updated (+${linkedCount})`);
        } else {
          await userStatsRef.set({
            courses_enrolled: linkedCount,
            courses_completed: 0,
            certificates_earned: 0,
            learning_streak: 0,
            last_activity: new Date().toISOString()
          });
          console.log(`   ✅ User stats created with ${linkedCount} enrollments`);
        }
      }

      console.log('=== END LOGIN DEBUG ===\n');

    } catch (linkError) {
      console.error('❌ Error auto-linking guest enrollments:', linkError);
      console.error('Stack trace:', linkError.stack);
      // Don't fail login if linking fails - just log the error
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
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Server error during login' 
    });
  }
});

// Get current user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: req.user.id,
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
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
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
      updated_at: firebase.firestore.Timestamp.now()
    });

    // Get updated user data
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

// Upload avatar (UNIFIED)
app.post('/api/auth/avatar', authenticateToken, (req, res, next) => {
  // Handle multer errors properly
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const profileImage = `/uploads/avatars/${req.file.filename}`;

    // Delete old avatar if exists
    if (req.user.profile_image) {
      const oldFilename = path.basename(req.user.profile_image);
      const oldPath = path.join(avatarsDir, oldFilename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await db.collection('users').doc(userId).update({
      profile_image: profileImage,
      updated_at: firebase.firestore.Timestamp.now()
    });

    // Send success response with plain text
    res.status(200).send(profileImage);

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const statsDoc = await db.collection('user_stats').doc(userId).get();

    if (!statsDoc.exists) {
      // Create default stats if not exists
      await db.collection('user_stats').doc(userId).set({
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        last_activity: new Date().toISOString()
      });

      res.json({
        coursesEnrolled: 0,
        coursesCompleted: 0,
        certificatesEarned: 0,
        learningStreak: 0,
        lastActivity: new Date().toISOString()
      });
    } else {
      const userStats = statsDoc.data();
      res.json({
        coursesEnrolled: userStats.courses_enrolled,
        coursesCompleted: userStats.courses_completed,
        certificatesEarned: userStats.certificates_earned,
        learningStreak: userStats.learning_streak,
        lastActivity: userStats.last_activity
      });
    }

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============== ENHANCED SOCIAL FEED FUNCTIONALITY ===============


// --- Multer Configuration for Social Post Images ---
const socialUploadDir = 'public/uploads/social';
if (!fs.existsSync(socialUploadDir)) {
  fs.mkdirSync(socialUploadDir, { recursive: true });
}

const socialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, socialUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `social-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const socialUpload = multer({
  storage: socialStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - jpeg, jpg, png, gif, webp'));
  },
}).single('image');

// Helper function to get full URL for images
const getFullImageUrl = (req, imagePath) => {
  if (!imagePath) {
    return null;
  }
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  let cleanPath = imagePath.replace(/^public\//, '');
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  return `${req.protocol}://${req.get('host')}${cleanPath}`;
};

// Helper function to safely convert Firestore timestamp to ISO string
const timestampToISO = (timestamp) => {
  if (!timestamp) return new Date().toISOString();
  try {
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toISOString();
    }
    return new Date().toISOString();
  } catch (error) {
    console.error('Error converting timestamp:', error);
    return new Date().toISOString();
  }
};

// Helper function to get user connections
const getUserConnections = async (userId) => {
  try {
    const connections = new Set();
    
    // Get connections where user is user_id_1
    const connections1Snap = await db.collection('user_connections')
      .where('user_id_1', '==', userId)
      .where('status', '==', 'accepted')
      .get();
    
    connections1Snap.forEach(doc => {
      const data = doc.data();
      if (data.user_id_2) {
        connections.add(data.user_id_2);
      }
    });

    // Get connections where user is user_id_2
    const connections2Snap = await db.collection('user_connections')
      .where('user_id_2', '==', userId)
      .where('status', '==', 'accepted')
      .get();
    
    connections2Snap.forEach(doc => {
      const data = doc.data();
      if (data.user_id_1) {
        connections.add(data.user_id_1);
      }
    });

    return Array.from(connections);
  } catch (error) {
    console.error('Error getting user connections:', error);
    return [];
  }
};

// --- GET All Posts (with Pagination, Likes, Comments, etc.) ---
app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  try {
    console.log(`Fetching posts for user ${userId}, page ${page}`);

    // Get user's connections
    const connections = await getUserConnections(userId);
    console.log(`User has ${connections.length} connections`);

    // Fetch all posts from social_activities collection
    // Note: If you get index errors, create the index in Firebase Console
    let allPostsSnap;
    try {
      allPostsSnap = await db.collection('social_activities')
        .where('activity_type', '==', 'post')
        .orderBy('created_at', 'desc')
        .get();
    } catch (indexError) {
      console.log('Index not found, fetching without orderBy:', indexError.message);
      // Fallback: fetch without orderBy if index doesn't exist yet
      allPostsSnap = await db.collection('social_activities')
        .where('activity_type', '==', 'post')
        .get();
    }

    console.log(`Found ${allPostsSnap.size} total posts`);

    // Filter posts based on visibility
    const visiblePosts = [];
    
    allPostsSnap.forEach(doc => {
      const post = doc.data();
      const postId = doc.id;
      
      // Check visibility rules
      const isPublic = !post.visibility || post.visibility === 'public';
      const isOwnPost = post.user_id === userId;
      const isConnectionPost = post.visibility === 'connections' && 
                              (isOwnPost || connections.includes(post.user_id));
      const isPrivate = post.visibility === 'private' && isOwnPost;

      if (isPublic || isConnectionPost || isPrivate) {
        visiblePosts.push({ id: postId, ...post });
      }
    });

    // Sort posts manually by created_at if orderBy wasn't used
    visiblePosts.sort((a, b) => {
      const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at || 0);
      const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at || 0);
      return dateB - dateA; // Descending order (newest first)
    });

    console.log(`${visiblePosts.length} posts visible to user`);

    // Calculate pagination
    const totalPosts = visiblePosts.length;
    const totalPages = Math.ceil(totalPosts / limit);
    
    // Get paginated posts
    const paginatedPosts = visiblePosts.slice(offset, offset + limit);

    // Enrich posts with user data, likes, comments, etc.
    const enrichedPosts = await Promise.all(
      paginatedPosts.map(async (post) => {
        try {
          // Get user data
          let userData = null;
          if (post.user_id) {
            try {
              const userDoc = await db.collection('users').doc(post.user_id).get();
              if (userDoc.exists) {
                const u = userDoc.data();
                userData = {
                  id: post.user_id,
                  first_name: u.first_name || '',
                  last_name: u.last_name || '',
                  profile_image: getFullImageUrl(req, u.profile_image),
                  account_type: u.account_type || 'student'
                };
              }
            } catch (userError) {
              console.error(`Error fetching user ${post.user_id}:`, userError.message);
            }
          }

          // Fetch ALL activities related to this post in ONE query
          // This avoids complex composite indexes
          let allActivities = [];
          try {
            const activitiesSnap = await db.collection('social_activities')
              .where('target_id', '==', post.id)
              .get();
            
            allActivities = activitiesSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          } catch (activitiesError) {
            console.log(`Could not fetch activities for post ${post.id}:`, activitiesError.message);
          }

          // Filter activities by type in memory
          const likes = allActivities.filter(a => a.activity_type === 'like');
          const userLikes = likes.filter(a => a.user_id === userId);
          const bookmarks = allActivities.filter(a => a.activity_type === 'bookmark' && a.user_id === userId);
          const commentActivities = allActivities.filter(a => a.activity_type === 'comment');

          // Get comment user data
          const comments = await Promise.all(
            commentActivities.map(async (comment) => {
              let commentUser = null;
              
              if (comment.user_id) {
                try {
                  const commentUserDoc = await db.collection('users').doc(comment.user_id).get();
                  if (commentUserDoc.exists) {
                    const cu = commentUserDoc.data();
                    commentUser = {
                      id: comment.user_id,
                      first_name: cu.first_name || '',
                      last_name: cu.last_name || '',
                      profile_image: getFullImageUrl(req, cu.profile_image),
                      account_type: cu.account_type || 'student'
                    };
                  }
                } catch (userError) {
                  console.error(`Error fetching comment user:`, userError.message);
                }
              }

              return {
                id: comment.id,
                content: comment.content || '',
                created_at: timestampToISO(comment.created_at),
                user: commentUser
              };
            })
          );

          // Sort comments by date manually (oldest first)
          comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

          return {
            id: post.id,
            user_id: post.user_id,
            activity_type: post.activity_type,
            content: post.content || '',
            image_url: getFullImageUrl(req, post.image_url),
            target_id: post.target_id || null,
            created_at: timestampToISO(post.created_at),
            updated_at: timestampToISO(post.updated_at || post.created_at),
            visibility: post.visibility || 'public',
            achievement: post.achievement || false,
            share_count: post.share_count || 0,
            likes: likes.length,
            has_liked: userLikes.length > 0,
            has_bookmarked: bookmarks.length > 0,
            comment_count: comments.length,
            user: userData,
            comments: comments
          };
        } catch (error) {
          console.error(`Error enriching post ${post.id}:`, error);
          return null;
        }
      })
    );

    // Filter out null posts
    const validPosts = enrichedPosts.filter(post => post !== null);

    console.log(`Returning ${validPosts.length} enriched posts`);

    res.json({
      posts: validPosts,
      pagination: {
        page,
        totalPages,
        totalPosts
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    res.status(500).json({
      error: 'Failed to fetch posts.',
      message: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// --- POST a new post ---
app.post('/api/posts', authenticateToken, (req, res) => {
  socialUpload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const { content, achievement, visibility } = req.body;
      const userId = req.user.id;

      console.log('Creating post:', { userId, content: content?.substring(0, 50), hasImage: !!req.file });

      // Validation
      if (!content && !req.file) {
        return res.status(400).json({ error: 'Post must have content or an image.' });
      }

      const imageUrl = req.file ? `/uploads/social/${req.file.filename}` : null;
      const isAchievement = achievement === 'true' || achievement === true;
      const postVisibility = visibility || 'public';

      // Create new post document
      const postRef = db.collection('social_activities').doc();
      const postData = {
        user_id: userId,
        activity_type: 'post',
        content: content || '',
        image_url: imageUrl,
        achievement: isAchievement,
        visibility: postVisibility,
        created_at: firebase.firestore.Timestamp.now(),
        updated_at: firebase.firestore.Timestamp.now(),
        share_count: 0
      };

      await postRef.set(postData);

      console.log('Post created successfully:', postRef.id);

      // Get user data for response
      const userDoc = await db.collection('users').doc(userId).get();
      let userData = null;
      
      if (userDoc.exists) {
        const u = userDoc.data();
        userData = {
          id: userId,
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          profile_image: getFullImageUrl(req, u.profile_image),
          account_type: u.account_type || 'student'
        };
      }

      // Return the created post
      res.status(201).json({
        id: postRef.id,
        user_id: userId,
        activity_type: 'post',
        content: postData.content,
        image_url: getFullImageUrl(req, postData.image_url),
        achievement: postData.achievement,
        visibility: postData.visibility,
        created_at: timestampToISO(postData.created_at),
        updated_at: timestampToISO(postData.updated_at),
        share_count: 0,
        has_liked: false,
        has_bookmarked: false,
        likes: 0,
        comment_count: 0,
        user: userData,
        comments: []
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({
        error: 'Failed to create post.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
});

// --- PUT (edit) a post ---
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Content cannot be empty.' });
  }

  try {
    console.log(`Editing post ${id} by user ${userId}`);

    const postRef = db.collection('social_activities').doc(id);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = postDoc.data();

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    await postRef.update({
      content: content.trim(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    console.log('Post updated successfully');

    res.json({ message: 'Post updated successfully.' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      error: 'Failed to update post.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- DELETE a post ---
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    console.log(`Deleting post ${id} by user ${userId}`);

    const postRef = db.collection('social_activities').doc(id);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = postDoc.data();

    if (post.user_id !== userId && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    // Delete the post
    await postRef.delete();

    // Delete associated image file if exists
    if (post.image_url && !post.image_url.startsWith('http')) {
      const imagePath = path.join(__dirname, post.image_url.replace(/^\//, ''));
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log('Post image deleted:', imagePath);
        } catch (fileError) {
          console.error("Error deleting post image:", fileError);
        }
      }
    }

    // Delete associated likes
    const likesSnap = await db.collection('social_activities')
      .where('activity_type', '==', 'like')
      .where('target_id', '==', id)
      .get();
    
    const likeDeletions = likesSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(likeDeletions);

    // Delete associated comments
    const commentsSnap = await db.collection('social_activities')
      .where('activity_type', '==', 'comment')
      .where('target_id', '==', id)
      .get();
    
    const commentDeletions = commentsSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(commentDeletions);

    // Delete associated bookmarks
    const bookmarksSnap = await db.collection('social_activities')
      .where('activity_type', '==', 'bookmark')
      .where('target_id', '==', id)
      .get();
    
    const bookmarkDeletions = bookmarksSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(bookmarkDeletions);

    console.log('Post and associated data deleted successfully');

    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      error: 'Failed to delete post.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- POST a comment on a post ---
app.post('/api/posts/:id/comment', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Comment cannot be empty.' });
  }

  try {
    console.log(`Adding comment to post ${targetId} by user ${userId}`);

    // Check if post exists
    const postDoc = await db.collection('social_activities').doc(targetId).get();
    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Create comment
    const commentRef = db.collection('social_activities').doc();
    const commentData = {
      user_id: userId,
      activity_type: 'comment',
      content: content.trim(),
      target_id: targetId,
      created_at: firebase.firestore.Timestamp.now()
    };

    await commentRef.set(commentData);

    console.log('Comment created successfully:', commentRef.id);

    // Get user data for response
    const userDoc = await db.collection('users').doc(userId).get();
    let userData = null;
    
    if (userDoc.exists) {
      const u = userDoc.data();
      userData = {
        id: userId,
        first_name: u.first_name || '',
        last_name: u.last_name || '',
        profile_image: getFullImageUrl(req, u.profile_image),
        account_type: u.account_type || 'student'
      };
    }

    // Return the created comment
    res.status(201).json({
      id: commentRef.id,
      content: commentData.content,
      created_at: timestampToISO(commentData.created_at),
      user: userData
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({
      error: 'Failed to post comment.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- POST (like) a post ---
app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    console.log(`User ${userId} liking post ${targetId}`);

    // Check if already liked
    const existingLikeSnap = await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'like')
      .where('target_id', '==', targetId)
      .get();

    if (!existingLikeSnap.empty) {
      return res.status(400).json({ error: 'Post already liked.' });
    }

    // Create like
    const likeRef = db.collection('social_activities').doc();
    await likeRef.set({
      user_id: userId,
      activity_type: 'like',
      target_id: targetId,
      created_at: firebase.firestore.Timestamp.now()
    });

    console.log('Post liked successfully');

    res.status(201).json({ message: 'Post liked.' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({
      error: 'Failed to like post.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- DELETE (unlike) a post ---
app.delete('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    console.log(`User ${userId} unliking post ${targetId}`);

    const likeSnap = await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'like')
      .where('target_id', '==', targetId)
      .get();

    if (likeSnap.empty) {
      return res.status(404).json({ error: 'Like not found' });
    }

    // Delete all matching likes (should be only one)
    const deletions = likeSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(deletions);

    console.log('Post unliked successfully');

    res.json({ message: 'Post unliked.' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({
      error: 'Failed to unlike post.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- POST (bookmark) a post ---
app.post('/api/posts/:id/bookmark', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    console.log(`User ${userId} bookmarking post ${targetId}`);

    // Check if already bookmarked
    const existingBookmarkSnap = await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'bookmark')
      .where('target_id', '==', targetId)
      .get();

    if (!existingBookmarkSnap.empty) {
      return res.status(400).json({ error: 'Post already bookmarked.' });
    }

    // Create bookmark
    const bookmarkRef = db.collection('social_activities').doc();
    await bookmarkRef.set({
      user_id: userId,
      activity_type: 'bookmark',
      target_id: targetId,
      created_at: firebase.firestore.Timestamp.now()
    });

    console.log('Post bookmarked successfully');

    res.status(201).json({ message: 'Post bookmarked.' });
  } catch (error) {
    console.error('Error bookmarking post:', error);
    res.status(500).json({
      error: 'Failed to bookmark post.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- DELETE (unbookmark) a post ---
app.delete('/api/posts/:id/bookmark', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    console.log(`User ${userId} unbookmarking post ${targetId}`);

    const bookmarkSnap = await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'bookmark')
      .where('target_id', '==', targetId)
      .get();

    if (bookmarkSnap.empty) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    // Delete all matching bookmarks (should be only one)
    const deletions = bookmarkSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(deletions);

    console.log('Post unbookmarked successfully');

    res.json({ message: 'Post unbookmarked.' });
  } catch (error) {
    console.error('Error unbookmarking post:', error);
    res.status(500).json({
      error: 'Failed to unbookmark post.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- POST (track) a share ---
app.post('/api/posts/:id/share', authenticateToken, async (req, res) => {
  const postId = req.params.id;

  try {
    console.log(`Tracking share for post ${postId}`);

    const postRef = db.collection('social_activities').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    await postRef.update({
      share_count: firebase.firestore.FieldValue.increment(1)
    });

    console.log('Share tracked successfully');

    res.json({ message: 'Share tracked.' });
  } catch (error) {
    console.error('Error tracking share:', error);
    res.status(500).json({
      error: 'Failed to track share.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============ STUDENT DASHBOARD SPECIFIC ENDPOINTS  ====================

// This fetches all enrolled courses for a specific user, including course details
app.get('/api/users/:userId/enrollments', authenticateToken, async (req, res) => {
  const userId = req.user.id; // User ID is from the authenticated token

  // Security check: Ensure the user requesting data matches the user ID in the URL parameter
  if (req.params.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own enrollment data.' });
  }

  try {
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).orderBy('enrollment_date', 'desc').get();

    const enrollments = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const c = courseDoc.data();
      enrollments.push({
        id: doc.id,
        progress: e.progress,
        status: e.status,
        enrollment_date: e.enrollment_date,
        completion_date: e.completion_date,
        course_id: e.course_id,
        courseTitle: c.title,
        instructorName: c.instructor_name,
        durationWeeks: c.duration_weeks
      });
    }

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching user enrollments for dashboard:', error);
    res.status(500).json({ error: 'Internal server error while fetching enrolled courses.' });
  }
});

// GET /api/users/:userId/internship-submissions
app.get('/api/users/:userId/internship-submissions', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (req.params.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own internship submissions.' });
  }

  try {
    const applicationsSnap = await db.collection('internship_submissions').where('user_id', '==', userId).orderBy('submitted_at', 'desc').get();

    const applications = [];
    for (const doc of applicationsSnap.docs) {
      const sub = doc.data();
      const internshipDoc = await db.collection('internships').doc(sub.internship_id).get();
      const i = internshipDoc.data();
      applications.push({
        id: doc.id,
        internship_id: sub.internship_id,
        applicationStatus: sub.status,
        applicationDate: sub.submitted_at,
        internshipTitle: i.title,
        companyName: i.company
      });
    }

    res.json(applications);
  } catch (error) {
    console.error('Error fetching user internship applications for dashboard:', error); 
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// =============== NEW PROFESSIONAL DASHBOARD ENDPOINTS ====================

// GET all active services (subcategories from active categories) - for regular users
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Fetching public services...');
    
    // FIXED: Remove orderBy to avoid composite index requirement
    // We'll sort in memory instead
    const subcategoriesSnap = await db.collection('service_subcategories').get();

    console.log(`Found ${subcategoriesSnap.size} total subcategories`);

    const services = [];
    
    for (const doc of subcategoriesSnap.docs) {
      const sub = doc.data();
      
      // FIXED: Handle both boolean and number for is_active (true/1 = active)
      const isSubcategoryActive = sub.is_active === true || sub.is_active === 1;
      
      if (!isSubcategoryActive) {
        console.log(`Skipping inactive subcategory ${doc.id}`);
        continue;
      }

      // Get category details
      if (!sub.category_id) {
        console.warn(`Subcategory ${doc.id} has no category_id`);
        continue;
      }

      try {
        const categoryDoc = await db.collection('service_categories').doc(sub.category_id).get();
        
        // Skip if category doesn't exist
        if (!categoryDoc.exists) {
          console.warn(`Category ${sub.category_id} not found for subcategory ${doc.id}`);
          continue;
        }

        const categoryData = categoryDoc.data();
        
        // FIXED: Handle both boolean and number for is_active
        const isCategoryActive = categoryData.is_active === true || categoryData.is_active === 1;
        
        if (!isCategoryActive) {
          console.log(`Skipping subcategory ${sub.name} - category is inactive`);
          continue;
        }

        // FIXED: Ensure features is always an array
        let features = [];
        if (sub.features) {
          if (typeof sub.features === 'string') {
            try {
              features = JSON.parse(sub.features);
            } catch (e) {
              console.warn(`Failed to parse features for ${doc.id}:`, e);
              features = [];
            }
          } else if (Array.isArray(sub.features)) {
            features = sub.features;
          }
        }

        // Format service data - INCLUDE created_at for sorting
        const service = {
          id: doc.id,
          name: sub.name || 'Unnamed Service',
          category_id: sub.category_id,
          categoryName: categoryData.name || 'Uncategorized',
          description: sub.description || '',
          price: parseFloat(sub.base_price || 0),
          duration: sub.duration || 'Variable',
          rating: parseFloat(sub.rating || 0),
          reviews: parseInt(sub.reviews || 0),
          features: features,
          popular: sub.popular === true || sub.popular === 1,
          is_active: true,
          created_at: sub.created_at || null // Store for sorting
        };
        
        services.push(service);
        
      } catch (err) {
        console.error(`Error fetching category for subcategory ${doc.id}:`, err);
        continue;
      }
    }

    // ✅ FIXED: Sort by created_at in memory (newest first) - CORRECT VERSION
    services.sort((a, b) => {
      const aTime = a.created_at?.toDate?.() || new Date(0);
      const bTime = b.created_at?.toDate?.() || new Date(0);
      return bTime - aTime;
    });

    // Remove created_at before sending response
    const cleanServices = services.map(({ created_at, ...rest }) => rest);

    console.log(`✅ Returning ${cleanServices.length} active services`);
    res.json(cleanServices);
    
  } catch (error) {
    console.error('❌ Error fetching services:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch services',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ADJUSTED: GET /api/users/:userId/service-requests - Fetch a user's submitted service requests
app.get('/api/users/:userId/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (req.params.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
  }

  try {
    const requestsSnap = await db.collection('service_requests')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const requests = [];
    
    for (const doc of requestsSnap.docs) {
      const sr = doc.data();
      
      // ✅ FIXED: Add safety checks for missing documents
      let categoryName = 'Unknown Category';
      
      try {
        // Check if subcategory exists
        const subcategoryDoc = await db.collection('service_subcategories').doc(sr.subcategory_id).get();
        
        if (!subcategoryDoc.exists) {
          console.warn(`Subcategory ${sr.subcategory_id} not found for request ${doc.id}`);
        } else {
          const sc = subcategoryDoc.data();
          
          // Check if category exists
          if (sc && sc.category_id) {
            const categoryDoc = await db.collection('service_categories').doc(sc.category_id).get();
            
            if (categoryDoc.exists) {
              const category = categoryDoc.data();
              categoryName = category.name || 'Unknown Category';
            } else {
              console.warn(`Category ${sc.category_id} not found for subcategory ${sr.subcategory_id}`);
            }
          } else {
            console.warn(`Subcategory ${sr.subcategory_id} has no category_id`);
          }
        }
      } catch (fetchError) {
        console.error(`Error fetching category for request ${doc.id}:`, fetchError);
        // Continue with default categoryName
      }
      
      requests.push({
        id: doc.id,
        userId: sr.user_id,
        categoryId: sr.subcategory_id,
        categoryName: categoryName,
        fullName: sr.full_name,
        email: sr.email,
        phone: sr.phone,
        company: sr.company || '',
        website: sr.website || '',
        projectDetails: sr.project_details,
        budgetRange: sr.budget_range,
        timeline: sr.timeline,
        contactMethod: sr.contact_method,
        additionalRequirements: sr.additional_requirements || '',
        status: sr.status,
        requestDate: sr.created_at?.toDate ? sr.created_at.toDate().toISOString() : new Date().toISOString(),
        updatedAt: sr.updated_at?.toDate ? sr.updated_at.toDate().toISOString() : new Date().toISOString()
      });
    }

    console.log(`✅ Returning ${requests.length} service requests for user ${userId}`);
    res.json(requests);
    
  } catch (error) {
    console.error('Error fetching user service requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch your service requests.', 
      error: error.message 
    });
  }
});

// ADJUSTED: POST /api/service-requests - Submit a new service request
app.post('/api/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id; // User ID from authenticated token
  const {
    categoryId, // Comes from selectedService.category_id
    fullName,
    email,
    phone,
    company,
    website,
    projectDetails, // Changed from description
    budgetRange,    // Changed from budget
    timeline,       // Changed from deadline
    contactMethod,
    additionalRequirements
  } = req.body;

  // Validate required fields based on your 'service_requests' table schema
  if (!categoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
    return res.status(400).json({ message: 'Missing required fields for service request. Please fill in all necessary details.' });
  }

  try {
    const requestRef = db.collection('service_requests').doc();
    await requestRef.set({
      user_id: userId,
      subcategory_id: categoryId,
      full_name: fullName,
      email,
      phone,
      company: company || null, // Allow null for optional fields if not provided
      website: website || null,
      project_details: projectDetails,
      budget_range: budgetRange,
      timeline,
      contact_method: contactMethod,
      additional_requirements: additionalRequirements || null,
      status: 'pending',
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Return the ID of the newly created request
    res.status(201).json({ message: 'Service request submitted successfully!', id: requestRef.id });
  } catch (error) {
    console.error('Error submitting service request:', error);
    res.status(500).json({ message: 'Failed to submit service request. An internal server error occurred.', error: error.message });
  }
});

// ==================== USER CALENDAR EVENTS ROUTES ====================

// GET /api/calendar/events - Get all calendar events for current user
app.get('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get course start/end dates for enrolled courses
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();

    const courseEvents = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const c = courseDoc.data();
      courseEvents.push({
        id: doc.id,
        title: c.title,
        description: c.description || 'Course enrollment',
        date: c.created_at,
        type: 'course_start',
        course: {
          id: e.course_id,
          title: c.title,
          category: c.category
        },
        color: 'blue'
      });
    }

    const assignmentEvents = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const assignmentsSnap = await db.collection('assignments').where('course_id', '==', e.course_id).get();
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
        let status = 'pending';
        if (!submissionSnap.empty) {
          if (submissionSnap.docs[0].data().status === 'graded') status = 'completed';
        } else if (a.due_date.toDate() < new Date()) {
          status = 'overdue';
        }
        const courseDoc = await db.collection('courses').doc(e.course_id).get();
        const c = courseDoc.data();
        assignmentEvents.push({
          id: aDoc.id,
          title: a.title,
          description: a.description || 'Assignment due',
          date: a.due_date,
          type: 'assignment',
          course: {
            id: e.course_id,
            title: c.title,
            category: c.category
          },
          status,
          color: status === 'completed' ? 'green' : status === 'overdue' ? 'red' : 'orange'
        });
      }
    }

    // Get custom calendar events
    const customEventsSnap = await db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '>=', new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)).orderBy('event_date').get();

    const customEvents = customEventsSnap.docs.map(doc => {
      const event = doc.data();
      return {
        id: doc.id,
        title: event.title,
        description: event.description || '',
        date: event.event_date,
        time: event.event_time,
        type: event.event_type || 'custom',
        color: 'purple'
      };
    });

    // Combine all events
    const allEvents = [...courseEvents, ...assignmentEvents, ...customEvents];

    res.json(allEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// GET /api/calendar/events/date/:date - Get events for specific date
app.get('/api/calendar/events/date/:date', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0); // Start of day
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();

    const eventsResult = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const c = courseDoc.data();
      if (c.created_at.toDate().toISOString().split('T')[0] === date) {
        eventsResult.push({
          event_type: 'course_start',
          id: c.id,
          title: `Course: ${c.title}`,
          description: c.description,
          date: c.created_at,
          time: null,
          course_id: e.course_id,
          course_title: c.title,
          course_category: c.category,
          status: 'active'
        });
      }

      const assignmentsSnap = await db.collection('assignments').where('course_id', '==', e.course_id).get();
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        if (a.due_date.toDate().toISOString().split('T')[0] === date) {
          const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
          let status = 'pending';
          if (!submissionSnap.empty) {
            if (submissionSnap.docs[0].data().status === 'graded') status = 'completed';
          } else if (a.due_date.toDate() < new Date()) {
            status = 'overdue';
          }
          eventsResult.push({
            event_type: 'assignment',
            id: aDoc.id,
            title: a.title,
            description: a.description,
            date: a.due_date,
            time: null,
            course_id: e.course_id,
            course_title: c.title,
            course_category: c.category,
            status
          });
        }
      }
    }

    // Try to get custom events for the date
    const customEventsSnap = await db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '>=', targetDate).where('event_date', '<', nextDay).get();

    const customEvents = customEventsSnap.docs.map(doc => {
      const event = doc.data();
      return {
        event_type: 'custom',
        id: doc.id,
        title: event.title,
        description: event.description,
        date: event.event_date,
        time: event.event_time,
        course_id: null,
        course_title: null,
        course_category: null,
        status: 'pending'
      };
    });

    const allEvents = [...eventsResult, ...customEvents];

    const events = allEvents.map(event => ({
      id: `${event.event_type}-${event.id}`,
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time,
      type: event.event_type,
      course: event.course_id ? {
        id: event.course_id,
        title: event.course_title,
        category: event.course_category
      } : null,
      status: event.status
    }));

    res.json(events);
  } catch (error) {
    console.error('Error fetching events for date:', error);
    res.status(500).json({ error: 'Failed to fetch events for specified date' });
  }
});

// GET /api/calendar/upcoming - Get upcoming events (next 7 days)
app.get('/api/calendar/upcoming', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();

    const upcomingResult = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const assignmentsSnap = await db.collection('assignments').where('course_id', '==', e.course_id).where('due_date', '>=', firebase.firestore.Timestamp.fromDate(now)).where('due_date', '<=', firebase.firestore.Timestamp.fromDate(sevenDaysLater)).orderBy('due_date').limit(10).get();
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
        let status = 'pending';
        if (!submissionSnap.empty) {
          if (submissionSnap.docs[0].data().status === 'graded') status = 'completed';
        } else if (a.due_date.toDate() < new Date()) {
          status = 'overdue';
        }
        const courseDoc = await db.collection('courses').doc(e.course_id).get();
        const c = courseDoc.data();
        upcomingResult.push({
          event_type: 'assignment',
          id: aDoc.id,
          title: a.title,
          description: a.description,
          date: a.due_date,
          time: null,
          course_id: e.course_id,
          course_title: c.title,
          course_category: c.category,
          status
        });
      }
    }

    // Try to get upcoming custom events
    const customResult = await db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '>=', firebase.firestore.Timestamp.fromDate(now)).where('event_date', '<=', firebase.firestore.Timestamp.fromDate(sevenDaysLater)).orderBy('event_date').limit(5).get();

    const customUpcoming = customResult.docs.map(doc => {
      const event = doc.data();
      return {
        event_type: 'custom',
        id: doc.id,
        title: event.title,
        description: event.description,
        date: event.event_date,
        time: event.event_time,
        course_id: null,
        course_title: null,
        course_category: null,
        status: 'pending'
      };
    });

    const allUpcoming = [...upcomingResult, ...customUpcoming];

    const upcomingEvents = allUpcoming.map(event => ({
      id: `${event.event_type}-${event.id}`,
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time,
      type: event.event_type,
      course: event.course_id ? {
        id: event.course_id,
        title: event.course_title,
        category: event.course_category
      } : null,
      status: event.status,
      color: event.status === 'completed' ? 'green' :
        event.status === 'overdue' ? 'red' :
          event.event_type === 'custom' ? 'purple' : 'orange'
    }));

    res.json(upcomingEvents);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// GET /api/calendar/stats - Get calendar statistics
app.get('/api/calendar/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).get();

    let pendingAssignments = 0;
    let completedAssignments = 0;
    let overdueAssignments = 0;
    let activeCourses = 0;
    let completedCourses = 0;

    enrollmentsSnap.docs.forEach(doc => {
      const e = doc.data();
      if (e.status === 'active') activeCourses++;
      if (e.status === 'completed') completedCourses++;
    });

    const assignmentsSnap = await db.collection('assignments').get(); // Inefficient, but since no join, fetch all and filter

    for (const aDoc of assignmentsSnap.docs) {
      const a = aDoc.data();
      // Check if user is enrolled in the course
      const enrollment = await db.collection('enrollments').where('user_id', '==', userId).where('course_id', '==', a.course_id).where('status', '==', 'active').get();
      if (!enrollment.empty) {
        const submission = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
        if (!submission.empty) {
          if (submission.docs[0].data().status === 'graded') completedAssignments++;
          else pendingAssignments++;
        } else {
          if (a.due_date.toDate() < new Date()) overdueAssignments++;
          else pendingAssignments++;
        }
      }
    }

    res.json({
      pending_assignments: pendingAssignments,
      completed_assignments: completedAssignments,
      overdue_assignments: overdueAssignments,
      active_courses: activeCourses,
      completed_courses: completedCourses,
      total_assignments: pendingAssignments + completedAssignments + overdueAssignments
    });
  } catch (error) {
    console.error('Error fetching calendar stats:', error);
    res.status(500).json({ error: 'Failed to fetch calendar statistics' });
  }
});

// GET /api/assignments/my-assignments - Get user's assignments (for calendar frontend)
app.get('/api/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();

    const assignments = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const assSnap = await db.collection('assignments').where('course_id', '==', e.course_id).orderBy('due_date').get();
      for (const aDoc of assSnap.docs) {
        const a = aDoc.data();
        const courseDoc = await db.collection('courses').doc(e.course_id).get();
        const c = courseDoc.data();
        const subSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
        let submission = null;
        if (!subSnap.empty) {
          submission = subSnap.docs[0].data();
          submission.id = subSnap.docs[0].id;
        }
        assignments.push({
          id: aDoc.id,
          course_id: e.course_id,
          title: a.title,
          description: a.description,
          due_date: a.due_date,
          max_points: a.max_points,
          created_at: a.created_at,
          course: {
            id: e.course_id,
            title: c.title,
            category: c.category
          },
          submission
        });
      }
    }

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// POST /api/calendar/events - Create a custom calendar event
app.post('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, date, time, type = 'custom' } = req.body;

    // Validate required fields
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const eventRef = db.collection('custom_calendar_events').doc();
    await eventRef.set({
      user_id: userId,
      title,
      description,
      event_date: new Date(date),
      event_time: time,
      event_type: type,
      created_at: firebase.firestore.Timestamp.now(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.status(201).json({
      id: eventRef.id,
      title,
      description,
      date,
      time,
      type,
      message: 'Calendar event created successfully'
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// PUT /api/calendar/events/:id - Update a custom calendar event
app.put('/api/calendar/events/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, date, time, type } = req.body;

    // Check if event exists and belongs to user
    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists || eventDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    await db.collection('custom_calendar_events').doc(id).update({
      title,
      description,
      event_date: new Date(date),
      event_time: time,
      event_type: type,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Calendar event updated successfully' });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

// DELETE /api/calendar/events/:id - Delete a custom calendar event
app.delete('/api/calendar/events/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists || eventDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    await db.collection('custom_calendar_events').doc(id).delete();

    res.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

// GET /api/auth/me - Get current user info (for calendar frontend)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: req.user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      account_type: user.account_type,
      profile_image: user.profile_image,
      company: user.company,
      website: user.website,
      bio: user.bio,
      is_active: user.is_active,
      email_verified: user.email_verified,
      created_at: user.created_at,
      last_login: user.last_login
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});

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

// ==================== ADMIN ENROLLMENT REQUESTS MANAGEMENT ====================

// GET all enrollment requests (admin only)
app.get('/api/admin/enrollment-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requestsSnap = await db.collection('course_enroll_requests')
      .orderBy('created_at', 'desc')
      .get();

    const requests = [];
    for (const doc of requestsSnap.docs) {
      const req = doc.data();
      
      // Get course details
      let courseName = 'Unknown Course';
      try {
        const courseDoc = await db.collection('courses').doc(req.course_id).get();
        if (courseDoc.exists) {
          courseName = courseDoc.data().title;
        }
      } catch (err) {
        console.error('Error fetching course:', err);
      }

      requests.push({
        id: doc.id,
        user_id: req.user_id || null,
        course_id: req.course_id,
        course_name: courseName,
        full_name: req.full_name,
        email: req.email,
        phone: req.phone,
        address: req.address,
        city: req.city,
        state: req.state,
        pincode: req.pincode,
        payment_method: req.payment_method,
        transaction_id: req.transaction_id,
        payment_screenshot: req.payment_screenshot,
        status: req.status,
        is_guest: req.is_guest || false,
        created_at: req.created_at
      });
    }

    res.json(requests);
  } catch (error) {
    console.error('Error fetching enrollment requests:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment requests' });
  }
});

// APPROVE enrollment request (admin only)
app.put('/api/admin/enrollment-requests/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the enrollment request
    const requestDoc = await db.collection('course_enroll_requests').doc(id).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Enrollment request not found' });
    }

    const request = requestDoc.data();
    
    // Check if course exists
    const courseDoc = await db.collection('courses').doc(request.course_id).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Find user by email (for guest enrollments)
    let userId = request.user_id;
    if (!userId) {
      const usersSnap = await db.collection('users')
        .where('email', '==', request.email.toLowerCase())
        .limit(1)
        .get();
      
      if (!usersSnap.empty) {
        userId = usersSnap.docs[0].id;
      }
    }

    if (userId) {
      // Check if already enrolled
      const existingEnrollment = await db.collection('enrollments')
        .where('user_id', '==', userId)
        .where('course_id', '==', request.course_id)
        .get();

      if (existingEnrollment.empty) {
        // Create enrollment
        const enrollmentRef = db.collection('enrollments').doc();
        await enrollmentRef.set({
          user_id: userId,
          course_id: request.course_id,
          enrollment_date: firebase.firestore.Timestamp.now(),
          progress: 0,
          status: 'active',
          completion_date: null
        });

        // Update user stats
        const userStatsRef = db.collection('user_stats').doc(userId);
        const userStatsDoc = await userStatsRef.get();
        
        if (userStatsDoc.exists) {
          await userStatsRef.update({
            courses_enrolled: firebase.firestore.FieldValue.increment(1)
          });
        } else {
          await userStatsRef.set({
            courses_enrolled: 1,
            courses_completed: 0,
            certificates_earned: 0,
            learning_streak: 0
          });
        }
      }
    }

    // Update request status
    await db.collection('course_enroll_requests').doc(id).update({
      status: 'approved',
      approved_at: firebase.firestore.Timestamp.now(),
      approved_by: req.user.id,
      user_id: userId || null
    });

    res.json({ 
      message: 'Enrollment request approved successfully',
      userId: userId,
      userFound: !!userId
    });

  } catch (error) {
    console.error('Error approving enrollment request:', error);
    res.status(500).json({ error: 'Failed to approve enrollment request' });
  }
});

// REJECT enrollment request (admin only)
app.put('/api/admin/enrollment-requests/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const requestDoc = await db.collection('course_enroll_requests').doc(id).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Enrollment request not found' });
    }

    await db.collection('course_enroll_requests').doc(id).update({
      status: 'rejected',
      rejected_at: firebase.firestore.Timestamp.now(),
      rejected_by: req.user.id,
      rejection_reason: reason || 'No reason provided'
    });

    res.json({ message: 'Enrollment request rejected successfully' });

  } catch (error) {
    console.error('Error rejecting enrollment request:', error);
    res.status(500).json({ error: 'Failed to reject enrollment request' });
  }
});

// DELETE enrollment request (admin only)
app.delete('/api/admin/enrollment-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const requestDoc = await db.collection('course_enroll_requests').doc(id).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Enrollment request not found' });
    }

    // Delete payment screenshot file if exists
    const request = requestDoc.data();
    if (request.payment_screenshot) {
      const filePath = path.join(__dirname, request.payment_screenshot.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error('Error deleting payment screenshot:', fileError);
        }
      }
    }

    await db.collection('course_enroll_requests').doc(id).delete();

    res.json({ message: 'Enrollment request deleted successfully' });

  } catch (error) {
    console.error('Error deleting enrollment request:', error);
    res.status(500).json({ error: 'Failed to delete enrollment request' });
  }
});

// AUTO-LINK guest enrollments when user logs in
app.post('/api/link-guest-enrollments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Find approved enrollment requests with matching email
    const requestsSnap = await db.collection('course_enroll_requests')
      .where('email', '==', userEmail.toLowerCase())
      .where('status', '==', 'approved')
      .where('user_id', '==', null)
      .get();

    let linkedCount = 0;

    for (const doc of requestsSnap.docs) {
      const request = doc.data();

      // Check if already enrolled
      const existingEnrollment = await db.collection('enrollments')
        .where('user_id', '==', userId)
        .where('course_id', '==', request.course_id)
        .get();

      if (existingEnrollment.empty) {
        // Create enrollment
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

      // Update request to link user_id
      await db.collection('course_enroll_requests').doc(doc.id).update({
        user_id: userId
      });
    }

    if (linkedCount > 0) {
      // Update user stats
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
          learning_streak: 0
        });
      }
    }

    res.json({ 
      message: `Successfully linked ${linkedCount} guest enrollment(s)`,
      linkedCount 
    });

  } catch (error) {
    console.error('Error linking guest enrollments:', error);
    res.status(500).json({ error: 'Failed to link guest enrollments' });
  }
});


// ==================== COURSES ROUTES ====================

// Replace the existing /api/courses endpoint
app.get('/api/courses', async (req, res) => {
  try {
    const coursesSnap = await db.collection('courses').where('is_active', '==', true).orderBy('created_at', 'desc').get();

    const formattedCourses = coursesSnap.docs.map(doc => {
      const course = doc.data();
      return {
        id: doc.id,
        title: course.title,
        description: course.description,
        instructorName: course.instructor_name,
        durationWeeks: course.duration_weeks,
        difficultyLevel: course.difficulty_level,
        category: course.category,
        price: course.price !== null ? `₹${parseFloat(course.price).toFixed(2)}` : '₹0.00',
        thumbnail: course.thumbnail,
        isActive: course.is_active
      };
    });

    res.json(formattedCourses);

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
});

// Link guest enrollments to logged-in user - PUT THIS AFTER THE LOGIN ENDPOINT
app.post('/api/link-guest-enrollments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    console.log(`\n🔗 Manual linking for user ${userId} (${userEmail})`);

    // Find approved enrollment requests with this email
    const requestsSnap = await db.collection('course_enroll_requests')
      .where('email', '==', userEmail.toLowerCase())
      .where('status', '==', 'approved')
      .get();

    console.log(`📋 Found ${requestsSnap.size} approved requests`);

    let linked = 0;
    let existing = 0;

    for (const doc of requestsSnap.docs) {
      const request = doc.data();
      console.log(`\n📦 Processing request ${doc.id} for course ${request.course_id}`);

      // Check if already enrolled
      const enrollmentSnap = await db.collection('enrollments')
        .where('user_id', '==', userId)
        .where('course_id', '==', request.course_id)
        .get();

      if (enrollmentSnap.empty) {
        // Create enrollment
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
        console.log(`✅ Created enrollment ${enrollmentRef.id}`);
      } else {
        existing++;
        console.log(`⏭️  Already enrolled in ${request.course_id}`);
      }

      // Update request to link user_id
      await db.collection('course_enroll_requests').doc(doc.id).update({
        user_id: userId
      });
      console.log(`🔗 Linked request to user`);
    }

    console.log(`\n📊 Summary: ${linked} new, ${existing} existing`);

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

// Get user's enrollments with course details
app.get('/api/enrollments/my-courses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📚 Fetching enrollments for user ${userId}`);

    // Get user's enrollments
    const enrollmentsSnap = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .get();

    console.log(`✅ Found ${enrollmentsSnap.size} enrollments`);

    const enrollments = [];

    for (const doc of enrollmentsSnap.docs) {
      const enrollment = doc.data();
      
      // Get course details
      const courseDoc = await db.collection('courses').doc(enrollment.course_id).get();
      
      if (courseDoc.exists) {
        const courseData = courseDoc.data();
        
        // Get instructor name
        let instructorName = 'Unknown Instructor';
        if (courseData.instructor_id) {
          const instructorDoc = await db.collection('users').doc(courseData.instructor_id).get();
          if (instructorDoc.exists) {
            const instructor = instructorDoc.data();
            instructorName = `${instructor.first_name} ${instructor.last_name}`;
          }
        }

        enrollments.push({
          id: doc.id,
          progress: enrollment.progress || 0,
          status: enrollment.status,
          enrollment_date: enrollment.enrollment_date,
          completion_date: enrollment.completion_date,
          course: {
            id: courseDoc.id,
            title: courseData.title,
            description: courseData.description,
            thumbnail: courseData.thumbnail,
            durationWeeks: courseData.duration_weeks,
            instructorName: instructorName
          }
        });
      }
    }

    console.log(`✅ Returning ${enrollments.length} enrollments with course details`);
    res.json(enrollments);

  } catch (error) {
    console.error('❌ Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Enroll in a course
app.post('/api/courses/enroll', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Check if already enrolled
    const existingSnap = await db.collection('enrollments').where('user_id', '==', userId).where('course_id', '==', courseId).get();

    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();

    if (!courseDoc.exists || !courseDoc.data().is_active) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    const enrollmentRef = db.collection('enrollments').doc();
    await enrollmentRef.set({
      user_id: userId,
      course_id: courseId,
      enrollment_date: firebase.firestore.Timestamp.now()
    });

    // Update user stats
    await db.collection('user_stats').doc(userId).update({
      courses_enrolled: firebase.firestore.FieldValue.increment(1)
    });

    res.status(201).json({ message: 'Successfully enrolled in course' });

  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ASSIGNMENTS ROUTES ====================

// GET /auth/me - Get current user info
app.get('/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// GET /assignments/my-assignments - Get user's assignments
app.get('/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).get();

    const results = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const c = courseDoc.data();
      if (c.is_active) {
        const assignmentsSnap = await db.collection('assignments').where('course_id', '==', e.course_id).orderBy('due_date').get();
        for (const aDoc of assignmentsSnap.docs) {
          const a = aDoc.data();
          const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
          let sub = null;
          if (!submissionSnap.empty) {
            sub = submissionSnap.docs[0].data();
          }
          results.push({
            id: aDoc.id,
            course_id: e.course_id,
            title: a.title,
            description: a.description,
            due_date: a.due_date,
            max_points: a.max_points,
            created_at: a.created_at,
            course_title: c.title,
            course_category: c.category,
            submission_id: sub ? submissionSnap.docs[0].id : null,
            submission_content: sub ? sub.content : null,
            submission_file_path: sub ? sub.file_path : null,
            submitted_at: sub ? sub.submitted_at : null,
            grade: sub ? sub.grade : null,
            feedback: sub ? sub.feedback : null,
            submission_status: sub ? sub.status : null
          });
        }
      }
    }

    // Format results
    const assignments = results.map(row => ({
      id: row.id,
      course_id: row.course_id,
      title: row.title,
      description: row.description,
      due_date: row.due_date,
      max_points: row.max_points,
      created_at: row.created_at,
      course: {
        id: row.course_id,
        title: row.course_title,
        category: row.course_category
      },
      submission: row.submission_id ? {
        id: row.submission_id,
        content: row.submission_content,
        file_path: row.submission_file_path,
        submitted_at: row.submitted_at,
        grade: row.grade,
        feedback: row.feedback,
        status: row.submission_status
      } : null
    }));

    res.json(assignments);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /assignments/all - Get all assignments (admin only)
app.get('/assignments/all', authenticateToken, async (req, res) => {
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }

  try {
    const assignmentsSnap = await db.collection('assignments').get();

    const results = [];
    for (const aDoc of assignmentsSnap.docs) {
      const a = aDoc.data();
      const courseDoc = await db.collection('courses').doc(a.course_id).get();
      const c = courseDoc.data();
      if (c.is_active) {
        const submissionsSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).get();
        let submission_count = submissionsSnap.size;
        let graded_count = 0;
        submissionsSnap.docs.forEach(sDoc => {
          if (sDoc.data().status === 'graded') graded_count++;
        });
        results.push({
          id: aDoc.id,
          course_id: a.course_id,
          title: a.title,
          description: a.description,
          due_date: a.due_date,
          max_points: a.max_points,
          created_at: a.created_at,
          course_title: c.title,
          course_category: c.category,
          submission_count,
          graded_count
        });
      }
    }

    res.json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /assignments/submit - Submit assignment
app.post('/assignments/submit', authenticateToken, assignmentUpload.single('file'), async (req, res) => {
  const { assignment_id, content } = req.body;
  const file_path = req.file ? req.file.filename : null;

  if (!assignment_id) {
    return res.status(400).json({ error: 'Assignment ID is required' });
  }

  if (!content && !file_path) {
    return res.status(400).json({ error: 'Either content or file is required' });
  }

  try {
    const assignmentDoc = await db.collection('assignments').doc(assignment_id).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found or not enrolled' });
    }

    const course_id = assignmentDoc.data().course_id;

    const enrollmentSnap = await db.collection('enrollments').where('course_id', '==', course_id).where('user_id', '==', req.user.id).get();
    if (enrollmentSnap.empty) {
      return res.status(404).json({ error: 'Assignment not found or not enrolled' });
    }

    const existingSnap = await db.collection('assignment_submissions').where('assignment_id', '==', assignment_id).where('user_id', '==', req.user.id).get();
    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }

    const submissionRef = db.collection('assignment_submissions').doc();
    await submissionRef.set({
      assignment_id,
      user_id: req.user.id,
      content: content || '',
      file_path,
      submitted_at: firebase.firestore.Timestamp.now(),
      status: 'submitted'
    });

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission_id: submissionRef.id
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /assignments/download-submission/:id - Download submission file
app.get('/assignments/download-submission/:id', authenticateToken, async (req, res) => {
  const submissionId = req.params.id;

  try {
    const submissionDoc = await db.collection('assignment_submissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const s = submissionDoc.data();

    const assignmentDoc = await db.collection('assignments').doc(s.assignment_id).get();
    const a = assignmentDoc.data();

    if (s.user_id !== req.user.id && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!s.file_path) {
      return res.status(404).json({ error: 'No file attached to this submission' });
    }

    const filePath = path.join(__dirname, 'uploads', 'assignments', s.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${s.file_path}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /assignments/course/:courseId - Get assignments for a specific course
app.get('/assignments/course/:courseId', authenticateToken, async (req, res) => {
  const courseId = req.params.courseId;

  try {
    const enrollmentSnap = await db.collection('enrollments').where('course_id', '==', courseId).where('user_id', '==', req.user.id).get();
    if (enrollmentSnap.empty && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignmentsSnap = await db.collection('assignments').where('course_id', '==', courseId).orderBy('due_date').get();

    const results = [];
    for (const aDoc of assignmentsSnap.docs) {
      const a = aDoc.data();
      const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', req.user.id).get();
      let sub = null;
      if (!submissionSnap.empty) {
        sub = submissionSnap.docs[0].data();
      }
      const courseDoc = await db.collection('courses').doc(courseId).get();
      const c = courseDoc.data();
      results.push({
        id: aDoc.id,
        course_id: courseId,
        title: a.title,
        description: a.description,
        due_date: a.due_date,
        max_points: a.max_points,
        created_at: a.created_at,
        course_title: c.title,
        course_category: c.category,
        submission_id: sub ? submissionSnap.docs[0].id : null,
        submission_content: sub ? sub.content : null,
        submission_file_path: sub ? sub.file_path : null,
        submitted_at: sub ? sub.submitted_at : null,
        grade: sub ? sub.grade : null,
        feedback: sub ? sub.feedback : null,
        submission_status: sub ? sub.status : null
      });
    }

    const assignments = results.map(row => ({
      id: row.id,
      course_id: row.course_id,
      title: row.title,
      description: row.description,
      due_date: row.due_date,
      max_points: row.max_points,
      created_at: row.created_at,
      course: {
        id: row.course_id,
        title: row.course_title,
        category: row.course_category
      },
      submission: row.submission_id ? {
        id: row.submission_id,
        content: row.submission_content,
        file_path: row.submission_file_path,
        submitted_at: row.submitted_at,
        grade: row.grade,
        feedback: row.feedback,
        status: row.submission_status
      } : null
    }));

    res.json(assignments);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT /assignments/grade/:submissionId - Grade assignment (admin/instructor only)
app.put('/assignments/grade/:submissionId', authenticateToken, (req, res) => {
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }

  const submissionId = req.params.submissionId;
  const { grade, feedback } = req.body;

  // Validate grade
  if (grade < 0 || grade > 100) {
    return res.status(400).json({ error: 'Grade must be between 0 and 100' });
  }

  db.collection('assignment_submissions').doc(submissionId).update({
    grade,
    feedback: feedback || '',
    status: 'graded'
  }).then(() => {
    res.json({
      success: true,
      message: 'Assignment graded successfully'
    });
  }).catch(err => {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  });
});

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

// ==================== RESOURCES ROUTES ======================
// GET resources for current user
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First get user's account type
    const userDoc = await db.collection('users').doc(userId).get();
    const accountType = userDoc.data().account_type;
    
    // Get all resources that are allowed for this account type
    const resourcesSnap = await db.collection('resources').get();
    const resources = resourcesSnap.docs.map(doc => doc.data()).filter(r => JSON.parse(r.allowed_account_types || '[]').includes(accountType));
    
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// GET resource download
app.get('/api/resources/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // First check if user has access to this resource
    const resourceDoc = await db.collection('resources').doc(id).get();
    if (!resourceDoc.exists) {
      return res.status(404).json({ error: 'Resource not found or access denied' });
    }

    const resource = resourceDoc.data();
    const userDoc = await db.collection('users').doc(userId).get();
    const accountType = userDoc.data().account_type;

    if (!JSON.parse(resource.allowed_account_types || '[]').includes(accountType)) {
      return res.status(404).json({ error: 'Resource not found or access denied' });
    }
    
    // Check if resource is premium and user doesn't have access
    if (resource.is_premium && !['professional', 'business', 'agency', 'admin'].includes(accountType)) {
      return res.status(403).json({ error: 'Premium resource requires upgraded account' });
    }
    
    // For demo purposes, we'll return a simple text file
    // In a real application, you would serve the actual file
    res.setHeader('Content-Disposition', `attachment; filename="${resource.title}.txt"`);
    res.setHeader('Content-Type', 'text/plain');
    
    // Create a simple text file with resource details
    const fileContent = `
      Resource: ${resource.title}
      Description: ${resource.description}
      Type: ${resource.type}
      Category: ${resource.category}
      Access Level: ${resource.is_premium ? 'Premium' : 'Free'}
      
      This is a demo download. In a real application, this would be the actual resource file.
    `;
    
    res.send(fileContent);
  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ error: 'Failed to download resource' });
  }
});

// ==================== CERTIFICATES MANAGEMENT ROUTES ====================

// Certificate Routes - Student view
app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`🏆 Fetching certificates for user: ${userId}`);

    const certificatesSnap = await db.collection('certificates')
      .where('user_id', '==', userId)
      .orderBy('issued_date', 'desc')
      .get();

    console.log(`📜 Found ${certificatesSnap.size} certificates in database`);

    const formattedCertificates = [];
    
    for (const doc of certificatesSnap.docs) {
      const c = doc.data();
      
      // Get course details
      const courseDoc = await db.collection('courses').doc(c.course_id).get();
      if (!courseDoc.exists) {
        console.log(`⚠️ Course ${c.course_id} not found, skipping certificate ${doc.id}`);
        continue;
      }
      
      const co = courseDoc.data();
      
      // Get enrollment details
      const enrollmentSnap = await db.collection('enrollments')
        .where('user_id', '==', userId)
        .where('course_id', '==', c.course_id)
        .get();
      
      if (enrollmentSnap.empty) {
        console.log(`⚠️ No enrollment found for course ${c.course_id}, skipping certificate ${doc.id}`);
        continue;
      }
      
      const e = enrollmentSnap.docs[0].data();
      
      // Calculate final grade from assignments
      const assignmentsSnap = await db.collection('assignments')
        .where('course_id', '==', c.course_id)
        .get();
      
      let finalGrade = 0;
      let count = 0;
      
      for (const aDoc of assignmentsSnap.docs) {
        const subSnap = await db.collection('assignment_submissions')
          .where('assignment_id', '==', aDoc.id)
          .where('user_id', '==', userId)
          .get();
        
        if (!subSnap.empty) {
          finalGrade += subSnap.docs[0].data().grade || 0;
          count++;
        }
      }
      
      // Get instructor name
      let instructorName = co.instructor_name || 'Unknown Instructor';
      if (co.instructor_id) {
        const instructorDoc = await db.collection('users').doc(co.instructor_id).get();
        if (instructorDoc.exists) {
          const instructor = instructorDoc.data();
          instructorName = `${instructor.first_name} ${instructor.last_name}`;
        }
      }
      
      // Format in the structure expected by frontend
      formattedCertificates.push({
        id: doc.id,
        userId: c.user_id,
        courseId: c.course_id,
        certificateUrl: c.certificate_url || `#certificate-${doc.id}`,
        issuedDate: c.issued_date.toDate().toISOString(),
        // NESTED course object (required by frontend)
        course: {
          id: c.course_id,
          title: co.title,
          description: co.description || '',
          instructorName: instructorName,
          category: co.category || 'General',
          difficultyLevel: co.difficulty_level || 'Beginner'
        },
        // NESTED enrollment object (required by frontend)
        enrollment: {
          completionDate: e.completion_date ? e.completion_date.toDate().toISOString() : c.issued_date.toDate().toISOString(),
          finalGrade: count > 0 ? Math.round(finalGrade / count) : null,
          status: e.status || 'completed'
        }
      });
    }

    console.log(`✅ Returning ${formattedCertificates.length} formatted certificates`);
    res.json(formattedCertificates);
    
  } catch (error) {
    console.error('❌ Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Download certificate endpoint
app.get('/api/certificates/:certificateId/download', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;

    // Verify the certificate belongs to the user
    const certificateDoc = await db.collection('certificates').doc(certificateId).get();
    if (!certificateDoc.exists || certificateDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = certificateDoc.data();

    const courseDoc = await db.collection('courses').doc(certificate.course_id).get();
    const course = courseDoc.data();

    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();

    // If certificate_url exists, redirect to it
    if (certificate.certificate_url) {
      return res.redirect(certificate.certificate_url);
    }

    // Otherwise, generate a simple PDF certificate
    const certificateData = {
      recipientName: `${user.first_name} ${user.last_name}`,
      courseName: course.title,
      completionDate: certificate.issued_date.toDate().toISOString(),
      certificateId: certificateId
    };

    res.json({
      message: 'Certificate ready for download',
      data: certificateData,
      downloadUrl: `/api/certificates/${certificateId}/pdf`
    });

  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({ error: 'Failed to download certificate' });
  }
});

// ==================== ADMIN CERTIFICATES MANAGEMENT ROUTES ====================

// Get all certificates (admin only)
app.get('/api/certificates', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const certificatesSnap = await db.collection('certificates').orderBy('issued_date', 'desc').get();

    const formattedCertificates = [];
    for (const doc of certificatesSnap.docs) {
      const c = doc.data();
      
      const courseDoc = await db.collection('courses').doc(c.course_id).get();
      if (!courseDoc.exists) continue;
      
      const co = courseDoc.data();
      
      const userDoc = await db.collection('users').doc(c.user_id).get();
      if (!userDoc.exists) continue;
      
      const u = userDoc.data();
      
      const enrollmentSnap = await db.collection('enrollments')
        .where('user_id', '==', c.user_id)
        .where('course_id', '==', c.course_id)
        .get();
      
      const e = !enrollmentSnap.empty ? enrollmentSnap.docs[0].data() : null;
      
      formattedCertificates.push({
        id: doc.id,
        userId: c.user_id,
        courseId: c.course_id,
        certificateUrl: c.certificate_url,
        issuedDate: c.issued_date.toDate().toISOString(),
        course: {
          id: c.course_id,
          title: co.title,
          instructorName: co.instructor_name,
          category: co.category,
          difficultyLevel: co.difficulty_level
        },
        user: {
          firstName: u.first_name,
          lastName: u.last_name,
          email: u.email
        },
        enrollment: {
          completionDate: e && e.completion_date ? e.completion_date.toDate().toISOString() : null
        }
      });
    }

    res.json(formattedCertificates);
  } catch (error) {
    console.error('Error fetching all certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Issue new certificate (admin only)
app.post('/api/certificates', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId, courseId, certificateUrl } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'User ID and Course ID are required' });
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(400).json({ error: 'Course not found' });
    }

    // Check if user has completed the course
    const enrollments = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('course_id', '==', courseId)
      .where('status', '==', 'completed')
      .get();

    if (enrollments.empty) {
      return res.status(400).json({ error: 'User has not completed this course' });
    }

    // Check if certificate already exists
    const existingCertificates = await db.collection('certificates')
      .where('user_id', '==', userId)
      .where('course_id', '==', courseId)
      .get();

    if (!existingCertificates.empty) {
      return res.status(400).json({ error: 'Certificate already exists for this user and course' });
    }

    // Create new certificate
    const certRef = db.collection('certificates').doc();
    await certRef.set({
      user_id: userId,
      course_id: courseId,
      certificate_url: certificateUrl || null,
      issued_date: firebase.firestore.Timestamp.now()
    });

    // Update user stats (check if document exists first)
    const userStatsRef = db.collection('user_stats').doc(userId);
    const userStatsDoc = await userStatsRef.get();
    
    if (userStatsDoc.exists) {
      await userStatsRef.update({
        certificates_earned: firebase.firestore.FieldValue.increment(1)
      });
    } else {
      await userStatsRef.set({
        certificates_earned: 1,
        courses_completed: 0,
        total_learning_hours: 0
      });
    }

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificateId: certRef.id
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ error: 'Failed to issue certificate' });
  }
});

// Update certificate
app.put('/api/certificates/:certificateId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { certificateId } = req.params;
    const { certificateUrl } = req.body;

    // Check if certificate exists
    const certDoc = await db.collection('certificates').doc(certificateId).get();
    if (!certDoc.exists) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Update only the certificate URL, keep issued_date unchanged
    await db.collection('certificates').doc(certificateId).update({
      certificate_url: certificateUrl || null
    });

    res.json({ message: 'Certificate updated successfully' });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ error: 'Failed to update certificate' });
  }
});

// Delete certificate (admin only)
app.delete('/api/certificates/:certificateId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { certificateId } = req.params;

    // Get certificate details before deletion
    const certificateDoc = await db.collection('certificates').doc(certificateId).get();

    if (!certificateDoc.exists) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = certificateDoc.data();

    // Delete certificate
    await db.collection('certificates').doc(certificateId).delete();

    // Update user stats (check if document exists first)
    const userStatsRef = db.collection('user_stats').doc(certificate.user_id);
    const userStatsDoc = await userStatsRef.get();
    
    if (userStatsDoc.exists) {
      const currentCount = userStatsDoc.data().certificates_earned || 0;
      if (currentCount > 0) {
        await userStatsRef.update({
          certificates_earned: firebase.firestore.FieldValue.increment(-1)
        });
      }
    }

    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

// ==================== RESOURCES SECTION ROUTES ====================

const getDefaultResources = (accountType) => {
  const allResources = [
    // ... (keep the hardcoded array as is)
  ];

  return allResources.filter(resource =>
    resource.allowedAccountTypes.includes(accountType)
  );
};

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user stats
app.get('/api/user/stats', authenticateToken, async (req, res) => {
  try {
    const statsDoc = await db.collection('user_stats').doc(req.user.id).get();

    let stats;
    if (!statsDoc.exists) {
      // Create default stats if none exist
      await db.collection('user_stats').doc(req.user.id).set({
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0
      });

      stats = {
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0
      };
    } else {
      stats = statsDoc.data();
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get resources
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const resources = getDefaultResources(req.user.account_type);
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download resource
app.get('/api/resources/:id/download', authenticateToken, async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const resources = getDefaultResources(req.user.account_type);
    const resource = resources.find(r => r.id === resourceId);

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (resource.type === 'tool') {
      return res.status(400).json({ error: 'Cannot download external tools' });
    }

    // Log the download
    await db.collection('download_logs').add({
      user_id: req.user.id,
      resource_id: resourceId,
      resource_name: resource.title
    });

    // Create a mock file buffer for download
    const fileExtension = resource.type === 'excel' ? 'xlsx' : 'pdf';
    const filename = `${resource.title}.${fileExtension}`;

    // Mock file content
    const mockContent = `Mock ${resource.type.toUpperCase()} content for: ${resource.title}`;
    const buffer = Buffer.from(mockContent);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get enrolled courses
app.get('/api/courses/enrolled', authenticateToken, async (req, res) => {
  try {
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', req.user.id).where('status', '==', 'active').orderBy('enrollment_date', 'desc').get();

    const courses = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const c = courseDoc.data();
      courses.push({
        id: doc.id,
        title: c.title,
        category: c.category,
        difficulty_level: c.difficulty_level,
        progress: e.progress,
        isEnrolled: true
      });
    }

    res.json(courses);
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== INTERNSHIPS SECTION ROUTES ====================

// GET /api/internships - Fetch all internships
app.get('/api/internships', async (req, res) => {
  try {
    const internshipsSnap = await db.collection('internships').orderBy('posted_at', 'desc').get();

    const internships = internshipsSnap.docs.map(doc => {
      const i = doc.data();
      return {
        id: doc.id,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: JSON.parse(i.requirements || '[]'),
        benefits: JSON.parse(i.benefits || '[]'),
        posted_at: i.posted_at,
        applications_count: i.applications_count,
        spots_available: i.spots_available
      };
    });

    res.json(internships);
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ message: 'Internal server error while fetching internships.' });
  }
});

// GET /api/user/internship-applications - Fetch applications for the authenticated user
app.get('/api/user/internship-applications', authenticateToken, async (req, res) => {
  const userId = req.user.id; 

  if (!userId) {
    return res.status(400).json({ message: 'User ID not found in token.' });
  }

  try {
    const applicationsSnap = await db.collection('internship_submissions').where('user_id', '==', userId).orderBy('submitted_at', 'desc').get();

    const parsedApplications = [];
    for (const doc of applicationsSnap.docs) {
      const app = doc.data();
      const internshipDoc = await db.collection('internships').doc(app.internship_id).get();
      const i = internshipDoc.data();
      parsedApplications.push({
        id: doc.id,
        internship_id: app.internship_id,
        status: app.status,
        submitted_at: app.submitted_at,
        resume_url: app.resume_url,
        cover_letter: app.cover_letter,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: JSON.parse(i.requirements || '[]'),
        benefits: JSON.parse(i.benefits || '[]'),
        applications_count: i.applications_count,
        spots_available: i.spots_available,
        internship_posted_at: i.posted_at
      });
    }

    res.json(parsedApplications);
  } catch (error) {
    console.error('Error fetching user internship applications:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// POST /api/internships/:id/apply - Apply for an internship
app.post('/api/internships/:id/apply', authenticateToken, async (req, res) => {
  const { id: internshipId } = req.params;
  const { full_name, email, phone, resume_url, cover_letter } = req.body;
  const userId = req.user.id;

  if (!full_name || !email || !resume_url) {
    return res.status(400).json({ message: 'Full name, email, and resume link are required.' });
  }

  try {
    const internshipDoc = await db.collection('internships').doc(internshipId).get();

    if (!internshipDoc.exists) {
      return res.status(404).json({ message: 'Internship not found.' });
    }

    const internship = internshipDoc.data();

    if (internship.spots_available <= 0) {
      return res.status(400).json({ message: 'No available spots left for this internship.' });
    }

    const existingApplication = await db.collection('internship_submissions').where('internship_id', '==', internshipId).where('user_id', '==', userId).get();
    if (!existingApplication.empty) {
      return res.status(409).json({ message: 'You have already applied for this internship.' });
    }

    const submissionRef = db.collection('internship_submissions').doc();
    await submissionRef.set({
      internship_id: internshipId,
      user_id: userId,
      full_name,
      email,
      phone: phone || null,
      resume_url,
      cover_letter: cover_letter || null,
      submitted_at: firebase.firestore.Timestamp.now(),
      status: 'pending'
    });

    await db.collection('internships').doc(internshipId).update({
      spots_available: firebase.firestore.FieldValue.increment(-1),
      applications_count: firebase.firestore.FieldValue.increment(1)
    });

    res.status(201).json({ message: 'Internship application submitted successfully!' });
  } catch (error) {
    console.error('Error submitting internship application:', error);
    res.status(500).json({ message: 'Internal server error during application submission.' });
  }
});

// ==================== ADMIN INTERNSHIP MANAGEMENT ROUTES ====================

// GET /api/admin/internships - Fetch all internships for admin management
app.get('/api/admin/internships', authenticateToken, async (req, res) => {
  try {
    const internshipsSnap = await db.collection('internships').orderBy('posted_at', 'desc').get();

    const internships = internshipsSnap.docs.map(doc => {
      const i = doc.data();
      return {
        id: doc.id,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: JSON.parse(i.requirements || '[]'),
        benefits: JSON.parse(i.benefits || '[]'),
        posted_at: i.posted_at,
        applications_count: i.applications_count || 0,
        spots_available: i.spots_available || 0
      };
    });

    res.json(internships);
  } catch (error) {
    console.error('Error fetching internships for admin:', error);
    res.status(500).json({ error: 'Internal server error while fetching internships.' });
  }
});

// ==================== ADMIN INTERNSHIP APPLICATION ROUTES ====================

app.get('/api/admin/internships/applications', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching all internship applications...');
    
    const applicationsSnap = await db.collection('internship_submissions')
      .orderBy('submitted_at', 'desc')
      .get();

    console.log(`Found ${applicationsSnap.docs.length} applications`);

    const applications = [];
    
    for (const doc of applicationsSnap.docs) {
      const app = doc.data();
      
      // Fetch internship details - handle case where internship may have been deleted
      let internshipTitle = 'Deleted Internship';
      let internshipCompany = 'N/A';
      
      try {
        const internshipDoc = await db.collection('internships').doc(app.internship_id).get();
        
        if (internshipDoc.exists) {
          const internship = internshipDoc.data();
          internshipTitle = internship?.title || 'Unknown';
          internshipCompany = internship?.company || 'Unknown';
        } else {
          console.warn(`Internship ${app.internship_id} not found for application ${doc.id}`);
        }
      } catch (internshipError) {
        console.error(`Error fetching internship ${app.internship_id}:`, internshipError);
        // Continue with default values
      }

      applications.push({
        id: doc.id,
        internship_id: app.internship_id,
        internship_title: internshipTitle,
        internship_company: internshipCompany,
        user_id: app.user_id,
        full_name: app.full_name,
        email: app.email,
        phone: app.phone || null,
        resume_url: app.resume_url,
        cover_letter: app.cover_letter || null,
        status: app.status || 'pending',
        submitted_at: app.submitted_at
      });
    }

    console.log(`Returning ${applications.length} applications`);
    res.json(applications);
  } catch (error) {
    console.error('Error fetching all internship applications:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching applications.',
      details: error.message 
    });
  }
});

app.patch('/api/admin/internships/applications/:applicationId/status', authenticateToken, async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
  
  if (!status || !validStatuses.includes(status.toLowerCase())) {
    return res.status(400).json({ error: 'Valid status is required (pending, reviewed, accepted, rejected).' });
  }

  try {
    const applicationRef = db.collection('internship_submissions').doc(applicationId);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    await applicationRef.update({
      status: status.toLowerCase()
    });

    res.json({ 
      message: 'Application status updated successfully',
      status: status.toLowerCase()
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Internal server error while updating application status.' });
  }
});


//===================== ADMIN INTERNSHIP MANAGEMENT ROUTES ====================

app.get('/api/admin/internships/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const internshipDoc = await db.collection('internships').doc(id).get();

    if (!internshipDoc.exists) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    const i = internshipDoc.data();
    const internship = {
      id: internshipDoc.id,
      title: i.title,
      company: i.company,
      location: i.location,
      duration: i.duration,
      type: i.type,
      level: i.level,
      description: i.description,
      requirements: JSON.parse(i.requirements || '[]'),
      benefits: JSON.parse(i.benefits || '[]'),
      posted_at: i.posted_at,
      applications_count: i.applications_count || 0,
      spots_available: i.spots_available || 0
    };

    res.json(internship);
  } catch (error) {
    console.error('Error fetching internship:', error);
    res.status(500).json({ error: 'Internal server error while fetching internship.' });
  }
});

// POST /api/admin/internships - Create new internship
app.post('/api/admin/internships', authenticateToken, async (req, res) => {
  const {
    title,
    company,
    location,
    duration,
    type,
    level,
    description,
    requirements,
    benefits,
    spots_available
  } = req.body;

  // Validation
  if (!title || !company || !location || !duration || !type || !level || !description) {
    return res.status(400).json({ error: 'All required fields must be provided.' });
  }

  if (!requirements || !benefits) {
    return res.status(400).json({ error: 'Requirements and benefits are required.' });
  }

  if (spots_available === undefined || spots_available < 0) {
    return res.status(400).json({ error: 'Valid spots_available is required.' });
  }

  try {
    const internshipRef = db.collection('internships').doc();
    
    await internshipRef.set({
      title,
      company,
      location,
      duration,
      type,
      level,
      description,
      requirements: typeof requirements === 'string' ? requirements : JSON.stringify(requirements),
      benefits: typeof benefits === 'string' ? benefits : JSON.stringify(benefits),
      spots_available: parseInt(spots_available),
      applications_count: 0,
      posted_at: firebase.firestore.Timestamp.now()
    });

    const newInternship = await internshipRef.get();
    const i = newInternship.data();
    
    res.status(201).json({
      message: 'Internship created successfully',
      internship: {
        id: newInternship.id,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: JSON.parse(i.requirements),
        benefits: JSON.parse(i.benefits),
        posted_at: i.posted_at,
        applications_count: i.applications_count,
        spots_available: i.spots_available
      }
    });
  } catch (error) {
    console.error('Error creating internship:', error);
    res.status(500).json({ error: 'Internal server error while creating internship.' });
  }
});


app.put('/api/admin/internships/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    company,
    location,
    duration,
    type,
    level,
    description,
    requirements,
    benefits,
    spots_available,
    applications_count
  } = req.body;

  try {
    const internshipRef = db.collection('internships').doc(id);
    const internshipDoc = await internshipRef.get();

    if (!internshipDoc.exists) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (company !== undefined) updateData.company = company;
    if (location !== undefined) updateData.location = location;
    if (duration !== undefined) updateData.duration = duration;
    if (type !== undefined) updateData.type = type;
    if (level !== undefined) updateData.level = level;
    if (description !== undefined) updateData.description = description;
    if (requirements !== undefined) {
      updateData.requirements = typeof requirements === 'string' ? requirements : JSON.stringify(requirements);
    }
    if (benefits !== undefined) {
      updateData.benefits = typeof benefits === 'string' ? benefits : JSON.stringify(benefits);
    }
    if (spots_available !== undefined) updateData.spots_available = parseInt(spots_available);
    if (applications_count !== undefined) updateData.applications_count = parseInt(applications_count);

    await internshipRef.update(updateData);

    const updatedDoc = await internshipRef.get();
    const i = updatedDoc.data();

    res.json({
      message: 'Internship updated successfully',
      internship: {
        id: updatedDoc.id,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: JSON.parse(i.requirements),
        benefits: JSON.parse(i.benefits),
        posted_at: i.posted_at,
        applications_count: i.applications_count,
        spots_available: i.spots_available
      }
    });
  } catch (error) {
    console.error('Error updating internship:', error);
    res.status(500).json({ error: 'Internal server error while updating internship.' });
  }
});


app.delete('/api/admin/internships/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const internshipRef = db.collection('internships').doc(id);
    const internshipDoc = await internshipRef.get();

    if (!internshipDoc.exists) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    // Optional: Check if there are any applications before deletion
    const applicationsSnap = await db.collection('internship_submissions')
      .where('internship_id', '==', id)
      .limit(1)
      .get();

    if (!applicationsSnap.empty) {
      // You can choose to prevent deletion or cascade delete
      // For now, we'll allow deletion but you might want to handle this differently
      console.warn(`Deleting internship ${id} which has ${applicationsSnap.size} applications`);
    }

    await internshipRef.delete();

    res.json({ message: 'Internship deleted successfully' });
  } catch (error) {
    console.error('Error deleting internship:', error);
    res.status(500).json({ error: 'Internal server error while deleting internship.' });
  }
});

// ==================== ADMIN INTERNSHIP CRUD ROUTES ====================

// GET /api/admin/internships - Fetch all internships for admin management
app.get('/api/admin/internships', authenticateToken, async (req, res) => {
  try {
    const internshipsSnap = await db.collection('internships').orderBy('posted_at', 'desc').get();

    const internships = internshipsSnap.docs.map(doc => {
      const i = doc.data();
      return {
        id: doc.id,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: JSON.parse(i.requirements || '[]'),
        benefits: JSON.parse(i.benefits || '[]'),
        posted_at: i.posted_at,
        applications_count: i.applications_count || 0,
        spots_available: i.spots_available || 0
      };
    });

    res.json(internships);
  } catch (error) {
    console.error('Error fetching internships for admin:', error);
    res.status(500).json({ error: 'Internal server error while fetching internships.' });
  }
});

app.get('/api/admin/internships/:id/applications', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Fetching applications for internship: ${id}`);
    
    const internshipRef = db.collection('internships').doc(id);
    const internshipDoc = await internshipRef.get();

    if (!internshipDoc.exists) {
      console.log(`Internship ${id} not found`);
      return res.status(404).json({ error: 'Internship not found.' });
    }

    const applicationsSnap = await db.collection('internship_submissions')
      .where('internship_id', '==', id)
      .orderBy('submitted_at', 'desc')
      .get();

    const applications = applicationsSnap.docs.map(doc => {
      const app = doc.data();
      return {
        id: doc.id,
        user_id: app.user_id,
        full_name: app.full_name,
        email: app.email,
        phone: app.phone || null,
        resume_url: app.resume_url,
        cover_letter: app.cover_letter || null,
        status: app.status || 'pending',
        submitted_at: app.submitted_at
      };
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching internship applications:', error);
    res.status(500).json({ error: 'Internal server error while fetching applications.' });
  }
});

app.get('/api/admin/internships/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const internshipDoc = await db.collection('internships').doc(id).get();

    if (!internshipDoc.exists) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    const i = internshipDoc.data();
    const internship = {
      id: internshipDoc.id,
      title: i.title,
      company: i.company,
      location: i.location,
      duration: i.duration,
      type: i.type,
      level: i.level,
      description: i.description,
      requirements: JSON.parse(i.requirements || '[]'),
      benefits: JSON.parse(i.benefits || '[]'),
      posted_at: i.posted_at,
      applications_count: i.applications_count || 0,
      spots_available: i.spots_available || 0
    };

    res.json(internship);
  } catch (error) {
    console.error('Error fetching internship:', error);
    res.status(500).json({ error: 'Internal server error while fetching internship.' });
  }
});

// POST /api/admin/internships - Create new internship
app.post('/api/admin/internships', authenticateToken, async (req, res) => {
  const {
    title,
    company,
    location,
    duration,
    type,
    level,
    description,
    requirements,
    benefits,
    spots_available
  } = req.body;

  // Validation
  if (!title || !company || !location || !duration || !type || !level || !description) {
    return res.status(400).json({ error: 'All required fields must be provided.' });
  }

  if (!requirements || !benefits) {
    return res.status(400).json({ error: 'Requirements and benefits are required.' });
  }

  if (spots_available === undefined || spots_available < 0) {
    return res.status(400).json({ error: 'Valid spots_available is required.' });
  }

  try {
    const internshipRef = db.collection('internships').doc();
    
    await internshipRef.set({
      title,
      company,
      location,
      duration,
      type,
      level,
      description,
      requirements: typeof requirements === 'string' ? requirements : JSON.stringify(requirements),
      benefits: typeof benefits === 'string' ? benefits : JSON.stringify(benefits),
      spots_available: parseInt(spots_available),
      applications_count: 0,
      posted_at: firebase.firestore.Timestamp.now()
    });

    const newInternship = await internshipRef.get();
    const i = newInternship.data();
    
    res.status(201).json({
      message: 'Internship created successfully',
      internship: {
        id: newInternship.id,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: JSON.parse(i.requirements),
        benefits: JSON.parse(i.benefits),
        posted_at: i.posted_at,
        applications_count: i.applications_count,
        spots_available: i.spots_available
      }
    });
  } catch (error) {
    console.error('Error creating internship:', error);
    res.status(500).json({ error: 'Internal server error while creating internship.' });
  }
});

app.put('/api/admin/internships/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    company,
    location,
    duration,
    type,
    level,
    description,
    requirements,
    benefits,
    spots_available,
    applications_count
  } = req.body;

  try {
    const internshipRef = db.collection('internships').doc(id);
    const internshipDoc = await internshipRef.get();

    if (!internshipDoc.exists) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (company !== undefined) updateData.company = company;
    if (location !== undefined) updateData.location = location;
    if (duration !== undefined) updateData.duration = duration;
    if (type !== undefined) updateData.type = type;
    if (level !== undefined) updateData.level = level;
    if (description !== undefined) updateData.description = description;
    if (requirements !== undefined) {
      updateData.requirements = typeof requirements === 'string' ? requirements : JSON.stringify(requirements);
    }
    if (benefits !== undefined) {
      updateData.benefits = typeof benefits === 'string' ? benefits : JSON.stringify(benefits);
    }
    if (spots_available !== undefined) updateData.spots_available = parseInt(spots_available);
    if (applications_count !== undefined) updateData.applications_count = parseInt(applications_count);

    await internshipRef.update(updateData);

    const updatedDoc = await internshipRef.get();
    const i = updatedDoc.data();

    res.json({
      message: 'Internship updated successfully',
      internship: {
        id: updatedDoc.id,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: JSON.parse(i.requirements),
        benefits: JSON.parse(i.benefits),
        posted_at: i.posted_at,
        applications_count: i.applications_count,
        spots_available: i.spots_available
      }
    });
  } catch (error) {
    console.error('Error updating internship:', error);
    res.status(500).json({ error: 'Internal server error while updating internship.' });
  }
});

app.delete('/api/admin/internships/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const internshipRef = db.collection('internships').doc(id);
    const internshipDoc = await internshipRef.get();

    if (!internshipDoc.exists) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    // Optional: Check if there are any applications before deletion
    const applicationsSnap = await db.collection('internship_submissions')
      .where('internship_id', '==', id)
      .limit(1)
      .get();

    if (!applicationsSnap.empty) {
      // You can choose to prevent deletion or cascade delete
      // For now, we'll allow deletion but you might want to handle this differently
      console.warn(`Deleting internship ${id} which has applications`);
    }

    await internshipRef.delete();

    res.json({ message: 'Internship deleted successfully' });
  } catch (error) {
    console.error('Error deleting internship:', error);
    res.status(500).json({ error: 'Internal server error while deleting internship.' });
  }
});


// ==================== SERVICES ROUTES ====================

// Get service categories
app.get('/api/services/categories', async (req, res) => {
  try {
    const categoriesSnap = await db.collection('service_categories').where('is_active', '==', true).orderBy('name').get();

    const categoriesWithSubs = [];
    for (const doc of categoriesSnap.docs) {
      const category = doc.data();
      const subcategoriesSnap = await db.collection('service_subcategories').where('category_id', '==', doc.id).where('is_active', '==', true).orderBy('name').get();
      categoriesWithSubs.push({
        id: doc.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        subcategories: subcategoriesSnap.docs.map(subDoc => {
          const sub = subDoc.data();
          return {
            id: subDoc.id,
            categoryId: sub.category_id,
            name: sub.name,
            description: sub.description,
            basePrice: sub.base_price
          };
        })
      });
    }

    res.json(categoriesWithSubs);

  } catch (error) {
    console.error('Get service categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit service request
app.post('/api/services/requests', authenticateToken, async (req, res) => {
  try {
    const {
      subcategoryId, fullName, email, phone, company, website,
      projectDetails, budgetRange, timeline, contactMethod, additionalRequirements
    } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!subcategoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check if subcategory exists
    const subcategoryDoc = await db.collection('service_subcategories').doc(subcategoryId).get();

    if (!subcategoryDoc.exists || !subcategoryDoc.data().is_active) {
      return res.status(404).json({ error: 'Service subcategory not found' });
    }

    // Create service request
    const requestRef = db.collection('service_requests').doc();
    await requestRef.set({
      user_id: userId,
      subcategory_id: subcategoryId,
      full_name: fullName,
      email,
      phone,
      company,
      website,
      project_details: projectDetails,
      budget_range: budgetRange,
      timeline,
      contact_method: contactMethod,
      additional_requirements: additionalRequirements,
      created_at: firebase.firestore.Timestamp.now()
    });

    res.status(201).json({
      message: 'Service request submitted successfully',
      requestId: requestRef.id
    });

  } catch (error) {
    console.error('Service request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's service requests
app.get('/api/services/my-requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const requestsSnap = await db.collection('service_requests').where('user_id', '==', userId).orderBy('created_at', 'desc').get();

    const requests = [];
    for (const doc of requestsSnap.docs) {
      const sr = doc.data();
      const ssDoc = await db.collection('service_subcategories').doc(sr.subcategory_id).get();
      const ss = ssDoc.data();
      const scDoc = await db.collection('service_categories').doc(ss.category_id).get();
      const sc = scDoc.data();
      requests.push({
        id: doc.id,
        userId: sr.user_id,
        subcategoryId: sr.subcategory_id,
        fullName: sr.full_name,
        email: sr.email,
        phone: sr.phone,
        company: sr.company,
        website: sr.website,
        projectDetails: sr.project_details,
        budgetRange: sr.budget_range,
        timeline: sr.timeline,
        contactMethod: sr.contact_method,
        additionalRequirements: sr.additional_requirements,
        status: sr.status,
        createdAt: sr.created_at,
        updatedAt: sr.updated_at,
        categoryName: sc.name,
        subcategoryName: ss.name
      });
    }

    res.json(requests);
  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ADMIN SERVICE SUBCATEGORIES AS SERVICES ====================

// GET all service subcategories formatted as services (admin only)
app.get('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const subcategoriesSnap = await db.collection('service_subcategories')
      .orderBy('created_at', 'desc')
      .get();

    const services = [];
    
    for (const doc of subcategoriesSnap.docs) {
      const sub = doc.data();
      
      // Get category name
      let categoryName = 'Unknown Category';
      if (sub.category_id) {
        try {
          const categoryDoc = await db.collection('service_categories').doc(sub.category_id).get();
          if (categoryDoc.exists) {
            categoryName = categoryDoc.data().name;
          }
        } catch (err) {
          console.error('Error fetching category:', err);
        }
      }
      
      services.push({
        id: doc.id,
        name: sub.name,
        category_id: sub.category_id,
        category_name: categoryName,
        description: sub.description || '',
        price: sub.base_price || 0,
        duration: sub.duration || 'Variable',
        rating: sub.rating || 0,           // ✅ Read from Firestore
        reviews: sub.reviews || 0,         // ✅ Read from Firestore
        features: sub.features || [],      // ✅ Read from Firestore
        popular: sub.popular || false,     // ✅ Read from Firestore
        is_active: sub.is_active || true,
        created_at: sub.created_at,
        updated_at: sub.updated_at
      });
    }

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ 
      error: 'Failed to fetch services',
      details: error.message 
    });
  }
});

// POST create new service subcategory (admin only)
app.post('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      category_id,
      description,
      price,
      duration,
      features,
      rating,      // NEW
      reviews,     // NEW
      popular,
      is_active
    } = req.body;

    // Validate required fields
    if (!name || !category_id || !price) {
      return res.status(400).json({ 
        error: 'Name, category, and price are required' 
      });
    }

    // Check if category exists
    const categoryDoc = await db.collection('service_categories').doc(category_id).get();
    if (!categoryDoc.exists) {
      return res.status(400).json({ error: 'Category not found' });
    }

    // Create subcategory
    const subcategoryRef = db.collection('service_subcategories').doc();
    await subcategoryRef.set({
      name: name.trim(),
      category_id,
      description: description || '',
      base_price: parseFloat(price),
      duration: duration || 'Variable',
      features: Array.isArray(features) ? features : [],
      rating: parseFloat(rating) || 0,      // NEW
      reviews: parseInt(reviews) || 0,       // NEW
      popular: popular === true || popular === '1',
      is_active: is_active === true || is_active === '1',
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      message: 'Service created successfully',
      serviceId: subcategoryRef.id
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ 
      error: 'Failed to create service',
      details: error.message 
    });
  }
});

// PUT update service subcategory (admin only)
app.put('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category_id,
      description,
      price,
      duration,
      features,
      rating,      // NEW
      reviews,     // NEW
      popular,
      is_active
    } = req.body;

    // Check if exists
    const subcategoryDoc = await db.collection('service_subcategories').doc(id).get();
    if (!subcategoryDoc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Update subcategory
    await db.collection('service_subcategories').doc(id).update({
      name: name.trim(),
      category_id,
      description: description || '',
      base_price: parseFloat(price),
      duration: duration || 'Variable',
      features: Array.isArray(features) ? features : [],
      rating: parseFloat(rating) || 0,      // NEW
      reviews: parseInt(reviews) || 0,       // NEW
      popular: popular === true || popular === '1',
      is_active: is_active === true || is_active === '1',
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ 
      error: 'Failed to update service',
      details: error.message 
    });
  }
});

// DELETE service subcategory (admin only)
app.delete('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if exists
    const subcategoryDoc = await db.collection('service_subcategories').doc(id).get();
    if (!subcategoryDoc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Delete subcategory
    await db.collection('service_subcategories').doc(id).delete();

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ 
      error: 'Failed to delete service',
      details: error.message 
    });
  }
});

// ==================== ADMIN DASHBOARD ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    // Fixed query - using true instead of 1 for boolean comparison
    const usersSnap = await db.collection('users').where('is_active', '==', true).get();
    const totalUsers = usersSnap.size;

    // Fixed query - using true instead of 1
    const coursesSnap = await db.collection('courses').where('is_active', '==', true).get();
    const totalCourses = coursesSnap.size;

    const enrollmentsSnap = await db.collection('enrollments').get();
    const totalEnrollments = enrollmentsSnap.size;

    // Calculate revenue with proper error handling
    let totalRevenue = 0;
    for (const doc of enrollmentsSnap.docs) {
      try {
        const e = doc.data();
        if (e.status === 'completed' && e.course_id) {
          const courseDoc = await db.collection('courses').doc(e.course_id).get();
          if (courseDoc.exists) {
            const courseData = courseDoc.data();
            totalRevenue += parseFloat(courseData.price || '0');
          }
        }
      } catch (revenueError) {
        console.error('Error calculating revenue for enrollment:', doc.id, revenueError);
        // Continue with other enrollments
      }
    }

    const sevenDaysAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
    const contactsSnap = await db.collection('contact_messages').where('created_at', '>=', sevenDaysAgo).get();
    const pendingContacts = contactsSnap.size;

    const serviceRequestsSnap = await db.collection('service_requests').where('status', '==', 'pending').get();
    const pendingServiceRequests = serviceRequestsSnap.size;

    // Return with success flag and consistent formatting
    res.json({
      success: true,
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue: totalRevenue.toString(),
      pendingContacts,
      pendingServiceRequests
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard stats', 
      details: error.message 
    });
  }
});

// Recent Users
app.get('/api/admin/recent-users', authenticateToken, async (req, res) => {
  try {
    // Fixed query - using true instead of 1
    const usersSnap = await db.collection('users')
      .where('is_active', '==', true)
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();

    const users = [];
    
    usersSnap.forEach(doc => {
      try {
        const u = doc.data();
        let joinDate = 'N/A';
        
        // Handle different timestamp formats safely
        if (u.created_at) {
          if (u.created_at.toDate) {
            // Firestore timestamp
            joinDate = u.created_at.toDate().toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          } else if (u.created_at instanceof Date) {
            // JavaScript Date
            joinDate = u.created_at.toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          } else if (typeof u.created_at === 'string') {
            // ISO string
            joinDate = new Date(u.created_at).toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          }
        }
        
        users.push({
          id: doc.id,
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          email: u.email || '',
          account_type: u.account_type || 'student',
          join_date: joinDate
        });
      } catch (userError) {
        console.error('Error processing user:', doc.id, userError);
        // Continue with other users
      }
    });

    // Wrap in object with success flag as frontend expects
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch recent users', 
      details: error.message 
    });
  }
});

// Recent Enrollments
app.get('/api/admin/recent-enrollments', authenticateToken, async (req, res) => {
  try {
    // Use created_at as fallback if enrollment_date doesn't exist
    const enrollmentsSnap = await db.collection('enrollments')
      .orderBy('enrollment_date', 'desc')
      .limit(5)
      .get();

    const enrollments = [];
    
    for (const doc of enrollmentsSnap.docs) {
      try {
        const e = doc.data();
        
        // Get user data with error handling
        let userName = 'Unknown User';
        if (e.user_id) {
          try {
            const userDoc = await db.collection('users').doc(e.user_id).get();
            if (userDoc.exists) {
              const u = userDoc.data();
              userName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown User';
            }
          } catch (userError) {
            console.error('Error fetching user for enrollment:', e.user_id, userError);
          }
        }
        
        // Get course data with error handling
        let courseName = 'Unknown Course';
        if (e.course_id) {
          try {
            const courseDoc = await db.collection('courses').doc(e.course_id).get();
            if (courseDoc.exists) {
              const c = courseDoc.data();
              courseName = c.title || 'Unknown Course';
            }
          } catch (courseError) {
            console.error('Error fetching course for enrollment:', e.course_id, courseError);
          }
        }
        
        // Format date safely
        let enrollmentDate = 'N/A';
        const dateField = e.enrollment_date || e.created_at;
        if (dateField) {
          if (dateField.toDate) {
            // Firestore timestamp
            enrollmentDate = dateField.toDate().toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          } else if (dateField instanceof Date) {
            // JavaScript Date
            enrollmentDate = dateField.toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          } else if (typeof dateField === 'string') {
            // ISO string
            enrollmentDate = new Date(dateField).toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          }
        }
        
        enrollments.push({
          id: doc.id,
          user_name: userName,
          course_name: courseName,
          date: enrollmentDate,
          status: e.status || 'active'
        });
      } catch (enrollmentError) {
        console.error('Error processing enrollment:', doc.id, enrollmentError);
        // Continue with other enrollments
      }
    }

    // Wrap in object with success flag as frontend expects
    res.json({
      success: true,
      enrollments: enrollments
    });
  } catch (error) {
    console.error('Error fetching recent enrollments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch recent enrollments', 
      details: error.message 
    });
  }
});

// Service Requests - MISSING ENDPOINT IMPLEMENTATION
app.get('/api/admin/service-requests', authenticateToken, async (req, res) => {
  try {
    const requestsSnap = await db.collection('service_requests')
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();

    const requests = [];
    
    requestsSnap.forEach(doc => {
      try {
        const reqData = doc.data();
        
        // Format date safely
        let requestDate = 'N/A';
        const dateField = reqData.created_at || reqData.date;
        if (dateField) {
          if (dateField.toDate) {
            // Firestore timestamp
            requestDate = dateField.toDate().toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          } else if (dateField instanceof Date) {
            // JavaScript Date
            requestDate = dateField.toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          } else if (typeof dateField === 'string') {
            // ISO string
            requestDate = new Date(dateField).toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          }
        }
        
        // Get name from various possible fields
        const name = reqData.name || 
                    `${reqData.user_first_name || ''} ${reqData.user_last_name || ''}`.trim() || 
                    reqData.user_name ||
                    'Unknown';
        
        requests.push({
          id: doc.id,
          name: name,
          service: reqData.service || reqData.service_type || 'General Inquiry',
          date: requestDate,
          status: reqData.status || 'pending',
          email: reqData.email || '',
          phone: reqData.phone || '',
          company: reqData.company || '',
          website: reqData.website || '',
          project_details: reqData.project_details || reqData.details || reqData.message || '',
          budget_range: reqData.budget_range || reqData.budget || '',
          timeline: reqData.timeline || '',
          contact_method: reqData.contact_method || 'email',
          additional_requirements: reqData.additional_requirements || reqData.requirements || ''
        });
      } catch (requestError) {
        console.error('Error processing service request:', doc.id, requestError);
        // Continue with other requests
      }
    });

    // Wrap in object with success flag as frontend expects
    res.json({
      success: true,
      requests: requests
    });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch service requests', 
      details: error.message 
    });
  }
});

// ==================== CONTACT ROUTES ====================

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, phone, company, message } = req.body;

  try {
    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        error: 'First name, last name, email, and message are required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Insert contact form data into database
    const contactRef = db.collection('contact_messages').doc();
    await contactRef.set({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      company: company || null,
      message: message.trim(),
      created_at: firebase.firestore.Timestamp.now()
    });

    console.log('Contact message saved successfully:', {
      id: contactRef.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim()
    });

    res.status(201).json({
      message: 'Contact message sent successfully',
      contactId: contactRef.id
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ANALYTICS ROUTES ====================

// Get analytics data (admin only)
app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sixMonthsAgo = new Date(new Date().getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

    // User growth data (last 6 months)
    const usersSnap = await db.collection('users').where('created_at', '>=', sixMonthsAgo).get();
    const userGrowth = {};
    usersSnap.docs.forEach(doc => {
      const created = doc.data().created_at.toDate();
      const month = created.toISOString().slice(0, 7);
      userGrowth[month] = (userGrowth[month] || 0) + 1;
    });

    // Course enrollment data
    const coursesSnap = await db.collection('courses').where('is_active', '==', true).get();
    const courseEnrollments = [];
    for (const doc of coursesSnap.docs) {
      const enrollmentsSnap = await db.collection('enrollments').where('course_id', '==', doc.id).get();
      courseEnrollments.push({
        title: doc.data().title,
        enrollments: enrollmentsSnap.size
      });
    }
    courseEnrollments.sort((a, b) => b.enrollments - a.enrollments);
    const top10 = courseEnrollments.slice(0, 10);

    // Revenue by month (mock calculation)
    const enrollmentsSnap = await db.collection('enrollments').where('enrollment_date', '>=', sixMonthsAgo).get();
    const revenueData = {};
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const month = e.enrollment_date.toDate().toISOString().slice(0, 7);
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const revenue = courseDoc.data().price;
      revenueData[month] = (revenueData[month] || 0) + revenue;
    }

    res.json({
      userGrowth: Object.keys(userGrowth).map(month => ({ month, count: userGrowth[month] })),
      courseEnrollments: top10,
      revenueData: Object.keys(revenueData).map(month => ({ month, revenue: revenueData[month] }))
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ADMIN USER MANAGEMENT ROUTES ====================

// GET /api/admin/users - Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching users for admin');
    
    const { search, accountType, status } = req.query;
    
    let query = db.collection('users');

    // Apply filters
    if (accountType && accountType !== 'all') {
      query = query.where('account_type', '==', accountType);
    }

    if (status && status !== 'all') {
      const isActive = status === 'active';
      query = query.where('is_active', '==', isActive);
    }

    const snapshot = await query.get();
    
    let users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        account_type: userData.account_type || 'student',
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        company: userData.company || '',
        website: userData.website || '',
        bio: userData.bio || '',
        created_at: userData.created_at ? userData.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: userData.updated_at ? userData.updated_at.toDate().toISOString() : new Date().toISOString()
      });
    });

    // Apply search filter
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase().trim();
      users = users.filter(user => 
        (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower))
      );
    }

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching users' 
    });
  }
});

// POST /api/admin/users - Create new user
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Creating new user:', req.body);
    
    let { firstName, lastName, email, phone, password, accountType, isActive, company, website, bio } = req.body;

    // Trim inputs
    firstName = firstName ? firstName.trim() : '';
    lastName = lastName ? lastName.trim() : '';
    email = email ? email.trim().toLowerCase() : '';
    phone = phone ? phone.trim() : '';
    company = company ? company.trim() : '';
    website = website ? website.trim() : '';
    bio = bio ? bio.trim() : '';

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, email, and password are required'
      });
    }

    // Check if email exists
    const emailSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (!emailSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      password_hash: hashedPassword,
      account_type: accountType || 'student',
      is_active: isActive !== undefined ? isActive : true,
      company: company,
      website: website,
      bio: bio,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    const userRef = await db.collection('users').add(userData);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: userRef.id,
        ...userData,
        created_at: userData.created_at.toISOString(),
        updated_at: userData.updated_at.toISOString()
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating user'
    });
  }
});

// PUT /api/admin/users/:id - Update user - FIXED AND ENHANCED
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Updating user with ID:', userId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const { firstName, lastName, email, phone, accountType, isActive, company, website, bio } = req.body;
    console.log('Update payload:', req.body);

    // Check if user exists
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        console.log('User not found with ID:', userId);
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const currentUser = userDoc.data();
      console.log('Found current user:', currentUser);

      // Check email uniqueness if changed
      if (email && email !== currentUser.email) {
        const emailSnapshot = await db.collection('users')
          .where('email', '==', email.trim().toLowerCase())
          .get();
        
        if (!emailSnapshot.empty) {
          // Make sure we're not matching the same user
          const matchingUser = emailSnapshot.docs[0];
          if (matchingUser.id !== userId) {
            console.log('Email already exists for another user');
            return res.status(400).json({
              success: false,
              error: 'Email already exists'
            });
          }
        }
      }

      // Prepare update data
      const updateData = {
        first_name: firstName !== undefined ? firstName.trim() : currentUser.first_name,
        last_name: lastName !== undefined ? lastName.trim() : currentUser.last_name,
        email: email !== undefined ? email.trim().toLowerCase() : currentUser.email,
        phone: phone !== undefined ? phone : currentUser.phone,
        account_type: accountType || currentUser.account_type,
        is_active: isActive !== undefined ? isActive : currentUser.is_active,
        company: company !== undefined ? company : currentUser.company,
        website: website !== undefined ? website : currentUser.website,
        bio: bio !== undefined ? bio : currentUser.bio,
        updated_at: firebase.firestore.Timestamp.now()
      };
      console.log('Prepared update data:', updateData);

      // Update the user
      await db.collection('users').doc(userId).update(updateData);
      console.log('User updated successfully');

      // Get updated user data for response
      const updatedUserDoc = await db.collection('users').doc(userId).get();
      const updatedUser = updatedUserDoc.data();

      return res.json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: userId,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          account_type: updatedUser.account_type,
          is_active: updatedUser.is_active,
          company: updatedUser.company || '',
          website: updatedUser.website || '',
          bio: updatedUser.bio || '',
          created_at: updatedUser.created_at.toDate().toISOString(),
          updated_at: updatedUser.updated_at.toDate().toISOString()
        }
      });
    } catch (firebaseError) {
      console.error('Firebase error:', firebaseError);
      return res.status(500).json({
        success: false,
        error: 'Database error: ' + firebaseError.message
      });
    }
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while updating user: ' + error.message
    });
  }
});

// DELETE /api/admin/users/:id - Delete user (soft delete)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id || req.user.userId;

    console.log('Deleting user:', userId);

    // Prevent self-deletion
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account'
      });
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Soft delete
    await db.collection('users').doc(userId).update({
      is_active: false,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting user'
    });
  }
});

// PUT /api/admin/users/:id/password - Reset password
app.put('/api/admin/users/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;

    console.log('Resetting password for user:', userId);

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection('users').doc(userId).update({
      password_hash: hashedPassword,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while resetting password'
    });
  }
});

// Debug route to see all registered routes
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
  res.json({ routes });
});

// ==================== ADMIN DASHBOARD STATS ====================

app.get('/api/admin/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching dashboard data for admin:', req.user.email);

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    
    let activeUsers = 0;
    let studentCount = 0;
    let professionalCount = 0;
    let businessCount = 0;
    
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      if (user.is_active !== false) activeUsers++;
      
      switch(user.account_type) {
        case 'student': studentCount++; break;
        case 'professional': professionalCount++; break;
        case 'business': businessCount++; break;
      }
    });

    // Get courses (if collection exists)
    let totalCourses = 0;
    try {
      const coursesSnapshot = await db.collection('courses').get();
      totalCourses = coursesSnapshot.size;
    } catch (e) {
      console.log('Courses collection not found');
    }

    // Get enrollments (if collection exists)
    let totalEnrollments = 0;
    try {
      const enrollmentsSnapshot = await db.collection('enrollments').get();
      totalEnrollments = enrollmentsSnapshot.size;
    } catch (e) {
      console.log('Enrollments collection not found');
    }

    const stats = {
      totalUsers,
      activeUsers,
      totalCourses,
      totalEnrollments,
      usersByType: {
        student: studentCount,
        professional: professionalCount,
        business: businessCount
      }
    };

    console.log('Dashboard stats:', stats);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching dashboard data',
      details: error.message
    });
  }
});

// ==================== AUTH ROUTES ====================

// Register endpoint
app.post('/api/register', async (req, res) => {
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

// Login endpoint
app.post('/api/login', async (req, res) => {
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

    // ✅ AUTO-LINK GUEST ENROLLMENTS - ADD THIS
    try {
      const requestsSnap = await db.collection('course_enroll_requests')
        .where('email', '==', email.toLowerCase())
        .where('status', '==', 'approved')
        .where('user_id', '==', null)
        .get();

      for (const doc of requestsSnap.docs) {
        const request = doc.data();

        // Check if already enrolled
        const existingEnrollment = await db.collection('enrollments')
          .where('user_id', '==', userId)
          .where('course_id', '==', request.course_id)
          .get();

        if (existingEnrollment.empty) {
          // Create enrollment
          await db.collection('enrollments').add({
            user_id: userId,
            course_id: request.course_id,
            enrollment_date: request.created_at || firebase.firestore.Timestamp.now(),
            progress: 0,
            status: 'active',
            completion_date: null
          });
        }

        // Update request to link user_id
        await db.collection('course_enroll_requests').doc(doc.id).update({
          user_id: userId
        });
      }
    } catch (linkError) {
      console.error('Error auto-linking guest enrollments:', linkError);
    }

    // Update last login timestamp
    await db.collection('users').doc(userId).update({
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log('User logged in successfully:', { userId, email: user.email });

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
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during login' 
    });
  }
});

// ==================== USER PROFILE ENDPOINTS ====================

// Get current user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
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
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
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

    // Get updated user data
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

// Get user stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const statsDoc = await db.collection('user_stats').doc(userId).get();

    if (!statsDoc.exists) {
      // Create default stats if not exists
      const defaultStats = {
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        last_activity: new Date().toISOString()
      };
      await db.collection('user_stats').doc(userId).set(defaultStats);

      res.json({
        coursesEnrolled: 0,
        coursesCompleted: 0,
        certificatesEarned: 0,
        learningStreak: 0,
        lastActivity: new Date().toISOString()
      });
    } else {
      const userStats = statsDoc.data();
      res.json({
        coursesEnrolled: userStats.courses_enrolled || 0,
        coursesCompleted: userStats.courses_completed || 0,
        certificatesEarned: userStats.certificates_earned || 0,
        learningStreak: userStats.learning_streak || 0,
        lastActivity: userStats.last_activity || new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================== ADMIN PAYMENTS MANAGEMENT ENDPOINT ======================

app.post('/api/payments/upload-proof', authenticateToken, paymentProofUpload.single('proof'), async (req, res) => {
  try {
    const { transaction_id, payment_method, resource_id, plan, amount, user_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Payment proof file is required' });
    }

    if (!transaction_id) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Save payment record to database
    const paymentRef = db.collection('payments').doc();
    await paymentRef.set({
      user_id,
      resource_id: resource_id || null,
      plan,
      amount,
      payment_method,
      transaction_id,
      proof_file: req.file.filename,
      status: 'pending'
    });

    res.json({ 
      message: 'Payment proof uploaded successfully', 
      paymentId: paymentRef.id 
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ error: 'Failed to upload payment proof' });
  }
});

// Admin payment management endpoint
app.get('/api/admin/payments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const paymentsSnap = await db.collection('payments').orderBy('created_at', 'desc').get();

    const payments = [];
    for (const doc of paymentsSnap.docs) {
      const p = doc.data();
      const userDoc = await db.collection('users').doc(p.user_id).get();
      const u = userDoc.data();
      let resourceTitle = null;
      if (p.resource_id) {
        const resourceDoc = await db.collection('resources').doc(p.resource_id).get();
        resourceTitle = resourceDoc.data().title;
      }
      payments.push({
        id: doc.id,
        user_id: p.user_id,
        resource_id: p.resource_id,
        plan: p.plan,
        amount: p.amount,
        payment_method: p.payment_method,
        transaction_id: p.transaction_id,
        proof_file: p.proof_file,
        status: p.status,
        created_at: p.created_at,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        resource_title: resourceTitle
      });
    }

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Admin payment verification endpoint
app.put('/api/admin/payments/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.collection('payments').doc(id).update({
      status,
      verified_at: firebase.firestore.Timestamp.now()
    });

    // If payment is approved, grant access to the resource
    if (status === 'approved') {
      const paymentDoc = await db.collection('payments').doc(id).get();
      const payment = paymentDoc.data();
      
      if (payment.plan === 'individual' && payment.resource_id) {
        // Grant access to specific resource
        await db.collection('user_resources').add({
          user_id: payment.user_id,
          resource_id: payment.resource_id
        });
      } else if (payment.plan === 'premium') {
        // Upgrade user to premium
        await db.collection('users').doc(payment.user_id).update({
          subscription_plan: "premium"
        });
      }
    }

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// ==================== ADMIN ENROLLMENT MANAGEMENT ENDPOINTS ====================

// GET all enrollments (admin only)
app.get('/api/admin/enrollments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const enrollmentsSnap = await db.collection('enrollments').orderBy('enrollment_date', 'desc').get();

    const enrollments = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const userDoc = await db.collection('users').doc(e.user_id).get();
      const u = userDoc.data();
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const c = courseDoc.data();
      enrollments.push({
        id: doc.id,
        user_id: e.user_id,
        user_name: `${u.first_name} ${u.last_name}`,
        course_id: e.course_id,
        course_name: c.title,
        progress: e.progress,
        status: e.status,
        enrollment_date: e.enrollment_date,
        completion_date: e.completion_date
      });
    }

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// UPDATE enrollment (admin only)
app.put('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, completion_date } = req.body;

    await db.collection('enrollments').doc(id).update({
      status,
      progress,
      completion_date: status === 'completed' ? (completion_date || firebase.firestore.Timestamp.now()) : null
    });

    res.json({ message: 'Enrollment updated successfully' });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({ error: 'Failed to update enrollment' });
  }
});

// DELETE enrollment (admin only)
app.delete('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection('enrollments').doc(id).delete();

    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ error: 'Failed to delete enrollment' });
  }
});

// ==================== ADMIN COURSE MANAGEMENT ENDPOINTS ====================

// GET all courses (admin only)
app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const coursesSnap = await db.collection('courses').orderBy('created_at', 'desc').get();

    const courses = coursesSnap.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      description: doc.data().description,
      instructor_name: doc.data().instructor_name,
      duration_weeks: doc.data().duration_weeks,
      difficulty_level: doc.data().difficulty_level,
      category: doc.data().category,
      price: doc.data().price,
      thumbnail: doc.data().thumbnail,
      is_active: doc.data().is_active,
      created_at: doc.data().created_at,
      updated_at: doc.data().updated_at
    }));

    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// CREATE new course (admin only)
app.post('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      instructor_name,
      duration_weeks,
      difficulty_level,
      category,
      price,
      is_active
    } = req.body;

    // Validate required fields
    if (!title || !instructor_name || !duration_weeks || !difficulty_level || !category || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const courseRef = db.collection('courses').doc();
    await courseRef.set({
      title,
      description,
      instructor_name,
      duration_weeks,
      difficulty_level,
      category,
      price,
      is_active: is_active || 1,
      created_at: firebase.firestore.Timestamp.now(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.status(201).json({ 
      message: 'Course created successfully',
      courseId: courseRef.id
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// UPDATE course (admin only)
app.put('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      instructor_name,
      duration_weeks,
      difficulty_level,
      category,
      price,
      is_active
    } = req.body;

    // Validate required fields
    if (!title || !instructor_name || !duration_weeks || !difficulty_level || !category || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await db.collection('courses').doc(id).update({
      title,
      description,
      instructor_name,
      duration_weeks,
      difficulty_level,
      category,
      price,
      is_active,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE course (admin only)
app.delete('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const enrollmentsSnap = await db.collection('enrollments').where('course_id', '==', id).get();

    if (!enrollmentsSnap.empty) {
      return res.status(400).json({ error: 'Cannot delete course with active enrollments' });
    }

    await db.collection('courses').doc(id).delete();

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Upload course thumbnail
app.post('/api/admin/courses/:id/thumbnail', authenticateToken, requireAdmin, (req, res, next) => {
  // Assuming multer for thumbnail upload, similar to others. Add if needed.
  // For now, assume it's handled similarly.
  // Code omitted for brevity, add if required.
});

// ==================== ADMIN RESOURCE MANAGEMENT ENDPOINTS ====================

// GET all resources (admin only)
app.get('/api/admin/resources', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const resourcesSnap = await db.collection('resources').orderBy('created_at', 'desc').get();

    const resourcesWithParsedTypes = resourcesSnap.docs.map(doc => {
      const r = doc.data();
      return {
        id: doc.id,
        title: r.title,
        description: r.description,
        type: r.type,
        size: r.size,
        url: r.url,
        category: r.category,
        icon_name: r.icon_name,
        button_color: r.button_color,
        allowed_account_types: JSON.parse(r.allowed_account_types || '[]'),
        is_premium: r.is_premium,
        created_at: r.created_at,
        updated_at: r.updated_at
      };
    });

    res.json(resourcesWithParsedTypes);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// CREATE new resource (admin only)
app.post('/api/admin/resources', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      size,
      url,
      category,
      icon_name,
      button_color,
      allowed_account_types,
      is_premium
    } = req.body;

    // Validate required fields
    if (!title || !description || !type || !category || !icon_name || !button_color || !allowed_account_types) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure allowed_account_types is an array and convert to JSON string
    const accountTypesArray = Array.isArray(allowed_account_types) 
      ? allowed_account_types 
      : [allowed_account_types];
    
    const accountTypesJSON = JSON.stringify(accountTypesArray);

    const resourceRef = db.collection('resources').doc();
    await resourceRef.set({
      title,
      description,
      type,
      size: size || null,
      url: url || null,
      category,
      icon_name,
      button_color,
      allowed_account_types: accountTypesJSON,
      is_premium: is_premium || false,
      created_at: firebase.firestore.Timestamp.now(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.status(201).json({ 
      message: 'Resource created successfully',
      resourceId: resourceRef.id
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// UPDATE resource (admin only)
app.put('/api/admin/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      size,
      url,
      category,
      icon_name,
      button_color,
      allowed_account_types,
      is_premium
    } = req.body;

    // Validate required fields
    if (!title || !description || !type || !category || !icon_name || !button_color || !allowed_account_types) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure allowed_account_types is an array and convert to JSON string
    const accountTypesArray = Array.isArray(allowed_account_types) 
      ? allowed_account_types 
      : [allowed_account_types];
    
    const accountTypesJSON = JSON.stringify(accountTypesArray);

    await db.collection('resources').doc(id).update({
      title,
      description,
      type,
      size: size || null,
      url: url || null,
      category,
      icon_name,
      button_color,
      allowed_account_types: accountTypesJSON,
      is_premium,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Resource updated successfully' });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

// DELETE resource (admin only)
app.delete('/api/admin/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection('resources').doc(id).delete();

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// ==================== ADMIN ASSIGNMENT MANAGEMENT ENDPOINTS ====================

// GET /api/assignments/my-assignments - Get assignments for current user's enrolled courses
app.get('/api/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userAccountType = req.user.account_type;

    let assignments = [];

    if (userAccountType === 'admin') {
      // Admin can see all assignments
      const assignmentsSnapshot = await db.collection('assignments').get();
      assignments = await Promise.all(
        assignmentsSnapshot.docs.map(async (doc) => {
          const assignment = doc.data();
          const courseDoc = await db.collection('courses').doc(assignment.course_id).get();
          const course = courseDoc.exists ? courseDoc.data() : { title: 'Unknown Course', category: 'Unknown' };
          
          // Get submission if exists
          const submissionSnapshot = await db.collection('submissions')
            .where('assignment_id', '==', doc.id)
            .where('user_id', '==', userId)
            .get();
          
          const submission = submissionSnapshot.empty ? null : {
            id: submissionSnapshot.docs[0].id,
            ...submissionSnapshot.docs[0].data()
          };

          return {
            id: doc.id,
            ...assignment,
            course: {
              id: assignment.course_id,
              title: course.title,
              category: course.category
            },
            submission: submission
          };
        })
      );
    } else {
      // For students/professionals, get assignments from enrolled courses
      const enrollmentsSnapshot = await db.collection('enrollments')
        .where('user_id', '==', userId)
        .get();

      const enrolledCourseIds = enrollmentsSnapshot.docs.map(doc => doc.data().course_id);

      if (enrolledCourseIds.length === 0) {
        return res.json([]);
      }

      // Get assignments for enrolled courses
      const assignmentsSnapshot = await db.collection('assignments')
        .where('course_id', 'in', enrolledCourseIds)
        .get();

      assignments = await Promise.all(
        assignmentsSnapshot.docs.map(async (doc) => {
          const assignment = doc.data();
          const courseDoc = await db.collection('courses').doc(assignment.course_id).get();
          const course = courseDoc.exists ? courseDoc.data() : { title: 'Unknown Course', category: 'Unknown' };
          
          // Get submission if exists
          const submissionSnapshot = await db.collection('submissions')
            .where('assignment_id', '==', doc.id)
            .where('user_id', '==', userId)
            .get();
          
          const submission = submissionSnapshot.empty ? null : {
            id: submissionSnapshot.docs[0].id,
            ...submissionSnapshot.docs[0].data()
          };

          return {
            id: doc.id,
            ...assignment,
            course: {
              id: assignment.course_id,
              title: course.title,
              category: course.category
            },
            submission: submission
          };
        })
      );
    }

    res.json(assignments);

  } catch (error) {
    console.error('Get my assignments error:', error);
    res.status(500).json({ error: 'Server error while fetching assignments' });
  }
});

// POST /api/assignments/submit - Submit an assignment
app.post('/api/assignments/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { assignment_id, content } = req.body;

    if (!assignment_id) {
      return res.status(400).json({ error: 'Assignment ID is required' });
    }

    // Check if assignment exists
    const assignmentDoc = await db.collection('assignments').doc(assignment_id).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if user is enrolled in the course
    const assignment = assignmentDoc.data();
    const enrollmentSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('course_id', '==', assignment.course_id)
      .get();

    if (enrollmentSnapshot.empty) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Check if already submitted
    const existingSubmissionSnapshot = await db.collection('submissions')
      .where('assignment_id', '==', assignment_id)
      .where('user_id', '==', userId)
      .get();

    if (!existingSubmissionSnapshot.empty) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }

    // Create submission
    const submissionRef = db.collection('submissions').doc();
    const submissionData = {
      assignment_id: assignment_id,
      user_id: userId,
      content: content || '',
      file_path: '', // File upload would be handled separately
      submitted_at: firebase.firestore.FieldValue.serverTimestamp(),
      grade: null,
      feedback: '',
      status: 'submitted'
    };

    await submissionRef.set(submissionData);

    console.log('Assignment submitted:', { submissionId: submissionRef.id, userId, assignmentId: assignment_id });

    res.status(201).json({
      message: 'Assignment submitted successfully',
      submissionId: submissionRef.id
    });

  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: 'Server error while submitting assignment' });
  }
});

// GET /api/assignments/download-submission/:submissionId - Download submission file
app.get('/api/assignments/download-submission/:submissionId', authenticateToken, async (req, res) => {
  try {
    const submissionId = req.params.submissionId;
    const userId = req.user.id;

    const submissionDoc = await db.collection('submissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = submissionDoc.data();

    // Check if user owns the submission or is admin
    if (submission.user_id !== userId && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!submission.file_path) {
      return res.status(404).json({ error: 'No file attached to this submission' });
    }

    // For now, return file path. In production, you'd serve the actual file
    res.json({
      file_path: submission.file_path,
      file_name: `submission_${submissionId}.pdf` // You'd get this from metadata
    });

  } catch (error) {
    console.error('Download submission error:', error);
    res.status(500).json({ error: 'Server error while downloading submission' });
  }
});

// ==================== ADMIN ASSIGNMENT ENDPOINTS ====================

// GET /api/admin/assignments - Get all assignments (admin only)
app.get('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentsSnapshot = await db.collection('assignments').get();
    
    const assignments = await Promise.all(
      assignmentsSnapshot.docs.map(async (doc) => {
        const assignment = doc.data();
        const courseDoc = await db.collection('courses').doc(assignment.course_id).get();
        const course = courseDoc.exists ? courseDoc.data() : { title: 'Unknown Course' };
        
        return {
          id: doc.id,
          ...assignment,
          course_title: course.title
        };
      })
    );

    res.json(assignments);

  } catch (error) {
    console.error('Get admin assignments error:', error);
    res.status(500).json({ error: 'Server error while fetching assignments' });
  }
});

// GET /api/admin/courses - Get all courses for assignment form (admin only)
app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const coursesSnapshot = await db.collection('courses').get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(courses);

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error while fetching courses' });
  }
});

// POST /api/admin/assignments - Create new assignment (admin only)
app.post('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, due_date, max_points, course_id } = req.body;

    // Validate required fields
    if (!title || !due_date || !max_points || !course_id) {
      return res.status(400).json({
        error: 'Title, due date, max points, and course are required'
      });
    }

    // Check if course exists
    const courseDoc = await db.collection('courses').doc(course_id).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create assignment
    const assignmentRef = db.collection('assignments').doc();
    const assignmentData = {
      title: title.trim(),
      description: description || '',
      due_date: due_date,
      max_points: parseInt(max_points),
      course_id: course_id,
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };

    await assignmentRef.set(assignmentData);

    console.log('Assignment created by admin:', { assignmentId: assignmentRef.id, title, admin: req.user.email });

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: {
        id: assignmentRef.id,
        ...assignmentData
      }
    });

  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Server error while creating assignment' });
  }
});

// PUT /api/admin/assignments/:id - Update assignment (admin only)
app.put('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { title, description, due_date, max_points, course_id } = req.body;

    // Check if assignment exists
    const assignmentDoc = await db.collection('assignments').doc(assignmentId).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if course exists if course_id is being updated
    if (course_id) {
      const courseDoc = await db.collection('courses').doc(course_id).get();
      if (!courseDoc.exists) {
        return res.status(404).json({ error: 'Course not found' });
      }
    }

    const currentAssignment = assignmentDoc.data();

    // Update assignment
    const updateData = {
      title: title || currentAssignment.title,
      description: description || currentAssignment.description,
      due_date: due_date || currentAssignment.due_date,
      max_points: max_points ? parseInt(max_points) : currentAssignment.max_points,
      course_id: course_id || currentAssignment.course_id,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('assignments').doc(assignmentId).update(updateData);

    // Get updated assignment with course title
    const updatedAssignmentDoc = await db.collection('assignments').doc(assignmentId).get();
    const updatedAssignment = updatedAssignmentDoc.data();
    const courseDoc = await db.collection('courses').doc(updatedAssignment.course_id).get();
    const course = courseDoc.exists ? courseDoc.data() : { title: 'Unknown Course' };

    res.json({
      message: 'Assignment updated successfully',
      assignment: {
        id: assignmentId,
        ...updatedAssignment,
        course_title: course.title
      }
    });

  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Server error while updating assignment' });
  }
});

// DELETE /api/admin/assignments/:id - Delete assignment (admin only)
app.delete('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentId = req.params.id;

    // Check if assignment exists
    const assignmentDoc = await db.collection('assignments').doc(assignmentId).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if there are submissions for this assignment
    const submissionsSnapshot = await db.collection('submissions')
      .where('assignment_id', '==', assignmentId)
      .get();

    if (!submissionsSnapshot.empty) {
      return res.status(400).json({ 
        error: 'Cannot delete assignment with existing submissions. Delete submissions first.' 
      });
    }

    // Delete assignment
    await db.collection('assignments').doc(assignmentId).delete();

    console.log('Assignment deleted by admin:', { assignmentId, admin: req.user.email });

    res.json({ message: 'Assignment deleted successfully' });

  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Server error while deleting assignment' });
  }
});

// GET /api/admin/assignment-submissions/:assignmentId - Get submissions for an assignment (admin only)
app.get('/api/admin/assignment-submissions/:assignmentId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentId = req.params.id;

    const submissionsSnapshot = await db.collection('submissions')
      .where('assignment_id', '==', assignmentId)
      .get();

    const submissions = await Promise.all(
      submissionsSnapshot.docs.map(async (doc) => {
        const submission = doc.data();
        const userDoc = await db.collection('users').doc(submission.user_id).get();
        const user = userDoc.exists ? userDoc.data() : { first_name: 'Unknown', last_name: 'User' };
        
        return {
          id: doc.id,
          ...submission,
          user: {
            id: submission.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email
          }
        };
      })
    );

    res.json(submissions);

  } catch (error) {
    console.error('Get assignment submissions error:', error);
    res.status(500).json({ error: 'Server error while fetching submissions' });
  }
});

// PUT /api/admin/grade-submission/:submissionId - Grade a submission (admin only)
app.put('/api/admin/grade-submission/:submissionId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const submissionId = req.params.submissionId;
    const { grade, feedback } = req.body;

    if (grade === undefined || grade === null) {
      return res.status(400).json({ error: 'Grade is required' });
    }

    const submissionDoc = await db.collection('submissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    await db.collection('submissions').doc(submissionId).update({
      grade: parseInt(grade),
      feedback: feedback || '',
      status: 'graded',
      graded_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Submission graded successfully' });

  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ error: 'Server error while grading submission' });
  }
});

// ==================== ADMIN CONTACT MESSAGES ENDPOINTS ====================

// Get contact messages (admin only) - FIXED VERSION
app.get('/api/admin/contact-messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Firestore doesn't support offset() - we'll fetch all and paginate in memory for simplicity
    // For production with large datasets, implement cursor-based pagination with startAfter()
    const messagesSnap = await db.collection('contact_messages')
      .orderBy('created_at', 'desc')
      .get();

    if (messagesSnap.empty) {
      return res.json({
        messages: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalMessages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      });
    }

    // Get all messages
    const allMessages = messagesSnap.docs.map(doc => {
      const m = doc.data();
      return {
        id: doc.id,
        first_name: m.first_name || '',
        last_name: m.last_name || '',
        email: m.email || '',
        phone: m.phone || '',
        company: m.company || '',
        message: m.message || '',
        status: m.status || 'pending',
        created_at: m.created_at ? m.created_at.toDate?.() || m.created_at : new Date().toISOString()
      };
    });

    const total = allMessages.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Paginate in memory
    const paginatedMessages = allMessages.slice(startIndex, endIndex);

    res.json({
      messages: paginatedMessages,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalMessages: total,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching contact messages:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch contact messages',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// UPDATE contact message status (admin only)
app.put('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    if (!status || !['pending', 'contacted', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value. Must be: pending, contacted, resolved, or closed' });
    }

    // Check if document exists
    const docRef = db.collection('contact_messages').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    // Update the status
    await docRef.update({
      status,
      updated_at: new Date().toISOString()
    });

    res.json({ 
      message: 'Contact message updated successfully',
      id,
      status
    });

  } catch (error) {
    console.error('Error updating contact message:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Failed to update contact message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE contact message (admin only)
app.delete('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    // Check if document exists
    const docRef = db.collection('contact_messages').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    // Delete the document
    await docRef.delete();

    res.json({ 
      message: 'Contact message deleted successfully',
      id
    });

  } catch (error) {
    console.error('Error deleting contact message:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Failed to delete contact message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== ADMIN SERVICE MANAGEMENT ENDPOINTS ====================

// Get all services (admin only)
app.get('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const servicesSnap = await db.collection('services').orderBy('created_at', 'desc').get();

    const services = [];
    for (const doc of servicesSnap.docs) {
      const s = doc.data();
      const categoryDoc = await db.collection('service_categories').doc(s.category_id).get();
      services.push({
        id: doc.id,
        name: s.name,
        category_id: s.category_id,
        category_name: categoryDoc.data().name,
        description: s.description,
        price: s.price,
        duration: s.duration,
        rating: s.rating,
        reviews: s.reviews,
        features: s.features ? JSON.parse(s.features) : [],
        popular: s.popular === 1,
        is_active: s.is_active
      });
    }

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get service by ID (admin only)
app.get('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const serviceDoc = await db.collection('services').doc(id).get();

    if (!serviceDoc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = serviceDoc.data();
    const categoryDoc = await db.collection('service_categories').doc(service.category_id).get();

    res.json({
      id,
      name: service.name,
      category_id: service.category_id,
      category_name: categoryDoc.data().name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      rating: service.rating,
      reviews: service.reviews,
      features: service.features ? JSON.parse(service.features) : [],
      popular: service.popular === 1,
      is_active: service.is_active
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Create new service (admin only)
app.post('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      category_id,
      description,
      price,
      duration,
      features,
      popular,
      is_active
    } = req.body;

    // Validate required fields
    if (!name || !category_id || !price) {
      return res.status(400).json({ error: 'Name, category, and price are required' });
    }

    const serviceRef = db.collection('services').doc();
    await serviceRef.set({
      name,
      category_id,
      description: description || null,
      price,
      duration: duration || null,
      features: features ? JSON.stringify(features) : null,
      popular: popular ? 1 : 0,
      is_active: is_active ? 1 : 0,
      created_at: firebase.firestore.Timestamp.now(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.status(201).json({
      message: 'Service created successfully',
      serviceId: serviceRef.id
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update service (admin only)
app.put('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category_id,
      description,
      price,
      duration,
      features,
      popular,
      is_active
    } = req.body;

    const serviceDoc = await db.collection('services').doc(id).get();

    if (!serviceDoc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await db.collection('services').doc(id).update({
      name,
      category_id,
      description: description || null,
      price,
      duration: duration || null,
      features: features ? JSON.stringify(features) : null,
      popular: popular ? 1 : 0,
      is_active: is_active ? 1 : 0,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service (admin only)
app.delete('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const serviceDoc = await db.collection('services').doc(id).get();

    if (!serviceDoc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await db.collection('services').doc(id).delete();

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// ==================== ADMIN SERVICE CATEGORIES ENDPOINT ====================

// GET service categories (admin only)
app.get('/api/admin/service-categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Remove the where clause to get ALL categories, not just is_active=1
    const categoriesSnap = await db.collection('service_categories')
      .orderBy('name')
      .get();

    const categories = categoriesSnap.docs
      .filter(doc => {
        const data = doc.data();
        // Handle both boolean true and number 1 for is_active
        return data.is_active === true || data.is_active === 1;
      })
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id, // This is a string in Firestore
          name: data.name,
          description: data.description,
          icon: data.icon,
          is_active: data.is_active
        };
      });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch service categories',
      details: error.message 
    });
  }
});

// ==================== ADMIN CALENDAR MANAGEMENT ENDPOINTS ====================

// Get all calendar events (admin only) - FIXED VERSION
app.get('/api/admin/calendar-events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Simple query - sort by event_date only to avoid composite index requirement
    const eventsSnap = await db.collection('custom_calendar_events')
      .orderBy('event_date', 'desc')
      .get();

    if (eventsSnap.empty) {
      return res.json([]);
    }

    const events = [];
    
    for (const doc of eventsSnap.docs) {
      const e = doc.data();
      
      // Initialize user data
      let userData = {
        first_name: null,
        last_name: null,
        email: null
      };

      // Only fetch user data if user_id exists
      if (e.user_id) {
        try {
          const userDoc = await db.collection('users').doc(String(e.user_id)).get();
          if (userDoc.exists) {
            const u = userDoc.data();
            userData = {
              first_name: u.first_name || null,
              last_name: u.last_name || null,
              email: u.email || null
            };
          }
        } catch (userError) {
          console.error(`Error fetching user ${e.user_id}:`, userError);
          // Continue with null user data
        }
      }

      events.push({
        id: doc.id,
        user_id: e.user_id || null,
        title: e.title || '',
        description: e.description || null,
        event_date: e.event_date ? e.event_date.toDate?.() || e.event_date : null,
        event_time: e.event_time || null,
        event_type: e.event_type || 'custom',
        created_at: e.created_at ? e.created_at.toDate?.() || e.created_at : new Date().toISOString(),
        updated_at: e.updated_at ? e.updated_at.toDate?.() || e.updated_at : new Date().toISOString(),
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email
      });
    }

    // Sort by date and time in memory
    events.sort((a, b) => {
      const dateA = new Date(a.event_date);
      const dateB = new Date(b.event_date);
      if (dateB.getTime() !== dateA.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      // If dates are equal, sort by time
      if (a.event_time && b.event_time) {
        return b.event_time.localeCompare(a.event_time);
      }
      return 0;
    });

    res.json(events);

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch calendar events',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get calendar event by ID (admin only) - FIXED VERSION
app.get('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    const event = eventDoc.data();
    
    // Initialize user data
    let userData = {
      first_name: null,
      last_name: null,
      email: null
    };

    // Only fetch user data if user_id exists
    if (event.user_id) {
      try {
        const userDoc = await db.collection('users').doc(String(event.user_id)).get();
        if (userDoc.exists) {
          const user = userDoc.data();
          userData = {
            first_name: user.first_name || null,
            last_name: user.last_name || null,
            email: user.email || null
          };
        }
      } catch (userError) {
        console.error(`Error fetching user ${event.user_id}:`, userError);
      }
    }

    res.json({
      id,
      user_id: event.user_id || null,
      title: event.title || '',
      description: event.description || null,
      event_date: event.event_date ? event.event_date.toDate?.() || event.event_date : null,
      event_time: event.event_time || null,
      event_type: event.event_type || 'custom',
      created_at: event.created_at ? event.created_at.toDate?.() || event.created_at : new Date().toISOString(),
      updated_at: event.updated_at ? event.updated_at.toDate?.() || event.updated_at : new Date().toISOString(),
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email
    });

  } catch (error) {
    console.error('Error fetching calendar event:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendar event',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new calendar event (admin only) - FIXED VERSION
app.post('/api/admin/calendar-events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      user_id,
      title,
      description,
      event_date,
      event_time,
      event_type
    } = req.body;

    // Validate required fields
    if (!title || !event_date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(event_date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate event type
    const validTypes = ['custom', 'webinar', 'workshop', 'meeting', 'deadline'];
    if (event_type && !validTypes.includes(event_type)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    // Validate user_id if provided
    if (user_id) {
      const userDoc = await db.collection('users').doc(String(user_id)).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    const eventRef = db.collection('custom_calendar_events').doc();
    await eventRef.set({
      user_id: user_id ? String(user_id) : null,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      event_date: firebase.firestore.Timestamp.fromDate(new Date(event_date)),
      event_time: event_time || null,
      event_type: event_type || 'custom',
      created_at: firebase.firestore.Timestamp.now(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.status(201).json({
      message: 'Calendar event created successfully',
      eventId: eventRef.id
    });

  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ 
      error: 'Failed to create calendar event',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update calendar event (admin only) - FIXED VERSION
app.put('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user_id,
      title,
      description,
      event_date,
      event_time,
      event_type
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    // Validate required fields
    if (!title || !event_date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(event_date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate event type
    const validTypes = ['custom', 'webinar', 'workshop', 'meeting', 'deadline'];
    if (event_type && !validTypes.includes(event_type)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    // Validate user_id if provided
    if (user_id) {
      const userDoc = await db.collection('users').doc(String(user_id)).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    await db.collection('custom_calendar_events').doc(id).update({
      user_id: user_id ? String(user_id) : null,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      event_date: firebase.firestore.Timestamp.fromDate(new Date(event_date)),
      event_time: event_time || null,
      event_type: event_type || 'custom',
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Calendar event updated successfully' });

  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ 
      error: 'Failed to update calendar event',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete calendar event (admin only) - FIXED VERSION
app.delete('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    await db.collection('custom_calendar_events').doc(id).delete();

    res.json({ message: 'Calendar event deleted successfully' });

  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ 
      error: 'Failed to delete calendar event',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== ADMIN SERVICE REQUEST MANAGEMENT PAGE ====================

// Updated GET endpoint for service requests
app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requestsSnap = await db.collection('service_requests').orderBy('created_at', 'desc').get();

    const requests = [];
    for (const doc of requestsSnap.docs) {
      const sr = doc.data();
      const scDoc = await db.collection('service_subcategories').doc(sr.subcategory_id).get();
      const uDoc = await db.collection('users').doc(sr.user_id).get();
      const u = uDoc.data();
      requests.push({
        id: doc.id,
        name: sr.full_name,
        service: scDoc.data().name,
        date: sr.created_at.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: sr.status,
        email: sr.email,
        phone: sr.phone,
        company: sr.company,
        website: sr.website,
        project_details: sr.project_details,
        budget_range: sr.budget_range,
        timeline: sr.timeline,
        contact_method: sr.contact_method,
        additional_requirements: sr.additional_requirements,
        user_id: sr.user_id,
        user_first_name: u.first_name,
        user_last_name: u.last_name,
        user_account_type: u.account_type
      });
    }

    res.json(requests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests', details: error.message });
  }
});

// Updated PUT endpoint for service requests
app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, project_details, budget_range, timeline, additional_requirements } = req.body;

    await db.collection('service_requests').doc(id).update({
      status,
      project_details,
      budget_range,
      timeline,
      additional_requirements,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Service request updated successfully' });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ error: 'Failed to update service request', details: error.message });
  }
});

// PUT /api/admin/service-requests/:id - Update service request status
app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.collection('service_requests').doc(id).update({
      status,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Service request updated successfully' });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ error: 'Failed to update service request', details: error.message });
  }
});

// DELETE /api/admin/service-requests/:id - Delete service request
app.delete('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection('service_requests').doc(id).delete();

    res.json({ message: 'Service request deleted successfully' });
  } catch (error) {
    console.error('Error deleting service request:', error);
    res.status(500).json({ error: 'Failed to delete service request', details: error.message });
  }
});

// ==================== UTILITY ROUTES ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get server info
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Padak Dashboard API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
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
});

// ==================== SERVER STARTUP ====================

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;