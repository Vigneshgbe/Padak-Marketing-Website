// server.js
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

const app = express();
const port = process.env.PORT || 5000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: "startup-dbs-1",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "startup-dbs-1",
  storageBucket: "startup-dbs-1.firebasestorage.app"
});

const db = admin.firestore();
const storage = admin.storage().bucket();

// Create necessary directories
const assignmentsDir = path.join(__dirname, 'uploads', 'assignments');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });

const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const paymentsDir = path.join(__dirname, 'uploads', 'payments');
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

// Test Firestore connection
async function testConnection() {
  try {
    await db.collection('health').doc('test').set({ timestamp: new Date(), status: 'connected' });
    console.log('Connected to Firestore database');
  } catch (err) {
    console.error('Firestore connection failed:', err);
    process.exit(1);
  }
}

testConnection();

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
    const userDoc = await db.collection('users').doc(decoded.userId).get();

    if (!userDoc.exists || !userDoc.data().isActive) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = { id: userDoc.id, ...userDoc.data() };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.accountType !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ==================== HELPER FUNCTIONS ====================

// Generate unique ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Convert Firestore timestamp to date
const convertTimestamp = (timestamp) => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  }
  return timestamp;
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
    const existingUsersSnapshot = await db.collection('users').where('email', '==', email).get();
    if (!existingUsersSnapshot.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user document
    const userId = generateId();
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      passwordHash: hashedPassword,
      accountType: accountType || 'student',
      isActive: true,
      emailVerified: false,
      profileImage: null,
      company: null,
      website: null,
      bio: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userId).set(userData);

    // Create user stats document
    await db.collection('userStats').doc(userId).set({
      userId: userId,
      coursesEnrolled: 0,
      coursesCompleted: 0,
      certificatesEarned: 0,
      learningStreak: 0,
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
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
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .where('isActive', '==', true)
      .get();

    if (usersSnapshot.empty) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const userDoc = usersSnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const tokenExpiry = rememberMe ? '30d' : '1d';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        accountType: user.accountType
      },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // Update last login timestamp
    await db.collection('users').doc(user.id).update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('User logged in successfully:', { userId: user.id, email: user.email });

    // Send success response
    res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        accountType: user.accountType,
        profileImage: user.profileImage,
        company: user.company,
        website: user.website,
        bio: user.bio,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
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
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      accountType: user.accountType,
      profileImage: user.profileImage,
      company: user.company,
      website: user.website,
      bio: user.bio,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
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
      firstName,
      lastName,
      phone,
      company,
      website,
      bio,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get updated user data
    const userDoc = await db.collection('users').doc(userId).get();
    const user = { id: userDoc.id, ...userDoc.data() };

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      accountType: user.accountType,
      profileImage: user.profileImage,
      company: user.company,
      website: user.website,
      bio: user.bio,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
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
    if (req.user.profileImage) {
      const oldFilename = path.basename(req.user.profileImage);
      const oldPath = path.join(avatarsDir, oldFilename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await db.collection('users').doc(userId).update({
      profileImage,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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

    const statsDoc = await db.collection('userStats').doc(userId).get();

    if (!statsDoc.exists) {
      // Create default stats if not exists
      const defaultStats = {
        userId,
        coursesEnrolled: 0,
        coursesCompleted: 0,
        certificatesEarned: 0,
        learningStreak: 0,
        lastActivity: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('userStats').doc(userId).set(defaultStats);

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
        coursesEnrolled: userStats.coursesEnrolled,
        coursesCompleted: userStats.coursesCompleted,
        certificatesEarned: userStats.certificatesEarned,
        learningStreak: userStats.learningStreak,
        lastActivity: userStats.lastActivity
      });
    }

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// =================================================================
// ============== ENHANCED SOCIAL FEED FUNCTIONALITY ===============
// =================================================================

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

// --- GET All Posts (with Pagination, Likes, Comments, etc.) ---
app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  try {
    // Get posts with pagination
    const postsQuery = db.collection('socialActivities')
      .where('activityType', '==', 'post')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    const postsSnapshot = await postsQuery.get();
    const posts = [];

    for (const doc of postsSnapshot.docs) {
      const postData = { id: doc.id, ...doc.data() };
      
      // Get user data
      const userDoc = await db.collection('users').doc(postData.userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      // Get likes count and check if user has liked
      const likesSnapshot = await db.collection('socialActivities')
        .where('activityType', '==', 'like')
        .where('targetId', '==', doc.id)
        .get();

      const hasLikedSnapshot = await db.collection('socialActivities')
        .where('activityType', '==', 'like')
        .where('targetId', '==', doc.id)
        .where('userId', '==', userId)
        .get();

      // Get bookmarks
      const hasBookmarkedSnapshot = await db.collection('socialActivities')
        .where('activityType', '==', 'bookmark')
        .where('targetId', '==', doc.id)
        .where('userId', '==', userId)
        .get();

      // Get comments
      const commentsSnapshot = await db.collection('socialActivities')
        .where('activityType', '==', 'comment')
        .where('targetId', '==', doc.id)
        .orderBy('createdAt', 'asc')
        .get();

      const comments = [];
      for (const commentDoc of commentsSnapshot.docs) {
        const commentData = commentDoc.data();
        const commentUserDoc = await db.collection('users').doc(commentData.userId).get();
        const commentUser = commentUserDoc.exists ? commentUserDoc.data() : {};

        comments.push({
          ...commentData,
          id: commentDoc.id,
          user: {
            id: commentData.userId,
            firstName: commentUser.firstName,
            lastName: commentUser.lastName,
            profileImage: getFullImageUrl(req, commentUser.profileImage),
            accountType: commentUser.accountType,
          }
        });
      }

      posts.push({
        ...postData,
        hasLiked: !hasLikedSnapshot.empty,
        hasBookmarked: !hasBookmarkedSnapshot.empty,
        likes: likesSnapshot.size,
        commentCount: commentsSnapshot.size,
        imageUrl: getFullImageUrl(req, postData.imageUrl),
        user: {
          id: postData.userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImage: getFullImageUrl(req, userData.profileImage),
          accountType: userData.accountType,
        },
        comments: comments,
      });
    }

    // Get total count
    const totalPostsSnapshot = await db.collection('socialActivities')
      .where('activityType', '==', 'post')
      .get();

    const totalPosts = totalPostsSnapshot.size;
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

      if (!content && !req.file) {
        return res.status(400).json({ error: 'Post must have content or an image.' });
      }

      const imageUrl = req.file ? `/uploads/social/${req.file.filename}` : null;
      const isAchievement = achievement === 'true';

      const postId = generateId();
      const postData = {
        userId,
        activityType: 'post',
        content: content || '',
        imageUrl,
        achievement: isAchievement,
        visibility: visibility || 'public',
        shareCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('socialActivities').doc(postId).set(postData);

      // Get user data for response
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      res.status(201).json({
        ...postData,
        id: postId,
        hasLiked: false,
        hasBookmarked: false,
        likes: 0,
        commentCount: 0,
        imageUrl: getFullImageUrl(req, imageUrl),
        user: {
          id: userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImage: getFullImageUrl(req, userData.profileImage),
          accountType: userData.accountType,
        },
        comments: [],
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post.' });
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
    const postDoc = await db.collection('socialActivities').doc(id).get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const postData = postDoc.data();
    if (postData.userId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    await db.collection('socialActivities').doc(id).update({
      content,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Post updated successfully.' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post.' });
  }
});

// --- DELETE a post ---
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const postDoc = await db.collection('socialActivities').doc(id).get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const postData = postDoc.data();
    if (postData.userId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    // Delete related activities (likes, comments, bookmarks)
    const relatedActivitiesSnapshot = await db.collection('socialActivities')
      .where('targetId', '==', id)
      .get();

    const batch = db.batch();
    relatedActivitiesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete the post
    batch.delete(db.collection('socialActivities').doc(id));
    await batch.commit();

    // Delete image file if exists
    if (postData.imageUrl) {
      fs.unlink(path.join(__dirname, postData.imageUrl), (err) => {
        if (err) console.error("Error deleting post image:", err);
      });
    }

    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
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
    const commentId = generateId();
    const commentData = {
      userId,
      activityType: 'comment',
      content,
      targetId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('socialActivities').doc(commentId).set(commentData);

    // Get user data for response
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    res.status(201).json({
      ...commentData,
      id: commentId,
      user: {
        id: userId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImage: getFullImageUrl(req, userData.profileImage)
      }
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

// --- POST (like) a post ---
app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    // Check if already liked
    const existingLike = await db.collection('socialActivities')
      .where('activityType', '==', 'like')
      .where('targetId', '==', targetId)
      .where('userId', '==', userId)
      .get();

    if (existingLike.empty) {
      const likeId = generateId();
      await db.collection('socialActivities').doc(likeId).set({
        userId,
        activityType: 'like',
        targetId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.status(201).json({ message: 'Post liked.' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post.' });
  }
});

// --- DELETE (unlike) a post ---
app.delete('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    const likesSnapshot = await db.collection('socialActivities')
      .where('activityType', '==', 'like')
      .where('targetId', '==', targetId)
      .where('userId', '==', userId)
      .get();

    const batch = db.batch();
    likesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({ message: 'Post unliked.' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ error: 'Failed to unlike post.' });
  }
});

// --- POST (bookmark) a post ---
app.post('/api/posts/:id/bookmark', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    // Check if already bookmarked
    const existingBookmark = await db.collection('socialActivities')
      .where('activityType', '==', 'bookmark')
      .where('targetId', '==', targetId)
      .where('userId', '==', userId)
      .get();

    if (existingBookmark.empty) {
      const bookmarkId = generateId();
      await db.collection('socialActivities').doc(bookmarkId).set({
        userId,
        activityType: 'bookmark',
        targetId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.status(201).json({ message: 'Post bookmarked.' });
  } catch (error) {
    console.error('Error bookmarking post:', error);
    res.status(500).json({ error: 'Failed to bookmark post.' });
  }
});

// --- DELETE (unbookmark) a post ---
app.delete('/api/posts/:id/bookmark', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    const bookmarksSnapshot = await db.collection('socialActivities')
      .where('activityType', '==', 'bookmark')
      .where('targetId', '==', targetId)
      .where('userId', '==', userId)
      .get();

    const batch = db.batch();
    bookmarksSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({ message: 'Post unbookmarked.' });
  } catch (error) {
    console.error('Error unbookmarking post:', error);
    res.status(500).json({ error: 'Failed to unbookmark post.' });
  }
});

// --- POST (track) a share ---
app.post('/api/posts/:id/share', authenticateToken, async (req, res) => {
  const postId = req.params.id;

  try {
    await db.collection('socialActivities').doc(postId).update({
      shareCount: admin.firestore.FieldValue.increment(1)
    });
    
    res.json({ message: 'Share tracked.' });
  } catch (error) {
    console.error('Error tracking share:', error);
    res.status(500).json({ error: 'Failed to track share.' });
  }
});

// ============ STUDENT DASHBOARD SPECIFIC ENDPOINTS  ====================

// Get user enrollments
app.get('/api/users/:userId/enrollments', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (parseInt(req.params.userId, 10) !== parseInt(userId)) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own enrollment data.' });
  }

  try {
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('userId', '==', userId)
      .get();

    const enrollments = [];
    
    for (const doc of enrollmentsSnapshot.docs) {
      const enrollmentData = doc.data();
      
      // Get course data
      const courseDoc = await db.collection('courses').doc(enrollmentData.courseId).get();
      const courseData = courseDoc.exists ? courseDoc.data() : {};

      enrollments.push({
        id: doc.id,
        progress: enrollmentData.progress,
        status: enrollmentData.status,
        enrollmentDate: enrollmentData.enrollmentDate,
        completionDate: enrollmentData.completionDate,
        courseId: enrollmentData.courseId,
        courseTitle: courseData.title,
        instructorName: courseData.instructorName,
        durationWeeks: courseData.durationWeeks
      });
    }

    enrollments.sort((a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate));
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching user enrollments for dashboard:', error);
    res.status(500).json({ error: 'Internal server error while fetching enrolled courses.' });
  }
});

// GET /api/users/:userId/internship-submissions
app.get('/api/users/:userId/internship-submissions', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (parseInt(req.params.userId, 10) !== parseInt(userId)) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own internship submissions.' });
  }

  try {
    const submissionsSnapshot = await db.collection('internshipSubmissions')
      .where('userId', '==', userId)
      .get();

    const applications = [];

    for (const doc of submissionsSnapshot.docs) {
      const submissionData = doc.data();
      
      // Get internship data
      const internshipDoc = await db.collection('internships').doc(submissionData.internshipId).get();
      const internshipData = internshipDoc.exists ? internshipDoc.data() : {};

      applications.push({
        id: doc.id,
        internshipId: submissionData.internshipId,
        applicationStatus: submissionData.status,
        applicationDate: submissionData.submittedAt,
        internshipTitle: internshipData.title,
        companyName: internshipData.company
      });
    }

    applications.sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));
    res.json(applications);
  } catch (error) {
    console.error('Error fetching user internship applications for dashboard:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// =============== NEW PROFESSIONAL DASHBOARD ENDPOINTS ====================

// Get available services
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const servicesSnapshot = await db.collection('services').get();
    const services = [];

    for (const doc of servicesSnapshot.docs) {
      const serviceData = doc.data();
      
      // Get category data
      const categoryDoc = await db.collection('serviceCategories').doc(serviceData.categoryId).get();
      const categoryData = categoryDoc.exists ? categoryDoc.data() : {};

      if (categoryData.isActive) {
        services.push({
          id: doc.id,
          name: serviceData.name,
          categoryId: serviceData.categoryId,
          categoryName: categoryData.name,
          description: serviceData.description,
          price: serviceData.price,
          duration: serviceData.duration,
          rating: serviceData.rating || 0,
          reviews: serviceData.reviews || 0,
          features: serviceData.features || [],
          popular: serviceData.popular || false
        });
      }
    }

    services.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    res.json(services);
  } catch (error) {
    console.error('Error fetching available services:', error);
    res.status(500).json({ message: 'Failed to fetch available services.', error: error.message });
  }
});

// Get user's service requests
app.get('/api/users/:userId/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (parseInt(req.params.userId, 10) !== parseInt(userId)) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
  }

  try {
    const requestsSnapshot = await db.collection('serviceRequests')
      .where('userId', '==', userId)
      .get();

    const requests = [];

    for (const doc of requestsSnapshot.docs) {
      const requestData = doc.data();
      
      // Get category data
      const categoryDoc = await db.collection('serviceCategories').doc(requestData.subcategoryId).get();
      const categoryData = categoryDoc.exists ? categoryDoc.data() : {};

      requests.push({
        id: doc.id,
        userId: requestData.userId,
        categoryId: requestData.subcategoryId,
        categoryName: categoryData.name,
        fullName: requestData.fullName,
        email: requestData.email,
        phone: requestData.phone,
        company: requestData.company,
        website: requestData.website,
        projectDetails: requestData.projectDetails,
        budgetRange: requestData.budgetRange,
        timeline: requestData.timeline,
        contactMethod: requestData.contactMethod,
        additionalRequirements: requestData.additionalRequirements,
        status: requestData.status,
        requestDate: requestData.createdAt,
        updatedAt: requestData.updatedAt
      });
    }

    requests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
    res.json(requests);
  } catch (error) {
    console.error('Error fetching user service requests:', error);
    res.status(500).json({ message: 'Failed to fetch your service requests.', error: error.message });
  }
});

// Submit service request
app.post('/api/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const {
    categoryId, fullName, email, phone, company, website,
    projectDetails, budgetRange, timeline, contactMethod, additionalRequirements
  } = req.body;

  // Validate required fields
  if (!userId || !categoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
    return res.status(400).json({ message: 'Missing required fields for service request. Please fill in all necessary details.' });
  }

  try {
    const requestId = generateId();
    const requestData = {
      userId,
      subcategoryId: categoryId,
      fullName,
      email,
      phone,
      company: company || null,
      website: website || null,
      projectDetails,
      budgetRange,
      timeline,
      contactMethod,
      additionalRequirements: additionalRequirements || null,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('serviceRequests').doc(requestId).set(requestData);

    res.status(201).json({ message: 'Service request submitted successfully!', id: requestId });
  } catch (error) {
    console.error('Error submitting service request:', error);
    res.status(500).json({ message: 'Failed to submit service request. An internal server error occurred.', error: error.message });
  }
});

// ==================== COURSES ROUTES ====================

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const coursesSnapshot = await db.collection('courses')
      .where('isActive', '==', true)
      .get();

    const courses = [];
    coursesSnapshot.docs.forEach(doc => {
      const courseData = doc.data();
      courses.push({
        id: doc.id,
        title: courseData.title,
        description: courseData.description,
        instructorName: courseData.instructorName,
        durationWeeks: courseData.durationWeeks,
        difficultyLevel: courseData.difficultyLevel,
        category: courseData.category,
        price: courseData.price !== null ? `₹${parseFloat(courseData.price).toFixed(2)}` : '₹0.00',
        thumbnail: courseData.thumbnail,
        isActive: courseData.isActive
      });
    });

    courses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();

    const enrollments = [];

    for (const doc of enrollmentsSnapshot.docs) {
      const enrollmentData = doc.data();
      
      // Get course data
      const courseDoc = await db.collection('courses').doc(enrollmentData.courseId).get();
      if (courseDoc.exists) {
        const courseData = courseDoc.data();

        enrollments.push({
          id: doc.id,
          userId: enrollmentData.userId,
          courseId: enrollmentData.courseId,
          progress: enrollmentData.progress,
          enrollmentDate: enrollmentData.enrollmentDate,
          completionDate: enrollmentData.completionDate,
          status: enrollmentData.status,
          course: {
            id: enrollmentData.courseId,
            title: courseData.title,
            description: courseData.description,
            instructorName: courseData.instructorName,
            durationWeeks: courseData.durationWeeks,
            difficultyLevel: courseData.difficultyLevel,
            category: courseData.category,
            price: courseData.price,
            thumbnail: courseData.thumbnail,
            isActive: courseData.isActive
          }
        });
      }
    }

    enrollments.sort((a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate));
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
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .get();

    if (!existingEnrollment.empty) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists || !courseDoc.data().isActive) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    const enrollmentId = generateId();
    await db.collection('enrollments').doc(enrollmentId).set({
      userId,
      courseId,
      progress: 0,
      status: 'active',
      enrollmentDate: admin.firestore.FieldValue.serverTimestamp(),
      completionDate: null
    });

    // Update user stats
    await db.collection('userStats').doc(userId).update({
      coursesEnrolled: admin.firestore.FieldValue.increment(1)
    });

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

    // Insert contact form data into Firestore
    const contactId = generateId();
    await db.collection('contactMessages').doc(contactId).set({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      company: company || null,
      message: message.trim(),
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
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
        courseId, fullName, email, phone, address, city, state, pincode,
        paymentMethod, transactionId
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

      // Insert into Firestore
      const requestId = generateId();
      await db.collection('courseEnrollRequests').doc(requestId).set({
        userId,
        courseId,
        fullName,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        paymentMethod,
        transactionId,
        paymentScreenshot: `/uploads/payments/${req.file.filename}`,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
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

// ==================== INTERNSHIPS ROUTES ====================

// GET all internships
app.get('/api/internships', async (req, res) => {
  try {
    const internshipsSnapshot = await db.collection('internships')
      .orderBy('postedAt', 'desc')
      .get();

    const internships = [];
    internshipsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      internships.push({
        id: doc.id,
        ...data,
        requirements: data.requirements || [],
        benefits: data.benefits || []
      });
    });

    res.json(internships);
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ message: 'Internal server error while fetching internships.' });
  }
});

// GET user internship applications
app.get('/api/user/internship-applications', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (!userId) {
    return res.status(400).json({ message: 'User ID not found in token.' });
  }

  try {
    const applicationsSnapshot = await db.collection('internshipSubmissions')
      .where('userId', '==', userId)
      .get();

    const applications = [];

    for (const doc of applicationsSnapshot.docs) {
      const submissionData = doc.data();
      
      // Get internship data
      const internshipDoc = await db.collection('internships').doc(submissionData.internshipId).get();
      if (internshipDoc.exists) {
        const internshipData = internshipDoc.data();
        
        applications.push({
          submissionId: doc.id,
          submittedAt: submissionData.submittedAt,
          status: submissionData.status,
          resumeUrl: submissionData.resumeUrl,
          coverLetter: submissionData.coverLetter,
          internshipId: submissionData.internshipId,
          title: internshipData.title,
          company: internshipData.company,
          location: internshipData.location,
          duration: internshipData.duration,
          type: internshipData.type,
          level: internshipData.level,
          description: internshipData.description,
          requirements: internshipData.requirements || [],
          benefits: internshipData.benefits || [],
          applicationsCount: internshipData.applicationsCount,
          spotsAvailable: internshipData.spotsAvailable,
          internshipPostedAt: internshipData.postedAt
        });
      }
    }

    applications.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.json(applications);
  } catch (error) {
    console.error('Error fetching user internship applications:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// POST apply for internship
app.post('/api/internships/:id/apply', authenticateToken, async (req, res) => {
  const { id: internshipId } = req.params;
  const { full_name, email, phone, resume_url, cover_letter } = req.body;
  const userId = req.user.id;

  if (!full_name || !email || !resume_url) {
    return res.status(400).json({ message: 'Full name, email, and resume link are required.' });
  }

  try {
    // Get internship document
    const internshipDoc = await db.collection('internships').doc(internshipId).get();
    
    if (!internshipDoc.exists) {
      return res.status(404).json({ message: 'Internship not found.' });
    }

    const internshipData = internshipDoc.data();
    if (internshipData.spotsAvailable <= 0) {
      return res.status(400).json({ message: 'No available spots left for this internship.' });
    }

    // Check if already applied
    const existingApplication = await db.collection('internshipSubmissions')
      .where('internshipId', '==', internshipId)
      .where('userId', '==', userId)
      .get();

    if (!existingApplication.empty) {
      return res.status(409).json({ message: 'You have already applied for this internship.' });
    }

    // Create application
    const submissionId = generateId();
    await db.collection('internshipSubmissions').doc(submissionId).set({
      internshipId,
      userId,
      fullName: full_name,
      email,
      phone: phone || null,
      resumeUrl: resume_url,
      coverLetter: cover_letter || null,
      status: 'pending',
      submittedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update internship counts
    await db.collection('internships').doc(internshipId).update({
      spotsAvailable: admin.firestore.FieldValue.increment(-1),
      applicationsCount: admin.firestore.FieldValue.increment(1)
    });

    res.status(201).json({ message: 'Internship application submitted successfully!' });

  } catch (error) {
    console.error('Error submitting internship application:', error);
    res.status(500).json({ message: 'Internal server error during application submission.' });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    // Get total users
    const usersSnapshot = await db.collection('users').where('isActive', '==', true).get();
    const totalUsers = usersSnapshot.size;

    // Get total courses
    const coursesSnapshot = await db.collection('courses').where('isActive', '==', true).get();
    const totalCourses = coursesSnapshot.size;

    // Get total enrollments
    const enrollmentsSnapshot = await db.collection('enrollments').get();
    const totalEnrollments = enrollmentsSnapshot.size;

    // Calculate total revenue (mock calculation)
    let totalRevenue = 0;
    for (const doc of enrollmentsSnapshot.docs) {
      const enrollment = doc.data();
      if (enrollment.status === 'completed') {
        const courseDoc = await db.collection('courses').doc(enrollment.courseId).get();
        if (courseDoc.exists) {
          const courseData = courseDoc.data();
          totalRevenue += parseFloat(courseData.price || 0);
        }
      }
    }

    // Get pending contacts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const contactsSnapshot = await db.collection('contactMessages')
      .where('createdAt', '>=', sevenDaysAgo)
      .get();
    const pendingContacts = contactsSnapshot.size;

    // Get pending service requests
    const serviceRequestsSnapshot = await db.collection('serviceRequests')
      .where('status', '==', 'pending')
      .get();
    const pendingServiceRequests = serviceRequestsSnapshot.size;

    res.json({
      totalUsers: totalUsers || 0,
      totalCourses: totalCourses || 0,
      totalEnrollments: totalEnrollments || 0,
      totalRevenue: totalRevenue || 0,
      pendingContacts: pendingContacts || 0,
      pendingServiceRequests: pendingServiceRequests || 0
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

// Recent Users
app.get('/api/admin/recent-users', authenticateToken, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const users = [];
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        accountType: userData.accountType,
        joinDate: userData.createdAt ? userData.createdAt.toDate().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) : 'N/A'
      });
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({ error: 'Failed to fetch recent users', details: error.message });
  }
});

// Recent Enrollments
app.get('/api/admin/recent-enrollments', authenticateToken, async (req, res) => {
  try {
    const enrollmentsSnapshot = await db.collection('enrollments')
      .orderBy('enrollmentDate', 'desc')
      .limit(5)
      .get();

    const enrollments = [];

    for (const doc of enrollmentsSnapshot.docs) {
      const enrollmentData = doc.data();
      
      // Get user data
      const userDoc = await db.collection('users').doc(enrollmentData.userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      // Get course data
      const courseDoc = await db.collection('courses').doc(enrollmentData.courseId).get();
      const courseData = courseDoc.exists ? courseDoc.data() : {};

      enrollments.push({
        id: doc.id,
        userName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User',
        courseName: courseData.title || 'Unknown Course',
        date: enrollmentData.enrollmentDate ? enrollmentData.enrollmentDate.toDate().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) : 'N/A',
        status: enrollmentData.status
      });
    }

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching recent enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch recent enrollments', details: error.message });
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

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔥 Database: Firebase Firestore`);
});

module.exports = app;