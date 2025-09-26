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

// Firebase Admin SDK initialization
const admin = require('firebase-admin');

const serviceAccount = {
  "type": "service_account",
  "project_id": "startup-dbs-1",
  "private_key_id": "379e14e75ef08331690e76197c989e62252e8f9f",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC8QMKq9c3jxxHw\nIRXDKF07ndJr0ju76IT5Iz2v6IXuBqxAMHej8mGm4mx5c/iA9J5tJ/p5DQylCL3s\nhnOyow6UVvaF2a6qcVic+nx4FeWFmXjn1kjmPZ8ARcQLco1UDGt2dx279AYDFb63\nsqqdDTnw5kGPfLK0HNz8OoWntRjuNPefRZ/XwnFSGg41dPFtUQKQ0Wkg6z6TWHmK\nY9o4TcRBvNA3ujLoE3988x6DCQaidX5O4LC3CqsU03YCJaZ//47gcVp3laj8v5LX\nqoXp0Oa+UOVq+3xudbzHHGC1ixoqSpXfcGo/n0MPudK0ezkpBgYNS/N5+De1kwUP\n+/3q2g1RAgMBAAECggEAAbVHNLnCNluIvFSM4pdkk/YwxcjsVHeAsCm4WSlG2dKz\nhoirBME3L+N6F35j0GEQkBa3+O1shVOeLS9IhZ4jab4orx1puh0gamQaDw1toNrP\ncUsz/VBICRnTIw8mnq4c5YH+XSaDNi4LjtQGYq4He4OXs6JuhXWFhoXheeJPw6TQ\nSH22RlYnjSRhsWpVojHVrSgyF4+Jqvv+eN3gOX3HHjv0XoTVSmFjQDj0bncv8Xa6\n39tP0NdMjkjo6DaaFDVifu9/wP+D0iKi+q0L/U3XQKxHMOhq4tOb9XNheY02z3RI\nU69Rr3Xnqu8myldbDMKpNbqxXQWAT73bW3S+VYnOLwKBgQDkxjsBXcn6GBMdGV1c\njl9F6i3M+GSJR5tApjoEPBerahL0eszxF5DLZVm2z5+2em4Zc6HV4aAmnTTVc2nJ\nwvMCRVL4R2gCs8t5XlmGHNSsVqzxIb1xILzQkgA+Flgr5oA9BpDorunm+Ea7EBYM\n/YewTi6Q+bTLuXVSH7CQzKBZBwKBgQDSqASsWV4UlCfB2SMIt1T9tNDmwo7oIamj\n1WwPxo3GY6GCpD4BqYZ+00aY4LhAhyeK7om9kLoxLkd1cpc1dVO1r4EuVU7HSnWC\nEA9ZDREEmVMJ8k42KFlLCT3P1m5O85DU/WwzK99ywXw5tRHfBu1inhsOLhG7OTiG\nFxgwULKI5wKBgQCkN1L1mSA5gHx/38wvexcSdZWo0wg/roHX9zof/g6zgbHXgiqI\nSPUruzWZzxGDCADuDh22DH5MGX5qVa0zIdgT4jU7eO5FOlAtb7dtWFak2pbLg/+b\nK/e884BvENT7tjqJE6SDEcNegwsqjdJ2QqrauFQexs+riRWY/JxeZDQZkwKBgQC6\ndYAVcdEFlBIQ0nrhJy1yl87kwsetjsZSPwG0gQJS3TNDqM89t2lV7vqpLRfJ/hex\nMOz4vxcfmyAjRDe1WNGsmtlUQqxFWJHkewSqxRcQJArNXg1+gH5xHY/53IqtFYhY\nDqzsKmRRdhPYHH7iE4ahaOL3zS1itAZlIiIF+hfddwKBgGpAx336Vg4zana4957d\n/iw9YrVkcZrH9h9naIYPPVndvIi8TDpMQAHrzQFFNdEM2vBgTLNGr008eXVFsjvd\nSU8fDl0jaxvQcfRcq1q4yRiwSmxt0WGzsK32F1UFknZOXEc47dcVoqWHNrtvSZOp\nRTQmoD23+iHGv75ueRYOlRQK\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@startup-dbs-1.iam.gserviceaccount.com",
  "client_id": "110678261411363611678",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40startup-dbs-1.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Firestore Collection References
const collections = {
  users: db.collection('users'),
  userStats: db.collection('user_stats'),
  courses: db.collection('courses'),
  enrollments: db.collection('enrollments'),
  assignments: db.collection('assignments'),
  assignmentSubmissions: db.collection('assignment_submissions'),
  certificates: db.collection('certificates'),
  serviceCategories: db.collection('service_categories'),
  serviceSubcategories: db.collection('service_subcategories'),
  serviceRequests: db.collection('service_requests'),
  socialActivities: db.collection('social_activities'),
  internshipSubmissions: db.collection('internship_submissions'),
  internships: db.collection('internships'),
  contactMessages: db.collection('contact_messages'),
  payments: db.collection('payments'),
  resources: db.collection('resources'),
  downloadLogs: db.collection('download_logs'),
  customCalendarEvents: db.collection('custom_calendar_events'),
  courseEnrollRequests: db.collection('course_enroll_requests')
};

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Create necessary directories
const assignmentsDir = path.join(__dirname, 'uploads', 'assignments');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });

const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const paymentsDir = path.join(__dirname, 'uploads', 'payments');
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

// Multer configurations (same as before)
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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatars'));
    }
  }
});

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
  limits: { fileSize: 10 * 1024 * 1024 },
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

const paymentProofStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads', 'payments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `payment-proof-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const paymentProofUpload = multer({
  storage: paymentProofStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads', 'avatars')));

// ======== FIREBASE UTILITY FUNCTIONS ========

// Generate unique ID (similar to MySQL auto-increment but using Firestore's auto-ID)
const generateId = () => admin.firestore().collection('temp').doc().id;

// Convert MySQL timestamp to Firestore timestamp
const getFirestoreTimestamp = () => admin.firestore.Timestamp.now();

// Convert Firestore timestamp to JavaScript Date
const convertTimestamp = (timestamp) => timestamp ? timestamp.toDate() : null;

// Pagination helper
const paginateQuery = async (query, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const snapshot = await query.limit(limit).offset(offset).get();
  const totalSnapshot = await query.count().get();
  
  return {
    data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    total: totalSnapshot.data().count,
    page,
    limit,
    totalPages: Math.ceil(totalSnapshot.data().count / limit)
  };
};

// ======== AUTHENTICATION MIDDLEWARE ========

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
    const userDoc = await collections.users.doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userData = userDoc.data();
    if (!userData.is_active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    req.user = { id: userDoc.id, ...userData };
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
    const emailQuery = await collections.users.where('email', '==', email).get();
    if (!emailQuery.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user document
    const userRef = collections.users.doc();
    const userData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      password_hash: hashedPassword,
      account_type: accountType || 'student',
      profile_image: null,
      company: null,
      website: null,
      bio: null,
      is_active: true,
      email_verified: false,
      created_at: getFirestoreTimestamp(),
      updated_at: getFirestoreTimestamp(),
      last_login: null
    };

    await userRef.set(userData);

    // Create user stats entry
    const statsRef = collections.userStats.doc(userRef.id);
    await statsRef.set({
      user_id: userRef.id,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: getFirestoreTimestamp(),
      created_at: getFirestoreTimestamp(),
      updated_at: getFirestoreTimestamp()
    });

    console.log('User registered successfully:', { userId: userRef.id, email });
    res.status(201).json({
      message: 'User registered successfully',
      userId: userRef.id
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
    const userQuery = await collections.users
      .where('email', '==', email)
      .where('is_active', '==', true)
      .get();

    if (userQuery.empty) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const userDoc = userQuery.docs[0];
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
        userId: userDoc.id,
        email: user.email,
        accountType: user.account_type
      },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // Update last login timestamp
    await collections.users.doc(userDoc.id).update({
      updated_at: getFirestoreTimestamp(),
      last_login: getFirestoreTimestamp()
    });

    console.log('User logged in successfully:', { userId: userDoc.id, email: user.email });

    // Send success response
    res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
        id: userDoc.id,
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
        createdAt: convertTimestamp(user.created_at),
        updatedAt: convertTimestamp(user.updated_at)
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
      createdAt: convertTimestamp(user.created_at),
      updatedAt: convertTimestamp(user.updated_at)
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

    await collections.users.doc(userId).update({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      company: company,
      website: website,
      bio: bio,
      updated_at: getFirestoreTimestamp()
    });

    // Get updated user data
    const userDoc = await collections.users.doc(userId).get();
    const user = { id: userDoc.id, ...userDoc.data() };

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
      createdAt: convertTimestamp(user.created_at),
      updatedAt: convertTimestamp(user.updated_at)
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

    await collections.users.doc(userId).update({
      profile_image: profileImage,
      updated_at: getFirestoreTimestamp()
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

    const statsDoc = await collections.userStats.doc(userId).get();
    
    if (!statsDoc.exists) {
      // Create default stats if not exists
      const defaultStats = {
        user_id: userId,
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        last_activity: getFirestoreTimestamp(),
        created_at: getFirestoreTimestamp(),
        updated_at: getFirestoreTimestamp()
      };
      
      await collections.userStats.doc(userId).set(defaultStats);
      
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
        lastActivity: convertTimestamp(userStats.last_activity).toISOString()
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
    const coursesSnapshot = await collections.courses
      .where('is_active', '==', true)
      .orderBy('created_at', 'desc')
      .get();

    const courses = coursesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        instructorName: data.instructor_name,
        durationWeeks: data.duration_weeks,
        difficultyLevel: data.difficulty_level,
        category: data.category,
        price: data.price !== null ? `₹${parseFloat(data.price).toFixed(2)}` : '₹0.00',
        thumbnail: data.thumbnail,
        isActive: data.is_active
      };
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

    const enrollmentsSnapshot = await collections.enrollments
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .orderBy('enrollment_date', 'desc')
      .get();

    const enrollments = await Promise.all(
      enrollmentsSnapshot.docs.map(async (doc) => {
        const enrollment = doc.data();
        const courseDoc = await collections.courses.doc(enrollment.course_id).get();
        
        if (!courseDoc.exists) {
          return null;
        }

        const course = courseDoc.data();
        return {
          id: doc.id,
          userId: enrollment.user_id,
          courseId: enrollment.course_id,
          progress: enrollment.progress,
          enrollmentDate: convertTimestamp(enrollment.enrollment_date),
          completionDate: convertTimestamp(enrollment.completion_date),
          status: enrollment.status,
          course: {
            id: enrollment.course_id,
            title: course.title,
            description: course.description,
            instructorName: course.instructor_name,
            durationWeeks: course.duration_weeks,
            difficultyLevel: course.difficulty_level,
            category: course.category,
            price: course.price,
            thumbnail: course.thumbnail,
            isActive: course.is_active
          }
        };
      })
    );

    res.json(enrollments.filter(e => e !== null));

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
    const existingEnrollment = await collections.enrollments
      .where('user_id', '==', userId)
      .where('course_id', '==', courseId)
      .get();

    if (!existingEnrollment.empty) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const courseDoc = await collections.courses.doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const courseData = courseDoc.data();
    if (!courseData.is_active) {
      return res.status(400).json({ error: 'Course is not active' });
    }

    // Create enrollment
    const enrollmentRef = collections.enrollments.doc();
    await enrollmentRef.set({
      user_id: userId,
      course_id: courseId,
      progress: 0,
      enrollment_date: getFirestoreTimestamp(),
      completion_date: null,
      status: 'active',
      created_at: getFirestoreTimestamp(),
      updated_at: getFirestoreTimestamp()
    });

    // Update user stats
    const statsDoc = await collections.userStats.doc(userId).get();
    if (statsDoc.exists) {
      const stats = statsDoc.data();
      await collections.userStats.doc(userId).update({
        courses_enrolled: (stats.courses_enrolled || 0) + 1,
        updated_at: getFirestoreTimestamp()
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

    // Get user's enrolled courses
    const enrollmentsSnapshot = await collections.enrollments
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .get();

    const courseIds = enrollmentsSnapshot.docs.map(doc => doc.data().course_id);

    if (courseIds.length === 0) {
      return res.json([]);
    }

    // Get assignments for enrolled courses
    const assignmentsSnapshot = await collections.assignments
      .where('course_id', 'in', courseIds)
      .orderBy('due_date', 'asc')
      .get();

    const assignments = await Promise.all(
      assignmentsSnapshot.docs.map(async (doc) => {
        const assignment = doc.data();
        
        // Get course details
        const courseDoc = await collections.courses.doc(assignment.course_id).get();
        if (!courseDoc.exists) {
          return null;
        }
        const course = courseDoc.data();

        // Get submission if exists
        const submissionQuery = await collections.assignmentSubmissions
          .where('assignment_id', '==', doc.id)
          .where('user_id', '==', userId)
          .get();

        const submission = submissionQuery.empty ? null : {
          id: submissionQuery.docs[0].id,
          ...submissionQuery.docs[0].data()
        };

        return {
          id: doc.id,
          course_id: assignment.course_id,
          title: assignment.title,
          description: assignment.description,
          due_date: convertTimestamp(assignment.due_date),
          max_points: assignment.max_points,
          created_at: convertTimestamp(assignment.created_at),
          course: {
            id: assignment.course_id,
            title: course.title,
            category: course.category
          },
          submission: submission ? {
            id: submission.id,
            content: submission.content,
            file_path: submission.file_path,
            submitted_at: convertTimestamp(submission.submitted_at),
            grade: submission.grade,
            feedback: submission.feedback,
            status: submission.status
          } : null
        };
      })
    );

    res.json(assignments.filter(a => a !== null));

  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Submit assignment
app.post('/api/assignments/submit', authenticateToken, assignmentUpload.single('file'), async (req, res) => {
  try {
    const { assignment_id, content } = req.body;
    const file_path = req.file ? req.file.filename : null;
    const userId = req.user.id;

    if (!assignment_id) {
      return res.status(400).json({ error: 'Assignment ID is required' });
    }

    if (!content && !file_path) {
      return res.status(400).json({ error: 'Either content or file is required' });
    }

    // Check if assignment exists and user is enrolled
    const assignmentDoc = await collections.assignments.doc(assignment_id).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentDoc.data();
    const enrollmentQuery = await collections.enrollments
      .where('user_id', '==', userId)
      .where('course_id', '==', assignment.course_id)
      .where('status', '==', 'active')
      .get();

    if (enrollmentQuery.empty) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Check if already submitted
    const existingSubmission = await collections.assignmentSubmissions
      .where('assignment_id', '==', assignment_id)
      .where('user_id', '==', userId)
      .get();

    if (!existingSubmission.empty) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }

    // Create submission
    const submissionRef = collections.assignmentSubmissions.doc();
    await submissionRef.set({
      assignment_id: assignment_id,
      user_id: userId,
      content: content || '',
      file_path: file_path,
      submitted_at: getFirestoreTimestamp(),
      grade: null,
      feedback: null,
      status: 'submitted',
      created_at: getFirestoreTimestamp(),
      updated_at: getFirestoreTimestamp()
    });

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission_id: submissionRef.id
    });

  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// ==================== CERTIFICATES ROUTES ====================

// Get user's certificates
app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const certificatesSnapshot = await collections.certificates
      .where('user_id', '==', userId)
      .orderBy('issued_date', 'desc')
      .get();

    const certificates = await Promise.all(
      certificatesSnapshot.docs.map(async (doc) => {
        const cert = doc.data();
        
        // Get course details
        const courseDoc = await collections.courses.doc(cert.course_id).get();
        if (!courseDoc.exists) {
          return null;
        }
        const course = courseDoc.data();

        // Get enrollment details
        const enrollmentQuery = await collections.enrollments
          .where('user_id', '==', userId)
          .where('course_id', '==', cert.course_id)
          .get();

        const enrollment = enrollmentQuery.empty ? null : enrollmentQuery.docs[0].data();

        // Calculate average grade from submissions
        const assignmentsQuery = await collections.assignments
          .where('course_id', '==', cert.course_id)
          .get();

        const assignmentIds = assignmentsQuery.docs.map(d => d.id);
        
        let finalGrade = 0;
        if (assignmentIds.length > 0) {
          const submissionsQuery = await collections.assignmentSubmissions
            .where('assignment_id', 'in', assignmentIds)
            .where('user_id', '==', userId)
            .where('grade', '!=', null)
            .get();

          const grades = submissionsQuery.docs.map(d => d.data().grade).filter(g => g !== null);
          finalGrade = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
        }

        return {
          id: doc.id,
          userId: cert.user_id,
          courseId: cert.course_id,
          certificateUrl: cert.certificate_url,
          issuedDate: convertTimestamp(cert.issued_date),
          course: {
            id: cert.course_id,
            title: course.title,
            description: course.description,
            instructorName: course.instructor_name,
            category: course.category,
            difficultyLevel: course.difficulty_level
          },
          enrollment: {
            completionDate: enrollment ? convertTimestamp(enrollment.completion_date) : null,
            finalGrade: Math.round(finalGrade),
            status: enrollment ? enrollment.status : 'unknown'
          }
        };
      })
    );

    res.json(certificates.filter(c => c !== null));

  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// ==================== SERVICES ROUTES ====================

// Get service categories
app.get('/api/services/categories', async (req, res) => {
  try {
    const categoriesSnapshot = await collections.serviceCategories
      .where('is_active', '==', true)
      .orderBy('name')
      .get();

    const categories = await Promise.all(
      categoriesSnapshot.docs.map(async (doc) => {
        const category = doc.data();
        
        const subcategoriesSnapshot = await collections.serviceSubcategories
          .where('category_id', '==', doc.id)
          .where('is_active', '==', true)
          .orderBy('name')
          .get();

        return {
          id: doc.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          subcategories: subcategoriesSnapshot.docs.map(subDoc => {
            const sub = subDoc.data();
            return {
              id: subDoc.id,
              categoryId: sub.category_id,
              name: sub.name,
              description: sub.description,
              basePrice: sub.base_price
            };
          })
        };
      })
    );

    res.json(categories);

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
    const subcategoryDoc = await collections.serviceSubcategories.doc(subcategoryId).get();
    if (!subcategoryDoc.exists) {
      return res.status(404).json({ error: 'Service subcategory not found' });
    }

    // Create service request
    const requestRef = collections.serviceRequests.doc();
    await requestRef.set({
      user_id: userId,
      subcategory_id: subcategoryId,
      full_name: fullName,
      email: email,
      phone: phone,
      company: company,
      website: website,
      project_details: projectDetails,
      budget_range: budgetRange,
      timeline: timeline,
      contact_method: contactMethod,
      additional_requirements: additionalRequirements,
      status: 'pending',
      created_at: getFirestoreTimestamp(),
      updated_at: getFirestoreTimestamp()
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

// ==================== ADMIN DASHBOARD ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsersSnapshot,
      totalCoursesSnapshot,
      totalEnrollmentsSnapshot,
      pendingServiceRequestsSnapshot
    ] = await Promise.all([
      collections.users.where('is_active', '==', true).count().get(),
      collections.courses.where('is_active', '==', true).count().get(),
      collections.enrollments.count().get(),
      collections.serviceRequests.where('status', '==', 'pending').count().get()
    ]);

    // Calculate revenue from completed enrollments
    const enrollmentsSnapshot = await collections.enrollments
      .where('status', '==', 'completed')
      .get();

    let totalRevenue = 0;
    for (const doc of enrollmentsSnapshot.docs) {
      const enrollment = doc.data();
      const courseDoc = await collections.courses.doc(enrollment.course_id).get();
      if (courseDoc.exists) {
        totalRevenue += parseFloat(courseDoc.data().price) || 0;
      }
    }

    // Recent contacts (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentContactsSnapshot = await collections.contactMessages
      .where('created_at', '>=', admin.firestore.Timestamp.fromDate(oneWeekAgo))
      .count()
      .get();

    res.json({
      totalUsers: totalUsersSnapshot.data().count,
      totalCourses: totalCoursesSnapshot.data().count,
      totalEnrollments: totalEnrollmentsSnapshot.data().count,
      totalRevenue: totalRevenue,
      pendingContacts: recentContactsSnapshot.data().count,
      pendingServiceRequests: pendingServiceRequestsSnapshot.data().count
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
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

    let query = collections.users;

    // Apply filters
    if (accountType && accountType !== 'all') {
      query = query.where('account_type', '==', accountType);
    }

    if (status && status !== 'all') {
      const isActive = status === 'active';
      query = query.where('is_active', '==', isActive);
    }

    // Note: Firestore doesn't support OR queries or full-text search natively
    // For search, we'd need to use a more advanced solution like Algolia
    // For now, we'll fetch all and filter in memory (not ideal for large datasets)
    
    const snapshot = await query.orderBy('created_at', 'desc').get();
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply search filter in memory
    if (search) {
      users = users.filter(user => 
        user.first_name.toLowerCase().includes(search.toLowerCase()) ||
        user.last_name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Manual pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      users: paginatedUsers.map(user => ({
        ...user,
        created_at: convertTimestamp(user.created_at),
        updated_at: convertTimestamp(user.updated_at)
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(users.length / limit),
        totalUsers: users.length,
        hasNextPage: endIndex < users.length,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
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

    // Save contact message
    const contactRef = collections.contactMessages.doc();
    await contactRef.set({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      company: company || null,
      message: message.trim(),
      status: 'pending',
      created_at: getFirestoreTimestamp(),
      updated_at: getFirestoreTimestamp()
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

// ==================== RESOURCES ROUTES ====================

// GET resources for current user
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const accountType = req.user.account_type;

    // Get all resources that are allowed for this account type
    const resourcesSnapshot = await collections.resources
      .where('allowed_account_types', 'array-contains', accountType)
      .orderBy('created_at', 'desc')
      .get();

    const resources = resourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// ==================== INTERNSHIPS ROUTES ====================

// GET all internships
app.get('/api/internships', async (req, res) => {
  try {
    const internshipsSnapshot = await collections.internships
      .orderBy('posted_at', 'desc')
      .get();

    const internships = internshipsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requirements: doc.data().requirements || [],
      benefits: doc.data().benefits || []
    }));

    res.json(internships);
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ message: 'Internal server error while fetching internships.' });
  }
});

// POST apply for internship
app.post('/api/internships/:id/apply', authenticateToken, async (req, res) => {
  const internshipId = req.params.id;
  const { full_name, email, resume_url, cover_letter } = req.body;
  const userId = req.user.id;

  if (!full_name || !email || !resume_url) {
    return res.status(400).json({ message: 'Full name, email, and resume link are required.' });
  }

  const batch = db.batch();

  try {
    // Get internship with transaction-like consistency
    const internshipDoc = await collections.internships.doc(internshipId).get();
    if (!internshipDoc.exists) {
      return res.status(404).json({ message: 'Internship not found.' });
    }

    const internship = internshipDoc.data();
    if (internship.spots_available <= 0) {
      return res.status(400).json({ message: 'No available spots left for this internship.' });
    }

    // Check for existing application
    const existingApplication = await collections.internshipSubmissions
      .where('internship_id', '==', internshipId)
      .where('user_id', '==', userId)
      .get();

    if (!existingApplication.empty) {
      return res.status(409).json({ message: 'You have already applied for this internship.' });
    }

    // Create application
    const applicationRef = collections.internshipSubmissions.doc();
    batch.set(applicationRef, {
      internship_id: internshipId,
      user_id: userId,
      full_name: full_name,
      email: email,
      resume_url: resume_url,
      cover_letter: cover_letter || null,
      status: 'pending',
      submitted_at: getFirestoreTimestamp(),
      created_at: getFirestoreTimestamp()
    });

    // Update internship spots
    batch.update(collections.internships.doc(internshipId), {
      spots_available: internship.spots_available - 1,
      applications_count: (internship.applications_count || 0) + 1
    });

    await batch.commit();

    res.status(201).json({ message: 'Internship application submitted successfully!' });

  } catch (error) {
    console.error('Error submitting internship application:', error);
    res.status(500).json({ message: 'Internal server error during application submission.' });
  }
});

// ==================== COURSE ENROLLMENT REQUEST ====================

app.post('/api/enroll-request', 
  authenticateToken, 
  paymentProofUpload.single('paymentScreenshot'), 
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

      // Create enrollment request
      const requestRef = collections.courseEnrollRequests.doc();
      await requestRef.set({
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
        created_at: getFirestoreTimestamp(),
        updated_at: getFirestoreTimestamp()
      });

      res.status(201).json({
        message: 'Enrollment request submitted successfully',
        requestId: requestRef.id
      });

    } catch (error) {
      console.error('Enrollment request error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
);

// ==================== ADDITIONAL ADMIN ENDPOINTS ====================

// Admin service requests
app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requestsSnapshot = await collections.serviceRequests
      .orderBy('created_at', 'desc')
      .get();

    const requests = await Promise.all(
      requestsSnapshot.docs.map(async (doc) => {
        const request = doc.data();
        
        // Get subcategory details
        const subcategoryDoc = await collections.serviceSubcategories.doc(request.subcategory_id).get();
        const subcategory = subcategoryDoc.exists ? subcategoryDoc.data() : { name: 'Unknown' };

        // Get user details if available
        let userDetails = {};
        if (request.user_id) {
          const userDoc = await collections.users.doc(request.user_id).get();
          if (userDoc.exists) {
            const user = userDoc.data();
            userDetails = {
              user_first_name: user.first_name,
              user_last_name: user.last_name,
              user_account_type: user.account_type
            };
          }
        }

        return {
          id: doc.id,
          name: request.full_name,
          service: subcategory.name,
          date: convertTimestamp(request.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: request.status,
          email: request.email,
          phone: request.phone,
          company: request.company,
          website: request.website,
          project_details: request.project_details,
          budget_range: request.budget_range,
          timeline: request.timeline,
          contact_method: request.contact_method,
          additional_requirements: request.additional_requirements,
          user_id: request.user_id,
          ...userDetails
        };
      })
    );

    res.json(requests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests' });
  }
});

// Update service request status
app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await collections.serviceRequests.doc(id).update({
      status: status,
      updated_at: getFirestoreTimestamp()
    });

    res.json({ message: 'Service request updated successfully' });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ error: 'Failed to update service request' });
  }
});

// ==================== UTILITY ROUTES ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'Firebase Firestore'
  });
});

// Get server info
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Padak Dashboard API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'Firebase Firestore',
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

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==================== SERVER STARTUP ====================

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: Firebase Firestore`);
});

module.exports = app;