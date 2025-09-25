// server.js (Firebase Firestore Version)
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
  startAfter,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch
} = require('firebase/firestore');

const app = express();
const port = process.env.PORT || 5000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Firebase Configuration (using Client SDK)
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

// Social upload configuration
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

// CORS configuration
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

// ======== FIREBASE HELPER FUNCTIONS ========

// Convert Firestore timestamp to JavaScript date
const convertTimestamps = (data) => {
  if (!data) return data;
  
  const result = { ...data };
  for (const key in result) {
    if (result[key] && typeof result[key] === 'object' && 'toDate' in result[key]) {
      result[key] = result[key].toDate();
    } else if (Array.isArray(result[key])) {
      result[key] = result[key].map(item => 
        item && typeof item === 'object' && 'toDate' in item ? item.toDate() : item
      );
    }
  }
  return result;
};

// Get document by ID
const getDocument = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertTimestamps(docSnap.data()) };
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

// Get documents by query
const getDocuments = async (collectionName, conditions = [], orderByField = null, orderDirection = 'asc', docLimit = null) => {
  try {
    let q = collection(db, collectionName);
    
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });
    
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    if (docLimit) {
      q = query(q, limit(docLimit));
    }
    
    const querySnapshot = await getDocs(q);
    const results = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...convertTimestamps(doc.data()) });
    });
    
    return results;
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

// Add document
const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

// Update document
const updateDocument = async (collectionName, id, data) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updated_at: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

// Delete document
const deleteDocument = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
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
    const user = await getDocument('users', decoded.userId);

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
  const { firstName, lastName, email, phone, password, accountType } = req.body;

  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'First name, last name, email, and password are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if email exists
    const existingUsers = await getDocuments('users', [
      { field: 'email', operator: '==', value: email }
    ]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const userId = await addDocument('users', {
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
      email_verified: false
    });

    // Create user stats entry
    await addDocument('user_stats', {
      user_id: userId,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: Timestamp.now()
    });

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

app.post('/api/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const users = await getDocuments('users', [
      { field: 'email', operator: '==', value: email },
      { field: 'is_active', operator: '==', value: true }
    ]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const user = users[0];

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
    await updateDocument('users', user.id, {
      updated_at: Timestamp.now()
    });

    console.log('User logged in successfully:', { userId: user.id, email: user.email });

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

    await updateDocument('users', userId, {
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      company: company,
      website: website,
      bio: bio
    });

    // Get updated user data
    const updatedUser = await getDocument('users', userId);

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

    await updateDocument('users', userId, {
      profile_image: profileImage
    });

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

    const stats = await getDocuments('user_stats', [
      { field: 'user_id', operator: '==', value: userId }
    ]);

    if (stats.length === 0) {
      // Create default stats if not exists
      const statsId = await addDocument('user_stats', {
        user_id: userId,
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        last_activity: Timestamp.now()
      });

      res.json({
        coursesEnrolled: 0,
        coursesCompleted: 0,
        certificatesEarned: 0,
        learningStreak: 0,
        lastActivity: new Date().toISOString()
      });
    } else {
      const userStats = stats[0];
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

// ==================== SOCIAL FEED ROUTES ====================

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

app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    // Get user's connections
    const connections = await getDocuments('user_connections', [
      { field: 'user_id_1', operator: '==', value: userId },
      { field: 'status', operator: '==', value: 'accepted' }
    ]);

    const connectionIds = connections.map(conn => conn.user_id_2);
    connectionIds.push(userId); // Include user's own posts

    // Get posts with pagination
    let postsQuery = query(
      collection(db, 'social_activities'),
      where('activity_type', '==', 'post'),
      orderBy('created_at', 'desc'),
      limit(limit * page)
    );

    const postsSnapshot = await getDocs(postsQuery);
    const allPosts = [];
    postsSnapshot.forEach(doc => {
      allPosts.push({ id: doc.id, ...convertTimestamps(doc.data()) });
    });

    // Filter posts based on visibility
    const filteredPosts = allPosts.filter(post => {
      if (post.visibility === 'public') return true;
      if (post.visibility === 'private' && post.user_id === userId) return true;
      if (post.visibility === 'connections' && connectionIds.includes(post.user_id)) return true;
      return false;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit);

    // Get comments and likes for these posts
    const postIds = paginatedPosts.map(post => post.id);
    const comments = await getDocuments('social_activities', [
      { field: 'activity_type', operator: '==', value: 'comment' },
      { field: 'target_id', operator: 'in', value: postIds }
    ]);

    // Format response
    const postsWithData = await Promise.all(paginatedPosts.map(async (post) => {
      const user = await getDocument('users', post.user_id);
      const postComments = comments.filter(comment => comment.target_id === post.id);
      
      // Get likes and bookmarks
      const likes = await getDocuments('social_activities', [
        { field: 'activity_type', operator: '==', value: 'like' },
        { field: 'target_id', operator: '==', value: post.id }
      ]);

      const hasLiked = likes.some(like => like.user_id === userId);
      const hasBookmarked = await getDocuments('social_activities', [
        { field: 'activity_type', operator: '==', value: 'bookmark' },
        { field: 'target_id', operator: '==', value: post.id },
        { field: 'user_id', operator: '==', value: userId }
      ]);

      return {
        ...post,
        has_liked: hasLiked,
        has_bookmarked: hasBookmarked.length > 0,
        likes: likes.length,
        comment_count: postComments.length,
        image_url: getFullImageUrl(req, post.image_url),
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_image: getFullImageUrl(req, user.profile_image),
          account_type: user.account_type,
        },
        comments: await Promise.all(postComments.map(async (comment) => {
          const commentUser = await getDocument('users', comment.user_id);
          return {
            ...comment,
            user: {
              id: commentUser.id,
              first_name: commentUser.first_name,
              last_name: commentUser.last_name,
              profile_image: getFullImageUrl(req, commentUser.profile_image),
              account_type: commentUser.account_type,
            }
          };
        })),
      };
    }));

    res.json({
      posts: postsWithData,
      pagination: {
        page,
        totalPages: Math.ceil(filteredPosts.length / limit),
        totalPosts: filteredPosts.length
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

// Continue with other social endpoints (create post, like, comment, etc.)
// [Similar conversion pattern for all other endpoints...]

// ==================== COURSES ROUTES ====================

app.get('/api/courses', async (req, res) => {
  try {
    const courses = await getDocuments('courses', [
      { field: 'is_active', operator: '==', value: true }
    ], 'created_at', 'desc');

    const formattedCourses = courses.map(course => ({
      ...course,
      price: course.price !== null ? `₹${parseFloat(course.price).toFixed(2)}` : '₹0.00'
    }));

    res.json(formattedCourses);

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
});

app.get('/api/enrollments/my-courses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollments = await getDocuments('enrollments', [
      { field: 'user_id', operator: '==', value: userId },
      { field: 'status', operator: '==', value: 'active' }
    ], 'enrollment_date', 'desc');

    const enrollmentsWithCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await getDocument('courses', enrollment.course_id);
        return {
          id: enrollment.id,
          userId: enrollment.user_id,
          courseId: enrollment.course_id,
          progress: enrollment.progress,
          enrollmentDate: enrollment.enrollment_date,
          completionDate: enrollment.completion_date,
          status: enrollment.status,
          course: course ? {
            id: course.id,
            title: course.title,
            description: course.description,
            instructorName: course.instructor_name,
            durationWeeks: course.duration_weeks,
            difficultyLevel: course.difficulty_level,
            category: course.category,
            price: course.price,
            thumbnail: course.thumbnail,
            isActive: course.is_active
          } : null
        };
      })
    );

    res.json(enrollmentsWithCourses);

  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/courses/enroll', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Check if already enrolled
    const existingEnrollments = await getDocuments('enrollments', [
      { field: 'user_id', operator: '==', value: userId },
      { field: 'course_id', operator: '==', value: courseId }
    ]);

    if (existingEnrollments.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const course = await getDocument('courses', courseId);
    if (!course || !course.is_active) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    await addDocument('enrollments', {
      user_id: userId,
      course_id: courseId,
      enrollment_date: Timestamp.now(),
      progress: 0,
      status: 'active'
    });

    // Update user stats
    const userStats = await getDocuments('user_stats', [
      { field: 'user_id', operator: '==', value: userId }
    ]);

    if (userStats.length > 0) {
      await updateDocument('user_stats', userStats[0].id, {
        courses_enrolled: increment(1)
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

    // Get user's enrolled courses
    const enrollments = await getDocuments('enrollments', [
      { field: 'user_id', operator: '==', value: userId },
      { field: 'status', operator: '==', value: 'active' }
    ]);

    const courseIds = enrollments.map(e => e.course_id);

    if (courseIds.length === 0) {
      return res.json([]);
    }

    // Get assignments for these courses
    const assignments = await getDocuments('assignments', [
      { field: 'course_id', operator: 'in', value: courseIds }
    ], 'due_date', 'asc');

    const assignmentsWithSubmissions = await Promise.all(
      assignments.map(async (assignment) => {
        const course = await getDocument('courses', assignment.course_id);
        const submissions = await getDocuments('assignment_submissions', [
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
          course: course ? {
            id: course.id,
            title: course.title,
            category: course.category
          } : null,
          submission: submissions.length > 0 ? {
            id: submissions[0].id,
            content: submissions[0].content,
            file_path: submissions[0].file_path,
            submitted_at: submissions[0].submitted_at,
            grade: submissions[0].grade,
            feedback: submissions[0].feedback,
            status: submissions[0].status
          } : null
        };
      })
    );

    res.json(assignmentsWithSubmissions);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Continue with other assignment endpoints...

// ==================== RESOURCES ROUTES ====================

app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await getDocument('users', userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const accountType = user.account_type;
    
    // Get all resources
    const resources = await getDocuments('resources', [], 'created_at', 'desc');
    
    // Filter resources based on allowed account types
    const filteredResources = resources.filter(resource => {
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

    const certificates = await getDocuments('certificates', [
      { field: 'user_id', operator: '==', value: userId }
    ], 'issued_date', 'desc');

    const certificatesWithDetails = await Promise.all(
      certificates.map(async (cert) => {
        const course = await getDocument('courses', cert.course_id);
        const enrollment = await getDocuments('enrollments', [
          { field: 'user_id', operator: '==', value: userId },
          { field: 'course_id', operator: '==', value: cert.course_id }
        ]);

        return {
          id: cert.id,
          userId: cert.user_id,
          courseId: cert.course_id,
          certificateUrl: cert.certificate_url,
          issuedDate: cert.issued_date,
          course: course ? {
            id: course.id,
            title: course.title,
            description: course.description,
            instructorName: course.instructor_name,
            category: course.category,
            difficultyLevel: course.difficulty_level
          } : null,
          enrollment: enrollment.length > 0 ? {
            completionDate: enrollment[0].completion_date,
            finalGrade: enrollment[0].final_grade || 0,
            status: enrollment[0].status
          } : null
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
    const internships = await getDocuments('internships', [], 'posted_at', 'desc');
    
    const parsedInternships = internships.map(internship => ({
      ...internship,
      requirements: Array.isArray(internship.requirements) ? internship.requirements : [],
      benefits: Array.isArray(internship.benefits) ? internship.benefits : []
    }));
    
    res.json(parsedInternships);
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ message: 'Internal server error while fetching internships.' });
  }
});

// ==================== SERVICES ROUTES ====================

app.get('/api/services/categories', async (req, res) => {
  try {
    const categories = await getDocuments('service_categories', [
      { field: 'is_active', operator: '==', value: true }
    ], 'name', 'asc');

    const categoriesWithSubs = await Promise.all(
      categories.map(async (category) => {
        const subcategories = await getDocuments('service_subcategories', [
          { field: 'category_id', operator: '==', value: category.id },
          { field: 'is_active', operator: '==', value: true }
        ], 'name', 'asc');

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          subcategories: subcategories.map(sub => ({
            id: sub.id,
            categoryId: sub.category_id,
            name: sub.name,
            description: sub.description,
            basePrice: sub.base_price
          }))
        };
      })
    );

    res.json(categoriesWithSubs);
  } catch (error) {
    console.error('Get service categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ADMIN ROUTES ====================

app.get('/api/admin/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      pendingContacts,
      pendingServiceRequests
    ] = await Promise.all([
      getDocuments('users', [{ field: 'is_active', operator: '==', value: true }]),
      getDocuments('courses', [{ field: 'is_active', operator: '==', value: true }]),
      getDocuments('enrollments'),
      getDocuments('contact_messages', [{ field: 'created_at', operator: '>=', value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }]),
      getDocuments('service_requests', [{ field: 'status', operator: '==', value: 'pending' }])
    ]);

    // Calculate revenue (mock calculation)
    const completedEnrollments = await getDocuments('enrollments', [
      { field: 'status', operator: '==', value: 'completed' }
    ]);

    let totalRevenue = 0;
    for (const enrollment of completedEnrollments) {
      const course = await getDocument('courses', enrollment.course_id);
      if (course && course.price) {
        totalRevenue += parseFloat(course.price) || 0;
      }
    }

    res.json({
      totalUsers: totalUsers.length,
      totalCourses: totalCourses.length,
      totalEnrollments: totalEnrollments.length,
      totalRevenue: totalRevenue,
      pendingContacts: pendingContacts.length,
      pendingServiceRequests: pendingServiceRequests.length
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

// ==================== CONTACT ROUTES ====================

app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, phone, company, message } = req.body;

  try {
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        error: 'First name, last name, email, and message are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    const contactId = await addDocument('contact_messages', {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      company: company || null,
      message: message.trim(),
      status: 'pending'
    });

    console.log('Contact message saved successfully:', { contactId, email: email.trim() });
    res.status(201).json({
      message: 'Contact message sent successfully',
      contactId: contactId
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== CALENDAR ROUTES ====================

app.get('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's enrollments
    const enrollments = await getDocuments('enrollments', [
      { field: 'user_id', operator: '==', value: userId },
      { field: 'status', operator: '==', value: 'active' }
    ]);

    const courseIds = enrollments.map(e => e.course_id);
    const events = [];

    // Get course events
    if (courseIds.length > 0) {
      const courses = await getDocuments('courses', [
        { field: 'id', operator: 'in', value: courseIds }
      ]);

      courses.forEach(course => {
        events.push({
          id: `course-${course.id}`,
          title: `Course: ${course.title}`,
          description: course.description || 'Course enrollment',
          date: course.created_at,
          type: 'course_start',
          course: {
            id: course.id,
            title: course.title,
            category: course.category
          },
          color: 'blue'
        });
      });

      // Get assignment events
      const assignments = await getDocuments('assignments', [
        { field: 'course_id', operator: 'in', value: courseIds }
      ]);

      for (const assignment of assignments) {
        const course = courses.find(c => c.id === assignment.course_id);
        const submissions = await getDocuments('assignment_submissions', [
          { field: 'assignment_id', operator: '==', value: assignment.id },
          { field: 'user_id', operator: '==', value: userId }
        ]);

        let status = 'pending';
        if (submissions.length > 0) {
          status = submissions[0].status === 'graded' ? 'completed' : 'submitted';
        } else if (assignment.due_date < new Date()) {
          status = 'overdue';
        }

        events.push({
          id: `assignment-${assignment.id}`,
          title: assignment.title,
          description: assignment.description || 'Assignment due',
          date: assignment.due_date,
          type: 'assignment',
          course: course ? {
            id: course.id,
            title: course.title,
            category: course.category
          } : null,
          status: status,
          color: status === 'completed' ? 'green' :
                 status === 'overdue' ? 'red' : 'orange'
        });
      }
    }

    // Get custom events
    try {
      const customEvents = await getDocuments('custom_calendar_events', [
        { field: 'user_id', operator: '==', value: userId }
      ], 'event_date', 'asc');

      customEvents.forEach(event => {
        events.push({
          id: `custom-${event.id}`,
          title: event.title,
          description: event.description || '',
          date: event.event_date,
          time: event.event_time,
          type: event.event_type || 'custom',
          color: 'purple'
        });
      });
    } catch (error) {
      console.log('Custom events not available:', error.message);
    }

    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// ==================== UTILITY ROUTES ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'Padak Dashboard API (Firebase Version)',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'Firebase Firestore',
    timestamp: new Date().toISOString()
  });
});

// ==================== ERROR HANDLING ====================

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

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

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: Firebase Firestore`);
});

module.exports = app;