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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads', 'avatars')));

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
    req.user = userDoc.data();
    req.user.id = decoded.userId;
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
    const existingUsers = await db.collection('users').where('email', '==', email).get();

    if (!existingUsers.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const userRef = db.collection('users').doc();
    await userRef.set({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      password_hash: hashedPassword,
      account_type: accountType || 'student',
      is_active: true, // Fixed: Set is_active to true
      email_verified: false,
      created_at: firebase.firestore.Timestamp.now(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    // Create user stats entry
    await db.collection('user_stats').doc(userRef.id).set({
      user_id: userRef.id
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
    const users = await db.collection('users').where('email', '==', email).where('is_active', '==', true).get();

    if (users.empty) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const userDoc = users.docs[0];
    const user = userDoc.data();
    const userId = userDoc.id;

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const tokenExpiry = rememberMe ? '30d' : '1d';
    const token = jwt.sign(
      {
        userId: userId,
        email: user.email,
        accountType: user.account_type
      },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // Update last login timestamp
    await db.collection('users').doc(userId).update({
      updated_at: firebase.firestore.Timestamp.now()
    });

    console.log('User logged in successfully:', { userId, email: user.email });

    // Send success response
    res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
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
    // Step 1: Get total count
    // In Firestore, we can't do complex conditional counts easily, so fetch all and filter
    const allPostsSnap = await db.collection('social_activities').where('activity_type', '==', 'post').get();
    let totalPosts = 0;
    const postIds = [];

    const connections1 = await db.collection('user_connections').where('user_id_1', '==', userId).where('status', '==', 'accepted').get();
    const connections2 = await db.collection('user_connections').where('user_id_2', '==', userId).where('status', '==', 'accepted').get();
    const connections = [...connections1.docs.map(d => d.data().user_id_2), ...connections2.docs.map(d => d.data().user_id_1)];

    allPostsSnap.docs.forEach(doc => {
      const p = doc.data();
      if (
        p.visibility === 'public' ||
        (p.visibility === 'private' && p.user_id === userId) ||
        (p.visibility === 'connections' && (p.user_id === userId || connections.includes(p.user_id)))
      ) {
        totalPosts++;
        postIds.push(doc.id);
      }
    });

    const totalPages = Math.ceil(totalPosts / limit);

    // Step 2: Fetch paginated posts (manual pagination since conditional)
    const posts = [];
    const start = offset;
    const end = offset + limit;
    for (let i = start; i < Math.min(end, postIds.length); i++) {
      const postDoc = await db.collection('social_activities').doc(postIds[i]).get();
      const post = postDoc.data();
      post.id = postIds[i];

      const userDoc = await db.collection('users').doc(post.user_id).get();
      const u = userDoc.data();

      post.likes = (await db.collection('social_activities').where('activity_type', '==', 'like').where('target_id', '==', post.id).get()).size;

      post.comment_count = (await db.collection('social_activities').where('activity_type', '==', 'comment').where('target_id', '==', post.id).get()).size;

      post.has_liked = !(await db.collection('social_activities').where('activity_type', '==', 'like').where('target_id', '==', post.id).where('user_id', '==', userId).get()).empty;

      post.has_bookmarked = !(await db.collection('social_activities').where('activity_type', '==', 'bookmark').where('target_id', '==', post.id).where('user_id', '==', userId).get()).empty;

      post.image_url = getFullImageUrl(req, post.image_url);

      post.user = {
        id: post.user_id,
        first_name: u.first_name,
        last_name: u.last_name,
        profile_image: getFullImageUrl(req, u.profile_image),
        account_type: u.account_type
      };

      const commentsSnap = await db.collection('social_activities').where('activity_type', '==', 'comment').where('target_id', '==', post.id).orderBy('created_at').get();

      post.comments = [];
      for (const commentDoc of commentsSnap.docs) {
        const c = commentDoc.data();
        c.id = commentDoc.id;

        const commentUserDoc = await db.collection('users').doc(c.user_id).get();
        const commentUser = commentUserDoc.data();

        c.user = {
          id: c.user_id,
          first_name: commentUser.first_name,
          last_name: commentUser.last_name,
          profile_image: getFullImageUrl(req, commentUser.profile_image),
          account_type: commentUser.account_type
        };

        post.comments.push(c);
      }

      posts.push(post);
    }

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

      const postRef = db.collection('social_activities').doc();
      await postRef.set({
        user_id: userId,
        activity_type: 'post',
        content: content || '',
        image_url: imageUrl,
        achievement: isAchievement,
        visibility: visibility,
        created_at: firebase.firestore.Timestamp.now(),
        updated_at: firebase.firestore.Timestamp.now(),
        share_count: 0
      });

      const postId = postRef.id;

      const newPostDoc = await postRef.get();
      const newPost = newPostDoc.data();

      const userDoc = await db.collection('users').doc(userId).get();
      const u = userDoc.data();

      res.status(201).json({
        ...newPost,
        id: postId,
        has_liked: false,
        has_bookmarked: false,
        likes: 0,
        comment_count: 0,
        image_url: getFullImageUrl(req, newPost.image_url),
        user: {
          id: userId,
          first_name: u.first_name,
          last_name: u.last_name,
          profile_image: getFullImageUrl(req, u.profile_image),
          account_type: u.account_type
        },
        comments: []
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

    const post = postDoc.data();

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    await db.collection('social_activities').doc(id).update({
      content: content,
      updated_at: firebase.firestore.Timestamp.now()
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

    const post = postDoc.data();

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    // Delete the post record
    await db.collection('social_activities').doc(id).delete();

    // If there was an image, delete it from the filesystem
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

// --- POST a comment on a post ---
app.post('/api/posts/:id/comment', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Comment cannot be empty.' });
  }

  try {
    const commentRef = db.collection('social_activities').doc();
    await commentRef.set({
      user_id: userId,
      activity_type: 'comment',
      content: content,
      target_id: targetId,
      created_at: firebase.firestore.Timestamp.now()
    });

    const commentId = commentRef.id;

    // Fetch the new comment with user info to return
    const newCommentDoc = await commentRef.get();
    const newComment = newCommentDoc.data();

    const userDoc = await db.collection('users').doc(userId).get();
    const u = userDoc.data();

    res.status(201).json({
      ...newComment,
      user: {
        id: userId,
        first_name: u.first_name,
        last_name: u.last_name,
        profile_image: getFullImageUrl(req, u.profile_image)
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
    // Use INSERT IGNORE to prevent duplicates if user clicks too fast
    const likeRef = db.collection('social_activities').doc();
    await likeRef.set({
      user_id: userId,
      activity_type: 'like',
      target_id: targetId,
      created_at: firebase.firestore.Timestamp.now()
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
      return res.status(404).json({ error: 'Like not found' });
    }

    await likeSnap.docs[0].ref.delete();

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
    const bookmarkRef = db.collection('social_activities').doc();
    await bookmarkRef.set({
      user_id: userId,
      activity_type: 'bookmark',
      target_id: targetId,
      created_at: firebase.firestore.Timestamp.now()
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
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    await bookmarkSnap.docs[0].ref.delete();

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
    await db.collection('social_activities').doc(postId).update({
      share_count: firebase.firestore.FieldValue.increment(1)
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

// Assumes a 'services' collection with detailed service info, joined with 'service_categories'
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const servicesSnap = await db.collection('services').get();
    const services = [];
    for (const doc of servicesSnap.docs) {
      const s = doc.data();
      const categoryDoc = await db.collection('service_categories').doc(s.category_id).get();
      if (categoryDoc.exists && categoryDoc.data().is_active) {
        services.push({
          id: doc.id,
          name: s.name,
          category_id: s.category_id,
          categoryName: categoryDoc.data().name,
          description: s.description,
          price: s.price,
          duration: s.duration,
          rating: s.rating,
          reviews: s.reviews,
          features: JSON.parse(s.features || '[]'),
          popular: s.popular
        });
      }
    }

    services.sort((a, b) => b.popular - a.popular || a.name.localeCompare(b.name));

    res.json(services);
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

    const requests = [];
    for (const doc of requestsSnap.docs) {
      const sr = doc.data();
      const subcategoryDoc = await db.collection('service_subcategories').doc(sr.subcategory_id).get();
      const sc = subcategoryDoc.data();
      const categoryDoc = await db.collection('service_categories').doc(sc.category_id).get();
      const category = categoryDoc.data();
      requests.push({
        id: doc.id,
        userId: sr.user_id,
        categoryId: sr.subcategory_id,
        categoryName: category.name,
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
        requestDate: sr.created_at,
        updatedAt: sr.updated_at
      });
    }

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
      status: 'pending'
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

      const requestRef = db.collection('course_enroll_requests').doc();
      await requestRef.set({
        user_id: userId,
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
        payment_screenshot: `/uploads/payments/${req.file.filename}`
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

// Get user's enrolled courses
app.get('/api/enrollments/my-courses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').orderBy('enrollment_date', 'desc').get();

    const enrollments = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const c = courseDoc.data();
      enrollments.push({
        id: doc.id,
        userId: e.user_id,
        courseId: e.course_id,
        progress: e.progress,
        enrollmentDate: e.enrollment_date,
        completionDate: e.completion_date,
        status: e.status,
        course: {
          id: e.course_id,
          title: c.title,
          description: c.description,
          instructorName: c.instructor_name,
          durationWeeks: c.duration_weeks,
          difficultyLevel: c.difficulty_level,
          category: c.category,
          price: c.price,
          thumbnail: c.thumbnail,
          isActive: c.is_active
        }
      });
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

// ==================== CERTIFICATES ROUTES ====================

// Certificate Routes
app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const certificatesSnap = await db.collection('certificates').where('user_id', '==', userId).orderBy('issued_date', 'desc').get();

    const formattedCertificates = [];
    for (const doc of certificatesSnap.docs) {
      const c = doc.data();
      const courseDoc = await db.collection('courses').doc(c.course_id).get();
      const co = courseDoc.data();
      const enrollmentSnap = await db.collection('enrollments').where('user_id', '==', userId).where('course_id', '==', c.course_id).get();
      const e = enrollmentSnap.docs[0].data();
      const assignmentsSnap = await db.collection('assignments').where('course_id', '==', c.course_id).get();
      let finalGrade = 0;
      let count = 0;
      for (const aDoc of assignmentsSnap.docs) {
        const subSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
        if (!subSnap.empty) {
          finalGrade += subSnap.docs[0].data().grade || 0;
          count++;
        }
      }
      formattedCertificates.push({
        id: doc.id,
        userId: c.user_id,
        courseId: c.course_id,
        certificateUrl: c.certificate_url,
        issuedDate: c.issued_date,
        courseTitle: co.title,
        courseDescription: co.description,
        instructorName: co.instructor_name,
        category: co.category,
        difficultyLevel: co.difficulty_level,
        completionDate: e.completion_date,
        enrollmentStatus: e.status,
        finalGrade: Math.round(finalGrade / count || 0)
      });
    }

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

    const formattedCertificates = [];
    for (const doc of certificatesSnap.docs) {
      const c = doc.data();
      const courseDoc = await db.collection('courses').doc(c.course_id).get();
      const co = courseDoc.data();
      const userDoc = await db.collection('users').doc(c.user_id).get();
      const u = userDoc.data();
      const enrollmentSnap = await db.collection('enrollments').where('user_id', '==', c.user_id).where('course_id', '==', c.course_id).get();
      const e = enrollmentSnap.docs[0].data();
      formattedCertificates.push({
        id: doc.id,
        userId: c.user_id,
        courseId: c.course_id,
        certificateUrl: c.certificate_url,
        issuedDate: c.issued_date,
        courseTitle: co.title,
        instructorName: co.instructor_name,
        category: co.category,
        difficultyLevel: co.difficulty_level,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        completionDate: e.completion_date
      });
    }

    res.json(formattedCertificates.map(cert => ({
      id: cert.id,
      userId: cert.userId,
      courseId: cert.courseId,
      certificateUrl: cert.certificateUrl,
      issuedDate: cert.issuedDate,
      course: {
        id: cert.courseId,
        title: cert.courseTitle,
        instructorName: cert.instructorName,
        category: cert.category,
        difficultyLevel: cert.difficultyLevel
      },
      user: {
        firstName: cert.first_name,
        lastName: cert.last_name,
        email: cert.email
      },
      enrollment: {
        completionDate: cert.completionDate
      }
    })));
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
    const enrollments = await db.collection('enrollments').where('user_id', '==', userId).where('course_id', '==', courseId).where('status', '==', 'completed').get();

    if (enrollments.empty) {
      return res.status(400).json({ error: 'User has not completed this course' });
    }

    // Check if certificate already exists
    const existingCertificates = await db.collection('certificates').where('user_id', '==', userId).where('course_id', '==', courseId).get();

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

    // Update user stats
    await db.collection('user_stats').doc(userId).update({
      certificates_earned: firebase.firestore.FieldValue.increment(1)
    });

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

    const result = await db.collection('certificates').doc(certificateId).update({
      certificate_url: certificateUrl,
      issued_date: firebase.firestore.Timestamp.now()
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

    // Update user stats
    await db.collection('user_stats').doc(certificate.user_id).update({
      certificates_earned: firebase.firestore.FieldValue.increment(-1)
    });

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

// ==================== ADMIN DASHBOARD ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const usersSnap = await db.collection('users').where('is_active', '==', 1).get();
    const totalUsers = usersSnap.size;

    const coursesSnap = await db.collection('courses').where('is_active', '==', 1).get();
    const totalCourses = coursesSnap.size;

    const enrollmentsSnap = await db.collection('enrollments').get();
    const totalEnrollments = enrollmentsSnap.size;

    let totalRevenue = 0;
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      if (e.status === 'completed') {
        const courseDoc = await db.collection('courses').doc(e.course_id).get();
        totalRevenue += parseFloat(courseDoc.data().price) || 0;
      }
    }

    const sevenDaysAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
    const contactsSnap = await db.collection('contact_messages').where('created_at', '>=', sevenDaysAgo).get();
    const pendingContacts = contactsSnap.size;

    const serviceRequestsSnap = await db.collection('service_requests').where('status', '==', 'pending').get();
    const pendingServiceRequests = serviceRequestsSnap.size;

    res.json({
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue: totalRevenue.toString(),
      pendingContacts,
      pendingServiceRequests
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

// Recent Users
app.get('/api/admin/recent-users', authenticateToken, async (req, res) => {
  try {
    const usersSnap = await db.collection('users').where('is_active', '==', 1).orderBy('created_at', 'desc').limit(5).get();

    const users = usersSnap.docs.map(doc => {
      const u = doc.data();
      return {
        id: doc.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        account_type: u.account_type,
        join_date: u.created_at.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
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

    const enrollments = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const userDoc = await db.collection('users').doc(e.user_id).get();
      const u = userDoc.data();
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const c = courseDoc.data();
      enrollments.push({
        id: doc.id,
        user_name: u.first_name + ' ' + u.last_name,
        course_name: c.title,
        date: e.enrollment_date.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: e.status
      });
    }

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

// ==================== ADMIN USER MANAGEMENT ENDPOINTS ====================

// Helper function to format user data
const formatUser = (u) => {
  if (u.created_at instanceof firebase.firestore.Timestamp) {
    u.created_at = u.created_at.toDate().toISOString();
  }
  if (u.updated_at instanceof firebase.firestore.Timestamp) {
    u.updated_at = u.updated_at.toDate().toISOString();
  }
  return u;
};

// GET /api/admin/users - Get all users with pagination and filtering
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const accountType = req.query.accountType;
    const status = req.query.status;
    const search = req.query.search;

    let query = db.collection('users').orderBy('created_at', 'desc');

    if (accountType && accountType !== 'all') {
      query = query.where('account_type', '==', accountType);
    }

    if (status && status !== 'all') {
      const isActive = status === 'active' ? true : false;
      query = query.where('is_active', '==', isActive);
    }

    if (search) {
      // For search, we need to handle it differently since Firestore doesn't support OR queries directly
      let usersRef = db.collection('users');

      if (accountType && accountType !== 'all') {
        usersRef = usersRef.where('account_type', '==', accountType);
      }

      if (status && status !== 'all') {
        const isActive = status === 'active' ? true : false;
        usersRef = usersRef.where('is_active', '==', isActive);
      }

      const firstNameQuery = usersRef.where('first_name', '>=', search).where('first_name', '<=', search + '\uf8ff');
      const lastNameQuery = usersRef.where('last_name', '>=', search).where('last_name', '<=', search + '\uf8ff');
      const emailQuery = usersRef.where('email', '>=', search).where('email', '<=', search + '\uf8ff');
      
      const [firstNameSnapshot, lastNameSnapshot, emailSnapshot] = await Promise.all([
        firstNameQuery.get(),
        lastNameQuery.get(),
        emailQuery.get()
      ]);

      const allDocs = [...firstNameSnapshot.docs, ...lastNameSnapshot.docs, ...emailSnapshot.docs];
      const uniqueDocs = allDocs.reduce((acc, doc) => {
        if (!acc.find(d => d.id === doc.id)) {
          acc.push(doc);
        }
        return acc;
      }, []);

      let users = uniqueDocs.map(doc => {
        const data = doc.data();
        data.id = doc.id;
        return data;
      });

      // Sort by created_at desc
      users.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());

      // Format dates
      users = users.map(formatUser);

      // Apply pagination manually for search results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = users.slice(startIndex, endIndex);

      res.json({
        users: paginatedUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(users.length / limit),
          totalUsers: users.length,
          hasNextPage: endIndex < users.length,
          hasPreviousPage: page > 1
        }
      });
      return;
    }

    // For non-search queries, use startAfter for pagination
    let usersSnapshot;
    if (page > 1) {
      // Get the last document of previous page to start after
      const previousPageQuery = query.limit((page - 1) * limit);
      const previousPageSnapshot = await previousPageQuery.get();
      const lastDoc = previousPageSnapshot.docs[previousPageSnapshot.docs.length - 1];
      
      usersSnapshot = await query.startAfter(lastDoc).limit(limit).get();
    } else {
      usersSnapshot = await query.limit(limit).get();
    }

    let users = usersSnapshot.docs.map(doc => {
      const u = doc.data();
      u.id = doc.id;
      return formatUser(u);
    });

    // Get total count
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    res.json({
      users: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNextPage: (page * limit) < total,
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
    const { id } = req.params;

    const user = await db.collection('users').doc(id).get();

    if (!user.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = user.data();
    data.id = id;
    formatUser(data);

    res.json(data);
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
    const existing = await db.collection('users').where('email', '==', email).get();

    if (!existing.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const userRef = db.collection('users').doc();
    await userRef.set({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      password_hash: hashedPassword,
      account_type: accountType || 'student',
      company: company || null,
      website: website || null,
      bio: bio || null,
      is_active: isActive !== undefined ? isActive : true,
      email_verified: true,
      created_at: firebase.firestore.Timestamp.now(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    // Create user stats entry
    await db.collection('user_stats').doc(userRef.id).set({
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: firebase.firestore.Timestamp.now()
    });

    console.log('User created successfully by admin:', { userId: userRef.id, email });
    
    const newUser = await db.collection('users').doc(userRef.id).get();
    const data = newUser.data();
    data.id = userRef.id;
    formatUser(data);

    res.status(201).json({
      message: 'User created successfully',
      user: data
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/users/:id - Update a user
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, accountType, isActive, company, website, bio } = req.body;

    const user = await db.collection('users').doc(id).get();

    if (!user.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const u = user.data();

    if (email && email !== u.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }

      const existing = await db.collection('users').where('email', '==', email).where(firebase.firestore.FieldPath.documentId(), '!=', id).get();

      if (!existing.empty) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    await db.collection('users').doc(id).update({
      first_name: firstName !== undefined ? firstName : u.first_name,
      last_name: lastName !== undefined ? lastName : u.last_name,
      email: email !== undefined ? email : u.email,
      phone: phone !== undefined ? phone : u.phone,
      account_type: accountType !== undefined ? accountType : u.account_type,
      is_active: isActive !== undefined ? isActive : u.is_active,
      company: company !== undefined ? company : u.company,
      website: website !== undefined ? website : u.website,
      bio: bio !== undefined ? bio : u.bio,
      updated_at: firebase.firestore.Timestamp.now()
    });

    const updated = await db.collection('users').doc(id).get();
    const data = updated.data();
    data.id = id;
    formatUser(data);

    res.json({
      message: 'User updated successfully',
      user: data
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id - Delete a user
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    if (id === adminId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const user = await db.collection('users').doc(id).get();

    if (!user.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.collection('users').doc(id).update({
      is_active: false,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/users/:id/password - Reset user password (admin only)
app.put('/api/admin/users/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await db.collection('users').doc(id).get();

    if (!user.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection('users').doc(id).update({
      password_hash: hashedPassword,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
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

// GET all assignments (admin only)
app.get('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentsSnap = await db.collection('assignments').orderBy('created_at', 'desc').get();

    const assignments = [];
    for (const doc of assignmentsSnap.docs) {
      const a = doc.data();
      const courseDoc = await db.collection('courses').doc(a.course_id).get();
      assignments.push({
        id: doc.id,
        course_id: a.course_id,
        title: a.title,
        description: a.description,
        due_date: a.due_date,
        max_points: a.max_points,
        created_at: a.created_at,
        course_title: courseDoc.data().title
      });
    }

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

    const assignmentRef = db.collection('assignments').doc();
    await assignmentRef.set({
      title,
      course_id,
      description,
      due_date: new Date(due_date),
      max_points,
      created_at: firebase.firestore.Timestamp.now()
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
      title,
      course_id,
      description,
      due_date: new Date(due_date),
      max_points
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
    const offset = (page - 1) * limit;

    const messagesSnap = await db.collection('contact_messages').orderBy('created_at', 'desc').limit(limit).offset(offset).get();

    const messages = messagesSnap.docs.map(doc => {
      const m = doc.data();
      return {
        id: doc.id,
        first_name: m.first_name,
        last_name: m.last_name,
        email: m.email,
        phone: m.phone,
        company: m.company,
        message: m.message,
        status: m.status || 'pending',
        created_at: m.created_at
      };
    });

    const totalSnap = await db.collection('contact_messages').get();
    const total = totalSnap.size;

    res.json({
      messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNextPage: page < Math.ceil(total / limit),
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
      status
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

// Get service categories (admin only)
app.get('/api/admin/service-categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const categoriesSnap = await db.collection('service_categories').where('is_active', '==', 1).orderBy('name').get();

    const categories = categoriesSnap.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      description: doc.data().description,
      icon: doc.data().icon,
      is_active: doc.data().is_active,
      created_at: doc.data().created_at,
      updated_at: doc.data().updated_at
    }));

    res.json(categories);
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({ error: 'Failed to fetch service categories' });
  }
});

// ==================== ADMIN CALENDAR MANAGEMENT ENDPOINTS ====================

// Get all calendar events (admin only)
app.get('/api/admin/calendar-events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const eventsSnap = await db.collection('custom_calendar_events').orderBy('event_date', 'desc').orderBy('event_time', 'desc').get();

    const events = [];
    for (const doc of eventsSnap.docs) {
      const e = doc.data();
      const userDoc = await db.collection('users').doc(e.user_id).get();
      const u = userDoc.data();
      events.push({
        id: doc.id,
        user_id: e.user_id,
        title: e.title,
        description: e.description,
        event_date: e.event_date,
        event_time: e.event_time,
        event_type: e.event_type,
        created_at: e.created_at,
        updated_at: e.updated_at,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email
      });
    }

    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// Get calendar event by ID (admin only)
app.get('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    const event = eventDoc.data();
    const userDoc = await db.collection('users').doc(event.user_id).get();
    const user = userDoc.data();

    res.json({
      id,
      user_id: event.user_id,
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      event_time: event.event_time,
      event_type: event.event_type,
      created_at: event.created_at,
      updated_at: event.updated_at,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email
    });
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    res.status(500).json({ error: 'Failed to fetch calendar event' });
  }
});

// Create new calendar event (admin only)
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

    const eventRef = db.collection('custom_calendar_events').doc();
    await eventRef.set({
      user_id: user_id || null,
      title,
      description: description || null,
      event_date: new Date(event_date),
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
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// Update calendar event (admin only)
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

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    // Validate date format if provided
    if (event_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(event_date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
    }

    await db.collection('custom_calendar_events').doc(id).update({
      user_id: user_id || null,
      title,
      description: description || null,
      event_date: new Date(event_date),
      event_time: event_time || null,
      event_type: event_type || 'custom',
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Calendar event updated successfully' });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

// Delete calendar event (admin only)
app.delete('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    await db.collection('custom_calendar_events').doc(id).delete();

    res.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

// Get all users for dropdown (admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersSnap = await db.collection('users').where('is_active', '==', 1).orderBy('first_name').orderBy('last_name').get();

    const users = usersSnap.docs.map(doc => ({
      id: doc.id,
      first_name: doc.data().first_name,
      last_name: doc.data().last_name,
      email: doc.data().email
    }));

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
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

// ... (The rest of the code is unchanged from the previous version. To fix the 'firebase.firestore is not a function' error, we used the compat mode imports (require('firebase/compat/app'); etc.). This allows using the v8 syntax in v9+ SDK. If you have further errors, check your package.json for firebase version and ensure it's installed: npm install firebase@9.23.0 or later.)

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;