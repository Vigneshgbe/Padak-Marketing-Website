// server.js - Converted to Firebase Firestore
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT;

// Firebase Client SDK Configuration
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, Timestamp, writeBatch, runTransaction } = require('firebase/firestore');

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

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Create necessary directories
const assignmentsDir = path.join(__dirname, 'uploads', 'assignments');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });

const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const paymentsDir = path.join(__dirname, 'uploads', 'payments');
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

// Firebase Collections (23 collections corresponding to MySQL tables)
const COLLECTIONS = {
  USERS: 'users',
  USER_STATS: 'user_stats',
  COURSES: 'courses',
  ENROLLMENTS: 'enrollments',
  ASSIGNMENTS: 'assignments',
  ASSIGNMENT_SUBMISSIONS: 'assignment_submissions',
  SOCIAL_ACTIVITIES: 'social_activities',
  USER_CONNECTIONS: 'user_connections',
  RESOURCES: 'resources',
  CERTIFICATES: 'certificates',
  INTERNSHIPS: 'internships',
  INTERNSHIP_SUBMISSIONS: 'internship_submissions',
  SERVICES: 'services',
  SERVICE_CATEGORIES: 'service_categories',
  SERVICE_SUBCATEGORIES: 'service_subcategories',
  SERVICE_REQUESTS: 'service_requests',
  CONTACT_MESSAGES: 'contact_messages',
  PAYMENTS: 'payments',
  USER_RESOURCES: 'user_resources',
  DOWNLOAD_LOGS: 'download_logs',
  CUSTOM_CALENDAR_EVENTS: 'custom_calendar_events',
  COURSE_ENROLL_REQUESTS: 'course_enroll_requests',
  COURSE_CATEGORIES: 'course_categories'
};

// ===== MULTER CONFIGURATIONS (Same as before) =====
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

// ===== CORS configuration ======
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

// Helper to convert Firestore data to plain object
const firestoreToObject = (doc) => {
  if (!doc.exists()) return null;
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    // Convert Firestore Timestamps to JavaScript Dates
    ...Object.keys(data).reduce((acc, key) => {
      if (data[key] && data[key].toDate) {
        acc[key] = data[key].toDate();
      }
      return acc;
    }, {})
  };
};

// Helper to get multiple documents
const getCollectionData = async (collectionName, conditions = []) => {
  try {
    let q = query(collection(db, collectionName));
    
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToObject);
  } catch (error) {
    console.error(`Error getting ${collectionName}:`, error);
    throw error;
  }
};

// Helper to get single document
const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return firestoreToObject(docSnap);
  } catch (error) {
    console.error(`Error getting document ${docId} from ${collectionName}:`, error);
    throw error;
  }
};

// Helper to add document
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

// Helper to update document
const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updated_at: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error(`Error updating document ${docId} in ${collectionName}:`, error);
    throw error;
  }
};

// Helper to delete document
const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
    throw error;
  }
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

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

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
    const existingUsers = await getCollectionData(COLLECTIONS.USERS, [
      { field: 'email', operator: '==', value: email }
    ]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
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
      bio: null
    });

    // Create user stats entry
    await addDocument(COLLECTIONS.USER_STATS, {
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

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const users = await getCollectionData(COLLECTIONS.USERS, [
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
    await updateDocument(COLLECTIONS.USERS, user.id, {
      updated_at: Timestamp.now()
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
        createdAt: user.created_at,
        updatedAt: user.updated_at
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

    await updateDocument(COLLECTIONS.USERS, userId, {
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      company: company,
      website: website,
      bio: bio
    });

    // Get updated user data
    const user = await getDocument(COLLECTIONS.USERS, userId);

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

    await updateDocument(COLLECTIONS.USERS, userId, {
      profile_image: profileImage
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

    const stats = await getCollectionData(COLLECTIONS.USER_STATS, [
      { field: 'user_id', operator: '==', value: userId }
    ]);

    if (stats.length === 0) {
      // Create default stats if not exists
      await addDocument(COLLECTIONS.USER_STATS, {
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

// ==================== SOCIAL FEED FUNCTIONALITY ====================

// GET All Posts (with Pagination, Likes, Comments, etc.)
app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    // Get all posts with pagination
    let postsQuery = query(
      collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
      where('activity_type', '==', 'post'),
      orderBy('created_at', 'desc'),
      limit(limit * page)
    );

    const postsSnapshot = await getDocs(postsQuery);
    const allPosts = postsSnapshot.docs.map(firestoreToObject);
    
    // Filter posts based on visibility (simplified for Firestore)
    const filteredPosts = allPosts.filter(post => {
      if (post.visibility === 'public') return true;
      if (post.visibility === 'private' && post.user_id === userId) return true;
      // For connections visibility, we'd need to check connections - simplified here
      return post.user_id === userId;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const posts = filteredPosts.slice(startIndex, startIndex + limit);

    // Get user data and engagement for each post
    const postsWithData = await Promise.all(posts.map(async (post) => {
      const user = await getDocument(COLLECTIONS.USERS, post.user_id);
      
      // Get likes count
      const likesQuery = query(
        collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
        where('activity_type', '==', 'like'),
        where('target_id', '==', post.id)
      );
      const likesSnapshot = await getDocs(likesQuery);
      const likes = likesSnapshot.size;

      // Get comments
      const commentsQuery = query(
        collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
        where('activity_type', '==', 'comment'),
        where('target_id', '==', post.id),
        orderBy('created_at', 'asc')
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const comments = await Promise.all(commentsSnapshot.docs.map(async (doc) => {
        const comment = firestoreToObject(doc);
        const commentUser = await getDocument(COLLECTIONS.USERS, comment.user_id);
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
      }));

      // Check if current user has liked or bookmarked
      const userLikeQuery = query(
        collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
        where('activity_type', '==', 'like'),
        where('target_id', '==', post.id),
        where('user_id', '==', userId)
      );
      const userLikeSnapshot = await getDocs(userLikeQuery);
      const hasLiked = !userLikeSnapshot.empty;

      const userBookmarkQuery = query(
        collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
        where('activity_type', '==', 'bookmark'),
        where('target_id', '==', post.id),
        where('user_id', '==', userId)
      );
      const userBookmarkSnapshot = await getDocs(userBookmarkQuery);
      const hasBookmarked = !userBookmarkSnapshot.empty;

      return {
        ...post,
        has_liked: hasLiked,
        has_bookmarked: hasBookmarked,
        likes: likes,
        comment_count: comments.length,
        image_url: getFullImageUrl(req, post.image_url),
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_image: getFullImageUrl(req, user.profile_image),
          account_type: user.account_type,
        },
        comments: comments,
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

      const postId = await addDocument(COLLECTIONS.SOCIAL_ACTIVITIES, {
        user_id: userId,
        activity_type: 'post',
        content: content || '',
        image_url: imageUrl,
        achievement: isAchievement,
        visibility: visibility || 'public',
        share_count: 0
      });

      // Fetch the newly created post to return to frontend
      const newPost = await getDocument(COLLECTIONS.SOCIAL_ACTIVITIES, postId);
      const user = await getDocument(COLLECTIONS.USERS, userId);

      res.status(201).json({
        ...newPost,
        has_liked: false,
        has_bookmarked: false,
        likes: 0,
        comment_count: 0,
        image_url: getFullImageUrl(req, newPost.image_url),
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_image: getFullImageUrl(req, user.profile_image),
          account_type: user.account_type,
        },
        comments: [],
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
    const post = await getDocument(COLLECTIONS.SOCIAL_ACTIVITIES, id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    await updateDocument(COLLECTIONS.SOCIAL_ACTIVITIES, id, {
      content: content
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
    const post = await getDocument(COLLECTIONS.SOCIAL_ACTIVITIES, id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    // Delete the post and related activities (comments, likes, bookmarks)
    const batch = writeBatch(db);
    
    // Delete post
    const postRef = doc(db, COLLECTIONS.SOCIAL_ACTIVITIES, id);
    batch.delete(postRef);

    // Delete related comments
    const commentsQuery = query(
      collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
      where('activity_type', '==', 'comment'),
      where('target_id', '==', id)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    commentsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete related likes and bookmarks
    const engagementsQuery = query(
      collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
      where('target_id', '==', id)
    );
    const engagementsSnapshot = await getDocs(engagementsQuery);
    engagementsSnapshot.docs.forEach(doc => {
      if (doc.data().activity_type === 'like' || doc.data().activity_type === 'bookmark') {
        batch.delete(doc.ref);
      }
    });

    await batch.commit();

    // If there was an image, delete it from filesystem
    if (post.image_url) {
      fs.unlink(path.join(__dirname, post.image_url), (err) => {
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
    const commentId = await addDocument(COLLECTIONS.SOCIAL_ACTIVITIES, {
      user_id: userId,
      activity_type: 'comment',
      content: content,
      target_id: target_id
    });

    // Fetch the new comment with user info
    const newComment = await getDocument(COLLECTIONS.SOCIAL_ACTIVITIES, commentId);
    const user = await getDocument(COLLECTIONS.USERS, userId);

    res.status(201).json({
      ...newComment,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_image: getFullImageUrl(req, user.profile_image)
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
    const existingLikeQuery = query(
      collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
      where('activity_type', '==', 'like'),
      where('target_id', '==', targetId),
      where('user_id', '==', userId)
    );
    const existingLikeSnapshot = await getDocs(existingLikeQuery);

    if (existingLikeSnapshot.empty) {
      await addDocument(COLLECTIONS.SOCIAL_ACTIVITIES, {
        user_id: userId,
        activity_type: 'like',
        target_id: targetId
      });
    }

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
    const likeQuery = query(
      collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
      where('activity_type', '==', 'like'),
      where('target_id', '==', targetId),
      where('user_id', '==', userId)
    );
    const likeSnapshot = await getDocs(likeQuery);

    if (!likeSnapshot.empty) {
      const likeDoc = likeSnapshot.docs[0];
      await deleteDocument(COLLECTIONS.SOCIAL_ACTIVITIES, likeDoc.id);
    }

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
    const existingBookmarkQuery = query(
      collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
      where('activity_type', '==', 'bookmark'),
      where('target_id', '==', targetId),
      where('user_id', '==', userId)
    );
    const existingBookmarkSnapshot = await getDocs(existingBookmarkQuery);

    if (existingBookmarkSnapshot.empty) {
      await addDocument(COLLECTIONS.SOCIAL_ACTIVITIES, {
        user_id: userId,
        activity_type: 'bookmark',
        target_id: targetId
      });
    }

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
    const bookmarkQuery = query(
      collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
      where('activity_type', '==', 'bookmark'),
      where('target_id', '==', targetId),
      where('user_id', '==', userId)
    );
    const bookmarkSnapshot = await getDocs(bookmarkQuery);

    if (!bookmarkSnapshot.empty) {
      const bookmarkDoc = bookmarkSnapshot.docs[0];
      await deleteDocument(COLLECTIONS.SOCIAL_ACTIVITIES, bookmarkDoc.id);
    }

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
    const post = await getDocument(COLLECTIONS.SOCIAL_ACTIVITIES, postId);
    if (post) {
      await updateDocument(COLLECTIONS.SOCIAL_ACTIVITIES, postId, {
        share_count: (post.share_count || 0) + 1
      });
    }

    res.json({ message: 'Share tracked.' });
  } catch (error) {
    console.error('Error tracking share:', error);
    res.status(500).json({ error: 'Failed to track share.' });
  }
});

// ==================== COURSES ROUTES ====================

// GET all courses
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await getCollectionData(COLLECTIONS.COURSES, [
      { field: 'is_active', operator: '==', value: true }
    ]);

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

// Get user's enrolled courses
app.get('/api/enrollments/my-courses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollments = await getCollectionData(COLLECTIONS.ENROLLMENTS, [
      { field: 'user_id', operator: '==', value: userId },
      { field: 'status', operator: '==', value: 'active' }
    ]);

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

// Enroll in a course
app.post('/api/courses/enroll', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Check if already enrolled
    const existingEnrollments = await getCollectionData(COLLECTIONS.ENROLLMENTS, [
      { field: 'user_id', operator: '==', value: userId },
      { field: 'course_id', operator: '==', value: courseId }
    ]);

    if (existingEnrollments.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const course = await getDocument(COLLECTIONS.COURSES, courseId);
    if (!course || !course.is_active) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    await addDocument(COLLECTIONS.ENROLLMENTS, {
      user_id: userId,
      course_id: courseId,
      enrollment_date: Timestamp.now(),
      progress: 0,
      status: 'active',
      completion_date: null
    });

    // Update user stats
    const userStats = await getCollectionData(COLLECTIONS.USER_STATS, [
      { field: 'user_id', operator: '==', value: userId }
    ]);

    if (userStats.length > 0) {
      const stats = userStats[0];
      await updateDocument(COLLECTIONS.USER_STATS, stats.id, {
        courses_enrolled: (stats.courses_enrolled || 0) + 1
      });
    }

    res.status(201).json({ message: 'Successfully enrolled in course' });

  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ASSIGNMENTS ROUTES ====================

// GET user's assignments
app.get('/api/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's enrollments to find their courses
    const enrollments = await getCollectionData(COLLECTIONS.ENROLLMENTS, [
      { field: 'user_id', operator: '==', value: userId },
      { field: 'status', operator: '==', value: 'active' }
    ]);

    const courseIds = enrollments.map(e => e.course_id);
    
    if (courseIds.length === 0) {
      return res.json([]);
    }

    // Get assignments for these courses
    const assignments = await getCollectionData(COLLECTIONS.ASSIGNMENTS);
    const userAssignments = assignments.filter(assignment => 
      courseIds.includes(assignment.course_id)
    );

    // Get submission data for each assignment
    const assignmentsWithSubmissions = await Promise.all(
      userAssignments.map(async (assignment) => {
        const course = await getDocument(COLLECTIONS.COURSES, assignment.course_id);
        
        // Get user's submission for this assignment
        const submissions = await getCollectionData(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, [
          { field: 'assignment_id', operator: '==', value: assignment.id },
          { field: 'user_id', operator: '==', value: userId }
        ]);

        const submission = submissions.length > 0 ? submissions[0] : null;

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
          submission: submission ? {
            id: submission.id,
            content: submission.content,
            file_path: submission.file_path,
            submitted_at: submission.submitted_at,
            grade: submission.grade,
            feedback: submission.feedback,
            status: submission.status
          } : null
        };
      })
    );

    // Sort by due date
    assignmentsWithSubmissions.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    res.json(assignmentsWithSubmissions);
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
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
    const assignment = await getDocument(COLLECTIONS.ASSIGNMENTS, assignment_id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if user is enrolled in the course
    const enrollments = await getCollectionData(COLLECTIONS.ENROLLMENTS, [
      { field: 'user_id', operator: '==', value: userId },
      { field: 'course_id', operator: '==', value: assignment.course_id },
      { field: 'status', operator: '==', value: 'active' }
    ]);

    if (enrollments.length === 0) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Check if already submitted
    const existingSubmissions = await getCollectionData(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, [
      { field: 'assignment_id', operator: '==', value: assignment_id },
      { field: 'user_id', operator: '==', value: userId }
    ]);

    if (existingSubmissions.length > 0) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }

    // Create submission
    const submissionId = await addDocument(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, {
      assignment_id: assignment_id,
      user_id: userId,
      content: content || '',
      file_path: file_path,
      submitted_at: Timestamp.now(),
      status: 'submitted',
      grade: null,
      feedback: null
    });

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission_id: submissionId
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Database error' });
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

    // Insert contact form data
    const contactId = await addDocument(COLLECTIONS.CONTACT_MESSAGES, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      company: company || null,
      message: message.trim(),
      status: 'pending'
    });

    console.log('Contact message saved successfully:', {
      id: contactId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim()
    });

    res.status(201).json({
      message: 'Contact message sent successfully',
      contactId: contactId
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Server error' });
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

      // Insert into database
      const requestId = await addDocument(COLLECTIONS.COURSE_ENROLL_REQUESTS, {
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

      res.status(201).json({
        message: 'Enrollment request submitted successfully',
        requestId: requestId
      });

    } catch (error) {
      console.error('Enrollment request error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
);

// ==================== ADMIN ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      contactMessages,
      serviceRequests
    ] = await Promise.all([
      getCollectionData(COLLECTIONS.USERS),
      getCollectionData(COLLECTIONS.COURSES, [{ field: 'is_active', operator: '==', value: true }]),
      getCollectionData(COLLECTIONS.ENROLLMENTS),
      getCollectionData(COLLECTIONS.CONTACT_MESSAGES),
      getCollectionData(COLLECTIONS.SERVICE_REQUESTS, [{ field: 'status', operator: '==', value: 'pending' }])
    ]);

    // Calculate revenue (mock calculation based on enrollments)
    const revenue = totalEnrollments.length * 100; // Assuming ₹100 per enrollment

    res.json({
      totalUsers: totalUsers.length,
      totalCourses: totalCourses.length,
      totalEnrollments: totalEnrollments.length,
      totalRevenue: revenue,
      pendingContacts: contactMessages.filter(msg => msg.status === 'pending').length,
      pendingServiceRequests: serviceRequests.length
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

    let usersQuery = collection(db, COLLECTIONS.USERS);
    
    // Apply filters
    if (accountType && accountType !== 'all') {
      usersQuery = query(usersQuery, where('account_type', '==', accountType));
    }

    if (status && status !== 'all') {
      const isActive = status === 'active';
      usersQuery = query(usersQuery, where('is_active', '==', isActive));
    }

    // Get all users first (Firestore doesn't have easy counting with filters)
    const usersSnapshot = await getDocs(usersQuery);
    let allUsers = usersSnapshot.docs.map(firestoreToObject);

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      allUsers = allUsers.filter(user => 
        user.first_name.toLowerCase().includes(searchLower) ||
        user.last_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
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

  if (err.message === 'Only image files are allowed for avatar') {
    return res.status(400).json({ error: err.message });
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