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
const app = express();
const port = process.env.PORT || 5000;

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase Client SDK configuration
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
const auth = getAuth(firebaseApp);

app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Create necessary directories
const assignmentsDir = path.join(__dirname, 'uploads', 'assignments');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });

const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const paymentsDir = path.join(__dirname, 'uploads', 'payments');
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

// ===== AVATAR MULTER CONFIGURATION =====
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

    if (!userDoc.exists || !userDoc.data().is_active) {
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
    const existingUsers = await db.collection('users').where('email', '==', email.trim()).get();

    if (!existingUsers.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const userRef = await db.collection('users').add({
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
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    });

    // Create user stats entry
    await db.collection('user_stats').add({
      user_id: userRef.id,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: FieldValue.serverTimestamp()
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
    const usersSnap = await db.collection('users').where('email', '==', email).where('is_active', '==', true).get();

    if (usersSnap.empty) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const userDoc = usersSnap.docs[0];
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
      updated_at: FieldValue.serverTimestamp()
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

    await db.collection('users').doc(userId).update({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      company: company,
      website: website,
      bio: bio,
      updated_at: FieldValue.serverTimestamp()
    });

    // Get updated user data
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();

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
      updated_at: FieldValue.serverTimestamp()
    });

    // Send success response with plain text
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

    const statsSnap = await db.collection('user_stats').where('user_id', '==', userId).get();

    if (statsSnap.empty) {
      // Create default stats if not exists
      await db.collection('user_stats').add({
        user_id: userId,
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        last_activity: FieldValue.serverTimestamp()
      });

      res.json({
        coursesEnrolled: 0,
        coursesCompleted: 0,
        certificatesEarned: 0,
        learningStreak: 0,
        lastActivity: new Date().toISOString()
      });
    } else {
      const userStats = statsSnap.docs[0].data();
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

// Helper function to get full URL for images (SIMPLIFIED)
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
    // In Firestore, we need to fetch posts that match visibility criteria
    // First, get connections
    const connectionsSnap1 = await db.collection('user_connections').where('user_id_1', '==', userId).where('status', '==', 'accepted').get();
    const connectionsSnap2 = await db.collection('user_connections').where('user_id_2', '==', userId).where('status', '==', 'accepted').get();

    const connections = [...connectionsSnap1.docs.map(doc => doc.data().user_id_2), ...connectionsSnap2.docs.map(doc => doc.data().user_id_1)];

    // Fetch posts: public or private (own) or connections
    let postsQuery = db.collection('social_activities').where('activity_type', '==', 'post').orderBy('created_at', 'desc').limit(limit).startAfter(offset);

    // Firestore doesn't support OR well, so fetch separately and merge
    const publicPosts = await db.collection('social_activities').where('activity_type', '==', 'post').where('visibility', '==', 'public').orderBy('created_at', 'desc').get();

    const privatePosts = await db.collection('social_activities').where('activity_type', '==', 'post').where('visibility', '==', 'private').where('user_id', '==', userId).orderBy('created_at', 'desc').get();

    const connectionsPosts = await db.collection('social_activities').where('activity_type', '==', 'post').where('visibility', '==', 'connections').where('user_id', 'in', connections).orderBy('created_at', 'desc').get();

    const allPostsDocs = [...publicPosts.docs, ...privatePosts.docs, ...connectionsPosts.docs].sort((a, b) => b.data().created_at.toDate() - a.data().created_at.toDate()).slice(offset, offset + limit);

    const totalPosts = publicPosts.size + privatePosts.size + connectionsPosts.size;
    const totalPages = Math.ceil(totalPosts / limit);

    if (allPostsDocs.length === 0) {
      return res.json({ posts: [], pagination: { page, totalPages, totalPosts } });
    }

    const posts = allPostsDocs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch users for posts
    const userIds = [...new Set(posts.map(p => p.user_id))];
    const usersSnap = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', userIds).get();
    const usersMap = new Map(usersSnap.docs.map(doc => [doc.id, doc.data()]));

    // Fetch likes, comments, bookmarks
    const postIds = posts.map(p => p.id);
    const likesSnap = await db.collection('social_activities').where('activity_type', '==', 'like').where('target_id', 'in', postIds).get();
    const commentsSnap = await db.collection('social_activities').where('activity_type', '==', 'comment').where('target_id', 'in', postIds).get();
    const bookmarksSnap = await db.collection('social_activities').where('activity_type', '==', 'bookmark').where('target_id', 'in', postIds).get();

    const likesMap = postIds.reduce((map, id) => { map[id] = 0; return map; }, {});
    likesSnap.docs.forEach(doc => likesMap[doc.data().target_id]++);

    const commentCountMap = postIds.reduce((map, id) => { map[id] = 0; return map; }, {});
    commentsSnap.docs.forEach(doc => commentCountMap[doc.data().target_id]++);

    const hasLikedMap = postIds.reduce((map, id) => { map[id] = false; return map; }, {});
    likesSnap.docs.forEach(doc => {
      if (doc.data().user_id === userId) hasLikedMap[doc.data().target_id] = true;
    });

    const hasBookmarkedMap = postIds.reduce((map, id) => { map[id] = false; return map; }, {});
    bookmarksSnap.docs.forEach(doc => {
      if (doc.data().user_id === userId) hasBookmarkedMap[doc.data().target_id] = true;
    });

    // Fetch comments details
    const comments = commentsSnap.docs.map(doc => doc.data());

    // Fetch comment users
    const commentUserIds = [...new Set(comments.map(c => c.user_id))];
    const commentUsersSnap = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', commentUserIds).get();
    const commentUsersMap = new Map(commentUsersSnap.docs.map(doc => [doc.id, doc.data()]));

    // Map posts with data
    const postsWithData = posts.map(post => {
      const postComments = comments
        .filter(comment => comment.target_id === post.id)
        .map(c => ({
          ...c,
          user: {
            id: c.user_id,
            first_name: commentUsersMap.get(c.user_id)?.first_name,
            last_name: commentUsersMap.get(c.user_id)?.last_name,
            profile_image: getFullImageUrl(req, commentUsersMap.get(c.user_id)?.profile_image),
            account_type: commentUsersMap.get(c.user_id)?.account_type,
          }
        }));

      return {
        ...post,
        has_liked: hasLikedMap[post.id],
        has_bookmarked: hasBookmarkedMap[post.id],
        likes: likesMap[post.id],
        comment_count: commentCountMap[post.id],
        image_url: getFullImageUrl(req, post.image_url),
        user: {
          id: post.user_id,
          first_name: usersMap.get(post.user_id)?.first_name,
          last_name: usersMap.get(post.user_id)?.last_name,
          profile_image: getFullImageUrl(req, usersMap.get(post.user_id)?.profile_image),
          account_type: usersMap.get(post.user_id)?.account_type,
        },
        comments: postComments,
      };
    });

    res.json({
      posts: postsWithData,
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

      const postRef = await db.collection('social_activities').add({
        user_id: userId,
        activity_type: 'post',
        content: content || '',
        image_url: imageUrl,
        achievement: isAchievement,
        visibility: visibility,
        share_count: 0,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp()
      });

      // Fetch the newly created post
      const newPostDoc = await postRef.get();
      const newPost = { id: newPostDoc.id, ...newPostDoc.data() };

      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      res.status(201).json({
        ...newPost,
        has_liked: false,
        has_bookmarked: false,
        likes: 0,
        comment_count: 0,
        image_url: getFullImageUrl(req, newPost.image_url),
        user: {
          id: userId,
          first_name: userData.first_name,
          last_name: userData.last_name,
          profile_image: getFullImageUrl(req, userData.profile_image),
          account_type: userData.account_type,
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
    const postDoc = await db.collection('social_activities').doc(id).get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (postDoc.data().user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    await db.collection('social_activities').doc(id).update({
      content: content,
      updated_at: FieldValue.serverTimestamp()
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
    const postDoc = await db.collection('social_activities').doc(id).get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (postDoc.data().user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    // Delete the post record
    await db.collection('social_activities').doc(id).delete();

    // Delete related likes, comments, bookmarks
    const relatedActivities = await db.collection('social_activities').where('target_id', '==', id).get();
    const batch = db.batch();
    relatedActivities.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // If there was an image, delete it from the filesystem
    if (postDoc.data().image_url) {
      fs.unlink(path.join(__dirname, postDoc.data().image_url), (err) => {
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
    const commentRef = await db.collection('social_activities').add({
      user_id: userId,
      activity_type: 'comment',
      content: content,
      target_id: targetId,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    });

    const newCommentDoc = await commentRef.get();
    const newComment = { id: newCommentDoc.id, ...newCommentDoc.data() };

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    res.status(201).json({
      ...newComment,
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

// --- POST (like) a post ---
app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    // Check if already liked
    const existingLike = await db.collection('social_activities').where('user_id', '==', userId).where('activity_type', '==', 'like').where('target_id', '==', targetId).get();

    if (!existingLike.empty) {
      return res.status(400).json({ error: 'Already liked.' });
    }

    await db.collection('social_activities').add({
      user_id: userId,
      activity_type: 'like',
      target_id: targetId,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    });

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
    const likeSnap = await db.collection('social_activities').where('user_id', '==', userId).where('activity_type', '==', 'like').where('target_id', '==', targetId).get();

    if (likeSnap.empty) {
      return res.status(404).json({ error: 'Like not found.' });
    }

    await db.collection('social_activities').doc(likeSnap.docs[0].id).delete();

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
    const existingBookmark = await db.collection('social_activities').where('user_id', '==', userId).where('activity_type', '==', 'bookmark').where('target_id', '==', targetId).get();

    if (!existingBookmark.empty) {
      return res.status(400).json({ error: 'Already bookmarked.' });
    }

    await db.collection('social_activities').add({
      user_id: userId,
      activity_type: 'bookmark',
      target_id: targetId,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    });

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
    const bookmarkSnap = await db.collection('social_activities').where('user_id', '==', userId).where('activity_type', '==', 'bookmark').where('target_id', '==', targetId).get();

    if (bookmarkSnap.empty) {
      return res.status(404).json({ error: 'Bookmark not found.' });
    }

    await db.collection('social_activities').doc(bookmarkSnap.docs[0].id).delete();

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
    const postDoc = await db.collection('social_activities').doc(postId).get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    await db.collection('social_activities').doc(postId).update({
      share_count: FieldValue.increment(1)
    });

    res.json({ message: 'Share tracked.' });
  } catch (error) {
    console.error('Error tracking share:', error);
    res.status(500).json({ error: 'Failed to track share.' });
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
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).get();

    if (enrollmentsSnap.empty) {
      return res.json([]);
    }

    const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id);
    const coursesSnap = await db.collection('courses').where(admin.firestore.FieldPath.documentId(), 'in', courseIds).get();

    const coursesMap = new Map(coursesSnap.docs.map(doc => [doc.id, doc.data()]));

    const enrollments = enrollmentsSnap.docs.map(doc => {
      const data = doc.data();
      const course = coursesMap.get(data.course_id) || {};
      return {
        id: doc.id,
        progress: data.progress,
        status: data.status,
        enrollment_date: data.enrollment_date,
        completion_date: data.completion_date,
        course_id: data.course_id,
        courseTitle: course.title,
        instructorName: course.instructor_name,
        durationWeeks: course.duration_weeks
      };
    }).sort((a, b) => b.enrollment_date.toDate() - a.enrollment_date.toDate());

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
    const submissionsSnap = await db.collection('internship_submissions').where('user_id', '==', userId).get();

    if (submissionsSnap.empty) {
      return res.json([]);
    }

    const internshipIds = submissionsSnap.docs.map(doc => doc.data().internship_id);
    const internshipsSnap = await db.collection('internships').where(admin.firestore.FieldPath.documentId(), 'in', internshipIds).get();

    const internshipsMap = new Map(internshipsSnap.docs.map(doc => [doc.id, doc.data()]));

    const applications = submissionsSnap.docs.map(doc => {
      const data = doc.data();
      const internship = internshipsMap.get(data.internship_id) || {};
      return {
        id: doc.id,
        internship_id: data.internship_id,
        applicationStatus: data.status,
        applicationDate: data.submitted_at,
        internshipTitle: internship.title,
        companyName: internship.company
      };
    }).sort((a, b) => b.applicationDate.toDate() - a.applicationDate.toDate());

    res.json(applications);
  } catch (error) {
    console.error('Error fetching user internship applications for dashboard:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// =============== NEW PROFESSIONAL DASHBOARD ENDPOINTS ====================

// Assumes a 'services' table with detailed service info, joined with 'service_categories'
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const categoriesSnap = await db.collection('service_categories').where('is_active', '==', true).get();

    const categoryIds = categoriesSnap.docs.map(doc => doc.id);

    const servicesSnap = await db.collection('services').where('category_id', 'in', categoryIds).get();

    const parsedServices = servicesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        category_id: data.category_id,
        categoryName: categoriesSnap.docs.find(catDoc => catDoc.id === data.category_id)?.data().name,
        description: data.description,
        price: data.price,
        duration: data.duration,
        rating: data.rating,
        reviews: data.reviews,
        features: data.features || [],
        popular: data.popular
      };
    }).sort((a, b) => b.popular - a.popular || a.name.localeCompare(b.name));

    res.json(parsedServices);
  } catch (error) {
    console.error('Error fetching available services:', error);
    res.status(500).json({ message: 'Failed to fetch available services.', error: error.message });
  }
});

// ADJUSTED: GET /api/users/:userId/service-requests - Fetch a user's submitted service requests
app.get('/api/users/:userId/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (req.params.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
  }

  try {
    const requestsSnap = await db.collection('service_requests').where('user_id', '==', userId).orderBy('created_at', 'desc').get();

    if (requestsSnap.empty) {
      return res.json([]);
    }

    const subcategoryIds = requestsSnap.docs.map(doc => doc.data().subcategory_id);
    const subcategoriesSnap = await db.collection('service_subcategories').where(admin.firestore.FieldPath.documentId(), 'in', subcategoryIds).get();

    const subcategoriesMap = new Map(subcategoriesSnap.docs.map(doc => [doc.id, doc.data()]));

    const requests = requestsSnap.docs.map(doc => {
      const data = doc.data();
      const subcategory = subcategoriesMap.get(data.subcategory_id) || {};
      const categoryId = subcategory.category_id;
      return {
        id: doc.id,
        user_id: data.user_id,
        categoryId: categoryId,
        categoryName: subcategory.name, // Assuming subcategory name as categoryName for frontend
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        website: data.website,
        projectDetails: data.project_details,
        budgetRange: data.budget_range,
        timeline: data.timeline,
        contactMethod: data.contact_method,
        additionalRequirements: data.additional_requirements,
        status: data.status,
        requestDate: data.created_at,
        updatedAt: data.updated_at
      };
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching user service requests:', error);
    res.status(500).json({ message: 'Failed to fetch your service requests.', error: error.message });
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
  if (!userId || !categoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
    return res.status(400).json({ message: 'Missing required fields for service request. Please fill in all necessary details.' });
  }

  try {
    const requestRef = await db.collection('service_requests').add({
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
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    });

    // Return the ID of the newly created request
    res.status(201).json({ message: 'Service request submitted successfully!', id: requestRef.id });
  } catch (error) {
    console.error('Error submitting service request:', error);
    res.status(500).json({ message: 'Failed to submit service request. An internal server error occurred.', error: error.message });
  }
});

// ==================== CALENDER EVENTS ROUTES ====================

// GET /api/calendar/events - Get all calendar events for current user
app.get('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get enrolled courses
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();
    const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id);

    // Get courses
    const coursesSnap = await db.collection('courses').where(admin.firestore.FieldPath.documentId(), 'in', courseIds).get();

    const courseEvents = coursesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: `course-${doc.id}`,
        title: `Course: ${data.title}`,
        description: data.description || 'Course enrollment',
        date: data.created_at,
        type: 'course_start',
        course: {
          id: doc.id,
          title: data.title,
          category: data.category
        },
        color: 'blue'
      };
    });

    // Get assignments
    const assignmentsSnap = await db.collection('assignments').where('course_id', 'in', courseIds).get();

    const assignmentIds = assignmentsSnap.docs.map(doc => doc.id);
    const submissionsSnap = await db.collection('assignment_submissions').where('assignment_id', 'in', assignmentIds).where('user_id', '==', userId).get();

    const submissionsMap = new Map(submissionsSnap.docs.map(doc => [doc.data().assignment_id, doc.data()]));

    const assignmentEvents = assignmentsSnap.docs.map(doc => {
      const data = doc.data();
      const submission = submissionsMap.get(doc.id) || {};
      const status = submission.status === 'graded' ? 'completed' : (data.due_date.toDate() < new Date() && !submission.id) ? 'overdue' : 'pending';
      const course = coursesSnap.docs.find(cDoc => cDoc.id === data.course_id)?.data() || {};
      return {
        id: `assignment-${doc.id}`,
        title: data.title,
        description: data.description || 'Assignment due',
        date: data.due_date,
        type: 'assignment',
        course: {
          id: data.course_id,
          title: course.title,
          category: course.category
        },
        status: status,
        color: status === 'completed' ? 'green' : status === 'overdue' ? 'red' : 'orange'
      };
    });

    // Get custom events
    const customEventsSnap = await db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '>=', new Date(new Date().setDate(new Date().getDate() - 30))).get();

    const customEvents = customEventsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: `custom-${doc.id}`,
        title: data.title,
        description: data.description || '',
        date: data.event_date,
        time: data.event_time,
        type: data.event_type || 'custom',
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

    const parsedDate = new Date(date);

    // Get enrolled courses
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();
    const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id);

    // Get assignments for the date
    const assignmentsSnap = await db.collection('assignments').where('course_id', 'in', courseIds).get();

    const assignmentEvents = [];
    for (const doc of assignmentsSnap.docs) {
      const data = doc.data();
      if (data.due_date.toDate().toISOString().split('T')[0] === date) {
        const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', doc.id).where('user_id', '==', userId).get();
        const submission = submissionSnap.empty ? {} : submissionSnap.docs[0].data();
        const status = submission.status === 'graded' ? 'completed' : (data.due_date.toDate() < new Date() && !submission.id) ? 'overdue' : 'pending';
        const courseSnap = await db.collection('courses').doc(data.course_id).get();
        const course = courseSnap.data();
        assignmentEvents.push({
          id: `assignment-${doc.id}`,
          title: data.title,
          description: data.description || '',
          date: data.due_date,
          type: 'assignment',
          course: {
            id: data.course_id,
            title: course.title,
            category: course.category
          },
          status: status
        });
      }
    }

    // Get course starts for the date
    const coursesSnap = await db.collection('courses').where(admin.firestore.FieldPath.documentId(), 'in', courseIds).get();

    const courseEvents = coursesSnap.docs.filter(doc => doc.data().created_at.toDate().toISOString().split('T')[0] === date).map(doc => {
      const data = doc.data();
      return {
        id: `course_start-${doc.id}`,
        title: `Course: ${data.title}`,
        description: data.description,
        date: data.created_at,
        type: 'course_start',
        course: {
          id: doc.id,
          title: data.title,
          category: data.category
        },
        status: 'active'
      };
    });

    // Get custom events for the date
    const customEventsSnap = await db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '==', parsedDate).get();

    const customEvents = customEventsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: `custom-${doc.id}`,
        title: data.title,
        description: data.description || '',
        date: data.event_date,
        time: data.event_time,
        type: 'custom',
        status: 'pending'
      };
    });

    const allEvents = [...assignmentEvents, ...courseEvents, ...customEvents];

    res.json(allEvents);
  } catch (error) {
    console.error('Error fetching events for date:', error);
    res.status(500).json({ error: 'Failed to fetch events for specified date' });
  }
});

// GET /api/calendar/upcoming - Get upcoming events (next 7 days)
app.get('/api/calendar/upcoming', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get enrolled courses
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();
    const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id);

    // Get assignments in next 7 days
    const assignmentsSnap = await db.collection('assignments').where('course_id', 'in', courseIds).where('due_date', '>=', today).where('due_date', '<=', sevenDaysLater).limit(10).get();

    const assignmentEvents = [];
    for (const doc of assignmentsSnap.docs) {
      const data = doc.data();
      const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', doc.id).where('user_id', '==', userId).get();
      const submission = submissionSnap.empty ? {} : submissionSnap.docs[0].data();
      const status = submission.status === 'graded' ? 'completed' : (data.due_date.toDate() < new Date() && !submission.id) ? 'overdue' : 'pending';
      const courseSnap = await db.collection('courses').doc(data.course_id).get();
      const course = courseSnap.data();
      assignmentEvents.push({
        id: `assignment-${doc.id}`,
        title: data.title,
        description: data.description || '',
        date: data.due_date,
        type: 'assignment',
        course: {
          id: data.course_id,
          title: course.title,
          category: course.category
        },
        status: status
      });
    }

    // Get custom upcoming events
    const customEventsSnap = await db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '>=', today).where('event_date', '<=', sevenDaysLater).limit(5).get();

    const customEvents = customEventsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: `custom-${doc.id}`,
        title: data.title,
        description: data.description || '',
        date: data.event_date,
        time: data.event_time,
        type: 'custom',
        status: 'pending'
      };
    });

    const allUpcoming = [...assignmentEvents, ...customEvents].sort((a, b) => a.date.toDate() - b.date.toDate());

    const upcomingEvents = allUpcoming.map(event => ({
      ...event,
      color: event.status === 'completed' ? 'green' :
        event.status === 'overdue' ? 'red' :
          event.type === 'custom' ? 'purple' : 'orange'
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

    // Get enrolled courses
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).get();

    const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id);
    const activeCourses = enrollmentsSnap.docs.filter(doc => doc.data().status === 'active').length;
    const completedCourses = enrollmentsSnap.docs.filter(doc => doc.data().status === 'completed').length;

    // Get assignments
    const assignmentsSnap = await db.collection('assignments').where('course_id', 'in', courseIds).get();

    const assignmentIds = assignmentsSnap.docs.map(doc => doc.id);
    const submissionsSnap = await db.collection('assignment_submissions').where('assignment_id', 'in', assignmentIds).where('user_id', '==', userId).get();

    const submissionsMap = new Map(submissionsSnap.docs.map(doc => [doc.data().assignment_id, doc.data()]));

    let pending = 0, completed = 0, overdue = 0;

    assignmentsSnap.docs.forEach(doc => {
      const data = doc.data();
      const submission = submissionsMap.get(doc.id) || {};
      if (submission.status === 'graded') {
        completed++;
      } else if (data.due_date.toDate() < new Date() && !submission.id) {
        overdue++;
      } else {
        pending++;
      }
    });

    res.json({
      pending_assignments: pending,
      completed_assignments: completed,
      overdue_assignments: overdue,
      active_courses: activeCourses,
      completed_courses: completedCourses,
      total_assignments: pending + completed + overdue
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

    // Get enrolled courses
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();
    const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id);

    // Get assignments
    const assignmentsSnap = await db.collection('assignments').where('course_id', 'in', courseIds).get();

    const assignmentIds = assignmentsSnap.docs.map(doc => doc.id);
    const submissionsSnap = await db.collection('assignment_submissions').where('assignment_id', 'in', assignmentIds).where('user_id', '==', userId).get();

    const submissionsMap = new Map(submissionsSnap.docs.map(doc => [doc.data().assignment_id, { id: doc.id, ...doc.data() }]));

    const coursesSnap = await db.collection('courses').where(admin.firestore.FieldPath.documentId(), 'in', courseIds).get();
    const coursesMap = new Map(coursesSnap.docs.map(doc => [doc.id, doc.data()]));

    const assignments = assignmentsSnap.docs.map(doc => {
      const data = doc.data();
      const submission = submissionsMap.get(doc.id) || null;
      const course = coursesMap.get(data.course_id) || {};
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        max_points: data.max_points,
        course: {
          id: data.course_id,
          title: course.title,
          category: course.category
        },
        submission: submission
      };
    }).sort((a, b) => a.due_date.toDate() - b.due_date.toDate());

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

    const eventRef = await db.collection('custom_calendar_events').add({
      user_id: userId,
      title: title,
      description: description,
      event_date: new Date(date),
      event_time: time,
      event_type: type,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
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
      title: title,
      description: description,
      event_date: new Date(date),
      event_time: time,
      event_type: type,
      updated_at: FieldValue.serverTimestamp()
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
    const userId = req.user.id;

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDoc.data();

    res.json({
      id: userId,
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
      last_login: user.updated_at // Assuming last_login is updated_at for simplicity
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user information' });
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
      const requestRef = await db.collection('course_enroll_requests').add({
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
        created_at: FieldValue.serverTimestamp()
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

// ==================== COURSES ROUTES ====================

// Replace the existing /api/courses endpoint
app.get('/api/courses', async (req, res) => {
  try {
    const coursesSnap = await db.collection('courses').where('is_active', '==', true).orderBy('created_at', 'desc').get();

    const formattedCourses = coursesSnap.docs.map(doc => {
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

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').orderBy('enrollment_date', 'desc').get();

    if (enrollmentsSnap.empty) {
      return res.json([]);
    }

    const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id);
    const coursesSnap = await db.collection('courses').where(admin.firestore.FieldPath.documentId(), 'in', courseIds).get();

    const coursesMap = new Map(coursesSnap.docs.map(doc => [doc.id, doc.data()]));

    const enrollments = enrollmentsSnap.docs.map(doc => {
      const data = doc.data();
      const course = coursesMap.get(data.course_id) || {};
      return {
        id: doc.id,
        userId: data.user_id,
        courseId: data.course_id,
        progress: data.progress,
        enrollmentDate: data.enrollment_date,
        completionDate: data.completion_date,
        status: data.status,
        course: {
          id: data.course_id,
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
    });

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
    const existingEnrollments = await db.collection('enrollments').where('user_id', '==', userId).where('course_id', '==', courseId).get();

    if (!existingEnrollments.empty) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();

    if (!courseDoc.exists || !courseDoc.data().is_active) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    await db.collection('enrollments').add({
      user_id: userId,
      course_id: courseId,
      enrollment_date: FieldValue.serverTimestamp(),
      progress: 0,
      status: 'active',
      completion_date: null
    });

    // Update user stats
    const statsSnap = await db.collection('user_stats').where('user_id', '==', userId).get();
    if (!statsSnap.empty) {
      await db.collection('user_stats').doc(statsSnap.docs[0].id).update({
        courses_enrolled: FieldValue.increment(1)
      });
    }

    res.status(201).json({ message: 'Successfully enrolled in course' });

  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ASSIGNMENTS ROUTES ====================

// GET /assignments/my-assignments - Get user's assignments
app.get('/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).get();
    const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id);

    const coursesSnap = await db.collection('courses').where(admin.firestore.FieldPath.documentId(), 'in', courseIds).where('is_active', '==', true).get();
    const coursesMap = new Map(coursesSnap.docs.map(doc => [doc.id, doc.data()]));

    const assignmentsSnap = await db.collection('assignments').where('course_id', 'in', courseIds).get();

    const assignmentIds = assignmentsSnap.docs.map(doc => doc.id);
    const submissionsSnap = await db.collection('assignment_submissions').where('assignment_id', 'in', assignmentIds).where('user_id', '==', userId).get();

    const submissionsMap = new Map(submissionsSnap.docs.map(doc => [doc.data().assignment_id, { id: doc.id, ...doc.data() } ]));

    const assignments = assignmentsSnap.docs.map(doc => {
      const data = doc.data();
      const course = coursesMap.get(data.course_id) || {};
      const submission = submissionsMap.get(doc.id) || null;
      return {
        id: doc.id,
        course_id: data.course_id,
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        max_points: data.max_points,
        created_at: data.created_at,
        course: {
          id: data.course_id,
          title: course.title,
          category: course.category
        },
        submission: submission
      };
    }).sort((a, b) => a.due_date.toDate() - b.due_date.toDate());

    res.json(assignments);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /assignments/all - Get all assignments (admin only)
app.get('/assignments/all', authenticateToken, async (req, res) => {
  // Check if user is admin
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }

  try {
    const coursesSnap = await db.collection('courses').where('is_active', '==', true).get();
    const courseMap = new Map(coursesSnap.docs.map(doc => [doc.id, doc.data()]));

    const assignmentsSnap = await db.collection('assignments').get();

    const assignmentIds = assignmentsSnap.docs.map(doc => doc.id);
    const submissionsSnap = await db.collection('assignment_submissions').where('assignment_id', 'in', assignmentIds).get();

    const submissionCountMap = assignmentIds.reduce((map, id) => { map[id] = 0; return map; }, {});
    const gradedCountMap = assignmentIds.reduce((map, id) => { map[id] = 0; return map; }, {});

    submissionsSnap.docs.forEach(doc => {
      const data = doc.data();
      submissionCountMap[data.assignment_id]++;
      if (data.status === 'graded') gradedCountMap[data.assignment_id]++;
    });

    const assignments = assignmentsSnap.docs.map(doc => {
      const data = doc.data();
      const course = courseMap.get(data.course_id) || {};
      return {
        id: doc.id,
        course_id: data.course_id,
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        max_points: data.max_points,
        created_at: data.created_at,
        course: {
          id: data.course_id,
          title: course.title,
          category: course.category
        },
        submission_count: submissionCountMap[doc.id],
        graded_count: gradedCountMap[doc.id]
      };
    }).sort((a, b) => a.due_date.toDate() - b.due_date.toDate());

    res.json(assignments);
  } catch (error) {
    console.error('Database error:', error);
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
    // Check if assignment exists and user is enrolled
    const assignmentDoc = await db.collection('assignments').doc(assignment_id).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const courseId = assignmentDoc.data().course_id;
    const enrollmentSnap = await db.collection('enrollments').where('user_id', '==', req.user.id).where('course_id', '==', courseId).get();

    if (enrollmentSnap.empty) {
      return res.status(404).json({ error: 'Not enrolled in course' });
    }

    // Check if already submitted
    const existingSubmission = await db.collection('assignment_submissions').where('assignment_id', '==', assignment_id).where('user_id', '==', req.user.id).get();

    if (!existingSubmission.empty) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }

    // Insert submission
    const submissionRef = await db.collection('assignment_submissions').add({
      assignment_id: assignment_id,
      user_id: req.user.id,
      content: content || '',
      file_path: file_path,
      submitted_at: FieldValue.serverTimestamp(),
      status: 'submitted',
      grade: null,
      feedback: null
    });

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission_id: submissionRef.id
    });
  } catch (error) {
    console.error('Database error:', error);
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

    const submission = submissionDoc.data();

    const assignmentDoc = await db.collection('assignments').doc(submission.assignment_id).get();
    const assignment = assignmentDoc.data();

    // Check permissions - user can download their own submission or admin can download any
    if (submission.user_id !== req.user.id && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!submission.file_path) {
      return res.status(404).json({ error: 'No file attached to this submission' });
    }

    const filePath = path.join(__dirname, 'uploads', 'assignments', submission.file_path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set headers and send file
    res.setHeader('Content-Disposition', `attachment; filename="${submission.file_path}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /assignments/course/:courseId - Get assignments for a specific course
app.get('/assignments/course/:courseId', authenticateToken, async (req, res) => {
  const courseId = req.params.courseId;

  try {
    // Check if user is enrolled or admin
    const enrollmentSnap = await db.collection('enrollments').where('user_id', '==', req.user.id).where('course_id', '==', courseId).get();

    if (enrollmentSnap.empty && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignmentsSnap = await db.collection('assignments').where('course_id', '==', courseId).get();

    const assignmentIds = assignmentsSnap.docs.map(doc => doc.id);
    const submissionsSnap = await db.collection('assignment_submissions').where('assignment_id', 'in', assignmentIds).where('user_id', '==', req.user.id).get();

    const submissionsMap = new Map(submissionsSnap.docs.map(doc => [doc.data().assignment_id, doc.data()]));

    const courseDoc = await db.collection('courses').doc(courseId).get();
    const course = courseDoc.data();

    const assignments = assignmentsSnap.docs.map(doc => {
      const data = doc.data();
      const submission = submissionsMap.get(doc.id) || null;
      return {
        id: doc.id,
        course_id: data.course_id,
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        max_points: data.max_points,
        created_at: data.created_at,
        course: {
          id: data.course_id,
          title: course.title,
          category: course.category
        },
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
    }).sort((a, b) => a.due_date.toDate() - b.due_date.toDate());

    res.json(assignments);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT /assignments/grade/:submissionId - Grade assignment (admin/instructor only)
app.put('/assignments/grade/:submissionId', authenticateToken, async (req, res) => {
  const submissionId = req.params.submissionId;
  const { grade, feedback } = req.body;

  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }

  // Validate grade
  if (grade < 0 || grade > 100) {
    return res.status(400).json({ error: 'Grade must be between 0 and 100' });
  }

  try {
    await db.collection('assignment_submissions').doc(submissionId).update({
      grade: grade,
      feedback: feedback || '',
      status: 'graded'
    });

    res.json({
      success: true,
      message: 'Assignment graded successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
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
    
    const userDoc = await db.collection('users').doc(userId).get();
    const accountType = userDoc.data().account_type;

    // Get all resources that are allowed for this account type
    const resourcesSnap = await db.collection('resources').get();

    const resources = resourcesSnap.docs.filter(doc => {
      const data = doc.data();
      return (data.allowed_account_types || []).includes(accountType);
    }).map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        type: data.type,
        size: data.size,
        url: data.url,
        category: data.category,
        icon_name: data.icon_name,
        button_color: data.button_color,
        allowed_account_types: data.allowed_account_types,
        is_premium: data.is_premium,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    }).sort((a, b) => b.created_at.toDate() - a.created_at.toDate());

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

    const userDoc = await db.collection('users').doc(userId).get();
    const accountType = userDoc.data().account_type;

    const resourceDoc = await db.collection('resources').doc(id).get();

    if (!resourceDoc.exists || !(resourceDoc.data().allowed_account_types || []).includes(accountType)) {
      return res.status(404).json({ error: 'Resource not found or access denied' });
    }

    const resource = resourceDoc.data();

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

// ==================== CERTIFICATES ROUTES ====================

// Certificate Routes
app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const certificatesSnap = await db.collection('certificates').where('user_id', '==', userId).get();

    if (certificatesSnap.empty) {
      return res.json([]);
    }

    const courseIds = certificatesSnap.docs.map(doc => doc.data().course_id);
    const coursesSnap = await db.collection('courses').where(admin.firestore.FieldPath.documentId(), 'in', courseIds).get();

    const coursesMap = new Map(coursesSnap.docs.map(doc => [doc.id, doc.data()]));

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('course_id', 'in', courseIds).get();

    const enrollmentsMap = new Map(enrollmentsSnap.docs.map(doc => [doc.data().course_id, doc.data()]));

    // Get average grades
    const assignmentsSnap = await db.collection('assignments').where('course_id', 'in', courseIds).get();

    const assignmentIds = assignmentsSnap.docs.map(doc => doc.id);
    const submissionsSnap = await db.collection('assignment_submissions').where('assignment_id', 'in', assignmentIds).where('user_id', '==', userId).get();

    const gradesMap = courseIds.reduce((map, id) => { map[id] = { sum: 0, count: 0 }; return map; }, {});

    submissionsSnap.docs.forEach(doc => {
      const data = doc.data();
      const assignment = assignmentsSnap.docs.find(aDoc => aDoc.id === data.assignment_id);
      const courseId = assignment.data().course_id;
      gradesMap[courseId].sum += data.grade || 0;
      gradesMap[courseId].count++;
    });

    const formattedCertificates = certificatesSnap.docs.map(doc => {
      const data = doc.data();
      const course = coursesMap.get(data.course_id) || {};
      const enrollment = enrollmentsMap.get(data.course_id) || {};
      const gradeData = gradesMap[data.course_id];
      const finalGrade = gradeData.count > 0 ? Math.round(gradeData.sum / gradeData.count) : 0;
      return {
        id: doc.id,
        userId: data.user_id,
        courseId: data.course_id,
        certificateUrl: data.certificate_url,
        issuedDate: data.issued_date,
        course: {
          id: data.course_id,
          title: course.title,
          description: course.description,
          instructorName: course.instructor_name,
          category: course.category,
          difficultyLevel: course.difficulty_level
        },
        enrollment: {
          completionDate: enrollment.completion_date,
          finalGrade: finalGrade,
          status: enrollment.status
        }
      };
    }).sort((a, b) => b.issuedDate.toDate() - a.issuedDate.toDate());

    res.json(formattedCertificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
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
    // For now, we'll return a JSON response - you can implement PDF generation later
    const certificateData = {
      recipientName: `${user.first_name} ${user.last_name}`,
      courseName: course.title,
      completionDate: certificate.issued_date,
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

// Get all certificates (admin only)
app.get('/api/certificates', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const certificatesSnap = await db.collection('certificates').orderBy('issued_date', 'desc').get();

    if (certificatesSnap.empty) {
      return res.json([]);
    }

    const userIds = certificatesSnap.docs.map(doc => doc.data().user_id);
    const courseIds = certificatesSnap.docs.map(doc => doc.data().course_id);

    const usersSnap = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', userIds).get();
    const usersMap = new Map(usersSnap.docs.map(doc => [doc.id, doc.data()]));

    const coursesSnap = await db.collection('courses').where(admin.firestore.FieldPath.documentId(), 'in', courseIds).get();
    const coursesMap = new Map(coursesSnap.docs.map(doc => [doc.id, doc.data()]));

    const enrollmentsSnap = await db.collection('enrollments').where('course_id', 'in', courseIds).where('user_id', 'in', userIds).get();
    const enrollmentsMap = new Map(enrollmentsSnap.docs.map(doc => [`${doc.data().user_id}-${doc.data().course_id}`, doc.data()]));

    const formattedCertificates = certificatesSnap.docs.map(doc => {
      const data = doc.data();
      const course = coursesMap.get(data.course_id) || {};
      const user = usersMap.get(data.user_id) || {};
      const enrollment = enrollmentsMap.get(`${data.user_id}-${data.course_id}`) || {};
      return {
        id: doc.id,
        userId: data.user_id,
        courseId: data.course_id,
        certificateUrl: data.certificate_url,
        issuedDate: data.issued_date,
        course: {
          id: data.course_id,
          title: course.title,
          instructorName: course.instructor_name,
          category: course.category,
          difficultyLevel: course.difficulty_level
        },
        user: {
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email
        },
        enrollment: {
          completionDate: enrollment.completion_date
        }
      };
    });

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

    // Check if user has completed the course
    const enrollmentSnap = await db.collection('enrollments').where('user_id', '==', userId).where('course_id', '==', courseId).where('status', '==', 'completed').get();

    if (enrollmentSnap.empty) {
      return res.status(400).json({ error: 'User has not completed this course' });
    }

    // Check if certificate already exists
    const existingCertificates = await db.collection('certificates').where('user_id', '==', userId).where('course_id', '==', courseId).get();

    if (!existingCertificates.empty) {
      return res.status(400).json({ error: 'Certificate already exists for this user and course' });
    }

    // Create new certificate
    const certificateRef = await db.collection('certificates').add({
      user_id: userId,
      course_id: courseId,
      certificate_url: certificateUrl || null,
      issued_date: FieldValue.serverTimestamp()
    });

    // Update user stats
    const statsSnap = await db.collection('user_stats').where('user_id', '==', userId).get();
    if (!statsSnap.empty) {
      await db.collection('user_stats').doc(statsSnap.docs[0].id).update({
        certificates_earned: FieldValue.increment(1)
      });
    }

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificateId: certificateRef.id
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

    await db.collection('certificates').doc(certificateId).update({
      certificate_url: certificateUrl,
      issued_date: FieldValue.serverTimestamp()
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

    const certificateDoc = await db.collection('certificates').doc(certificateId).get();

    if (!certificateDoc.exists) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const userId = certificateDoc.data().user_id;

    // Delete certificate
    await db.collection('certificates').doc(certificateId).delete();

    // Update user stats
    const statsSnap = await db.collection('user_stats').where('user_id', '==', userId).get();
    if (!statsSnap.empty) {
      const current = statsSnap.docs[0].data().certificates_earned;
      await db.collection('user_stats').doc(statsSnap.docs[0].id).update({
        certificates_earned: Math.max(current - 1, 0)
      });
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
    // ... (keep the same as original, since it's mock)
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
    const statsSnap = await db.collection('user_stats').where('user_id', '==', req.user.id).get();

    let stats;
    if (statsSnap.empty) {
      // Create default stats
      const statsRef = await db.collection('user_stats').add({
        user_id: req.user.id,
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
      stats = statsSnap.docs[0].data();
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
    const resourceId = req.params.id;
    const resources = getDefaultResources(req.user.account_type);
    const resource = resources.find(r => r.id == resourceId); // Loose equality for id

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
      resource_name: resource.title,
      timestamp: FieldValue.serverTimestamp()
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

    if (enrollmentsSnap.empty) {
      return res.json([]);
    }

    const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id);
    const coursesSnap = await db.collection('courses').where(admin.firestore.FieldPath.documentId(), 'in', courseIds).get();

    const coursesMap = new Map(coursesSnap.docs.map(doc => [doc.id, doc.data()]));

    const courses = enrollmentsSnap.docs.map(doc => {
      const data = doc.data();
      const course = coursesMap.get(data.course_id) || {};
      return {
        id: data.course_id,
        title: course.title,
        category: course.category,
        difficulty_level: course.difficulty_level,
        progress: data.progress,
        isEnrolled: true
      };
    });

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
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        company: data.company,
        location: data.location,
        duration: data.duration,
        type: data.type,
        level: data.level,
        description: data.description,
        requirements: data.requirements || [],
        benefits: data.benefits || [],
        applications_count: data.applications_count,
        spots_available: data.spots_available,
        posted_at: data.posted_at
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
    const submissionsSnap = await db.collection('internship_submissions').where('user_id', '==', userId).orderBy('submitted_at', 'desc').get();

    if (submissionsSnap.empty) {
      return res.json([]);
    }

    const internshipIds = submissionsSnap.docs.map(doc => doc.data().internship_id);
    const internshipsSnap = await db.collection('internships').where(admin.firestore.FieldPath.documentId(), 'in', internshipIds).get();

    const internshipsMap = new Map(internshipsSnap.docs.map(doc => [doc.id, doc.data()]));

    const parsedApplications = submissionsSnap.docs.map(doc => {
      const data = doc.data();
      const internship = internshipsMap.get(data.internship_id) || {};
      return {
        id: doc.id,
        submitted_at: data.submitted_at,
        status: data.status,
        resume_url: data.resume_url,
        cover_letter: data.cover_letter,
        internship_id: data.internship_id,
        title: internship.title,
        company: internship.company,
        location: internship.location,
        duration: internship.duration,
        type: internship.type,
        level: internship.level,
        description: internship.description,
        requirements: internship.requirements || [],
        benefits: internship.benefits || [],
        applications_count: internship.applications_count,
        spots_available: internship.spots_available,
        internship_posted_at: internship.posted_at
      };
    });

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
    await db.runTransaction(async (transaction) => {
      const internshipRef = db.collection('internships').doc(internshipId);
      const internshipDoc = await transaction.get(internshipRef);

      if (!internshipDoc.exists) {
        throw new Error('Internship not found.');
      }

      if (internshipDoc.data().spots_available <= 0) {
        throw new Error('No available spots left for this internship.');
      }

      const existingApplication = await db.collection('internship_submissions').where('internship_id', '==', internshipId).where('user_id', '==', userId).get();
      if (!existingApplication.empty) {
        throw new Error('You have already applied for this internship.');
      }

      const submissionRef = db.collection('internship_submissions').doc();
      transaction.set(submissionRef, {
        internship_id: internshipId,
        user_id: userId,
        full_name: full_name,
        email: email,
        phone: phone || null,
        resume_url: resume_url,
        cover_letter: cover_letter || null,
        status: 'pending',
        submitted_at: FieldValue.serverTimestamp()
      });

      transaction.update(internshipRef, {
        spots_available: FieldValue.increment(-1),
        applications_count: FieldValue.increment(1)
      });
    });

    res.status(201).json({ message: 'Internship application submitted successfully!' });
  } catch (error) {
    console.error('Error submitting internship application:', error);
    res.status(500).json({ message: 'Internal server error during application submission.' });
  }
});

// ==================== SERVICES ROUTES ====================

// Get service categories
app.get('/api/services/categories', async (req, res) => {
  try {
    const categoriesSnap = await db.collection('service_categories').where('is_active', '==', true).orderBy('name').get();

    const categoriesWithSubs = await Promise.all(categoriesSnap.docs.map(async (doc) => {
      const data = doc.data();
      const subcategoriesSnap = await db.collection('service_subcategories').where('category_id', '==', doc.id).where('is_active', '==', true).orderBy('name').get();

      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        subcategories: subcategoriesSnap.docs.map(subDoc => {
          const subData = subDoc.data();
          return {
            id: subDoc.id,
            categoryId: subData.category_id,
            name: subData.name,
            description: subData.description,
            basePrice: subData.base_price
          };
        })
      };
    }));

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
    const requestRef = await db.collection('service_requests').add({
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
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
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

    if (requestsSnap.empty) {
      return res.json([]);
    }

    const subcategoryIds = requestsSnap.docs.map(doc => doc.data().subcategory_id);
    const subcategoriesSnap = await db.collection('service_subcategories').where(admin.firestore.FieldPath.documentId(), 'in', subcategoryIds).get();

    const subcategoriesMap = new Map(subcategoriesSnap.docs.map(doc => [doc.id, doc.data()]));

    const categoryIds = subcategoriesSnap.docs.map(doc => doc.data().category_id);
    const categoriesSnap = await db.collection('service_categories').where(admin.firestore.FieldPath.documentId(), 'in', categoryIds).get();

    const categoriesMap = new Map(categoriesSnap.docs.map(doc => [doc.id, doc.data()]));

    const requests = requestsSnap.docs.map(doc => {
      const data = doc.data();
      const subcategory = subcategoriesMap.get(data.subcategory_id) || {};
      const category = categoriesMap.get(subcategory.category_id) || {};
      return {
        id: doc.id,
        user_id: data.user_id,
        subcategory_id: data.subcategory_id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        website: data.website,
        project_details: data.project_details,
        budget_range: data.budget_range,
        timeline: data.timeline,
        contact_method: data.contact_method,
        additional_requirements: data.additional_requirements,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        category_name: category.name,
        subcategory_name: subcategory.name
      };
    });

    res.json(requests);

  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ADMIN DASHBOARD ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const usersSnap = await db.collection('users').where('is_active', '==', true).get();
    const coursesSnap = await db.collection('courses').where('is_active', '==', true).get();
    const enrollmentsSnap = await db.collection('enrollments').get();

    let totalRevenue = 0;
    for (const doc of enrollmentsSnap.docs) {
      const data = doc.data();
      if (data.status === 'completed') {
        const courseDoc = await db.collection('courses').doc(data.course_id).get();
        totalRevenue += courseDoc.data().price || 0;
      }
    }

    const contactsSnap = await db.collection('contact_messages').where('created_at', '>=', new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)).get();
    const serviceRequestsSnap = await db.collection('service_requests').where('status', '==', 'pending').get();

    res.json({
      totalUsers: usersSnap.size,
      totalCourses: coursesSnap.size,
      totalEnrollments: enrollmentsSnap.size,
      totalRevenue: totalRevenue,
      pendingContacts: contactsSnap.size,
      pendingServiceRequests: serviceRequestsSnap.size
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

// Recent Users
app.get('/api/admin/recent-users', authenticateToken, async (req, res) => {
  try {
    const usersSnap = await db.collection('users').where('is_active', '==', true).orderBy('created_at', 'desc').limit(5).get();

    const users = usersSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        account_type: data.account_type,
        join_date: data.created_at.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
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
    const enrollmentsSnap = await db.collection('enrollments').orderBy('enrollment_date', 'desc').limit(5).get();

    const userIds = enrollmentsSnap.docs.map(doc => doc.data().user_id);
    const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id);

    const usersSnap = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', userIds).get();
    const usersMap = new Map(usersSnap.docs.map(doc => [doc.id, doc.data()]));

    const coursesSnap = await db.collection('courses').where(admin.firestore.FieldPath.documentId(), 'in', courseIds).get();
    const coursesMap = new Map(coursesSnap.docs.map(doc => [doc.id, doc.data()]));

    const enrollments = enrollmentsSnap.docs.map(doc => {
      const data = doc.data();
      const user = usersMap.get(data.user_id) || {};
      const course = coursesMap.get(data.course_id) || {};
      return {
        id: doc.id,
        user_name: `${user.first_name} ${user.last_name}`,
        course_name: course.title,
        date: data.enrollment_date.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: data.status
      };
    });

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching recent enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch recent enrollments', details: error.message });
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
    const contactRef = await db.collection('contact_messages').add({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      company: company || null,
      message: message.trim(),
      created_at: FieldValue.serverTimestamp()
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
    const sixMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 6));

    // User growth data (last 6 months)
    const usersSnap = await db.collection('users').where('created_at', '>=', sixMonthsAgo).get();

    const userGrowthMap = {};
    usersSnap.docs.forEach(doc => {
      const month = doc.data().created_at.toDate().toISOString().slice(0, 7);
      userGrowthMap[month] = (userGrowthMap[month] || 0) + 1;
    });

    const userGrowth = Object.keys(userGrowthMap).sort().map(month => ({ month, count: userGrowthMap[month] }));

    // Course enrollment data
    const coursesSnap = await db.collection('courses').where('is_active', '==', true).get();
    const courseIds = coursesSnap.docs.map(doc => doc.id);

    const enrollmentsSnap = await db.collection('enrollments').get();

    const enrollmentCountMap = courseIds.reduce((map, id) => { map[id] = 0; return map; }, {});

    enrollmentsSnap.docs.forEach(doc => {
      enrollmentCountMap[doc.data().course_id]++;
    });

    const courseEnrollments = coursesSnap.docs.map(doc => ({
      title: doc.data().title,
      enrollments: enrollmentCountMap[doc.id]
    })).sort((a, b) => b.enrollments - a.enrollments).slice(0, 10);

    // Revenue by month
    const revenueMap = {};
    for (const doc of enrollmentsSnap.docs) {
      const data = doc.data();
      const month = data.enrollment_date.toDate().toISOString().slice(0, 7);
      const course = coursesSnap.docs.find(cDoc => cDoc.id === data.course_id)?.data() || {};
      revenueMap[month] = (revenueMap[month] || 0) + (course.price || 0);
    }

    const revenueData = Object.keys(revenueMap).sort().map(month => ({ month, revenue: revenueMap[month] }));

    res.json({
      userGrowth: userGrowth,
      courseEnrollments: courseEnrollments,
      revenueData: revenueData
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ADMIN USER MANAGEMENT ENDPOINTS ====================

// GET /api/admin/users - Get all users with pagination and filtering
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const accountType = req.query.accountType;
    const status = req.query.status;
    const search = req.query.search;

    let usersQuery = db.collection('users').orderBy('created_at', 'desc');

    if (accountType && accountType !== 'all') {
      usersQuery = usersQuery.where('account_type', '==', accountType);
    }

    if (status && status !== 'all') {
      const isActive = status === 'active' ? true : false;
      usersQuery = usersQuery.where('is_active', '==', isActive);
    }

    if (search) {
      // Firestore doesn't support full-text search, so approximate with startAt/endAt for name or email
      // For simplicity, we'll search on email only, or implement Cloud Search later
      usersQuery = usersQuery.where('email', '>=', search).where('email', '<=', search + '\uf8ff');
    }

    const usersSnap = await usersQuery.get();

    const totalUsers = usersSnap.size;
    const totalPages = Math.ceil(totalUsers / limit);

    const users = usersSnap.docs.slice((page - 1) * limit, page * limit).map(doc => ({
      id: doc.id,
      first_name: doc.data().first_name,
      last_name: doc.data().last_name,
      email: doc.data().email,
      phone: doc.data().phone,
      account_type: doc.data().account_type,
      profile_image: doc.data().profile_image,
      company: doc.data().company,
      website: doc.data().website,
      bio: doc.data().bio,
      is_active: doc.data().is_active,
      email_verified: doc.data().email_verified,
      created_at: doc.data().created_at,
      updated_at: doc.data().updated_at
    }));

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

// GET /api/admin/users/:id - Get a specific user
app.get('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDoc.data();

    res.json({
      id: userId,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      account_type: user.account_type,
      profile_image: user.profile_image,
      company: user.company,
      website: user.website,
      bio: user.bio,
      is_active: user.is_active,
      email_verified: user.email_verified,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/users - Create a new user
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, accountType, isActive, company, website, bio } = req.body;

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
    const existingUsers = await db.collection('users').where('email', '==', email.trim()).get();

    if (!existingUsers.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const userRef = await db.collection('users').add({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      password_hash: hashedPassword,
      account_type: accountType || 'student',
      is_active: isActive !== undefined ? isActive : true,
      company: company || null,
      website: website || null,
      bio: bio || null,
      email_verified: false,
      profile_image: null,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    });

    // Create user stats entry
    await db.collection('user_stats').add({
      user_id: userRef.id,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: FieldValue.serverTimestamp()
    });

    console.log('User created successfully by admin:', { userId: userRef.id, email });

    // Get the newly created user to return
    const newUserDoc = await db.collection('users').doc(userRef.id).get();
    const newUser = newUserDoc.data();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: userRef.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        phone: newUser.phone,
        account_type: newUser.account_type,
        profile_image: newUser.profile_image,
        company: newUser.company,
        website: newUser.website,
        bio: newUser.bio,
        is_active: newUser.is_active,
        email_verified: newUser.email_verified,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/users/:id - Update a user
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, email, phone, accountType, isActive, company, website, bio } = req.body;

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = userDoc.data();

    // Validate email if changed
    if (email && email !== currentUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }

      // Check if new email already exists
      const existingUsers = await db.collection('users').where('email', '==', email).get();

      if (!existingUsers.empty && existingUsers.docs[0].id !== userId) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Update user
    await db.collection('users').doc(userId).update({
      first_name: firstName || currentUser.first_name,
      last_name: lastName || currentUser.last_name,
      email: email || currentUser.email,
      phone: phone || currentUser.phone,
      account_type: accountType || currentUser.account_type,
      is_active: isActive !== undefined ? isActive : currentUser.is_active,
      company: company || currentUser.company,
      website: website || currentUser.website,
      bio: bio || currentUser.bio,
      updated_at: FieldValue.serverTimestamp()
    });

    // Get the updated user to return
    const updatedUserDoc = await db.collection('users').doc(userId).get();
    const updatedUser = updatedUserDoc.data();

    res.json({
      message: 'User updated successfully',
      user: {
        id: userId,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        account_type: updatedUser.account_type,
        profile_image: updatedUser.profile_image,
        company: updatedUser.company,
        website: updatedUser.website,
        bio: updatedUser.bio,
        is_active: updatedUser.is_active,
        email_verified: updatedUser.email_verified,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id - Delete a user
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id;

    // Prevent admin from deleting themselves
    if (userId === adminId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For safety, we'll do a soft delete by setting is_active to false
    await db.collection('users').doc(userId).update({
      is_active: false,
      updated_at: FieldValue.serverTimestamp()
    });

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error while deleting user' });
  }
});

// PUT /api/admin/users/:id/password - Reset user password (admin only)
app.put('/api/admin/users/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password
    await db.collection('users').doc(userId).update({
      password_hash: hashedPassword,
      updated_at: FieldValue.serverTimestamp()
    });

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================== ADMIN PAYMENTS MANAGEMENT ENDPOINT ======================

app.post('/api/payments/upload-proof', authenticateToken, paymentProofUpload.single('file'), async (req, res) => {

  try {
    const { transaction_id, payment_method, resource_id, plan, amount, user_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Payment proof file is required' });
    }

    if (!transaction_id) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Save payment record to database
    const paymentRef = await db.collection('payments').add({
      user_id: user_id,
      resource_id: resource_id || null,
      plan: plan,
      amount: amount,
      payment_method: payment_method,
      transaction_id: transaction_id,
      proof_file: req.file.filename,
      status: 'pending',
      created_at: FieldValue.serverTimestamp(),
      verified_at: null
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

    const userIds = paymentsSnap.docs.map(doc => doc.data().user_id);
    const resourceIds = paymentsSnap.docs.map(doc => doc.data().resource_id).filter(id => id);

    const usersSnap = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', userIds).get();
    const usersMap = new Map(usersSnap.docs.map(doc => [doc.id, doc.data()]));

    const resourcesSnap = resourceIds.length > 0 ? await db.collection('resources').where(admin.firestore.FieldPath.documentId(), 'in', resourceIds).get() : { docs: [] };
    const resourcesMap = new Map(resourcesSnap.docs.map(doc => [doc.id, doc.data()]));

    const payments = paymentsSnap.docs.map(doc => {
      const data = doc.data();
      const user = usersMap.get(data.user_id) || {};
      const resource = resourcesMap.get(data.resource_id) || {};
      return {
        id: doc.id,
        ...data,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        resource_title: resource.title
      };
    });

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

    const paymentDoc = await db.collection('payments').doc(id).get();

    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    await db.collection('payments').doc(id).update({
      status: status,
      verified_at: FieldValue.serverTimestamp()
    });

    // If payment is approved, grant access to the resource
    if (status === 'approved') {
      const data = paymentDoc.data();
      const { user_id, resource_id, plan } = data;
      
      if (plan === 'individual' && resource_id) {
        // Grant access to specific resource
        await db.collection('user_resources').add({
          user_id: user_id,
          resource_id: resource_id,
          granted_at: FieldValue.serverTimestamp()
        });
      } else if (plan === 'premium') {
        // Upgrade user to premium
        await db.collection('users').doc(user_id).update({
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

    const userIds = enrollmentsSnap.docs.map(doc => doc.data().user_id);
    const courseIds = enrollmentsSnap.docs.map(doc => doc.data().course_id);

    const usersSnap = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', userIds).get();
    const usersMap = new Map(usersSnap.docs.map(doc => [doc.id, doc.data()]));

    const coursesSnap = await db.collection('courses').where(admin.firestore.FieldPath.documentId(), 'in', courseIds).get();
    const coursesMap = new Map(coursesSnap.docs.map(doc => [doc.id, doc.data()]));

    const enrollments = enrollmentsSnap.docs.map(doc => {
      const data = doc.data();
      const user = usersMap.get(data.user_id) || {};
      const course = coursesMap.get(data.course_id) || {};
      return {
        id: doc.id,
        user_id: data.user_id,
        user_name: `${user.first_name} ${user.last_name}`,
        course_id: data.course_id,
        course_name: course.title,
        progress: data.progress,
        status: data.status,
        enrollment_date: data.enrollment_date,
        completion_date: data.completion_date
      };
    });

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
      status: status,
      progress: progress,
      completion_date: status === 'completed' ? (completion_date || FieldValue.serverTimestamp()) : null
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

    const courses = coursesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        instructor_name: data.instructor_name,
        duration_weeks: data.duration_weeks,
        difficulty_level: data.difficulty_level,
        category: data.category,
        price: data.price,
        thumbnail: data.thumbnail,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    });

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

    const courseRef = await db.collection('courses').add({
      title: title,
      description: description,
      instructor_name: instructor_name,
      duration_weeks: duration_weeks,
      difficulty_level: difficulty_level,
      category: category,
      price: price,
      thumbnail: null,
      is_active: is_active || true,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
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
      title: title,
      description: description,
      instructor_name: instructor_name,
      duration_weeks: duration_weeks,
      difficulty_level: difficulty_level,
      category: category,
      price: price,
      is_active: is_active,
      updated_at: FieldValue.serverTimestamp()
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

    // Check if course has enrollments
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
app.post('/api/admin/courses/:id/thumbnail', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const thumbnailPath = `/uploads/courses/${req.file.filename}`;

    await db.collection('courses').doc(id).update({
      thumbnail: thumbnailPath,
      updated_at: FieldValue.serverTimestamp()
    });

    res.json({ message: 'Thumbnail uploaded successfully', thumbnail: thumbnailPath });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    res.status(500).json({ error: 'Failed to upload thumbnail' });
  }
});

// ==================== ADMIN RESOURCE MANAGEMENT ENDPOINTS ====================

// GET all resources (admin only)
app.get('/api/admin/resources', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const resourcesSnap = await db.collection('resources').orderBy('created_at', 'desc').get();

    const resourcesWithParsedTypes = resourcesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        type: data.type,
        size: data.size,
        url: data.url,
        category: data.category,
        icon_name: data.icon_name,
        button_color: data.button_color,
        allowed_account_types: data.allowed_account_types || [],
        is_premium: data.is_premium,
        created_at: data.created_at,
        updated_at: data.updated_at
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

    // Ensure allowed_account_types is an array
    const accountTypesArray = Array.isArray(allowed_account_types) 
      ? allowed_account_types 
      : [allowed_account_types];

    const resourceRef = await db.collection('resources').add({
      title: title,
      description: description,
      type: type,
      size: size || null,
      url: url || null,
      category: category,
      icon_name: icon_name,
      button_color: button_color,
      allowed_account_types: accountTypesArray,
      is_premium: is_premium || false,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
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

    // Ensure allowed_account_types is an array
    const accountTypesArray = Array.isArray(allowed_account_types) 
      ? allowed_account_types 
      : [allowed_account_types];

    await db.collection('resources').doc(id).update({
      title: title,
      description: description,
      type: type,
      size: size || null,
      url: url || null,
      category: category,
      icon_name: icon_name,
      button_color: button_color,
      allowed_account_types: accountTypesArray,
      is_premium: is_premium,
      updated_at: FieldValue.serverTimestamp()
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

// GET all assignments (admin only)
app.get('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentsSnap = await db.collection('assignments').orderBy('created_at', 'desc').get();

    const courseIds = assignmentsSnap.docs.map(doc => doc.data().course_id);
    const coursesSnap = await db.collection('courses').where(admin.firestore.FieldPath.documentId(), 'in', courseIds).get();

    const coursesMap = new Map(coursesSnap.docs.map(doc => [doc.id, doc.data()]));

    const assignments = assignmentsSnap.docs.map(doc => {
      const data = doc.data();
      const course = coursesMap.get(data.course_id) || {};
      return {
        id: doc.id,
        course_id: data.course_id,
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        max_points: data.max_points,
        created_at: data.created_at,
        course_title: course.title
      };
    });

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// CREATE new assignment (admin only)
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

    const assignmentRef = await db.collection('assignments').add({
      title: title,
      course_id: course_id,
      description: description,
      due_date: new Date(due_date),
      max_points: max_points,
      created_at: FieldValue.serverTimestamp()
    });

    res.status(201).json({ 
      message: 'Assignment created successfully',
      assignmentId: assignmentRef.id
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// UPDATE assignment (admin only)
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

    await db.collection('assignments').doc(id).update({
      title: title,
      course_id: course_id,
      description: description,
      due_date: new Date(due_date),
      max_points: max_points
    });

    res.json({ message: 'Assignment updated successfully' });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// DELETE assignment (admin only)
app.delete('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const submissionsSnap = await db.collection('assignment_submissions').where('assignment_id', '==', id).get();

    if (!submissionsSnap.empty) {
      return res.status(400).json({ error: 'Cannot delete assignment with existing submissions' });
    }

    await db.collection('assignments').doc(id).delete();

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// ==================== ADMIN CONTACT MESSAGES ENDPOINTS ====================

// Get contact messages (admin only) - CORRECTED VERSION
app.get('/api/admin/contact-messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const messagesSnap = await db.collection('contact_messages').orderBy('created_at', 'desc').get();

    const totalMessages = messagesSnap.size;
    const totalPages = Math.ceil(totalMessages / limit);

    const messages = messagesSnap.docs.slice((page - 1) * limit, page * limit).map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        message: data.message,
        status: data.status || 'pending',
        created_at: data.created_at
      };
    });

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

// UPDATE contact message status (admin only)
app.put('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'contacted', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    await db.collection('contact_messages').doc(id).update({
      status: status
    });

    res.json({ message: 'Contact message updated successfully' });
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500).json({ error: 'Failed to update contact message' });
  }
});

// DELETE contact message (admin only)
app.delete('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection('contact_messages').doc(id).delete();

    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ error: 'Failed to delete contact message' });
  }
});

// ==================== ADMIN SERVICE REQUEST MANAGEMENT PAGE ====================

// Updated GET endpoint for service requests
app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requestsSnap = await db.collection('service_requests').orderBy('created_at', 'desc').get();

    const subcategoryIds = requestsSnap.docs.map(doc => doc.data().subcategory_id);
    const subcategoriesSnap = await db.collection('service_subcategories').where(admin.firestore.FieldPath.documentId(), 'in', subcategoryIds).get();

    const subcategoriesMap = new Map(subcategoriesSnap.docs.map(doc => [doc.id, doc.data()]));

    const userIds = requestsSnap.docs.map(doc => doc.data().user_id);
    const usersSnap = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', userIds).get();

    const usersMap = new Map(usersSnap.docs.map(doc => [doc.id, doc.data()]));

    const requests = requestsSnap.docs.map(doc => {
      const data = doc.data();
      const subcategory = subcategoriesMap.get(data.subcategory_id) || {};
      const user = usersMap.get(data.user_id) || {};
      return {
        id: doc.id,
        name: data.full_name,
        service: subcategory.name,
        date: data.created_at.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: data.status,
        email: data.email,
        phone: data.phone,
        company: data.company,
        website: data.website,
        project_details: data.project_details,
        budget_range: data.budget_range,
        timeline: data.timeline,
        contact_method: data.contact_method,
        additional_requirements: data.additional_requirements,
        user_id: data.user_id,
        user_first_name: user.first_name,
        user_last_name: user.last_name,
        user_account_type: user.account_type
      };
    });

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
      status: status,
      project_details: project_details,
      budget_range: budget_range,
      timeline: timeline,
      additional_requirements: additional_requirements,
      updated_at: FieldValue.serverTimestamp()
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
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;