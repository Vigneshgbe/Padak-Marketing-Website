// server.js - Firebase Firestore Version
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin
const firebaseConfig = {
  apiKey: "AIzaSyA4uHspTDS-8kIT2HsmPFGL9JNNBvI6NI4",
  authDomain: "startup-dbs-1.firebaseapp.com",
  projectId: "startup-dbs-1",
  storageBucket: "startup-dbs-1.firebasestorage.app",
  messagingSenderId: "70939047801",
  appId: "1:70939047801:web:08a6a9d17f6b63af9261a8"
};

// Initialize Firebase Admin with service account (you'll need to add service account key)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // or use service account
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const app = express();
const port = process.env.PORT || 5000;

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
const assignmentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads', 'assignments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `assignment-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

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

// ===== CORS configuration ======
const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

app.use(cors({
  origin: [process.env.FRONTEND_URL], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads', 'avatars')));

// ======== FIRESTORE HELPER FUNCTIONS ========

// Generate unique ID for documents
const generateId = () => {
  return db.collection('temp').doc().id;
};

// Convert Firestore timestamp to ISO string
const firestoreToDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// Test Firestore connection
async function testConnection() {
  try {
    await db.collection('test').doc('connection').set({ 
      test: true, 
      timestamp: admin.firestore.FieldValue.serverTimestamp() 
    });
    console.log('Connected to Firestore successfully');
    await db.collection('test').doc('connection').delete();
  } catch (err) {
    console.error('Firestore connection failed:', err);
    process.exit(1);
  }
}

testConnection();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// JWT Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from Firestore
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists || !userDoc.data().is_active) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = { id: decoded.userId, ...userDoc.data() };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ==================== AUTH ROUTES ====================

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, phone, password, accountType } = req.body;

  try {
    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'First name, last name, email, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if email exists
    const existingUsersQuery = await db.collection('users')
      .where('email', '==', email.trim())
      .get();

    if (!existingUsersQuery.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate user ID
    const userId = generateId();

    // Create user document
    const userData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      password_hash: hashedPassword,
      account_type: accountType || 'student',
      is_active: true,
      email_verified: false,
      profile_image: null,
      company: null,
      website: null,
      bio: null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userId).set(userData);

    // Create user stats document
    const userStatsData = {
      user_id: userId,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('user_stats').doc(userId).set(userStatsData);

    console.log('User registered successfully:', { userId, email });
    res.status(201).json({
      message: 'User registered successfully',
      userId: userId
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const usersQuery = await db.collection('users')
      .where('email', '==', email)
      .where('is_active', '==', true)
      .get();

    if (usersQuery.empty) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const userDoc = usersQuery.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const tokenExpiry = rememberMe ? '30d' : '1d';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        accountType: user.account_type
      },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // Update last login timestamp
    await db.collection('users').doc(user.id).update({
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('User logged in successfully:', { userId: user.id, email: user.email });

    // Send success response
    res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
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
        createdAt: firestoreToDate(user.created_at),
        updatedAt: firestoreToDate(user.updated_at)
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

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
      createdAt: firestoreToDate(user.created_at),
      updatedAt: firestoreToDate(user.updated_at)
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

    const updateData = {
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      company: company,
      website: website,
      bio: bio,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userId).update(updateData);

    // Get updated user data
    const updatedUserDoc = await db.collection('users').doc(userId).get();
    const user = { id: updatedUserDoc.id, ...updatedUserDoc.data() };

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
      createdAt: firestoreToDate(user.created_at),
      updatedAt: firestoreToDate(user.updated_at)
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload avatar
app.post('/api/auth/avatar', authenticateToken, (req, res, next) => {
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
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).send(profileImage);

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== DASHBOARD ROUTES ====================

// Get user stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const statsDoc = await db.collection('user_stats').doc(userId).get();

    if (!statsDoc.exists) {
      // Create default stats if not exists
      const defaultStats = {
        user_id: userId,
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        last_activity: admin.firestore.FieldValue.serverTimestamp()
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
        coursesEnrolled: userStats.courses_enrolled,
        coursesCompleted: userStats.courses_completed,
        certificatesEarned: userStats.certificates_earned,
        learningStreak: userStats.learning_streak,
        lastActivity: firestoreToDate(userStats.last_activity)
      });
    }

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== COURSES ROUTES ====================

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const coursesSnapshot = await db.collection('courses')
      .where('is_active', '==', true)
      .orderBy('created_at', 'desc')
      .get();

    const courses = [];
    coursesSnapshot.forEach(doc => {
      const courseData = doc.data();
      courses.push({
        id: doc.id,
        title: courseData.title,
        description: courseData.description,
        instructorName: courseData.instructor_name,
        durationWeeks: courseData.duration_weeks,
        difficultyLevel: courseData.difficulty_level,
        category: courseData.category,
        price: courseData.price !== null ? `₹${parseFloat(courseData.price).toFixed(2)}` : '₹0.00',
        thumbnail: courseData.thumbnail,
        isActive: courseData.is_active
      });
    });

    res.json(courses);

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
});

// Get user's enrolled courses
app.get('/api/enrollments/my-courses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .orderBy('enrollment_date', 'desc')
      .get();

    const enrollments = [];

    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data();
      
      // Get course data
      const courseDoc = await db.collection('courses').doc(enrollmentData.course_id).get();
      const courseData = courseDoc.exists ? courseDoc.data() : null;

      if (courseData) {
        enrollments.push({
          id: enrollmentDoc.id,
          userId: enrollmentData.user_id,
          courseId: enrollmentData.course_id,
          progress: enrollmentData.progress,
          enrollmentDate: firestoreToDate(enrollmentData.enrollment_date),
          completionDate: firestoreToDate(enrollmentData.completion_date),
          status: enrollmentData.status,
          course: {
            id: enrollmentData.course_id,
            title: courseData.title,
            description: courseData.description,
            instructorName: courseData.instructor_name,
            durationWeeks: courseData.duration_weeks,
            difficultyLevel: courseData.difficulty_level,
            category: courseData.category,
            price: courseData.price,
            thumbnail: courseData.thumbnail,
            isActive: courseData.is_active
          }
        });
      }
    }

    res.json(enrollments);

  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Enroll in a course
app.post('/api/courses/enroll', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Check if already enrolled
    const existingEnrollment = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('course_id', '==', courseId)
      .get();

    if (!existingEnrollment.empty) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();

    if (!courseDoc.exists || !courseDoc.data().is_active) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    const enrollmentData = {
      user_id: userId,
      course_id: courseId,
      progress: 0,
      status: 'active',
      enrollment_date: admin.firestore.FieldValue.serverTimestamp(),
      completion_date: null
    };

    await db.collection('enrollments').doc(generateId()).set(enrollmentData);

    // Update user stats
    const userStatsDoc = await db.collection('user_stats').doc(userId).get();
    if (userStatsDoc.exists) {
      await db.collection('user_stats').doc(userId).update({
        courses_enrolled: admin.firestore.FieldValue.increment(1)
      });
    }

    res.status(201).json({ message: 'Successfully enrolled in course' });

  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ASSIGNMENTS ROUTES ====================

// Get user's assignments
app.get('/api/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's enrollments
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .get();

    const courseIds = [];
    enrollmentsSnapshot.forEach(doc => {
      courseIds.push(doc.data().course_id);
    });

    if (courseIds.length === 0) {
      return res.json([]);
    }

    // Get assignments for enrolled courses
    const assignments = [];
    for (const courseId of courseIds) {
      const assignmentsSnapshot = await db.collection('assignments')
        .where('course_id', '==', courseId)
        .orderBy('due_date', 'asc')
        .get();

      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignmentData = assignmentDoc.data();
        
        // Get course data
        const courseDoc = await db.collection('courses').doc(courseId).get();
        const courseData = courseDoc.data();

        // Check for submission
        const submissionSnapshot = await db.collection('assignment_submissions')
          .where('assignment_id', '==', assignmentDoc.id)
          .where('user_id', '==', userId)
          .get();

        let submission = null;
        if (!submissionSnapshot.empty) {
          const submissionData = submissionSnapshot.docs[0].data();
          submission = {
            id: submissionSnapshot.docs[0].id,
            content: submissionData.content,
            file_path: submissionData.file_path,
            submitted_at: firestoreToDate(submissionData.submitted_at),
            grade: submissionData.grade,
            feedback: submissionData.feedback,
            status: submissionData.status
          };
        }

        assignments.push({
          id: assignmentDoc.id,
          course_id: courseId,
          title: assignmentData.title,
          description: assignmentData.description,
          due_date: firestoreToDate(assignmentData.due_date),
          max_points: assignmentData.max_points,
          created_at: firestoreToDate(assignmentData.created_at),
          course: {
            id: courseId,
            title: courseData.title,
            category: courseData.category
          },
          submission: submission
        });
      }
    }

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Submit assignment
app.post('/api/assignments/submit', authenticateToken, assignmentUpload.single('file'), async (req, res) => {
  const { assignment_id, content } = req.body;
  const file_path = req.file ? req.file.filename : null;
  const userId = req.user.id;

  if (!assignment_id) {
    return res.status(400).json({ error: 'Assignment ID is required' });
  }

  if (!content && !file_path) {
    return res.status(400).json({ error: 'Either content or file is required' });
  }

  try {
    // Check if assignment exists and user is enrolled
    const assignmentDoc = await db.collection('assignments').doc(assignment_id).get();
    
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignmentData = assignmentDoc.data();
    
    // Check if user is enrolled in the course
    const enrollmentSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('course_id', '==', assignmentData.course_id)
      .get();

    if (enrollmentSnapshot.empty) {
      return res.status(404).json({ error: 'Assignment not found or not enrolled' });
    }

    // Check if already submitted
    const existingSubmission = await db.collection('assignment_submissions')
      .where('assignment_id', '==', assignment_id)
      .where('user_id', '==', userId)
      .get();

    if (!existingSubmission.empty) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }

    // Insert submission
    const submissionData = {
      assignment_id: assignment_id,
      user_id: userId,
      content: content || '',
      file_path: file_path,
      submitted_at: admin.firestore.FieldValue.serverTimestamp(),
      status: 'submitted',
      grade: null,
      feedback: null
    };

    const submissionDoc = await db.collection('assignment_submissions').doc(generateId()).set(submissionData);

    res.json({
      success: true,
      message: 'Assignment submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ==================== SOCIAL FEED ROUTES ====================

// Multer Configuration for Social Post Images
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
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
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
}

// GET All Posts (with Pagination, Likes, Comments, etc.)
app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    // Get posts with visibility rules
    const postsSnapshot = await db.collection('social_activities')
      .where('activity_type', '==', 'post')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit)
      .get();

    const posts = [];
    
    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();
      
      // Check visibility permissions
      if (postData.visibility === 'private' && postData.user_id !== userId) {
        continue;
      }
      
      if (postData.visibility === 'connections') {
        const connectionSnapshot = await db.collection('user_connections')
          .where('status', '==', 'accepted')
          .where('user_id_1', 'in', [userId, postData.user_id])
          .where('user_id_2', 'in', [userId, postData.user_id])
          .get();
        
        if (connectionSnapshot.empty && postData.user_id !== userId) {
          continue;
        }
      }

      // Get user data
      const userDoc = await db.collection('users').doc(postData.user_id).get();
      const userData = userDoc.data();

      // Get likes count
      const likesSnapshot = await db.collection('social_activities')
        .where('activity_type', '==', 'like')
        .where('target_id', '==', postDoc.id)
        .get();

      // Get comments count
      const commentsSnapshot = await db.collection('social_activities')
        .where('activity_type', '==', 'comment')
        .where('target_id', '==', postDoc.id)
        .get();

      // Check if current user has liked
      const userLikeSnapshot = await db.collection('social_activities')
        .where('activity_type', '==', 'like')
        .where('target_id', '==', postDoc.id)
        .where('user_id', '==', userId)
        .get();

      // Check if current user has bookmarked
      const userBookmarkSnapshot = await db.collection('social_activities')
        .where('activity_type', '==', 'bookmark')
        .where('target_id', '==', postDoc.id)
        .where('user_id', '==', userId)
        .get();

      // Get comments data
      const comments = [];
      for (const commentDoc of commentsSnapshot.docs) {
        const commentData = commentDoc.data();
        const commentUserDoc = await db.collection('users').doc(commentData.user_id).get();
        const commentUserData = commentUserDoc.data();
        
        comments.push({
          ...commentData,
          id: commentDoc.id,
          user: {
            id: commentData.user_id,
            first_name: commentUserData.first_name,
            last_name: commentUserData.last_name,
            profile_image: getFullImageUrl(req, commentUserData.profile_image),
            account_type: commentUserData.account_type
          },
          created_at: firestoreToDate(commentData.created_at)
        });
      }

      posts.push({
        ...postData,
        id: postDoc.id,
        likes: likesSnapshot.size,
        comment_count: commentsSnapshot.size,
        has_liked: !userLikeSnapshot.empty,
        has_bookmarked: !userBookmarkSnapshot.empty,
        image_url: getFullImageUrl(req, postData.image_url),
        created_at: firestoreToDate(postData.created_at),
        user: {
          id: postData.user_id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          profile_image: getFullImageUrl(req, userData.profile_image),
          account_type: userData.account_type
        },
        comments: comments
      });
    }

    // Get total count for pagination
    const totalSnapshot = await db.collection('social_activities')
      .where('activity_type', '==', 'post')
      .get();

    const totalPosts = totalSnapshot.size;
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts: posts,
      pagination: { page, totalPages, totalPosts }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

// POST a new post
app.post('/api/posts', authenticateToken, (req, res) => {
  socialUpload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const { content, achievement, visibility } = req.body;
      const userId = req.user.id;

      if (!content && !req.file) {
        return res.status(400).json({ error: 'Post must have content or an image.' });
      }

      const imageUrl = req.file ? `/uploads/social/${req.file.filename}` : null;
      const isAchievement = achievement === 'true';

      const postData = {
        user_id: userId,
        activity_type: 'post',
        content: content || '',
        image_url: imageUrl,
        achievement: isAchievement,
        visibility: visibility || 'public',
        share_count: 0,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };

      const postDoc = await db.collection('social_activities').doc(generateId());
      await postDoc.set(postData);

      // Fetch the newly created post to return
      const newPostDoc = await postDoc.get();
      const newPostData = newPostDoc.data();

      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      res.status(201).json({
        ...newPostData,
        id: newPostDoc.id,
        has_liked: false,
        has_bookmarked: false,
        likes: 0,
        comment_count: 0,
        image_url: getFullImageUrl(req, newPostData.image_url),
        created_at: firestoreToDate(newPostData.created_at),
        user: {
          id: userId,
          first_name: userData.first_name,
          last_name: userData.last_name,
          profile_image: getFullImageUrl(req, userData.profile_image),
          account_type: userData.account_type
        },
        comments: []
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post.' });
    }
  });
});

// PUT (edit) a post
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Content cannot be empty.' });
  }

  try {
    const postDoc = await db.collection('social_activities').doc(id).get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const postData = postDoc.data();

    if (postData.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    await db.collection('social_activities').doc(id).update({
      content: content,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Post updated successfully.' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post.' });
  }
});

// DELETE a post
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const postDoc = await db.collection('social_activities').doc(id).get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const postData = postDoc.data();

    if (postData.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    // Delete the post record
    await db.collection('social_activities').doc(id).delete();

    // Delete related activities (likes, comments, bookmarks)
    const relatedActivitiesSnapshot = await db.collection('social_activities')
      .where('target_id', '==', id)
      .get();

    const batch = db.batch();
    relatedActivitiesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // If there was an image, delete it from the filesystem
    if (postData.image_url) {
      fs.unlink(path.join(__dirname, postData.image_url), (err) => {
        if (err) console.error("Error deleting post image:", err);
      });
    }

    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// POST a comment on a post
app.post('/api/posts/:id/comment', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Comment cannot be empty.' });
  }

  try {
    const commentData = {
      user_id: userId,
      activity_type: 'comment',
      content: content,
      target_id: targetId,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const commentDoc = await db.collection('social_activities').doc(generateId());
    await commentDoc.set(commentData);

    // Fetch the new comment with user info
    const newCommentDoc = await commentDoc.get();
    const newCommentData = newCommentDoc.data();

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    res.status(201).json({
      ...newCommentData,
      id: newCommentDoc.id,
      created_at: firestoreToDate(newCommentData.created_at),
      user: {
        id: userId,
        first_name: userData.first_name,
        last_name: userData.last_name,
        profile_image: getFullImageUrl(req, userData.profile_image)
      }
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

// POST (like) a post
app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    // Check if already liked
    const existingLike = await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'like')
      .where('target_id', '==', targetId)
      .get();

    if (!existingLike.empty) {
      return res.status(400).json({ error: 'Post already liked' });
    }

    const likeData = {
      user_id: userId,
      activity_type: 'like',
      target_id: targetId,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('social_activities').doc(generateId()).set(likeData);
    res.status(201).json({ message: 'Post liked.' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post.' });
  }
});

// DELETE (unlike) a post
app.delete('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    const likeSnapshot = await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'like')
      .where('target_id', '==', targetId)
      .get();

    const batch = db.batch();
    likeSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({ message: 'Post unliked.' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ error: 'Failed to unlike post.' });
  }
});

// POST (bookmark) a post
app.post('/api/posts/:id/bookmark', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    // Check if already bookmarked
    const existingBookmark = await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'bookmark')
      .where('target_id', '==', targetId)
      .get();

    if (!existingBookmark.empty) {
      return res.status(400).json({ error: 'Post already bookmarked' });
    }

    const bookmarkData = {
      user_id: userId,
      activity_type: 'bookmark',
      target_id: targetId,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('social_activities').doc(generateId()).set(bookmarkData);
    res.status(201).json({ message: 'Post bookmarked.' });
  } catch (error) {
    console.error('Error bookmarking post:', error);
    res.status(500).json({ error: 'Failed to bookmark post.' });
  }
});

// DELETE (unbookmark) a post
app.delete('/api/posts/:id/bookmark', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    const bookmarkSnapshot = await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'bookmark')
      .where('target_id', '==', targetId)
      .get();

    const batch = db.batch();
    bookmarkSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({ message: 'Post unbookmarked.' });
  } catch (error) {
    console.error('Error unbookmarking post:', error);
    res.status(500).json({ error: 'Failed to unbookmark post.' });
  }
});

// POST (track) a share
app.post('/api/posts/:id/share', authenticateToken, async (req, res) => {
  const postId = req.params.id;

  try {
    await db.collection('social_activities').doc(postId).update({
      share_count: admin.firestore.FieldValue.increment(1)
    });

    res.json({ message: 'Share tracked.' });
  } catch (error) {
    console.error('Error tracking share:', error);
    res.status(500).json({ error: 'Failed to track share.' });
  }
});

// ==================== STUDENT DASHBOARD SPECIFIC ENDPOINTS ====================

// Get user enrollments
app.get('/api/users/:userId/enrollments', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (req.params.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own enrollment data.' });
  }

  try {
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .orderBy('enrollment_date', 'desc')
      .get();

    const enrollments = [];
    
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data();
      
      // Get course data
      const courseDoc = await db.collection('courses').doc(enrollmentData.course_id).get();
      const courseData = courseDoc.exists ? courseDoc.data() : null;

      if (courseData) {
        enrollments.push({
          id: enrollmentDoc.id,
          progress: enrollmentData.progress,
          status: enrollmentData.status,
          enrollment_date: firestoreToDate(enrollmentData.enrollment_date),
          completion_date: firestoreToDate(enrollmentData.completion_date),
          course_id: enrollmentData.course_id,
          courseTitle: courseData.title,
          instructorName: courseData.instructor_name,
          durationWeeks: courseData.duration_weeks
        });
      }
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
    const submissionsSnapshot = await db.collection('internship_submissions')
      .where('user_id', '==', userId)
      .orderBy('submitted_at', 'desc')
      .get();

    const applications = [];

    for (const submissionDoc of submissionsSnapshot.docs) {
      const submissionData = submissionDoc.data();
      
      // Get internship data
      const internshipDoc = await db.collection('internships').doc(submissionData.internship_id).get();
      const internshipData = internshipDoc.exists ? internshipDoc.data() : null;

      if (internshipData) {
        applications.push({
          id: submissionDoc.id,
          internship_id: submissionData.internship_id,
          applicationStatus: submissionData.status,
          applicationDate: firestoreToDate(submissionData.submitted_at),
          internshipTitle: internshipData.title,
          companyName: internshipData.company
        });
      }
    }

    res.json(applications);
  } catch (error) {
    console.error('Error fetching user internship applications for dashboard:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// ==================== SERVICES ROUTES ====================

// Get all services
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const servicesSnapshot = await db.collection('services')
      .where('is_active', '==', true)
      .orderBy('popular', 'desc')
      .orderBy('name', 'asc')
      .get();

    const services = [];
    
    for (const serviceDoc of servicesSnapshot.docs) {
      const serviceData = serviceDoc.data();
      
      // Get category data
      const categoryDoc = await db.collection('service_categories').doc(serviceData.category_id).get();
      const categoryData = categoryDoc.exists ? categoryDoc.data() : null;

      services.push({
        id: serviceDoc.id,
        name: serviceData.name,
        category_id: serviceData.category_id,
        categoryName: categoryData ? categoryData.name : 'Unknown',
        description: serviceData.description,
        price: serviceData.price,
        duration: serviceData.duration,
        rating: serviceData.rating,
        reviews: serviceData.reviews,
        features: serviceData.features || [],
        popular: serviceData.popular
      });
    }

    res.json(services);
  } catch (error) {
    console.error('Error fetching available services:', error);
    res.status(500).json({ message: 'Failed to fetch available services.', error: error.message });
  }
});

// GET /api/users/:userId/service-requests - Fetch a user's submitted service requests
app.get('/api/users/:userId/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (req.params.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
  }

  try {
    const requestsSnapshot = await db.collection('service_requests')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const requests = [];

    for (const requestDoc of requestsSnapshot.docs) {
      const requestData = requestDoc.data();
      
      // Get service category data
      const categoryDoc = await db.collection('service_categories').doc(requestData.subcategory_id).get();
      const categoryData = categoryDoc.exists ? categoryDoc.data() : null;

      requests.push({
        id: requestDoc.id,
        userId: requestData.user_id,
        categoryId: requestData.subcategory_id,
        categoryName: categoryData ? categoryData.name : 'Unknown',
        fullName: requestData.full_name,
        email: requestData.email,
        phone: requestData.phone,
        company: requestData.company,
        website: requestData.website,
        projectDetails: requestData.project_details,
        budgetRange: requestData.budget_range,
        timeline: requestData.timeline,
        contactMethod: requestData.contact_method,
        additionalRequirements: requestData.additional_requirements,
        status: requestData.status,
        requestDate: firestoreToDate(requestData.created_at),
        updatedAt: firestoreToDate(requestData.updated_at)
      });
    }

    res.json(requests);
  } catch (error) {
    console.error('Error fetching user service requests:', error);
    res.status(500).json({ message: 'Failed to fetch your service requests.', error: error.message });
  }
});

// POST /api/service-requests - Submit a new service request
app.post('/api/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const {
    categoryId,
    fullName,
    email,
    phone,
    company,
    website,
    projectDetails,
    budgetRange,
    timeline,
    contactMethod,
    additionalRequirements
  } = req.body;

  // Validate required fields
  if (!userId || !categoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
    return res.status(400).json({ message: 'Missing required fields for service request. Please fill in all necessary details.' });
  }

  try {
    const requestData = {
      user_id: userId,
      subcategory_id: categoryId,
      full_name: fullName,
      email: email,
      phone: phone,
      company: company || null,
      website: website || null,
      project_details: projectDetails,
      budget_range: budgetRange,
      timeline: timeline,
      contact_method: contactMethod,
      additional_requirements: additionalRequirements || null,
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const requestDoc = await db.collection('service_requests').doc(generateId());
    await requestDoc.set(requestData);

    res.status(201).json({ message: 'Service request submitted successfully!', id: requestDoc.id });
  } catch (error) {
    console.error('Error submitting service request:', error);
    res.status(500).json({ message: 'Failed to submit service request. An internal server error occurred.', error: error.message });
  }
});

// ==================== CALENDAR EVENTS ROUTES ====================

// GET /api/calendar/events - Get all calendar events for current user
app.get('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get course start/end dates for enrolled courses
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .get();

    const courseEvents = [];
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data();
      const courseDoc = await db.collection('courses').doc(enrollmentData.course_id).get();
      
      if (courseDoc.exists) {
        const courseData = courseDoc.data();
        courseEvents.push({
          id: `course-${courseDoc.id}`,
          title: `Course: ${courseData.title}`,
          description: courseData.description || 'Course enrollment',
          date: firestoreToDate(courseData.created_at),
          type: 'course_start',
          course: {
            id: courseDoc.id,
            title: courseData.title,
            category: courseData.category
          },
          color: 'blue'
        });
      }
    }

    // Get assignment deadlines
    const assignmentEvents = [];
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data();
      const assignmentsSnapshot = await db.collection('assignments')
        .where('course_id', '==', enrollmentData.course_id)
        .get();

      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignmentData = assignmentDoc.data();
        const courseDoc = await db.collection('courses').doc(enrollmentData.course_id).get();
        const courseData = courseDoc.data();

        // Check for submission
        const submissionSnapshot = await db.collection('assignment_submissions')
          .where('assignment_id', '==', assignmentDoc.id)
          .where('user_id', '==', userId)
          .get();

        let status = 'pending';
        if (!submissionSnapshot.empty) {
          const submissionData = submissionSnapshot.docs[0].data();
          status = submissionData.status === 'graded' ? 'completed' : 'submitted';
        } else if (assignmentData.due_date && new Date(assignmentData.due_date.toDate()) < new Date()) {
          status = 'overdue';
        }

        assignmentEvents.push({
          id: `assignment-${assignmentDoc.id}`,
          title: assignmentData.title,
          description: assignmentData.description || 'Assignment due',
          date: firestoreToDate(assignmentData.due_date),
          type: 'assignment',
          course: {
            id: enrollmentData.course_id,
            title: courseData.title,
            category: courseData.category
          },
          status: status,
          color: status === 'completed' ? 'green' :
            status === 'overdue' ? 'red' : 'orange'
        });
      }
    }

    // Get custom calendar events
    const customEventsSnapshot = await db.collection('custom_calendar_events')
      .where('user_id', '==', userId)
      .where('event_date', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .orderBy('event_date', 'asc')
      .get();

    const customEvents = [];
    customEventsSnapshot.forEach(doc => {
      const eventData = doc.data();
      customEvents.push({
        id: `custom-${doc.id}`,
        title: eventData.title,
        description: eventData.description || '',
        date: firestoreToDate(eventData.event_date),
        time: eventData.event_time,
        type: eventData.event_type || 'custom',
        color: 'purple'
      });
    });

    // Combine all events
    const allEvents = [...courseEvents, ...assignmentEvents, ...customEvents];

    res.json(allEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
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

    const eventData = {
      user_id: userId,
      title: title,
      description: description || null,
      event_date: new Date(date),
      event_time: time || null,
      event_type: type,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const eventDoc = await db.collection('custom_calendar_events').doc(generateId());
    await eventDoc.set(eventData);

    res.status(201).json({
      id: eventDoc.id,
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

// ==================== COURSE ENROLLMENT REQUESTS ====================
app.post('/api/enroll-request', 
  authenticateToken, 
  paymentScreenshotUpload.single('paymentScreenshot'), 
  async (req, res) => {
    try {
      const userId = req.user ? req.user.id : null;
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

      const enrollRequestData = {
        user_id: userId,
        course_id: courseId,
        full_name: fullName,
        email: email,
        phone: phone,
        address: address,
        city: city,
        state: state,
        pincode: pincode,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        payment_screenshot: `/uploads/payments/${req.file.filename}`,
        status: 'pending',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };

      const requestDoc = await db.collection('course_enroll_requests').doc(generateId());
      await requestDoc.set(enrollRequestData);

      res.status(201).json({
        message: 'Enrollment request submitted successfully',
        requestId: requestDoc.id
      });

    } catch (error) {
      console.error('Enrollment request error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
);

// ==================== INTERNSHIPS ROUTES ====================

// GET /api/internships - Fetch all internships
app.get('/api/internships', async (req, res) => {
  try {
    const internshipsSnapshot = await db.collection('internships')
      .orderBy('posted_at', 'desc')
      .get();

    const internships = [];
    internshipsSnapshot.forEach(doc => {
      const internshipData = doc.data();
      internships.push({
        ...internshipData,
        id: doc.id,
        requirements: internshipData.requirements || [],
        benefits: internshipData.benefits || [],
        posted_at: firestoreToDate(internshipData.posted_at)
      });
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
    const submissionsSnapshot = await db.collection('internship_submissions')
      .where('user_id', '==', userId)
      .orderBy('submitted_at', 'desc')
      .get();

    const applications = [];

    for (const submissionDoc of submissionsSnapshot.docs) {
      const submissionData = submissionDoc.data();
      
      const internshipDoc = await db.collection('internships').doc(submissionData.internship_id).get();
      const internshipData = internshipDoc.exists ? internshipDoc.data() : null;

      if (internshipData) {
        applications.push({
          submission_id: submissionDoc.id,
          submitted_at: firestoreToDate(submissionData.submitted_at),
          status: submissionData.status,
          resume_url: submissionData.resume_url,
          cover_letter: submissionData.cover_letter,
          internship_id: submissionData.internship_id,
          title: internshipData.title,
          company: internshipData.company,
          location: internshipData.location,
          duration: internshipData.duration,
          type: internshipData.type,
          level: internshipData.level,
          description: internshipData.description,
          requirements: internshipData.requirements || [],
          benefits: internshipData.benefits || [],
          applications_count: internshipData.applications_count,
          spots_available: internshipData.spots_available,
          internship_posted_at: firestoreToDate(internshipData.posted_at)
        });
      }
    }

    res.json(applications);
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

    const internshipData = internshipDoc.data();
    
    if (internshipData.spots_available <= 0) {
      return res.status(400).json({ message: 'No available spots left for this internship.' });
    }

    // Check if already applied
    const existingApplication = await db.collection('internship_submissions')
      .where('internship_id', '==', internshipId)
      .where('user_id', '==', userId)
      .get();

    if (!existingApplication.empty) {
      return res.status(409).json({ message: 'You have already applied for this internship.' });
    }

    // Create application
    const applicationData = {
      internship_id: internshipId,
      user_id: userId,
      full_name: full_name,
      email: email,
      phone: phone || null,
      resume_url: resume_url,
      cover_letter: cover_letter || null,
      status: 'pending',
      submitted_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('internship_submissions').doc(generateId()).set(applicationData);

    // Update internship spots and applications count
    await db.collection('internships').doc(internshipId).update({
      spots_available: admin.firestore.FieldValue.increment(-1),
      applications_count: admin.firestore.FieldValue.increment(1)
    });

    res.status(201).json({ message: 'Internship application submitted successfully!' });

  } catch (error) {
    console.error('Error submitting internship application:', error);
    res.status(500).json({ message: 'Internal server error during application submission.' });
  }
});

// ==================== CERTIFICATES ROUTES ====================

// Get user's certificates
app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const certificatesSnapshot = await db.collection('certificates')
      .where('user_id', '==', userId)
      .orderBy('issued_date', 'desc')
      .get();

    const certificates = [];

    for (const certificateDoc of certificatesSnapshot.docs) {
      const certificateData = certificateDoc.data();
      
      // Get course data
      const courseDoc = await db.collection('courses').doc(certificateData.course_id).get();
      const courseData = courseDoc.exists ? courseDoc.data() : null;

      // Get enrollment data
      const enrollmentSnapshot = await db.collection('enrollments')
        .where('user_id', '==', userId)
        .where('course_id', '==', certificateData.course_id)
        .get();

      let enrollmentData = null;
      if (!enrollmentSnapshot.empty) {
        enrollmentData = enrollmentSnapshot.docs[0].data();
      }

      // Calculate final grade from assignment submissions
      const assignmentsSnapshot = await db.collection('assignments')
        .where('course_id', '==', certificateData.course_id)
        .get();

      let totalGrade = 0;
      let assignmentCount = 0;

      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const submissionSnapshot = await db.collection('assignment_submissions')
          .where('assignment_id', '==', assignmentDoc.id)
          .where('user_id', '==', userId)
          .get();

        if (!submissionSnapshot.empty) {
          const submissionData = submissionSnapshot.docs[0].data();
          if (submissionData.grade !== null) {
            totalGrade += submissionData.grade;
            assignmentCount++;
          }
        }
      }

      const finalGrade = assignmentCount > 0 ? Math.round(totalGrade / assignmentCount) : 0;

      certificates.push({
        id: certificateDoc.id,
        userId: certificateData.user_id,
        courseId: certificateData.course_id,
        certificateUrl: certificateData.certificate_url,
        issuedDate: firestoreToDate(certificateData.issued_date),
        course: courseData ? {
          id: certificateData.course_id,
          title: courseData.title,
          description: courseData.description,
          instructorName: courseData.instructor_name,
          category: courseData.category,
          difficultyLevel: courseData.difficulty_level
        } : null,
        enrollment: enrollmentData ? {
          completionDate: firestoreToDate(enrollmentData.completion_date),
          finalGrade: finalGrade,
          status: enrollmentData.status
        } : null
      });
    }

    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// ==================== RESOURCES ROUTES ====================

// Get resources for current user
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const accountType = req.user.account_type;

    const resourcesSnapshot = await db.collection('resources')
      .where('allowed_account_types', 'array-contains', accountType)
      .orderBy('created_at', 'desc')
      .get();

    const resources = [];
    resourcesSnapshot.forEach(doc => {
      const resourceData = doc.data();
      resources.push({
        id: doc.id,
        title: resourceData.title,
        description: resourceData.description,
        type: resourceData.type,
        size: resourceData.size,
        url: resourceData.url,
        category: resourceData.category,
        icon_name: resourceData.icon_name,
        button_color: resourceData.button_color,
        allowed_account_types: resourceData.allowed_account_types,
        is_premium: resourceData.is_premium,
        created_at: firestoreToDate(resourceData.created_at),
        updated_at: firestoreToDate(resourceData.updated_at)
      });
    });

    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
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

    const contactData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      company: company || null,
      message: message.trim(),
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const contactDoc = await db.collection('contact_messages').doc(generateId());
    await contactDoc.set(contactData);

    console.log('Contact message saved successfully:', {
      id: contactDoc.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim()
    });

    res.status(201).json({
      message: 'Contact message sent successfully',
      contactId: contactDoc.id
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total users
    const usersSnapshot = await db.collection('users')
      .where('is_active', '==', true)
      .get();
    const totalUsers = usersSnapshot.size;

    // Get total courses
    const coursesSnapshot = await db.collection('courses')
      .where('is_active', '==', true)
      .get();
    const totalCourses = coursesSnapshot.size;

    // Get total enrollments
    const enrollmentsSnapshot = await db.collection('enrollments').get();
    const totalEnrollments = enrollmentsSnapshot.size;

    // Calculate total revenue (mock calculation)
    let totalRevenue = 0;
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data();
      if (enrollmentData.status === 'completed') {
        const courseDoc = await db.collection('courses').doc(enrollmentData.course_id).get();
        if (courseDoc.exists) {
          const courseData = courseDoc.data();
          totalRevenue += parseFloat(courseData.price || 0);
        }
      }
    }

    // Get pending contacts (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const contactsSnapshot = await db.collection('contact_messages')
      .where('created_at', '>=', weekAgo)
      .get();
    const pendingContacts = contactsSnapshot.size;

    // Get pending service requests
    const serviceRequestsSnapshot = await db.collection('service_requests')
      .where('status', '==', 'pending')
      .get();
    const pendingServiceRequests = serviceRequestsSnapshot.size;

    res.json({
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      pendingContacts,
      pendingServiceRequests
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const accountType = req.query.accountType;
    const status = req.query.status;
    const search = req.query.search;

    let usersQuery = db.collection('users');

    // Add filters
    if (accountType && accountType !== 'all') {
      usersQuery = usersQuery.where('account_type', '==', accountType);
    }

    if (status && status !== 'all') {
      const isActive = status === 'active';
      usersQuery = usersQuery.where('is_active', '==', isActive);
    }

    // Get users with pagination
    const usersSnapshot = await usersQuery
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit)
      .get();

    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      
      // Apply search filter in memory (Firestore doesn't support complex text search)
      if (search) {
        const searchTerm = search.toLowerCase();
        const fullName = `${userData.first_name} ${userData.last_name}`.toLowerCase();
        const email = userData.email.toLowerCase();
        
        if (!fullName.includes(searchTerm) && !email.includes(searchTerm)) {
          return;
        }
      }

      users.push({
        id: doc.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone,
        account_type: userData.account_type,
        profile_image: userData.profile_image,
        company: userData.company,
        website: userData.website,
        bio: userData.bio,
        is_active: userData.is_active,
        email_verified: userData.email_verified,
        created_at: firestoreToDate(userData.created_at),
        updated_at: firestoreToDate(userData.updated_at)
      });
    });

    // Get total count (simplified - in production you'd want better pagination)
    const totalSnapshot = await db.collection('users').get();
    const totalUsers = totalSnapshot.size;
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users: users,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalUsers: totalUsers,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== PAYMENTS ROUTES ====================

// Upload payment proof
app.post('/api/payments/upload-proof', authenticateToken, paymentProofUpload.single('file'), async (req, res) => {
  try {
    const { transaction_id, payment_method, resource_id, plan, amount, user_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Payment proof file is required' });
    }

    if (!transaction_id) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const paymentData = {
      user_id: user_id,
      resource_id: resource_id || null,
      plan: plan,
      amount: amount,
      payment_method: payment_method,
      transaction_id: transaction_id,
      proof_file: req.file.filename,
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      verified_at: null
    };

    const paymentDoc = await db.collection('payments').doc(generateId());
    await paymentDoc.set(paymentData);

    res.json({ 
      message: 'Payment proof uploaded successfully', 
      paymentId: paymentDoc.id 
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ error: 'Failed to upload payment proof' });
  }
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
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔥 Using Firebase Firestore Database`);
});

module.exports = app;