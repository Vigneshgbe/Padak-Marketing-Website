// server.js - COMPLETE Firebase Firestore Version
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} = require('firebase/firestore');

const app = express();
const port = process.env.PORT || 5000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4uHspTDS-8kIT2HsmPFGL9JNNBvI6NI4",
  authDomain: "startup-dbs-1.firebaseapp.com",
  projectId: "startup-dbs-1",
  storageBucket: "startup-dbs-1.firebasestorage.app",
  messagingSenderId: "70939047801",
  appId: "1:70939047801:web:08a6a9d17f6b63af9261a8",
  measurementId: "G-KQ59313LSD"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Collections mapping to MySQL tables
const COLLECTIONS = {
  USERS: 'users',
  USER_STATS: 'user_stats',
  COURSES: 'courses',
  ENROLLMENTS: 'enrollments',
  ASSIGNMENTS: 'assignments',
  ASSIGNMENT_SUBMISSIONS: 'assignment_submissions',
  CERTIFICATES: 'certificates',
  RESOURCES: 'resources',
  SOCIAL_ACTIVITIES: 'social_activities',
  USER_CONNECTIONS: 'user_connections',
  INTERNSHIPS: 'internships',
  INTERNSHIP_SUBMISSIONS: 'internship_submissions',
  SERVICE_CATEGORIES: 'service_categories',
  SERVICE_SUBCATEGORIES: 'service_subcategories',
  SERVICE_REQUESTS: 'service_requests',
  CONTACT_MESSAGES: 'contact_messages',
  PAYMENTS: 'payments',
  USER_RESOURCES: 'user_resources',
  CUSTOM_CALENDAR_EVENTS: 'custom_calendar_events',
  COURSE_ENROLL_REQUESTS: 'course_enroll_requests',
  DOWNLOAD_LOGS: 'download_logs'
};

// Create necessary directories
const assignmentsDir = path.join(__dirname, 'uploads', 'assignments');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });

const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const paymentsDir = path.join(__dirname, 'uploads', 'payments');
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

const socialUploadDir = 'public/uploads/social';
if (!fs.existsSync(socialUploadDir)) {
  fs.mkdirSync(socialUploadDir, { recursive: true });
}

// Multer configurations (same as original)
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
  limits: { fileSize: 5 * 1024 * 1024 },
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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

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

// CORS configuration
const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads', 'avatars')));

// ======== FIREBASE HELPER FUNCTIONS ========
const docToObject = (doc) => {
  if (!doc.exists()) return null;
  const data = doc.data();
  return { id: doc.id, ...data };
};

const getDocument = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docToObject(docSnap);
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    return null;
  }
};

const getDocuments = async (collectionName, conditions = [], orderByField = null, orderDirection = 'asc', limitCount = null) => {
  try {
    let q = collection(db, collectionName);
    
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });
    
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToObject);
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    return [];
  }
};

const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

const updateDocument = async (collectionName, id, data) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

const deleteDocument = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// ======== AUTHENTICATION MIDDLEWARE ========
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getDocument(COLLECTIONS.USERS, decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ==================== AUTH ROUTES ====================
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, accountType } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUsers = await getDocuments(COLLECTIONS.USERS, [
      { field: 'email', operator: '==', value: email.trim() }
    ]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userId = await addDocument(COLLECTIONS.USERS, {
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    await addDocument(COLLECTIONS.USER_STATS, {
      user_id: userId,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: new Date().toISOString()
    });

    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await getDocuments(COLLECTIONS.USERS, [
      { field: 'email', operator: '==', value: email },
      { field: 'is_active', operator: '==', value: true }
    ]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const tokenExpiry = rememberMe ? '30d' : '1d';
    const token = jwt.sign({ userId: user.id, email: user.email, accountType: user.account_type }, JWT_SECRET, { expiresIn: tokenExpiry });

    await updateDocument(COLLECTIONS.USERS, user.id, { updated_at: new Date().toISOString() });

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
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

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

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, company, website, bio } = req.body;
    const userId = req.user.id;

    await updateDocument(COLLECTIONS.USERS, userId, {
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      company: company,
      website: website,
      bio: bio
    });

    const updatedUser = await getDocument(COLLECTIONS.USERS, userId);
    res.json({
      id: updatedUser.id,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      accountType: updatedUser.account_type,
      profileImage: updatedUser.profile_image,
      company: updatedUser.company,
      website: updatedUser.website,
      bio: updatedUser.bio,
      isActive: updatedUser.is_active,
      emailVerified: updatedUser.email_verified,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/avatar', authenticateToken, (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const userId = req.user.id;
    const profileImage = `/uploads/avatars/${req.file.filename}`;

    if (req.user.profile_image) {
      const oldFilename = path.basename(req.user.profile_image);
      const oldPath = path.join(avatarsDir, oldFilename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await updateDocument(COLLECTIONS.USERS, userId, { profile_image: profileImage });
    res.status(200).send(profileImage);
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== DASHBOARD ROUTES ====================
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await getDocuments(COLLECTIONS.USER_STATS, [
      { field: 'user_id', operator: '==', value: userId }
    ]);

    if (stats.length === 0) {
      await addDocument(COLLECTIONS.USER_STATS, {
        user_id: userId,
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        last_activity: new Date().toISOString()
      });

      res.json({ coursesEnrolled: 0, coursesCompleted: 0, certificatesEarned: 0, learningStreak: 0, lastActivity: new Date().toISOString() });
    } else {
      const userStats = stats[0];
      res.json({
        coursesEnrolled: userStats.courses_enrolled || 0,
        coursesCompleted: userStats.courses_completed || 0,
        certificatesEarned: userStats.certificates_earned || 0,
        learningStreak: userStats.learning_streak || 0,
        lastActivity: userStats.last_activity
      });
    }
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== COURSES ROUTES ====================
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await getDocuments(COLLECTIONS.COURSES, [
      { field: 'is_active', operator: '==', value: true }
    ], 'created_at', 'desc');

    const formattedCourses = courses.map(course => ({
      ...course,
      price: course.price !== null ? `₹${parseFloat(course.price).toFixed(2)}` : '₹0.00'
    }));

    res.json(formattedCourses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/enrollments/my-courses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const enrollments = await getDocuments(COLLECTIONS.ENROLLMENTS, [
      { field: 'user_id', operator: '==', value: userId },
      { field: 'status', operator: '==', value: 'active' }
    ], 'enrollment_date', 'desc');

    const enrollmentsWithCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await getDocument(COLLECTIONS.COURSES, enrollment.course_id);
        return {
          id: enrollment.id,
          userId: enrollment.user_id,
          courseId: enrollment.course_id,
          progress: enrollment.progress,
          enrollmentDate: enrollment.enrollment_date,
          completionDate: enrollment.completion_date,
          status: enrollment.status,
          course: course
        };
      })
    );

    res.json(enrollmentsWithCourses);
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ENROLLMENT MANAGEMENT ====================
app.get('/api/users/:userId/enrollments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const paramUserId = req.params.userId;

    if (paramUserId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You can only access your own enrollment data.' });
    }

    const enrollments = await getDocuments(COLLECTIONS.ENROLLMENTS, [
      { field: 'user_id', operator: '==', value: userId }
    ], 'enrollment_date', 'desc');

    const enrollmentsWithCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await getDocument(COLLECTIONS.COURSES, enrollment.course_id);
        return {
          id: enrollment.id,
          progress: enrollment.progress,
          status: enrollment.status,
          enrollment_date: enrollment.enrollment_date,
          completion_date: enrollment.completion_date,
          course_id: enrollment.course_id,
          courseTitle: course?.title,
          instructorName: course?.instructor_name,
          durationWeeks: course?.duration_weeks
        };
      })
    );

    res.json(enrollmentsWithCourses);
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    res.status(500).json({ error: 'Internal server error while fetching enrolled courses.' });
  }
});

app.post('/api/courses/enroll', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    const existing = await getDocuments(COLLECTIONS.ENROLLMENTS, [
      { field: 'user_id', operator: '==', value: userId },
      { field: 'course_id', operator: '==', value: courseId }
    ]);

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    const course = await getDocument(COLLECTIONS.COURSES, courseId);
    if (!course || !course.is_active) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await addDocument(COLLECTIONS.ENROLLMENTS, {
      user_id: userId,
      course_id: courseId,
      enrollment_date: new Date().toISOString(),
      progress: 0,
      status: 'active'
    });

    const userStats = await getDocuments(COLLECTIONS.USER_STATS, [
      { field: 'user_id', operator: '==', value: userId }
    ]);

    if (userStats.length > 0) {
      await updateDocument(COLLECTIONS.USER_STATS, userStats[0].id, {
        courses_enrolled: (userStats[0].courses_enrolled || 0) + 1
      });
    }

    res.status(201).json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ASSIGNMENTS ROUTES ====================
app.get('/api/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const enrollments = await getDocuments(COLLECTIONS.ENROLLMENTS, [
      { field: 'user_id', operator: '==', value: userId },
      { field: 'status', operator: '==', value: 'active' }
    ]);

    const courseIds = enrollments.map(e => e.course_id);
    if (courseIds.length === 0) return res.json([]);

    const assignments = await getDocuments(COLLECTIONS.ASSIGNMENTS, [
      { field: 'course_id', operator: 'in', value: courseIds }
    ], 'due_date', 'asc');

    const assignmentsWithDetails = await Promise.all(
      assignments.map(async (assignment) => {
        const course = await getDocument(COLLECTIONS.COURSES, assignment.course_id);
        const submissions = await getDocuments(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, [
          { field: 'assignment_id', operator: '==', value: assignment.id },
          { field: 'user_id', operator: '==', value: userId }
        ]);

        return {
          id: assignment.id,
          course_id: assignment.course_id,
          title: assignment.title,
          description: assignment.description,
          due_date: assignment.due_date,
          max_points: assignment.max_points,
          created_at: assignment.created_at,
          course: course,
          submission: submissions.length > 0 ? submissions[0] : null
        };
      })
    );

    res.json(assignmentsWithDetails);
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

app.post('/api/assignments/submit', authenticateToken, assignmentUpload.single('file'), async (req, res) => {
  try {
    const { assignment_id, content } = req.body;
    const file_path = req.file ? req.file.filename : null;
    const userId = req.user.id;

    if (!assignment_id) return res.status(400).json({ error: 'Assignment ID is required' });
    if (!content && !file_path) return res.status(400).json({ error: 'Either content or file is required' });

    const assignment = await getDocument(COLLECTIONS.ASSIGNMENTS, assignment_id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const enrollments = await getDocuments(COLLECTIONS.ENROLLMENTS, [
      { field: 'user_id', operator: '==', value: userId },
      { field: 'course_id', operator: '==', value: assignment.course_id }
    ]);

    if (enrollments.length === 0) return res.status(403).json({ error: 'Not enrolled in this course' });

    const existingSubmissions = await getDocuments(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, [
      { field: 'assignment_id', operator: '==', value: assignment_id },
      { field: 'user_id', operator: '==', value: userId }
    ]);

    if (existingSubmissions.length > 0) return res.status(400).json({ error: 'Assignment already submitted' });

    const submissionId = await addDocument(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, {
      assignment_id: assignment_id,
      user_id: userId,
      content: content || '',
      file_path: file_path,
      submitted_at: new Date().toISOString(),
      status: 'submitted'
    });

    res.json({ success: true, message: 'Assignment submitted successfully', submission_id: submissionId });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ==================== CALENDAR ROUTES ====================
app.get('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's enrollments and courses
    const enrollments = await getDocuments(COLLECTIONS.ENROLLMENTS, [
      { field: 'user_id', operator: '==', value: userId },
      { field: 'status', operator: '==', value: 'active' }
    ]);

    const courseIds = enrollments.map(e => e.course_id);
    const courses = await Promise.all(courseIds.map(id => getDocument(COLLECTIONS.COURSES, id)));

    // Get assignments for enrolled courses
    const assignments = await getDocuments(COLLECTIONS.ASSIGNMENTS, [
      { field: 'course_id', operator: 'in', value: courseIds }
    ]);

    // Get custom events
    const customEvents = await getDocuments(COLLECTIONS.CUSTOM_CALENDAR_EVENTS, [
      { field: 'user_id', operator: '==', value: userId }
    ]);

    // Format events
    const courseEvents = courses.map(course => ({
      id: `course-${course.id}`,
      title: `Course: ${course.title}`,
      description: course.description || 'Course enrollment',
      date: course.created_at,
      type: 'course_start',
      course: { id: course.id, title: course.title, category: course.category },
      color: 'blue'
    }));

    const assignmentEvents = await Promise.all(assignments.map(async (assignment) => {
      const course = courses.find(c => c.id === assignment.course_id);
      const submissions = await getDocuments(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, [
        { field: 'assignment_id', operator: '==', value: assignment.id },
        { field: 'user_id', operator: '==', value: userId }
      ]);

      let status = 'pending';
      if (submissions.length > 0) {
        status = submissions[0].status === 'graded' ? 'completed' : 'submitted';
      } else if (new Date(assignment.due_date) < new Date()) {
        status = 'overdue';
      }

      return {
        id: `assignment-${assignment.id}`,
        title: assignment.title,
        description: assignment.description || 'Assignment due',
        date: assignment.due_date,
        type: 'assignment',
        course: { id: course.id, title: course.title, category: course.category },
        status: status,
        color: status === 'completed' ? 'green' : status === 'overdue' ? 'red' : 'orange'
      };
    }));

    const customFormattedEvents = customEvents.map(event => ({
      id: `custom-${event.id}`,
      title: event.title,
      description: event.description || '',
      date: event.event_date,
      time: event.event_time,
      type: event.event_type || 'custom',
      color: 'purple'
    }));

    const allEvents = [...courseEvents, ...assignmentEvents, ...customFormattedEvents];
    res.json(allEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// ==================== RESOURCES ROUTES ====================
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getDocument(COLLECTIONS.USERS, userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const accountType = user.account_type;
    const allResources = await getDocuments(COLLECTIONS.RESOURCES, [], 'created_at', 'desc');

    const filteredResources = allResources.filter(resource => {
      const allowedTypes = resource.allowed_account_types || [];
      return allowedTypes.includes(accountType);
    });

    res.json(filteredResources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// ==================== CERTIFICATES ROUTES ====================
app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const certificates = await getDocuments(COLLECTIONS.CERTIFICATES, [
      { field: 'user_id', operator: '==', value: userId }
    ], 'issued_date', 'desc');

    const certificatesWithDetails = await Promise.all(
      certificates.map(async (certificate) => {
        const course = await getDocument(COLLECTIONS.COURSES, certificate.course_id);
        const enrollment = await getDocuments(COLLECTIONS.ENROLLMENTS, [
          { field: 'user_id', operator: '==', value: userId },
          { field: 'course_id', operator: '==', value: certificate.course_id }
        ]);

        return {
          id: certificate.id,
          userId: certificate.user_id,
          courseId: certificate.course_id,
          certificateUrl: certificate.certificate_url,
          issuedDate: certificate.issued_date,
          course: course,
          enrollment: enrollment.length > 0 ? enrollment[0] : null
        };
      })
    );

    res.json(certificatesWithDetails);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// ==================== INTERNSHIPS ROUTES ====================
app.get('/api/internships', async (req, res) => {
  try {
    const internships = await getDocuments(COLLECTIONS.INTERNSHIPS, [], 'posted_at', 'desc');
    const parsedInternships = internships.map(internship => ({
      ...internship,
      requirements: internship.requirements || [],
      benefits: internship.benefits || []
    }));
    res.json(parsedInternships);
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ message: 'Internal server error while fetching internships.' });
  }
});

app.get('/api/users/:userId/internship-submissions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const paramUserId = req.params.userId;

    if (paramUserId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You can only access your own internship submissions.' });
    }

    const applications = await getDocuments(COLLECTIONS.INTERNSHIP_SUBMISSIONS, [
      { field: 'user_id', operator: '==', value: userId }
    ], 'submitted_at', 'desc');

    const applicationsWithDetails = await Promise.all(
      applications.map(async (application) => {
        const internship = await getDocument(COLLECTIONS.INTERNSHIPS, application.internship_id);
        return {
          id: application.id,
          internship_id: application.internship_id,
          applicationStatus: application.status,
          applicationDate: application.submitted_at,
          internshipTitle: internship?.title,
          companyName: internship?.company
        };
      })
    );

    res.json(applicationsWithDetails);
  } catch (error) {
    console.error('Error fetching user internship applications:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

app.post('/api/internships/:id/apply', authenticateToken, async (req, res) => {
  try {
    const internshipId = req.params.id;
    const { full_name, email, phone, resume_url, cover_letter } = req.body;
    const userId = req.user.id;

    if (!full_name || !email || !resume_url) {
      return res.status(400).json({ message: 'Full name, email, and resume link are required.' });
    }

    const internship = await getDocument(COLLECTIONS.INTERNSHIPS, internshipId);
    if (!internship) return res.status(404).json({ message: 'Internship not found.' });

    if (internship.spots_available <= 0) {
      return res.status(400).json({ message: 'No available spots left for this internship.' });
    }

    const existingApplications = await getDocuments(COLLECTIONS.INTERNSHIP_SUBMISSIONS, [
      { field: 'internship_id', operator: '==', value: internshipId },
      { field: 'user_id', operator: '==', value: userId }
    ]);

    if (existingApplications.length > 0) {
      return res.status(409).json({ message: 'You have already applied for this internship.' });
    }

    await addDocument(COLLECTIONS.INTERNSHIP_SUBMISSIONS, {
      internship_id: internshipId,
      user_id: userId,
      full_name: full_name,
      email: email,
      phone: phone || null,
      resume_url: resume_url,
      cover_letter: cover_letter || null,
      submitted_at: new Date().toISOString(),
      status: 'pending'
    });

    await updateDocument(COLLECTIONS.INTERNSHIPS, internshipId, {
      spots_available: internship.spots_available - 1,
      applications_count: (internship.applications_count || 0) + 1
    });

    res.status(201).json({ message: 'Internship application submitted successfully!' });
  } catch (error) {
    console.error('Error submitting internship application:', error);
    res.status(500).json({ message: 'Internal server error during application submission.' });
  }
});

// ==================== SERVICES ROUTES ====================
app.get('/api/services/categories', async (req, res) => {
  try {
    const categories = await getDocuments(COLLECTIONS.SERVICE_CATEGORIES, [
      { field: 'is_active', operator: '==', value: true }
    ], 'name', 'asc');

    const categoriesWithSubs = await Promise.all(
      categories.map(async (category) => {
        const subcategories = await getDocuments(COLLECTIONS.SERVICE_SUBCATEGORIES, [
          { field: 'category_id', operator: '==', value: category.id },
          { field: 'is_active', operator: '==', value: true }
        ], 'name', 'asc');

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          subcategories: subcategories
        };
      })
    );

    res.json(categoriesWithSubs);
  } catch (error) {
    console.error('Get service categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/services/requests', authenticateToken, async (req, res) => {
  try {
    const { subcategoryId, fullName, email, phone, company, website, projectDetails, budgetRange, timeline, contactMethod, additionalRequirements } = req.body;
    const userId = req.user.id;

    if (!subcategoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const subcategory = await getDocument(COLLECTIONS.SERVICE_SUBCATEGORIES, subcategoryId);
    if (!subcategory || !subcategory.is_active) {
      return res.status(404).json({ error: 'Service subcategory not found' });
    }

    const requestId = await addDocument(COLLECTIONS.SERVICE_REQUESTS, {
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
      status: 'pending'
    });

    res.status(201).json({ message: 'Service request submitted successfully', requestId });
  } catch (error) {
    console.error('Service request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/services/my-requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await getDocuments(COLLECTIONS.SERVICE_REQUESTS, [
      { field: 'user_id', operator: '==', value: userId }
    ], 'created_at', 'desc');

    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const subcategory = await getDocument(COLLECTIONS.SERVICE_SUBCATEGORIES, request.subcategory_id);
        const category = subcategory ? await getDocument(COLLECTIONS.SERVICE_CATEGORIES, subcategory.category_id) : null;

        return {
          id: request.id,
          userId: request.user_id,
          subcategoryId: request.subcategory_id,
          fullName: request.full_name,
          email: request.email,
          phone: request.phone,
          company: request.company,
          website: request.website,
          projectDetails: request.project_details,
          budgetRange: request.budget_range,
          timeline: request.timeline,
          contactMethod: request.contact_method,
          additionalRequirements: request.additional_requirements,
          status: request.status,
          createdAt: request.created_at,
          categoryName: category?.name,
          subcategoryName: subcategory?.name
        };
      })
    );

    res.json(requestsWithDetails);
  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== CONTACT ROUTES ====================
app.post('/api/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, company, message } = req.body;

    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ error: 'First name, last name, email, and message are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    const contactId = await addDocument(COLLECTIONS.CONTACT_MESSAGES, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      company: company || null,
      message: message.trim(),
      status: 'pending'
    });

    res.status(201).json({ message: 'Contact message sent successfully', contactId });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== COURSE ENROLLMENT REQUEST ====================
app.post('/api/enroll-request', authenticateToken, paymentScreenshotUpload.single('paymentScreenshot'), async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { courseId, fullName, email, phone, address, city, state, pincode, paymentMethod, transactionId } = req.body;

    const requiredFields = ['courseId', 'fullName', 'email', 'phone', 'address', 'city', 'state', 'pincode', 'paymentMethod', 'transactionId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}`, missingFields });
    }

    if (!req.file) return res.status(400).json({ error: 'Payment screenshot is required' });

    await addDocument(COLLECTIONS.COURSE_ENROLL_REQUESTS, {
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
      status: 'pending'
    });

    res.status(201).json({ message: 'Enrollment request submitted successfully' });
  } catch (error) {
    console.error('Enrollment request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ADMIN ROUTES ====================
app.get('/api/admin/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await getDocuments(COLLECTIONS.USERS);
    const courses = await getDocuments(COLLECTIONS.COURSES);
    const enrollments = await getDocuments(COLLECTIONS.ENROLLMENTS);
    const contactMessages = await getDocuments(COLLECTIONS.CONTACT_MESSAGES);
    const serviceRequests = await getDocuments(COLLECTIONS.SERVICE_REQUESTS);

    const totalUsers = users.filter(user => user.is_active).length;
    const totalCourses = courses.filter(course => course.is_active).length;
    const totalEnrollments = enrollments.length;

    let totalRevenue = 0;
    const completedEnrollments = enrollments.filter(e => e.status === 'completed');
    for (const enrollment of completedEnrollments) {
      const course = await getDocument(COLLECTIONS.COURSES, enrollment.course_id);
      if (course && course.price) totalRevenue += parseFloat(course.price) || 0;
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const pendingContacts = contactMessages.filter(msg => new Date(msg.created_at) >= weekAgo).length;
    const pendingServiceRequests = serviceRequests.filter(req => req.status === 'pending').length;

    res.json({ totalUsers, totalCourses, totalEnrollments, totalRevenue, pendingContacts, pendingServiceRequests });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const accountType = req.query.accountType;
    const status = req.query.status;
    const search = req.query.search;

    let allUsers = await getDocuments(COLLECTIONS.USERS, [], 'created_at', 'desc');

    if (accountType && accountType !== 'all') {
      allUsers = allUsers.filter(user => user.account_type === accountType);
    }

    if (status && status !== 'all') {
      const isActive = status === 'active';
      allUsers = allUsers.filter(user => user.is_active === isActive);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      allUsers = allUsers.filter(user => 
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const users = allUsers.slice(startIndex, endIndex);

    res.json({
      users: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(allUsers.length / limit),
        totalUsers: allUsers.length,
        hasNextPage: page < Math.ceil(allUsers.length / limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== UTILITY ROUTES ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime(), database: 'Firebase Firestore' });
});

app.get('/api/info', (req, res) => {
  res.json({ name: 'Padak Dashboard API', version: '1.0.0', environment: process.env.NODE_ENV || 'development', database: 'Firebase Firestore', timestamp: new Date().toISOString() });
});

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path, method: req.method });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }

  res.status(500).json({ error: 'Internal server error', message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong' });
});

// ==================== SERVER STARTUP ====================
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: Firebase Firestore`);
  console.log(`🔥 Project: startup-dbs-1`);
});

module.exports = app;