// server.js - Firebase Client SDK Version
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Firebase Client SDK
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, writeBatch, serverTimestamp, increment, arrayUnion, arrayRemove } = require('firebase/firestore');

const app = express();
const port = process.env.PORT || 5000;

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4uHspTDS-8kIT2HsmPFGL9JNNBvI6NI4",
  authDomain: "startup-dbs-1.firebaseapp.com",
  projectId: "startup-dbs-1",
  storageBucket: "startup-dbs-1.firebasestorage.app",
  messagingSenderId: "70939047801",
  appId: "1:70939047801:web:08a6a9d17f6b63af9261a8"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

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
    const testRef = doc(db, 'test', 'connection');
    await updateDoc(testRef, { 
      test: true, 
      timestamp: serverTimestamp() 
    }).catch(async () => {
      await addDoc(collection(db, 'test'), { 
        test: true, 
        timestamp: serverTimestamp() 
      });
    });
    console.log('Connected to Firestore successfully');
    await deleteDoc(testRef).catch(() => {}); // Clean up
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
    const userDocRef = doc(db, 'users', decoded.userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists() || !userDoc.data().is_active) {
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
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.trim()));
    const existingUsers = await getDocs(q);

    if (!existingUsers.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

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
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const userDocRef = await addDoc(usersRef, userData);

    // Create user stats document
    const userStatsData = {
      user_id: userDocRef.id,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: serverTimestamp()
    };

    await addDoc(collection(db, 'user_stats'), userStatsData);

    console.log('User registered successfully:', { userId: userDocRef.id, email });
    res.status(201).json({
      message: 'User registered successfully',
      userId: userDocRef.id
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
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('email', '==', email),
      where('is_active', '==', true)
    );
    const userSnapshot = await getDocs(q);

    if (userSnapshot.empty) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const userDoc = userSnapshot.docs[0];
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
    await updateDoc(doc(db, 'users', user.id), {
      updated_at: serverTimestamp()
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
      updated_at: serverTimestamp()
    };

    await updateDoc(doc(db, 'users', userId), updateData);

    // Get updated user data
    const updatedUserDoc = await getDoc(doc(db, 'users', userId));
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

    await updateDoc(doc(db, 'users', userId), {
      profile_image: profileImage,
      updated_at: serverTimestamp()
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

    const statsQuery = query(
      collection(db, 'user_stats'),
      where('user_id', '==', userId)
    );
    const statsSnapshot = await getDocs(statsQuery);

    if (statsSnapshot.empty) {
      // Create default stats if not exists
      const defaultStats = {
        user_id: userId,
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        last_activity: serverTimestamp()
      };

      await addDoc(collection(db, 'user_stats'), defaultStats);

      res.json({
        coursesEnrolled: 0,
        coursesCompleted: 0,
        certificatesEarned: 0,
        learningStreak: 0,
        lastActivity: new Date().toISOString()
      });
    } else {
      const userStats = statsSnapshot.docs[0].data();
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
    const coursesQuery = query(
      collection(db, 'courses'),
      where('is_active', '==', true),
      orderBy('created_at', 'desc')
    );
    
    const coursesSnapshot = await getDocs(coursesQuery);

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

    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('user_id', '==', userId),
      where('status', '==', 'active'),
      orderBy('enrollment_date', 'desc')
    );

    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

    const enrollments = [];

    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data();
      
      // Get course data
      const courseDoc = await getDoc(doc(db, 'courses', enrollmentData.course_id));
      const courseData = courseDoc.exists() ? courseDoc.data() : null;

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
    const existingEnrollmentQuery = query(
      collection(db, 'enrollments'),
      where('user_id', '==', userId),
      where('course_id', '==', courseId)
    );
    const existingEnrollment = await getDocs(existingEnrollmentQuery);

    if (!existingEnrollment.empty) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const courseDoc = await getDoc(doc(db, 'courses', courseId));

    if (!courseDoc.exists() || !courseDoc.data().is_active) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    const enrollmentData = {
      user_id: userId,
      course_id: courseId,
      progress: 0,
      status: 'active',
      enrollment_date: serverTimestamp(),
      completion_date: null
    };

    await addDoc(collection(db, 'enrollments'), enrollmentData);

    // Update user stats
    const userStatsQuery = query(
      collection(db, 'user_stats'),
      where('user_id', '==', userId)
    );
    const userStatsSnapshot = await getDocs(userStatsQuery);
    
    if (!userStatsSnapshot.empty) {
      const userStatsDoc = userStatsSnapshot.docs[0];
      await updateDoc(userStatsDoc.ref, {
        courses_enrolled: increment(1)
      });
    }

    res.status(201).json({ message: 'Successfully enrolled in course' });

  } catch (error) {
    console.error('Course enrollment error:', error);
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

    const contactData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      company: company || null,
      message: message.trim(),
      status: 'pending',
      created_at: serverTimestamp()
    };

    const contactDocRef = await addDoc(collection(db, 'contact_messages'), contactData);

    console.log('Contact message saved successfully:', {
      id: contactDocRef.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim()
    });

    res.status(201).json({
      message: 'Contact message sent successfully',
      contactId: contactDocRef.id
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
    const usersQuery = query(
      collection(db, 'users'),
      where('is_active', '==', true)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const totalUsers = usersSnapshot.size;

    // Get total courses
    const coursesQuery = query(
      collection(db, 'courses'),
      where('is_active', '==', true)
    );
    const coursesSnapshot = await getDocs(coursesQuery);
    const totalCourses = coursesSnapshot.size;

    // Get total enrollments
    const enrollmentsSnapshot = await getDocs(collection(db, 'enrollments'));
    const totalEnrollments = enrollmentsSnapshot.size;

    // Calculate total revenue (mock calculation)
    let totalRevenue = 0;
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data();
      if (enrollmentData.status === 'completed') {
        const courseDoc = await getDoc(doc(db, 'courses', enrollmentData.course_id));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data();
          totalRevenue += parseFloat(courseData.price || 0);
        }
      }
    }

    // Get pending contacts (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const contactsSnapshot = await getDocs(collection(db, 'contact_messages'));
    let pendingContacts = 0;
    contactsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.created_at && data.created_at.toDate() >= weekAgo) {
        pendingContacts++;
      }
    });

    // Get pending service requests
    const serviceRequestsQuery = query(
      collection(db, 'service_requests'),
      where('status', '==', 'pending')
    );
    const serviceRequestsSnapshot = await getDocs(serviceRequestsQuery);
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

// ==================== ADDITIONAL ROUTES ====================

// ===== SOCIAL FEED ROUTES =====
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
  limits: { fileSize: 5 * 1024 * 1024 },
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

const getFullImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  let cleanPath = imagePath.replace(/^public\//, '');
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
  return `${req.protocol}://${req.get('host')}${cleanPath}`;
}

// GET All Posts
app.get('/api/posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limitNum = parseInt(req.query.limit, 10) || 10;

    const postsQuery = query(
      collection(db, 'social_activities'),
      where('activity_type', '==', 'post'),
      orderBy('created_at', 'desc'),
      limit(limitNum)
    );

    const postsSnapshot = await getDocs(postsQuery);
    const posts = [];

    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();
      
      // Check visibility permissions
      if (postData.visibility === 'private' && postData.user_id !== userId) continue;
      
      if (postData.visibility === 'connections') {
        const connectionsQuery = query(
          collection(db, 'user_connections'),
          where('status', '==', 'accepted')
        );
        const connectionsSnapshot = await getDocs(connectionsQuery);
        
        let hasConnection = false;
        connectionsSnapshot.forEach(doc => {
          const connData = doc.data();
          if ((connData.user_id_1 === userId && connData.user_id_2 === postData.user_id) ||
              (connData.user_id_2 === userId && connData.user_id_1 === postData.user_id)) {
            hasConnection = true;
          }
        });
        
        if (!hasConnection && postData.user_id !== userId) continue;
      }

      // Get user data
      const userDoc = await getDoc(doc(db, 'users', postData.user_id));
      const userData = userDoc.data();

      // Get likes count
      const likesQuery = query(
        collection(db, 'social_activities'),
        where('activity_type', '==', 'like'),
        where('target_id', '==', postDoc.id)
      );
      const likesSnapshot = await getDocs(likesQuery);

      // Get comments
      const commentsQuery = query(
        collection(db, 'social_activities'),
        where('activity_type', '==', 'comment'),
        where('target_id', '==', postDoc.id),
        orderBy('created_at', 'asc')
      );
      const commentsSnapshot = await getDocs(commentsQuery);

      const comments = [];
      for (const commentDoc of commentsSnapshot.docs) {
        const commentData = commentDoc.data();
        const commentUserDoc = await getDoc(doc(db, 'users', commentData.user_id));
        const commentUserData = commentUserDoc.data();
        
        comments.push({
          ...commentData,
          id: commentDoc.id,
          created_at: firestoreToDate(commentData.created_at),
          user: {
            id: commentData.user_id,
            first_name: commentUserData.first_name,
            last_name: commentUserData.last_name,
            profile_image: getFullImageUrl(req, commentUserData.profile_image),
            account_type: commentUserData.account_type
          }
        });
      }

      // Check if user liked/bookmarked
      const userLikeQuery = query(
        collection(db, 'social_activities'),
        where('activity_type', '==', 'like'),
        where('target_id', '==', postDoc.id),
        where('user_id', '==', userId)
      );
      const userLikeSnapshot = await getDocs(userLikeQuery);

      const userBookmarkQuery = query(
        collection(db, 'social_activities'),
        where('activity_type', '==', 'bookmark'),
        where('target_id', '==', postDoc.id),
        where('user_id', '==', userId)
      );
      const userBookmarkSnapshot = await getDocs(userBookmarkQuery);

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

    const totalSnapshot = await getDocs(query(
      collection(db, 'social_activities'),
      where('activity_type', '==', 'post')
    ));
    const totalPosts = totalSnapshot.size;
    const totalPages = Math.ceil(totalPosts / limitNum);

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
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const postDocRef = await addDoc(collection(db, 'social_activities'), postData);
      const newPostDoc = await getDoc(postDocRef);
      const newPostData = newPostDoc.data();

      const userDoc = await getDoc(doc(db, 'users', userId));
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

// POST (like) a post
app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    const userId = req.user.id;

    // Check if already liked
    const existingLikeQuery = query(
      collection(db, 'social_activities'),
      where('user_id', '==', userId),
      where('activity_type', '==', 'like'),
      where('target_id', '==', targetId)
    );
    const existingLike = await getDocs(existingLikeQuery);

    if (!existingLike.empty) {
      return res.status(400).json({ error: 'Post already liked' });
    }

    const likeData = {
      user_id: userId,
      activity_type: 'like',
      target_id: targetId,
      created_at: serverTimestamp()
    };

    await addDoc(collection(db, 'social_activities'), likeData);
    res.status(201).json({ message: 'Post liked.' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post.' });
  }
});

// DELETE (unlike) a post
app.delete('/api/posts/:id/like', authenticateToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    const userId = req.user.id;

    const likeQuery = query(
      collection(db, 'social_activities'),
      where('user_id', '==', userId),
      where('activity_type', '==', 'like'),
      where('target_id', '==', targetId)
    );
    const likeSnapshot = await getDocs(likeQuery);

    const batch = writeBatch(db);
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

// ===== ASSIGNMENTS ROUTES =====
app.get('/api/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's enrollments
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('user_id', '==', userId),
      where('status', '==', 'active')
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

    const assignments = [];
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data();
      
      // Get assignments for this course
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('course_id', '==', enrollmentData.course_id),
        orderBy('due_date', 'asc')
      );
      const assignmentsSnapshot = await getDocs(assignmentsQuery);

      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignmentData = assignmentDoc.data();
        
        // Get course data
        const courseDoc = await getDoc(doc(db, 'courses', enrollmentData.course_id));
        const courseData = courseDoc.data();

        // Check for submission
        const submissionQuery = query(
          collection(db, 'assignment_submissions'),
          where('assignment_id', '==', assignmentDoc.id),
          where('user_id', '==', userId)
        );
        const submissionSnapshot = await getDocs(submissionQuery);

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
          course_id: enrollmentData.course_id,
          title: assignmentData.title,
          description: assignmentData.description,
          due_date: firestoreToDate(assignmentData.due_date),
          max_points: assignmentData.max_points,
          created_at: firestoreToDate(assignmentData.created_at),
          course: {
            id: enrollmentData.course_id,
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
    const assignmentDoc = await getDoc(doc(db, 'assignments', assignment_id));
    
    if (!assignmentDoc.exists()) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignmentData = assignmentDoc.data();
    
    // Check if user is enrolled in the course
    const enrollmentQuery = query(
      collection(db, 'enrollments'),
      where('user_id', '==', userId),
      where('course_id', '==', assignmentData.course_id)
    );
    const enrollmentSnapshot = await getDocs(enrollmentQuery);

    if (enrollmentSnapshot.empty) {
      return res.status(404).json({ error: 'Assignment not found or not enrolled' });
    }

    // Check if already submitted
    const existingSubmissionQuery = query(
      collection(db, 'assignment_submissions'),
      where('assignment_id', '==', assignment_id),
      where('user_id', '==', userId)
    );
    const existingSubmission = await getDocs(existingSubmissionQuery);

    if (!existingSubmission.empty) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }

    // Insert submission
    const submissionData = {
      assignment_id: assignment_id,
      user_id: userId,
      content: content || '',
      file_path: file_path,
      submitted_at: serverTimestamp(),
      status: 'submitted',
      grade: null,
      feedback: null
    };

    await addDoc(collection(db, 'assignment_submissions'), submissionData);

    res.json({
      success: true,
      message: 'Assignment submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== RESOURCES ROUTES =====
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const accountType = req.user.account_type;

    const resourcesQuery = query(
      collection(db, 'resources'),
      orderBy('created_at', 'desc')
    );
    const resourcesSnapshot = await getDocs(resourcesQuery);

    const resources = [];
    resourcesSnapshot.forEach(doc => {
      const resourceData = doc.data();
      
      // Check if user's account type is allowed
      if (resourceData.allowed_account_types && 
          resourceData.allowed_account_types.includes(accountType)) {
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
      }
    });

    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// ===== INTERNSHIPS ROUTES =====
app.get('/api/internships', async (req, res) => {
  try {
    const internshipsQuery = query(
      collection(db, 'internships'),
      orderBy('posted_at', 'desc')
    );
    const internshipsSnapshot = await getDocs(internshipsQuery);

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

// Apply for internship
app.post('/api/internships/:id/apply', authenticateToken, async (req, res) => {
  try {
    const { id: internshipId } = req.params;
    const { full_name, email, phone, resume_url, cover_letter } = req.body;
    const userId = req.user.id;

    if (!full_name || !email || !resume_url) {
      return res.status(400).json({ message: 'Full name, email, and resume link are required.' });
    }

    const internshipDoc = await getDoc(doc(db, 'internships', internshipId));

    if (!internshipDoc.exists()) {
      return res.status(404).json({ message: 'Internship not found.' });
    }

    const internshipData = internshipDoc.data();
    
    if (internshipData.spots_available <= 0) {
      return res.status(400).json({ message: 'No available spots left for this internship.' });
    }

    // Check if already applied
    const existingApplicationQuery = query(
      collection(db, 'internship_submissions'),
      where('internship_id', '==', internshipId),
      where('user_id', '==', userId)
    );
    const existingApplication = await getDocs(existingApplicationQuery);

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
      submitted_at: serverTimestamp()
    };

    await addDoc(collection(db, 'internship_submissions'), applicationData);

    // Update internship spots and applications count
    await updateDoc(doc(db, 'internships', internshipId), {
      spots_available: increment(-1),
      applications_count: increment(1)
    });

    res.status(201).json({ message: 'Internship application submitted successfully!' });

  } catch (error) {
    console.error('Error submitting internship application:', error);
    res.status(500).json({ message: 'Internal server error during application submission.' });
  }
});

// ==================== MISSING ADMIN ENDPOINTS ====================

// GET /api/admin/enrollments - Get all enrollments (admin only)
app.get('/api/admin/enrollments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const enrollmentsSnapshot = await getDocs(collection(db, 'enrollments'));
    const enrollments = [];

    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data();
      
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', enrollmentData.user_id));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Get course data
      const courseDoc = await getDoc(doc(db, 'courses', enrollmentData.course_id));
      const courseData = courseDoc.exists() ? courseDoc.data() : null;

      enrollments.push({
        id: enrollmentDoc.id,
        user_id: enrollmentData.user_id,
        user_name: userData ? `${userData.first_name} ${userData.last_name}` : 'Unknown User',
        course_id: enrollmentData.course_id,
        course_name: courseData ? courseData.title : 'Unknown Course',
        progress: enrollmentData.progress || 0,
        status: enrollmentData.status,
        enrollment_date: firestoreToDate(enrollmentData.enrollment_date),
        completion_date: firestoreToDate(enrollmentData.completion_date)
      });
    }

    // Sort by enrollment date (newest first)
    enrollments.sort((a, b) => new Date(b.enrollment_date) - new Date(a.enrollment_date));

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// PUT /api/admin/enrollments/:id - Update enrollment (admin only)
app.put('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, completion_date } = req.body;

    const updateData = {
      status: status,
      progress: progress,
      updated_at: serverTimestamp()
    };

    if (status === 'completed') {
      updateData.completion_date = completion_date ? new Date(completion_date) : serverTimestamp();
    } else {
      updateData.completion_date = null;
    }

    await updateDoc(doc(db, 'enrollments', id), updateData);

    res.json({ message: 'Enrollment updated successfully' });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({ error: 'Failed to update enrollment' });
  }
});

// DELETE /api/admin/enrollments/:id - Delete enrollment (admin only)
app.delete('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteDoc(doc(db, 'enrollments', id));
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ error: 'Failed to delete enrollment' });
  }
});

// GET /api/admin/courses - Get all courses (admin only)
app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const coursesQuery = query(
      collection(db, 'courses'),
      orderBy('created_at', 'desc')
    );
    const coursesSnapshot = await getDocs(coursesQuery);

    const courses = [];
    coursesSnapshot.forEach(doc => {
      const courseData = doc.data();
      courses.push({
        id: doc.id,
        title: courseData.title,
        description: courseData.description,
        instructor_name: courseData.instructor_name,
        duration_weeks: courseData.duration_weeks,
        difficulty_level: courseData.difficulty_level,
        category: courseData.category,
        price: courseData.price,
        thumbnail: courseData.thumbnail,
        is_active: courseData.is_active,
        created_at: firestoreToDate(courseData.created_at),
        updated_at: firestoreToDate(courseData.updated_at)
      });
    });

    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// POST /api/admin/courses - Create new course (admin only)
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

    const courseData = {
      title: title,
      description: description || '',
      instructor_name: instructor_name,
      duration_weeks: parseInt(duration_weeks),
      difficulty_level: difficulty_level,
      category: category,
      price: parseFloat(price),
      thumbnail: null,
      is_active: is_active !== undefined ? is_active : true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const courseDocRef = await addDoc(collection(db, 'courses'), courseData);

    res.status(201).json({ 
      message: 'Course created successfully',
      courseId: courseDocRef.id
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// PUT /api/admin/courses/:id - Update course (admin only)
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

    const updateData = {
      title: title,
      description: description || '',
      instructor_name: instructor_name,
      duration_weeks: parseInt(duration_weeks),
      difficulty_level: difficulty_level,
      category: category,
      price: parseFloat(price),
      is_active: is_active,
      updated_at: serverTimestamp()
    };

    await updateDoc(doc(db, 'courses', id), updateData);

    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE /api/admin/courses/:id - Delete course (admin only)
app.delete('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course has enrollments
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('course_id', '==', id)
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

    if (!enrollmentsSnapshot.empty) {
      return res.status(400).json({ error: 'Cannot delete course with active enrollments' });
    }

    await deleteDoc(doc(db, 'courses', id));

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// GET /api/admin/assignments - Get all assignments (admin only)
app.get('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentsQuery = query(
      collection(db, 'assignments'),
      orderBy('created_at', 'desc')
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);

    const assignments = [];
    for (const assignmentDoc of assignmentsSnapshot.docs) {
      const assignmentData = assignmentDoc.data();
      
      // Get course data
      const courseDoc = await getDoc(doc(db, 'courses', assignmentData.course_id));
      const courseData = courseDoc.exists() ? courseDoc.data() : null;

      assignments.push({
        id: assignmentDoc.id,
        course_id: assignmentData.course_id,
        title: assignmentData.title,
        description: assignmentData.description,
        due_date: firestoreToDate(assignmentData.due_date),
        max_points: assignmentData.max_points,
        created_at: firestoreToDate(assignmentData.created_at),
        course_title: courseData ? courseData.title : 'Unknown Course'
      });
    }

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// POST /api/admin/assignments - Create new assignment (admin only)
app.post('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      course_id,
      description,
      due_date,
      max_points
    } = req.body;

    // Validate required fields
    if (!title || !course_id || !due_date || !max_points) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const assignmentData = {
      title: title,
      course_id: course_id,
      description: description || '',
      due_date: new Date(due_date),
      max_points: parseInt(max_points),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const assignmentDocRef = await addDoc(collection(db, 'assignments'), assignmentData);

    res.status(201).json({ 
      message: 'Assignment created successfully',
      assignmentId: assignmentDocRef.id
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// PUT /api/admin/assignments/:id - Update assignment (admin only)
app.put('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      course_id,
      description,
      due_date,
      max_points
    } = req.body;

    // Validate required fields
    if (!title || !course_id || !due_date || !max_points) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const updateData = {
      title: title,
      course_id: course_id,
      description: description || '',
      due_date: new Date(due_date),
      max_points: parseInt(max_points),
      updated_at: serverTimestamp()
    };

    await updateDoc(doc(db, 'assignments', id), updateData);

    res.json({ message: 'Assignment updated successfully' });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// DELETE /api/admin/assignments/:id - Delete assignment (admin only)
app.delete('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if assignment has submissions
    const submissionsQuery = query(
      collection(db, 'assignment_submissions'),
      where('assignment_id', '==', id)
    );
    const submissionsSnapshot = await getDocs(submissionsQuery);

    if (!submissionsSnapshot.empty) {
      return res.status(400).json({ error: 'Cannot delete assignment with existing submissions' });
    }

    await deleteDoc(doc(db, 'assignments', id));

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// GET /api/admin/certificates - Get all certificates (admin only)
app.get('/api/admin/certificates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const certificatesQuery = query(
      collection(db, 'certificates'),
      orderBy('issued_date', 'desc')
    );
    const certificatesSnapshot = await getDocs(certificatesQuery);

    const certificates = [];
    for (const certificateDoc of certificatesSnapshot.docs) {
      const certificateData = certificateDoc.data();
      
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', certificateData.user_id));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Get course data
      const courseDoc = await getDoc(doc(db, 'courses', certificateData.course_id));
      const courseData = courseDoc.exists() ? courseDoc.data() : null;
      
      // Get enrollment data
      const enrollmentQuery = query(
        collection(db, 'enrollments'),
        where('user_id', '==', certificateData.user_id),
        where('course_id', '==', certificateData.course_id)
      );
      const enrollmentSnapshot = await getDocs(enrollmentQuery);
      const enrollmentData = !enrollmentSnapshot.empty ? enrollmentSnapshot.docs[0].data() : null;

      certificates.push({
        id: certificateDoc.id,
        userId: certificateData.user_id,
        courseId: certificateData.course_id,
        certificateUrl: certificateData.certificate_url,
        issuedDate: firestoreToDate(certificateData.issued_date),
        course: courseData ? {
          id: certificateData.course_id,
          title: courseData.title,
          instructorName: courseData.instructor_name,
          category: courseData.category,
          difficultyLevel: courseData.difficulty_level
        } : null,
        user: userData ? {
          firstName: userData.first_name,
          lastName: userData.last_name,
          email: userData.email
        } : null,
        enrollment: enrollmentData ? {
          completionDate: firestoreToDate(enrollmentData.completion_date)
        } : null
      });
    }

    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// POST /api/admin/certificates - Create new certificate (admin only)
app.post('/api/admin/certificates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, courseId, certificateUrl } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'User ID and Course ID are required' });
    }

    // Check if user has completed the course
    const enrollmentQuery = query(
      collection(db, 'enrollments'),
      where('user_id', '==', userId),
      where('course_id', '==', courseId),
      where('status', '==', 'completed')
    );
    const enrollmentSnapshot = await getDocs(enrollmentQuery);

    if (enrollmentSnapshot.empty) {
      return res.status(400).json({ error: 'User has not completed this course' });
    }

    // Check if certificate already exists
    const existingCertificateQuery = query(
      collection(db, 'certificates'),
      where('user_id', '==', userId),
      where('course_id', '==', courseId)
    );
    const existingCertificatesSnapshot = await getDocs(existingCertificateQuery);

    if (!existingCertificatesSnapshot.empty) {
      return res.status(400).json({ error: 'Certificate already exists for this user and course' });
    }

    // Create new certificate
    const certificateData = {
      user_id: userId,
      course_id: courseId,
      certificate_url: certificateUrl || null,
      issued_date: serverTimestamp()
    };

    const certificateDocRef = await addDoc(collection(db, 'certificates'), certificateData);

    // Update user stats
    const userStatsQuery = query(
      collection(db, 'user_stats'),
      where('user_id', '==', userId)
    );
    const userStatsSnapshot = await getDocs(userStatsQuery);
    
    if (!userStatsSnapshot.empty) {
      const userStatsDoc = userStatsSnapshot.docs[0];
      await updateDoc(userStatsDoc.ref, {
        certificates_earned: increment(1)
      });
    }

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificateId: certificateDocRef.id
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ error: 'Failed to issue certificate' });
  }
});

// GET /api/admin/contact-messages - Get contact messages (admin only)
app.get('/api/admin/contact-messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limitNum = parseInt(req.query.limit) || 10;

    const messagesQuery = query(
      collection(db, 'contact_messages'),
      orderBy('created_at', 'desc'),
      limit(limitNum)
    );

    const messagesSnapshot = await getDocs(messagesQuery);

    const messages = [];
    messagesSnapshot.forEach(doc => {
      const messageData = doc.data();
      messages.push({
        id: doc.id,
        first_name: messageData.first_name,
        last_name: messageData.last_name,
        email: messageData.email,
        phone: messageData.phone,
        company: messageData.company,
        message: messageData.message,
        status: messageData.status || 'pending',
        created_at: firestoreToDate(messageData.created_at)
      });
    });

    // Get total count
    const totalSnapshot = await getDocs(collection(db, 'contact_messages'));
    const totalMessages = totalSnapshot.size;
    const totalPages = Math.ceil(totalMessages / limitNum);

    res.json({
      messages: messages,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalMessages: totalMessages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Failed to fetch contact messages' });
  }
});

// PUT /api/admin/contact-messages/:id - Update contact message status (admin only)
app.put('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'contacted', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    await updateDoc(doc(db, 'contact_messages', id), {
      status: status,
      updated_at: serverTimestamp()
    });

    res.json({ message: 'Contact message updated successfully' });
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500).json({ error: 'Failed to update contact message' });
  }
});

// DELETE /api/admin/contact-messages/:id - Delete contact message (admin only)
app.delete('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteDoc(doc(db, 'contact_messages', id));
    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ error: 'Failed to delete contact message' });
  }
});

// GET /api/admin/recent-users - Get recent users (admin only)
app.get('/api/admin/recent-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('is_active', '==', true),
      orderBy('created_at', 'desc'),
      limit(5)
    );
    const usersSnapshot = await getDocs(usersQuery);

    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        account_type: userData.account_type,
        join_date: firestoreToDate(userData.created_at)
      });
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({ error: 'Failed to fetch recent users', details: error.message });
  }
});

// GET /api/admin/recent-enrollments - Get recent enrollments (admin only)
app.get('/api/admin/recent-enrollments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      orderBy('enrollment_date', 'desc'),
      limit(5)
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

    const enrollments = [];
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data();
      
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', enrollmentData.user_id));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Get course data
      const courseDoc = await getDoc(doc(db, 'courses', enrollmentData.course_id));
      const courseData = courseDoc.exists() ? courseDoc.data() : null;

      enrollments.push({
        id: enrollmentDoc.id,
        user_name: userData ? `${userData.first_name} ${userData.last_name}` : 'Unknown User',
        course_name: courseData ? courseData.title : 'Unknown Course',
        date: firestoreToDate(enrollmentData.enrollment_date),
        status: enrollmentData.status
      });
    }

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching recent enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch recent enrollments', details: error.message });
  }
});

// GET /api/certificates/my-certificates - Get user's certificates
app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const certificatesQuery = query(
      collection(db, 'certificates'),
      where('user_id', '==', userId),
      orderBy('issued_date', 'desc')
    );
    const certificatesSnapshot = await getDocs(certificatesQuery);

    const certificates = [];
    for (const certificateDoc of certificatesSnapshot.docs) {
      const certificateData = certificateDoc.data();
      
      // Get course data
      const courseDoc = await getDoc(doc(db, 'courses', certificateData.course_id));
      const courseData = courseDoc.exists() ? courseDoc.data() : null;

      // Get enrollment data
      const enrollmentQuery = query(
        collection(db, 'enrollments'),
        where('user_id', '==', userId),
        where('course_id', '==', certificateData.course_id)
      );
      const enrollmentSnapshot = await getDocs(enrollmentQuery);
      const enrollmentData = !enrollmentSnapshot.empty ? enrollmentSnapshot.docs[0].data() : null;

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
          finalGrade: 0, // You can calculate this based on assignment submissions
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

// ==================== SERVICE REQUESTS ROUTES ====================

// GET /api/admin/service-requests - Get all service requests (admin only)
app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const serviceRequestsSnapshot = await getDocs(collection(db, 'service_requests'));
    const requests = [];

    for (const requestDoc of serviceRequestsSnapshot.docs) {
      const requestData = requestDoc.data();
      
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', requestData.user_id));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Get service category data
      const categoryDoc = await getDoc(doc(db, 'service_categories', requestData.subcategory_id));
      const categoryData = categoryDoc.exists() ? categoryDoc.data() : null;

      requests.push({
        id: requestDoc.id,
        name: requestData.full_name,
        service: categoryData ? categoryData.name : 'Unknown Service',
        date: firestoreToDate(requestData.created_at),
        status: requestData.status,
        email: requestData.email,
        phone: requestData.phone,
        company: requestData.company,
        website: requestData.website,
        project_details: requestData.project_details,
        budget_range: requestData.budget_range,
        timeline: requestData.timeline,
        contact_method: requestData.contact_method,
        additional_requirements: requestData.additional_requirements,
        user_id: requestData.user_id,
        user_first_name: userData ? userData.first_name : null,
        user_last_name: userData ? userData.last_name : null,
        user_account_type: userData ? userData.account_type : null
      });
    }

    // Sort by creation date (newest first)
    requests.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(requests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests', details: error.message });
  }
});

// PUT /api/admin/service-requests/:id - Update service request status
app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, project_details, budget_range, timeline, additional_requirements } = req.body;

    const updateData = {
      updated_at: serverTimestamp()
    };

    if (status) updateData.status = status;
    if (project_details) updateData.project_details = project_details;
    if (budget_range) updateData.budget_range = budget_range;
    if (timeline) updateData.timeline = timeline;
    if (additional_requirements) updateData.additional_requirements = additional_requirements;

    await updateDoc(doc(db, 'service_requests', id), updateData);

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
    await deleteDoc(doc(db, 'service_requests', id));
    res.json({ message: 'Service request deleted successfully' });
  } catch (error) {
    console.error('Error deleting service request:', error);
    res.status(500).json({ error: 'Failed to delete service request', details: error.message });
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
      created_at: serverTimestamp(),
      verified_at: null
    };

    const paymentDocRef = await addDoc(collection(db, 'payments'), paymentData);

    res.json({ 
      message: 'Payment proof uploaded successfully', 
      paymentId: paymentDocRef.id 
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ error: 'Failed to upload payment proof' });
  }
});

// GET /api/admin/payments - Get all payments (admin only)
app.get('/api/admin/payments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const paymentsSnapshot = await getDocs(collection(db, 'payments'));
    const payments = [];

    for (const paymentDoc of paymentsSnapshot.docs) {
      const paymentData = paymentDoc.data();
      
      // Get user data
      let userData = null;
      if (paymentData.user_id) {
        const userDoc = await getDoc(doc(db, 'users', paymentData.user_id));
        userData = userDoc.exists() ? userDoc.data() : null;
      }
      
      // Get resource data
      let resourceData = null;
      if (paymentData.resource_id) {
        const resourceDoc = await getDoc(doc(db, 'resources', paymentData.resource_id));
        resourceData = resourceDoc.exists() ? resourceDoc.data() : null;
      }

      payments.push({
        id: paymentDoc.id,
        ...paymentData,
        created_at: firestoreToDate(paymentData.created_at),
        verified_at: firestoreToDate(paymentData.verified_at),
        first_name: userData ? userData.first_name : null,
        last_name: userData ? userData.last_name : null,
        email: userData ? userData.email : null,
        resource_title: resourceData ? resourceData.title : null
      });
    }

    // Sort by creation date (newest first)
    payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// PUT /api/admin/payments/:id/verify - Verify payment (admin only)
app.put('/api/admin/payments/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData = {
      status: status,
      verified_at: serverTimestamp()
    };

    await updateDoc(doc(db, 'payments', id), updateData);

    // If payment is approved, grant access to the resource
    if (status === 'approved') {
      const paymentDoc = await getDoc(doc(db, 'payments', id));
      if (paymentDoc.exists()) {
        const paymentData = paymentDoc.data();
        const { user_id, resource_id, plan } = paymentData;
        
        if (plan === 'individual' && resource_id) {
          // Grant access to specific resource
          const userResourceData = {
            user_id: user_id,
            resource_id: resource_id,
            granted_at: serverTimestamp()
          };
          await addDoc(collection(db, 'user_resources'), userResourceData);
        } else if (plan === 'premium') {
          // Upgrade user to premium
          await updateDoc(doc(db, 'users', user_id), {
            subscription_plan: 'premium',
            updated_at: serverTimestamp()
          });
        }
      }
    }

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
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
        created_at: serverTimestamp()
      };

      const requestDocRef = await addDoc(collection(db, 'course_enroll_requests'), enrollRequestData);

      res.status(201).json({
        message: 'Enrollment request submitted successfully',
        requestId: requestDocRef.id
      });

    } catch (error) {
      console.error('Enrollment request error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
);

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
  console.log(`🔥 Using Firebase Client SDK with Firestore Database`);
});

module.exports = app;