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
const admin = require('firebase-admin');

admin.initializeApp(); // Assumes GOOGLE_APPLICATION_CREDENTIALS env var or service account setup
const db = admin.firestore();

const app = express();
const port = process.env.PORT || 5000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Function to get next incremental ID for collections
async function getNextId(collectionName) {
  const counterRef = db.collection('counters').doc(collectionName);
  return db.runTransaction(async (t) => {
    const counterDoc = await t.get(counterRef);
    let lastId = 0;
    if (counterDoc.exists) {
      lastId = counterDoc.data().lastId || 0;
    }
    const nextId = lastId + 1;
    t.set(counterRef, { lastId: nextId });
    return nextId;
  });
}

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

// ===== CORS configuration =====
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
    const userSnap = await db.collection('users').where('id', '==', decoded.userId).where('is_active', '==', true).limit(1).get();

    if (userSnap.empty) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = userSnap.docs[0].data();
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
    const existingSnap = await db.collection('users').where('email', '==', email.trim()).get();

    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const id = await getNextId('users');
    const userData = {
      id,
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
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };
    await db.collection('users').doc(id.toString()).set(userData);

    // Create user stats entry
    await db.collection('user_stats').doc(id.toString()).set({
      user_id: id,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: admin.firestore.Timestamp.now()
    });

    console.log('User registered successfully:', { userId: id, email });
    res.status(201).json({
      message: 'User registered successfully',
      userId: id
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
    const usersSnap = await db.collection('users').where('email', '==', email).where('is_active', '==', true).limit(1).get();

    if (usersSnap.empty) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const user = usersSnap.docs[0].data();

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
    await db.collection('users').doc(user.id.toString()).update({
      updated_at: admin.firestore.Timestamp.now()
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

    await db.collection('users').doc(userId.toString()).update({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      company: company,
      website: website,
      bio: bio,
      updated_at: admin.firestore.Timestamp.now()
    });

    // Get updated user data
    const updatedUserSnap = await db.collection('users').doc(userId.toString()).get();
    const user = updatedUserSnap.data();

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

    await db.collection('users').doc(userId.toString()).update({
      profile_image: profileImage,
      updated_at: admin.firestore.Timestamp.now()
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

    const statsSnap = await db.collection('user_stats').doc(userId.toString()).get();

    if (!statsSnap.exists) {
      // Create default stats if not exists
      await db.collection('user_stats').doc(userId.toString()).set({
        user_id: userId,
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        last_activity: admin.firestore.Timestamp.now()
      });

      res.json({
        coursesEnrolled: 0,
        coursesCompleted: 0,
        certificatesEarned: 0,
        learningStreak: 0,
        lastActivity: new Date().toISOString()
      });
    } else {
      const userStats = statsSnap.data();
      res.json({
        coursesEnrolled: userStats.courses_enrolled,
        coursesCompleted: userStats.courses_completed,
        certificatesEarned: userStats.certificates_earned,
        learningStreak: userStats.learning_streak,
        lastActivity: userStats.last_activity.toDate().toISOString()
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
    // Get connected IDs
    let connectedIds = [];
    const conn1Snap = await db.collection('user_connections').where('user_id_1', '==', userId).where('status', '==', 'accepted').get();
    conn1Snap.docs.forEach(d => connectedIds.push(d.data().user_id_2));
    const conn2Snap = await db.collection('user_connections').where('user_id_2', '==', userId).where('status', '==', 'accepted').get();
    conn2Snap.docs.forEach(d => connectedIds.push(d.data().user_id_1));
    connectedIds = [...new Set(connectedIds)];

    // Fetch posts
    const publicSnap = await db.collection('social_activities').where('activity_type', '==', 'post').where('visibility', '==', 'public').get();
    const privateSnap = await db.collection('social_activities').where('activity_type', '==', 'post').where('visibility', '==', 'private').where('user_id', '==', userId).get();
    const connectionsSnap = await db.collection('social_activities').where('activity_type', '==', 'post').where('visibility', '==', 'connections').where('user_id', 'in', [...connectedIds, userId]).get();

    let allPosts = [...publicSnap.docs, ...privateSnap.docs, ...connectionsSnap.docs].map(d => ({docId: d.id, ...d.data()}));
    allPosts.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());

    const totalPosts = allPosts.length;
    const totalPages = Math.ceil(totalPosts / limit);

    const paginatedPosts = allPosts.slice(offset, offset + limit);

    if (paginatedPosts.length === 0) {
      return res.json({ posts: [], pagination: { page, totalPages, totalPosts } });
    }

    // Get users for posts
    const userIds = new Set(paginatedPosts.map(p => p.user_id));
    const usersSnap = await db.collection('users').where('id', 'in', Array.from(userIds)).get();
    const usersMap = new Map(usersSnap.docs.map(d => [d.data().id, d.data()]));

    // Get likes, bookmarks, etc for each post
    const postIds = paginatedPosts.map(p => p.id);
    const likesSnap = await db.collection('social_activities').where('activity_type', '==', 'like').where('target_id', 'in', postIds).get();
    const bookmarksSnap = await db.collection('social_activities').where('activity_type', '==', 'bookmark').where('target_id', 'in', postIds).get();
    const commentsSnap = await db.collection('social_activities').where('activity_type', '==', 'comment').where('target_id', 'in', postIds).orderBy('created_at', 'asc').get();

    const comments = commentsSnap.docs.map(d => ({docId: d.id, ...d.data()}));
    const commentUserIds = new Set(comments.map(c => c.user_id));
    const commentUsersSnap = await db.collection('users').where('id', 'in', Array.from(commentUserIds)).get();
    const commentUsersMap = new Map(commentUsersSnap.docs.map(d => [d.data().id, d.data()]));

    const postsWithData = paginatedPosts.map(post => {
      const postLikes = likesSnap.docs.filter(d => d.data().target_id === post.id);
      const postBookmarks = bookmarksSnap.docs.filter(d => d.data().target_id === post.id);
      const postComments = comments.filter(c => c.target_id === post.id).map(c => ({
        ...c,
        user: commentUsersMap.get(c.user_id) ? {
          id: c.user_id,
          first_name: commentUsersMap.get(c.user_id).first_name,
          last_name: commentUsersMap.get(c.user_id).last_name,
          profile_image: getFullImageUrl(req, commentUsersMap.get(c.user_id).profile_image),
          account_type: commentUsersMap.get(c.user_id).account_type
        } : null
      }));

      return {
        ...post,
        likes: postLikes.length,
        comment_count: postComments.length,
        has_liked: !!postLikes.find(d => d.data().user_id === userId),
        has_bookmarked: !!postBookmarks.find(d => d.data().user_id === userId),
        image_url: getFullImageUrl(req, post.image_url),
        user: usersMap.get(post.user_id) ? {
          id: post.user_id,
          first_name: usersMap.get(post.user_id).first_name,
          last_name: usersMap.get(post.user_id).last_name,
          profile_image: getFullImageUrl(req, usersMap.get(post.user_id).profile_image),
          account_type: usersMap.get(post.user_id).account_type
        } : null,
        comments: postComments
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

      const id = await getNextId('social_activities');
      const postData = {
        id,
        user_id: userId,
        activity_type: 'post',
        content: content || '',
        image_url: imageUrl,
        achievement: isAchievement,
        visibility: visibility,
        share_count: 0,
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now()
      };

      await db.collection('social_activities').doc(id.toString()).set(postData);

      // Fetch the newly created post with user
      const postSnap = await db.collection('social_activities').doc(id.toString()).get();
      const newPost = postSnap.data();
      const userSnap = await db.collection('users').doc(userId.toString()).get();
      const userData = userSnap.data();

      res.status(201).json({
        ...newPost,
        has_liked: false,
        has_bookmarked: false,
        likes: 0,
        comment_count: 0,
        image_url: getFullImageUrl(req, newPost.image_url),
        user: {
          id: newPost.user_id,
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

// --- PUT (edit) a post ---
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Content cannot be empty.' });
  }

  try {
    const postSnap = await db.collection('social_activities').doc(id.toString()).get();

    if (!postSnap.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = postSnap.data();

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    await db.collection('social_activities').doc(id.toString()).update({
      content: content,
      updated_at: admin.firestore.Timestamp.now()
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
    const postSnap = await db.collection('social_activities').doc(id.toString()).get();

    if (!postSnap.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = postSnap.data();

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    // Delete the post
    await db.collection('social_activities').doc(id.toString()).delete();

    // Delete related likes, comments, bookmarks
    const likesSnap = await db.collection('social_activities').where('target_id', '==', post.id).where('activity_type', '==', 'like').get();
    likesSnap.docs.forEach(async (d) => await d.ref.delete());

    const commentsSnap = await db.collection('social_activities').where('target_id', '==', post.id).where('activity_type', '==', 'comment').get();
    commentsSnap.docs.forEach(async (d) => await d.ref.delete());

    const bookmarksSnap = await db.collection('social_activities').where('target_id', '==', 'post.id').where('activity_type', '==', 'bookmark').get();
    bookmarksSnap.docs.forEach(async (d) => await d.ref.delete());

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
  const targetId = parseInt(req.params.id);
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Comment cannot be empty.' });
  }

  try {
    const id = await getNextId('social_activities');
    const commentData = {
      id,
      user_id: userId,
      activity_type: 'comment',
      content,
      target_id: targetId,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    await db.collection('social_activities').doc(id.toString()).set(commentData);

    // Fetch the new comment with user info
    const commentSnap = await db.collection('social_activities').doc(id.toString()).get();
    const newComment = commentSnap.data();
    const userSnap = await db.collection('users').doc(userId.toString()).get();
    const userData = userSnap.data();

    res.status(201).json({
      ...newComment,
      user: {
        id: newComment.user_id,
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
  const targetId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    // Check if already liked
    const existingSnap = await db.collection('social_activities').where('user_id', '==', userId).where('activity_type', '==', 'like').where('target_id', '==', targetId).get();

    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'Already liked' });
    }

    const id = await getNextId('social_activities');
    await db.collection('social_activities').doc(id.toString()).set({
      id,
      user_id: userId,
      activity_type: 'like',
      target_id: targetId,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    });

    res.status(201).json({ message: 'Post liked.' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post.' });
  }
});

// --- DELETE (unlike) a post ---
app.delete('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const likesSnap = await db.collection('social_activities').where('user_id', '==', userId).where('activity_type', '==', 'like').where('target_id', '==', targetId).get();
    for (const doc of likesSnap.docs) {
      await doc.ref.delete();
    }
    res.json({ message: 'Post unliked.' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ error: 'Failed to unlike post.' });
  }
});

// --- POST (bookmark) a post ---
app.post('/api/posts/:id/bookmark', authenticateToken, async (req, res) => {
  const targetId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    // Check if already bookmarked
    const existingSnap = await db.collection('social_activities').where('user_id', '==', userId).where('activity_type', '==', 'bookmark').where('target_id', '==', targetId).get();

    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'Already bookmarked' });
    }

    const id = await getNextId('social_activities');
    await db.collection('social_activities').doc(id.toString()).set({
      id,
      user_id: userId,
      activity_type: 'bookmark',
      target_id: targetId,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    });

    res.status(201).json({ message: 'Post bookmarked.' });
  } catch (error) {
    console.error('Error bookmarking post:', error);
    res.status(500).json({ error: 'Failed to bookmark post.' });
  }
});

// --- DELETE (unbookmark) a post ---
app.delete('/api/posts/:id/bookmark', authenticateToken, async (req, res) => {
  const targetId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const bookmarksSnap = await db.collection('social_activities').where('user_id', '==', userId).where('activity_type', '==', 'bookmark').where('target_id', '==', targetId).get();
    for (const doc of bookmarksSnap.docs) {
      await doc.ref.delete();
    }
    res.json({ message: 'Post unbookmarked.' });
  } catch (error) {
    console.error('Error unbookmarking post:', error);
    res.status(500).json({ error: 'Failed to unbookmark post.' });
  }
});

// --- POST (track) a share ---
app.post('/api/posts/:id/share', authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.id);

  try {
    await db.collection('social_activities').doc(postId.toString()).update({
      share_count: admin.firestore.FieldValue.increment(1)
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
  if (parseInt(req.params.userId, 10) !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own enrollment data.' });
  }

  try {
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).orderBy('enrollment_date', 'desc').get();

    const enrollments = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const courseSnap = await db.collection('courses').doc(e.course_id.toString()).get();
      const c = courseSnap.data();
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

  if (parseInt(req.params.userId, 10) !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own internship submissions.' });
  }

  try {
    const submissionsSnap = await db.collection('internship_submissions').where('user_id', '==', userId).orderBy('submitted_at', 'desc').get();

    const applications = [];
    for (const doc of submissionsSnap.docs) {
      const sub = doc.data();
      const internshipSnap = await db.collection('internships').doc(sub.internship_id.toString()).get();
      const i = internshipSnap.data();
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
    const servicesSnap = await db.collection('services').where('is_active', '==', true).orderBy('popular', 'desc').orderBy('name', 'asc').get();

    const parsedServices = [];
    for (const doc of servicesSnap.docs) {
      const s = doc.data();
      const categorySnap = await db.collection('service_categories').doc(s.category_id.toString()).get();
      const sc = categorySnap.data();
      parsedServices.push({
        id: s.id,
        name: s.name,
        category_id: sc.id,
        categoryName: sc.name,
        description: s.description,
        price: s.price,
        duration: s.duration,
        rating: s.rating,
        reviews: s.reviews,
        features: s.features ? JSON.parse(s.features) : [],
        popular: s.popular
      });
    }

    res.json(parsedServices);
  } catch (error) {
    console.error('Error fetching available services:', error);
    res.status(500).json({ message: 'Failed to fetch available services.', error: error.message });
  }
});

// ADJUSTED: GET /api/users/:userId/service-requests - Fetch a user's submitted service requests
app.get('/api/users/:userId/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (parseInt(req.params.userId, 10) !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
  }

  try {
    const requestsSnap = await db.collection('service_requests').where('user_id', '==', userId).orderBy('created_at', 'desc').get();

    const requests = [];
    for (const doc of requestsSnap.docs) {
      const sr = doc.data();
      const scSnap = await db.collection('service_categories').doc(sr.subcategory_id.toString()).get();
      const sc = scSnap.data();
      requests.push({
        id: doc.id,
        user_id: sr.user_id,
        categoryId: sr.subcategory_id,
        categoryName: sc.name,
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
  if (!userId || !categoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
    return res.status(400).json({ message: 'Missing required fields for service request. Please fill in all necessary details.' });
  }

  try {
    const id = await getNextId('service_requests');
    await db.collection('service_requests').doc(id.toString()).set({
      id,
      user_id: userId,
      subcategory_id: categoryId,
      full_name: fullName,
      email,
      phone,
      company: company || null,
      website: website || null,
      project_details: projectDetails,
      budget_range: budgetRange,
      timeline,
      contact_method: contactMethod,
      additional_requirements: additionalRequirements || null,
      status: 'pending',
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    });

    res.status(201).json({ message: 'Service request submitted successfully!', id });
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

    // Get enrolled courses for course events
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();
    const courseIds = enrollmentsSnap.docs.map(d => d.data().course_id);

    // Get course start dates
    const courseEvents = [];
    if (courseIds.length > 0) {
      const coursesSnap = await db.collection('courses').where('id', 'in', courseIds).get();
      coursesSnap.docs.forEach(d => {
        const c = d.data();
        courseEvents.push({
          id: `course-${c.id}`,
          title: `Course: ${c.title}`,
          description: c.description || 'Course enrollment',
          date: c.created_at,
          type: 'course_start',
          course: {
            id: c.id,
            title: c.title,
            category: c.category
          },
          color: 'blue'
        });
      });
    }

    // Get assignment deadlines
    const assignmentsSnap = await db.collection('assignments').where('course_id', 'in', courseIds).get();
    const assignmentEvents = [];
    for (const aDoc of assignmentsSnap.docs) {
      const a = aDoc.data();
      const courseSnap = await db.collection('courses').doc(a.course_id.toString()).get();
      const c = courseSnap.data();
      const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', a.id).where('user_id', '==', userId).limit(1).get();
      const s = submissionSnap.empty ? null : submissionSnap.docs[0].data();

      const now = new Date();
      const dueDate = a.due_date.toDate();
      let status = 'pending';
      if (s && s.status === 'graded') status = 'completed';
      else if (dueDate < now && !s) status = 'overdue';

      assignmentEvents.push({
        id: `assignment-${a.id}`,
        title: a.title,
        description: a.description || 'Assignment due',
        date: a.due_date,
        type: 'assignment',
        course: {
          id: a.course_id,
          title: c.title,
          category: c.category
        },
        status,
        color: status === 'completed' ? 'green' : status === 'overdue' ? 'red' : 'orange'
      });
    }

    // Get custom events
    let customEvents = [];
    const customSnap = await db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).orderBy('event_date', 'asc').get();
    customSnap.docs.forEach(d => {
      const e = d.data();
      customEvents.push({
        id: `custom-${e.id}`,
        title: e.title,
        description: e.description || '',
        date: e.event_date,
        time: e.event_time,
        type: e.event_type || 'custom',
        color: 'purple'
      });
    });

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
    const courseIds = enrollmentsSnap.docs.map(d => d.data().course_id);

    // Assignment events for the date
    const assignmentEvents = [];
    if (courseIds.length > 0) {
      const assignmentsSnap = await db.collection('assignments').where('course_id', 'in', courseIds).get();
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        if (a.due_date.toDate().toISOString().split('T')[0] === date) {
          const courseSnap = await db.collection('courses').doc(a.course_id.toString()).get();
          const c = courseSnap.data();
          const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', a.id).where('user_id', '==', userId).limit(1).get();
          const s = submissionSnap.empty ? null : submissionSnap.docs[0].data();

          const now = new Date();
          const dueDate = a.due_date.toDate();
          let status = 'pending';
          if (s && s.status === 'graded') status = 'completed';
          else if (dueDate < now && !s) status = 'overdue';

          assignmentEvents.push({
            event_type: 'assignment',
            id: a.id,
            title: a.title,
            description: a.description,
            date: a.due_date,
            time: null,
            course_id: a.course_id,
            course_title: c.title,
            course_category: c.category,
            status
          });
        }
      }
    }

    // Course start events for the date
    const courseEvents = [];
    if (courseIds.length > 0) {
      const coursesSnap = await db.collection('courses').where('id', 'in', courseIds).get();
      coursesSnap.docs.forEach(d => {
        const c = d.data();
        if (c.created_at.toDate().toISOString().split('T')[0] === date) {
          courseEvents.push({
            event_type: 'course_start',
            id: c.id,
            title: `Course: ${c.title}`,
            description: c.description,
            date: c.created_at,
            time: null,
            course_id: c.id,
            course_title: c.title,
            course_category: c.category,
            status: 'active'
          });
        }
      });
    }

    // Custom events for the date
    let customEvents = [];
    const customSnap = await db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '==', parsedDate).get();
    customSnap.docs.forEach(d => {
      const e = d.data();
      customEvents.push({
        event_type: 'custom',
        id: e.id,
        title: e.title,
        description: e.description,
        date: e.event_date,
        time: e.event_time,
        course_id: null,
        course_title: null,
        course_category: null,
        status: 'pending'
      });
    });

    const allEvents = [...assignmentEvents, ...courseEvents, ...customEvents];

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

    // Get enrolled courses
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();
    const courseIds = enrollmentsSnap.docs.map(d => d.data().course_id);

    // Assignment events
    const assignmentEvents = [];
    if (courseIds.length > 0) {
      const assignmentsSnap = await db.collection('assignments').where('course_id', 'in', courseIds).where('due_date', '>=', now).where('due_date', '<=', sevenDaysLater).orderBy('due_date', 'asc').limit(10).get();
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        const courseSnap = await db.collection('courses').doc(a.course_id.toString()).get();
        const c = courseSnap.data();
        const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', a.id).where('user_id', '==', userId).limit(1).get();
        const s = submissionSnap.empty ? null : submissionSnap.docs[0].data();

        const dueDate = a.due_date.toDate();
        let status = 'pending';
        if (s && s.status === 'graded') status = 'completed';
        else if (dueDate < now && !s) status = 'overdue';

        assignmentEvents.push({
          event_type: 'assignment',
          id: a.id,
          title: a.title,
          description: a.description,
          date: a.due_date,
          time: null,
          course_id: a.course_id,
          course_title: c.title,
          course_category: c.category,
          status
        });
      }
    }

    // Custom events
    const customSnap = await db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '>=', now).where('event_date', '<=', sevenDaysLater).orderBy('event_date', 'asc').limit(5).get();
    const customUpcoming = customSnap.docs.map(d => {
      const e = d.data();
      return {
        event_type: 'custom',
        id: e.id,
        title: e.title,
        description: e.description,
        date: e.event_date,
        time: e.event_time,
        course_id: null,
        course_title: null,
        course_category: null,
        status: 'pending'
      };
    });

    const allUpcoming = [...assignmentEvents, ...customUpcoming];

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

    // Active courses
    const activeCoursesSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();
    const activeCourses = activeCoursesSnap.size;

    // Completed courses
    const completedCoursesSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'completed').get();
    const completedCourses = completedCoursesSnap.size;

    // Assignments
    const courseIds = [...activeCoursesSnap.docs, ...completedCoursesSnap.docs].map(d => d.data().course_id);
    let pendingAssignments = 0;
    let completedAssignments = 0;
    let overdueAssignments = 0;
    if (courseIds.length > 0) {
      const assignmentsSnap = await db.collection('assignments').where('course_id', 'in', courseIds).get();
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', a.id).where('user_id', '==', userId).limit(1).get();
        const s = submissionSnap.empty ? null : submissionSnap.docs[0].data();

        const now = new Date();
        const dueDate = a.due_date.toDate();
        if (s && s.status === 'graded') completedAssignments++;
        else if (dueDate < now && !s) overdueAssignments++;
        else pendingAssignments++;
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

    // Get enrolled courses
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();
    const courseIds = enrollmentsSnap.docs.map(d => d.data().course_id);

    const assignments = [];
    if (courseIds.length > 0) {
      const assignmentsSnap = await db.collection('assignments').where('course_id', 'in', courseIds).orderBy('due_date', 'asc').get();
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        const courseSnap = await db.collection('courses').doc(a.course_id.toString()).get();
        const c = courseSnap.data();
        const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', a.id).where('user_id', '==', userId).limit(1).get();
        const s = submissionSnap.empty ? null : submissionSnap.docs[0].data();

        assignments.push({
          id: a.id,
          title: a.title,
          description: a.description,
          due_date: a.due_date,
          max_points: a.max_points,
          course: {
            id: a.course_id,
            title: c.title,
            category: c.category
          },
          submission: s ? {
            id: submissionSnap.docs[0].id,
            status: s.status,
            grade: s.grade
          } : null
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

    const id = await getNextId('custom_calendar_events');
    await db.collection('custom_calendar_events').doc(id.toString()).set({
      id,
      user_id: userId,
      title,
      description,
      event_date: new Date(date),
      event_time: time || null,
      event_type: type,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    });

    res.status(201).json({
      id,
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
    const eventSnap = await db.collection('custom_calendar_events').doc(id.toString()).get();

    if (!eventSnap.exists || eventSnap.data().user_id !== userId) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    await db.collection('custom_calendar_events').doc(id.toString()).update({
      title,
      description,
      event_date: new Date(date),
      event_time: time,
      event_type: type,
      updated_at: admin.firestore.Timestamp.now()
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

    const eventSnap = await db.collection('custom_calendar_events').doc(id.toString()).get();

    if (!eventSnap.exists || eventSnap.data().user_id !== userId) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    await db.collection('custom_calendar_events').doc(id.toString()).delete();

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
      id: user.id,
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

      // Insert into database
      const id = await getNextId('course_enroll_requests');
      await db.collection('course_enroll_requests').doc(id.toString()).set({
        id,
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
        requestId: id
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
        id: course.id,
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
    for (const eDoc of enrollmentsSnap.docs) {
      const e = eDoc.data();
      const courseSnap = await db.collection('courses').doc(e.course_id.toString()).get();
      const c = courseSnap.data();
      enrollments.push({
        id: e.id,
        userId: e.user_id,
        courseId: e.course_id,
        progress: e.progress,
        enrollmentDate: e.enrollment_date,
        completionDate: e.completion_date,
        status: e.status,
        course: {
          id: c.id,
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
    const courseSnap = await db.collection('courses').doc(courseId.toString()).get();

    if (!courseSnap.exists || !courseSnap.data().is_active) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    const id = await getNextId('enrollments');
    await db.collection('enrollments').doc(id.toString()).set({
      id,
      user_id: userId,
      course_id: courseId,
      progress: 0,
      status: 'active',
      enrollment_date: admin.firestore.Timestamp.now(),
      completion_date: null
    });

    // Update user stats
    await db.collection('user_stats').doc(userId.toString()).update({
      courses_enrolled: admin.firestore.FieldValue.increment(1)
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
    const courseIds = enrollmentsSnap.docs.map(d => d.data().course_id);

    const coursesMap = new Map();
    if (courseIds.length > 0) {
      const coursesSnap = await db.collection('courses').where('id', 'in', courseIds).where('is_active', '==', true).get();
      coursesSnap.docs.forEach(d => coursesMap.set(d.data().id, d.data()));
    }

    const assignments = [];
    if (courseIds.length > 0) {
      const assignmentsSnap = await db.collection('assignments').where('course_id', 'in', courseIds).orderBy('due_date', 'asc').get();
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', a.id).where('user_id', '==', userId).limit(1).get();
        const s = submissionSnap.empty ? null : submissionSnap.docs[0].data();
        const sId = submissionSnap.empty ? null : submissionSnap.docs[0].id;

        const course = coursesMap.get(a.course_id);
        if (course) {
          assignments.push({
            id: a.id,
            course_id: a.course_id,
            title: a.title,
            description: a.description,
            due_date: a.due_date,
            max_points: a.max_points,
            created_at: a.created_at,
            course: {
              id: a.course_id,
              title: course.title,
              category: course.category
            },
            submission_id: sId,
            submission_content: s ? s.content : null,
            submission_file_path: s ? s.file_path : null,
            submitted_at: s ? s.submitted_at : null,
            grade: s ? s.grade : null,
            feedback: s ? s.feedback : null,
            submission_status: s ? s.status : null
          });
        }
      }
    }

    res.json(assignments);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /assignments/all - Get all assignments (admin only)
app.get('/assignments/all', authenticateToken, async (req, res) => {
  // Check if user is admin
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }

  try {
    const assignmentsSnap = await db.collection('assignments').get();

    const assignments = [];
    for (const aDoc of assignmentsSnap.docs) {
      const a = aDoc.data();
      const courseSnap = await db.collection('courses').doc(a.course_id.toString()).get();
      const c = courseSnap.data();
      const submissionsSnap = await db.collection('assignment_submissions').where('assignment_id', '==', a.id).get();
      const submissionCount = submissionsSnap.size;
      const gradedCount = submissionsSnap.docs.filter(d => d.data().status === 'graded').length;

      assignments.push({
        id: a.id,
        course_id: a.course_id,
        title: a.title,
        description: a.description,
        due_date: a.due_date,
        max_points: a.max_points,
        created_at: a.created_at,
        course: {
          id: a.course_id,
          title: c.title,
          category: c.category
        },
        submission_count: submissionCount,
        graded_count: gradedCount
      });
    }

    assignments.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());

    res.json(assignments);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /assignments/submit - Submit assignment
app.post('/assignments/submit', authenticateToken, assignmentUpload.single('file'), async (req, res) => {
  const { assignment_id } = req.body;
  const content = req.body.content || '';
  const file_path = req.file ? req.file.filename : null;

  if (!assignment_id) {
    return res.status(400).json({ error: 'Assignment ID is required' });
  }

  if (!content && !file_path) {
    return res.status(400).json({ error: 'Either content or file is required' });
  }

  try {
    // Check if assignment exists and user is enrolled
    const assignmentSnap = await db.collection('assignments').doc(assignment_id.toString()).get();
    if (!assignmentSnap.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const a = assignmentSnap.data();
    const enrollmentSnap = await db.collection('enrollments').where('user_id', '==', req.user.id).where('course_id', '==', a.course_id).get();
    if (enrollmentSnap.empty) {
      return res.status(404).json({ error: 'Not enrolled' });
    }

    // Check if already submitted
    const existingSnap = await db.collection('assignment_submissions').where('assignment_id', '==', parseInt(assignment_id)).where('user_id', '==', req.user.id).get();
    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }

    // Insert submission
    const id = await getNextId('assignment_submissions');
    await db.collection('assignment_submissions').doc(id.toString()).set({
      id,
      assignment_id: parseInt(assignment_id),
      user_id: req.user.id,
      content,
      file_path,
      submitted_at: admin.firestore.Timestamp.now(),
      status: 'submitted',
      grade: null,
      feedback: null
    });

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission_id: id
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /assignments/download-submission/:id - Download submission file
app.get('/assignments/download-submission/:id', authenticateToken, async (req, res) => {
  const submissionId = parseInt(req.params.id);

  try {
    const submissionSnap = await db.collection('assignment_submissions').doc(submissionId.toString()).get();
    if (!submissionSnap.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = submissionSnap.data();

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
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /assignments/course/:courseId - Get assignments for a specific course
app.get('/assignments/course/:courseId', authenticateToken, async (req, res) => {
  const courseId = parseInt(req.params.courseId);

  try {
    // Check if user is enrolled or admin
    const enrollmentSnap = await db.collection('enrollments').where('course_id', '==', courseId).where('user_id', '==', req.user.id).get();
    if (enrollmentSnap.empty && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const courseSnap = await db.collection('courses').doc(courseId.toString()).get();
    const c = courseSnap.data();

    const assignmentsSnap = await db.collection('assignments').where('course_id', '==', courseId).orderBy('due_date', 'asc').get();

    const assignments = [];
    for (const aDoc of assignmentsSnap.docs) {
      const a = aDoc.data();
      const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', a.id).where('user_id', '==', req.user.id).limit(1).get();
      const s = submissionSnap.empty ? null : submissionSnap.docs[0].data();
      const sId = submissionSnap.empty ? null : submissionSnap.docs[0].id;

      assignments.push({
        id: a.id,
        course_id: a.course_id,
        title: a.title,
        description: a.description,
        due_date: a.due_date,
        max_points: a.max_points,
        created_at: a.created_at,
        course: {
          id: a.course_id,
          title: c.title,
          category: c.category
        },
        submission_id: sId,
        submission_content: s ? s.content : null,
        submission_file_path: s ? s.file_path : null,
        submitted_at: s ? s.submitted_at : null,
        grade: s ? s.grade : null,
        feedback: s ? s.feedback : null,
        submission_status: s ? s.status : null
      });
    }

    res.json(assignments);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// PUT /api/assignments/grade/:submissionId - Grade assignment (admin/instructor only)
app.put('/api/assignments/grade/:submissionId', authenticateToken, async (req, res) => {
  const submissionId = parseInt(req.params.submissionId);
  const { grade, feedback } = req.body;

  // Check if user is admin
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }

  // Validate grade
  if (grade < 0 || grade > 100) {
    return res.status(400).json({ error: 'Grade must be between 0 and 100' });
  }

  try {
    await db.collection('assignment_submissions').doc(submissionId.toString()).update({
      grade,
      feedback: feedback || '',
      status: 'graded'
    });

    res.json({
      success: true,
      message: 'Assignment graded successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
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
    const accountType = req.user.account_type;

    const resourcesSnap = await db.collection('resources').get();

    const resources = resourcesSnap.docs.map(d => d.data()).filter(r => {
      const allowed = JSON.parse(r.allowed_account_types || '[]');
      return allowed.includes(accountType);
    });

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
    const accountType = req.user.account_type;

    const resourceSnap = await db.collection('resources').doc(id.toString()).get();
    if (!resourceSnap.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const resource = resourceSnap.data();

    // Check allowed account types
    const allowed = JSON.parse(resource.allowed_account_types || '[]');
    if (!allowed.includes(accountType)) {
      return res.status(404).json({ error: 'Resource not found or access denied' });
    }

    // Check premium
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
    for (const cDoc of certificatesSnap.docs) {
      const c = cDoc.data();
      const courseSnap = await db.collection('courses').doc(c.course_id.toString()).get();
      const co = courseSnap.data();
      const enrollmentSnap = await db.collection('enrollments').where('user_id', '==', userId).where('course_id', '==', c.course_id).limit(1).get();
      const e = enrollmentSnap.empty ? null : enrollmentSnap.docs[0].data();

      // Get average grade
      let finalGrade = 0;
      const assignmentsSnap = await db.collection('assignments').where('course_id', '==', c.course_id).get();
      if (assignmentsSnap.size > 0) {
        let totalGrade = 0;
        let count = 0;
        for (const aDoc of assignmentsSnap.docs) {
          const a = aDoc.data();
          const subSnap = await db.collection('assignment_submissions').where('assignment_id', '==', a.id).where('user_id', '==', userId).limit(1).get();
          if (!subSnap.empty) {
            totalGrade += subSnap.docs[0].data().grade || 0;
            count++;
          }
        }
        finalGrade = count > 0 ? totalGrade / count : 0;
      }

      formattedCertificates.push({
        id: c.id,
        userId: c.user_id,
        courseId: c.course_id,
        certificateUrl: c.certificate_url,
        issuedDate: c.issued_date,
        course: {
          id: c.course_id,
          title: co.title,
          description: co.description,
          instructorName: co.instructor_name,
          category: co.category,
          difficultyLevel: co.difficulty_level
        },
        enrollment: {
          completionDate: e ? e.completion_date : null,
          finalGrade: Math.round(finalGrade),
          status: e ? e.status : null
        }
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
    const certificateSnap = await db.collection('certificates').doc(certificateId.toString()).get();
    if (!certificateSnap.exists || certificateSnap.data().user_id !== userId) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = certificateSnap.data();
    const courseSnap = await db.collection('courses').doc(certificate.course_id.toString()).get();
    const course = courseSnap.data();
    const userSnap = await db.collection('users').doc(userId.toString()).get();
    const user = userSnap.data();

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
      certificateId: certificate.id
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
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const certificatesSnap = await db.collection('certificates').orderBy('issued_date', 'desc').get();

    const formattedCertificates = [];
    for (const cDoc of certificatesSnap.docs) {
      const c = cDoc.data();
      const courseSnap = await db.collection('courses').doc(c.course_id.toString()).get();
      const co = courseSnap.data();
      const userSnap = await db.collection('users').doc(c.user_id.toString()).get();
      const u = userSnap.data();
      const enrollmentSnap = await db.collection('enrollments').where('user_id', '==', c.user_id).where('course_id', '==', c.course_id).limit(1).get();
      const e = enrollmentSnap.empty ? null : enrollmentSnap.docs[0].data();

      formattedCertificates.push({
        id: c.id,
        userId: c.user_id,
        courseId: c.course_id,
        certificateUrl: c.certificate_url,
        issuedDate: c.issued_date,
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
          completionDate: e ? e.completion_date : null
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
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
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
    const existingSnap = await db.collection('certificates').where('user_id', '==', userId).where('course_id', '==', courseId).get();

    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'Certificate already exists for this user and course' });
    }

    // Create new certificate
    const id = await getNextId('certificates');
    await db.collection('certificates').doc(id.toString()).set({
      id,
      user_id: userId,
      course_id: courseId,
      certificate_url: certificateUrl || null,
      issued_date: admin.firestore.Timestamp.now()
    });

    // Update user stats
    await db.collection('user_stats').doc(userId.toString()).update({
      certificates_earned: admin.firestore.FieldValue.increment(1)
    });

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificateId: id
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ error: 'Failed to issue certificate' });
  }
});

// Update certificate
app.put('/api/certificates/:certificateId', authenticateToken, async (req, res) => {
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { certificateId } = req.params;
    const { certificateUrl } = req.body;

    await db.collection('certificates').doc(certificateId.toString()).update({
      certificate_url: certificateUrl,
      issued_date: admin.firestore.Timestamp.now()
    });

    res.json({ message: 'Certificate updated successfully' });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ error: 'Failed to update certificate' });
  }
});

// Delete certificate (admin only)
app.delete('/api/certificates/:certificateId', authenticateToken, async (req, res) => {
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { certificateId } = req.params;

    const certificateSnap = await db.collection('certificates').doc(certificateId.toString()).get();

    if (!certificateSnap.exists) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = certificateSnap.data();

    await db.collection('certificates').doc(certificateId.toString()).delete();

    // Update user stats
    await db.collection('user_stats').doc(certificate.user_id.toString()).update({
      certificates_earned: admin.firestore.FieldValue.increment(-1)
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
    // ... (keep the same array as in original)
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
    const statsSnap = await db.collection('user_stats').doc(req.user.id.toString()).get();

    let stats;
    if (!statsSnap.exists) {
      await db.collection('user_stats').doc(req.user.id.toString()).set({
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
      stats = statsSnap.data();
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
    const logId = await getNextId('download_logs');
    await db.collection('download_logs').doc(logId.toString()).set({
      id: logId,
      user_id: req.user.id,
      resource_id: resourceId,
      resource_name: resource.title,
      created_at: admin.firestore.Timestamp.now()
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
    for (const eDoc of enrollmentsSnap.docs) {
      const e = eDoc.data();
      const courseSnap = await db.collection('courses').doc(e.course_id.toString()).get();
      const c = courseSnap.data();
      courses.push({
        id: c.id,
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

// GET all internships
app.get('/api/internships', async (req, res) => {
  try {
    const internshipsSnap = await db.collection('internships').orderBy('posted_at', 'desc').get();
    const internships = internshipsSnap.docs.map(doc => ({
      ...doc.data(),
      requirements: JSON.parse(doc.data().requirements || '[]'),
      benefits: JSON.parse(doc.data().benefits || '[]')
    }));
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
    const submissionsSnap = await db.collection('internship_submissions').where('user_id', '==', userId).orderBy('submitted_at', 'desc').get();

    const parsedApplications = [];
    for (const doc of submissionsSnap.docs) {
      const app = doc.data();
      const internshipSnap = await db.collection('internships').doc(app.internship_id.toString()).get();
      const i = internshipSnap.data();
      parsedApplications.push({
        ...app,
        requirements: JSON.parse(i.requirements || '[]'),
        benefits: JSON.parse(i.benefits || '[]')
      });
    }

    res.json(parsedApplications);
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

  const t = db.runTransaction(async (transaction) => {
    const internshipRef = db.collection('internships').doc(internshipId.toString());
    const internshipDoc = await transaction.get(internshipRef);

    if (!internshipDoc.exists) {
      throw new Error('Internship not found.');
    }

    if (internshipDoc.data().spots_available <= 0) {
      throw new Error('No available spots left for this internship.');
    }

    const existingSnap = await transaction.get(db.collection('internship_submissions').where('internship_id', '==', internshipId).where('user_id', '==', userId).limit(1));
    if (!existingSnap.empty) {
      throw new Error('You have already applied for this internship.');
    }

    const id = await getNextId('internship_submissions');
    const submissionRef = db.collection('internship_submissions').doc(id.toString());
    transaction.set(submissionRef, {
      id,
      internship_id: internshipId,
      user_id: userId,
      full_name,
      email,
      phone: phone || null,
      resume_url,
      cover_letter: cover_letter || null,
      status: 'pending',
      submitted_at: admin.firestore.Timestamp.now()
    });

    transaction.update(internshipRef, {
      spots_available: admin.firestore.FieldValue.increment(-1),
      applications_count: admin.firestore.FieldValue.increment(1)
    });
  });

  try {
    await t;
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
    for (const catDoc of categoriesSnap.docs) {
      const category = catDoc.data();
      const subSnap = await db.collection('service_subcategories').where('category_id', '==', category.id).where('is_active', '==', true).orderBy('name').get();
      categoriesWithSubs.push({
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        subcategories: subSnap.docs.map(subDoc => {
          const sub = subDoc.data();
          return {
            id: sub.id,
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
    const subcategorySnap = await db.collection('service_subcategories').doc(subcategoryId.toString()).get();

    if (!subcategorySnap.exists || !subcategorySnap.data().is_active) {
      return res.status(404).json({ error: 'Service subcategory not found' });
    }

    // Create service request
    const id = await getNextId('service_requests');
    await db.collection('service_requests').doc(id.toString()).set({
      id,
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
      status: 'pending',
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    });

    res.status(201).json({
      message: 'Service request submitted successfully',
      requestId: id
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
    for (const srDoc of requestsSnap.docs) {
      const sr = srDoc.data();
      const ssSnap = await db.collection('service_subcategories').doc(sr.subcategory_id.toString()).get();
      const ss = ssSnap.data();
      const scSnap = await db.collection('service_categories').doc(ss.category_id.toString()).get();
      const sc = scSnap.data();
      requests.push({
        id: sr.id,
        user_id: sr.user_id,
        subcategory_id: sr.subcategory_id,
        full_name: sr.full_name,
        email: sr.email,
        phone: sr.phone,
        company: sr.company,
        website: sr.website,
        project_details: sr.project_details,
        budget_range: sr.budget_range,
        timeline: sr.timeline,
        contact_method: sr.contact_method,
        additional_requirements: sr.additional_requirements,
        status: sr.status,
        created_at: sr.created_at,
        updated_at: sr.updated_at,
        category_name: sc.name,
        subcategory_name: ss.name
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
    for (const eDoc of enrollmentsSnap.docs) {
      const e = eDoc.data();
      if (e.status === 'completed') {
        const courseSnap = await db.collection('courses').doc(e.course_id.toString()).get();
        totalRevenue += courseSnap.data().price || 0;
      }
    }

    const contactsSnap = await db.collection('contact_messages').where('created_at', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).get();
    const pendingContacts = contactsSnap.size;

    const serviceRequestsSnap = await db.collection('service_requests').where('status', '==', 'pending').get();
    const pendingServiceRequests = serviceRequestsSnap.size;

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

// Recent Users
app.get('/api/admin/recent-users', authenticateToken, async (req, res) => {
  try {
    const usersSnap = await db.collection('users').where('is_active', '==', 1).orderBy('created_at', 'desc').limit(5).get();

    const users = usersSnap.docs.map(d => {
      const u = d.data();
      return {
        id: u.id,
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
    for (const eDoc of enrollmentsSnap.docs) {
      const e = eDoc.data();
      const userSnap = await db.collection('users').doc(e.user_id.toString()).get();
      const u = userSnap.data();
      const courseSnap = await db.collection('courses').doc(e.course_id.toString()).get();
      const c = courseSnap.data();
      enrollments.push({
        id: e.id,
        user_name: `${u.first_name} ${u.last_name}`,
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
    const id = await getNextId('contact_messages');
    await db.collection('contact_messages').doc(id.toString()).set({
      id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      company: company || null,
      message: message.trim(),
      created_at: admin.firestore.Timestamp.now()
    });

    console.log('Contact message saved successfully:', {
      id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim()
    });

    res.status(201).json({
      message: 'Contact message sent successfully',
      contactId: id
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
    // User growth data (last 6 months)
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    const usersSnap = await db.collection('users').where('created_at', '>=', sixMonthsAgo).get();
    const userGrowth = [];
    usersSnap.docs.forEach(d => {
      const month = d.data().created_at.toDate().toISOString().slice(0, 7);
      const index = userGrowth.findIndex(g => g.month === month);
      if (index === -1) {
        userGrowth.push({month, count: 1});
      } else {
        userGrowth[index].count++;
      }
    });
    userGrowth.sort((a, b) => a.month.localeCompare(b.month));

    // Course enrollment data
    const coursesSnap = await db.collection('courses').where('is_active', '==', true).get();
    const courseEnrollments = [];
    for (const cDoc of coursesSnap.docs) {
      const c = cDoc.data();
      const enrollmentsSnap = await db.collection('enrollments').where('course_id', '==', c.id).get();
      courseEnrollments.push({
        title: c.title,
        enrollments: enrollmentsSnap.size
      });
    }
    courseEnrollments.sort((a, b) => b.enrollments - a.enrollments);
    const top10 = courseEnrollments.slice(0, 10);

    // Revenue by month
    const enrollmentsSnap = await db.collection('enrollments').where('enrollment_date', '>=', sixMonthsAgo).get();
    const revenueData = [];
    for (const eDoc of enrollmentsSnap.docs) {
      const e = eDoc.data();
      const month = e.enrollment_date.toDate().toISOString().slice(0, 7);
      const courseSnap = await db.collection('courses').doc(e.course_id.toString()).get();
      const price = courseSnap.data().price || 0;
      const index = revenueData.findIndex(r => r.month === month);
      if (index === -1) {
        revenueData.push({month, revenue: price});
      } else {
        revenueData[index].revenue += price;
      }
    }
    revenueData.sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      userGrowth,
      courseEnrollments: top10,
      revenueData
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
    const offset = (page - 1) * limit;
    const accountType = req.query.accountType;
    const status = req.query.status;
    const search = req.query.search;

    let query = db.collection('users');

    if (accountType && accountType !== 'all') {
      query = query.where('account_type', '==', accountType);
    }

    if (status && status !== 'all') {
      const isActive = status === 'active' ? true : false;
      query = query.where('is_active', '==', isActive);
    }

    if (search) {
      // Firestore doesn't support OR for multiple fields, so fetch all and filter
      const allUsersSnap = await query.get();
      let users = allUsersSnap.docs.map(d => d.data()).filter(u => u.first_name.includes(search) || u.last_name.includes(search) || u.email.includes(search));
      users.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());
      const totalUsers = users.length;
      users = users.slice(offset, offset + limit);
      const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page < Math.ceil(totalUsers / limit),
        hasPreviousPage: page > 1
      };
      res.json({users, pagination});
    } else {
      query = query.orderBy('created_at', 'desc').limit(limit).offset(offset);
      const usersSnap = await query.get();
      const users = usersSnap.docs.map(d => d.data());

      const totalSnap = await db.collection('users').get();
      const totalUsers = totalSnap.size;

      const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page < Math.ceil(totalUsers / limit),
        hasPreviousPage: page > 1
      };

      res.json({users, pagination});
    }
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/users/:id - Get a specific user
app.get('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const userSnap = await db.collection('users').where('id', '==', userId).limit(1).get();

    if (userSnap.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userSnap.docs[0].data());
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
    const existingSnap = await db.collection('users').where('email', '==', email).get();

    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const id = await getNextId('users');
    const userData = {
      id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      password_hash: hashedPassword,
      account_type: accountType || 'student',
      profile_image: null,
      company: company || null,
      website: website || null,
      bio: bio || null,
      is_active: isActive !== undefined ? isActive : true,
      email_verified: false,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    await db.collection('users').doc(id.toString()).set(userData);

    // Create user stats entry
    await db.collection('user_stats').doc(id.toString()).set({
      user_id: id,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: admin.firestore.Timestamp.now()
    });

    console.log('User created successfully by admin:', { userId: id, email });
    
    res.status(201).json({
      message: 'User created successfully',
      user: userData
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/users/:id - Update a user
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { firstName, lastName, email, phone, accountType, isActive, company, website, bio } = req.body;

    // Check if user exists
    const userSnap = await db.collection('users').where('id', '==', userId).limit(1).get();

    if (userSnap.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userSnap.docs[0].data();

    // Validate email if changed
    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }

      // Check if new email already exists
      const existingSnap = await db.collection('users').where('email', '==', email).get();

      if (!existingSnap.empty) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Update user
    await db.collection('users').doc(userId.toString()).update({
      first_name: firstName || user.first_name,
      last_name: lastName || user.last_name,
      email: email || user.email,
      phone: phone || user.phone,
      account_type: accountType || user.account_type,
      is_active: isActive !== undefined ? isActive : user.is_active,
      company: company || user.company,
      website: website || user.website,
      bio: bio || user.bio,
      updated_at: admin.firestore.Timestamp.now()
    });

    const updatedUserSnap = await db.collection('users').doc(userId.toString()).get();

    res.json({
      message: 'User updated successfully',
      user: updatedUserSnap.data()
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id - Delete a user
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const adminId = req.user.id;

    // Prevent admin from deleting themselves
    if (userId === adminId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Check if user exists
    const userSnap = await db.collection('users').where('id', '==', userId).limit(1).get();

    if (userSnap.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete
    await db.collection('users').doc(userId.toString()).update({
      is_active: false,
      updated_at: admin.firestore.Timestamp.now()
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
    const userId = parseInt(req.params.id);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user exists
    const userSnap = await db.collection('users').where('id', '==', userId).limit(1).get();

    if (userSnap.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password
    await db.collection('users').doc(userId.toString()).update({
      password_hash: hashedPassword,
      updated_at: admin.firestore.Timestamp.now()
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
    const id = await getNextId('payments');
    await db.collection('payments').doc(id.toString()).set({
      id,
      user_id,
      resource_id: resource_id || null,
      plan,
      amount,
      payment_method,
      transaction_id,
      proof_file: req.file.filename,
      status: 'pending',
      created_at: admin.firestore.Timestamp.now(),
      verified_at: null
    });

    res.json({ 
      message: 'Payment proof uploaded successfully', 
      paymentId: id
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
    for (const pDoc of paymentsSnap.docs) {
      const p = pDoc.data();
      const userSnap = await db.collection('users').doc(p.user_id.toString()).get();
      const u = userSnap.data();
      const resourceSnap = p.resource_id ? await db.collection('resources').doc(p.resource_id.toString()).get() : null;
      const r = resourceSnap ? resourceSnap.data() : null;
      payments.push({
        ...p,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        resource_title: r ? r.title : null
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

    await db.collection('payments').doc(id.toString()).update({
      status,
      verified_at: admin.firestore.Timestamp.now()
    });

    // If payment is approved, grant access to the resource
    if (status === 'approved') {
      const paymentSnap = await db.collection('payments').doc(id.toString()).get();
      const payment = paymentSnap.data();

      if (payment) {
        const { user_id, resource_id, plan } = payment;
        
        if (plan === 'individual' && resource_id) {
          // Grant access to specific resource
          const urId = await getNextId('user_resources');
          await db.collection('user_resources').doc(urId.toString()).set({
            id: urId,
            user_id,
            resource_id
          });
        } else if (plan === 'premium') {
          // Upgrade user to premium
          await db.collection('users').doc(user_id.toString()).update({
            subscription_plan: "premium"
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

// ==================== ADMIN ENROLLMENT MANAGEMENT ENDPOINTS ====================

// GET all enrollments (admin only)
app.get('/api/admin/enrollments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const enrollmentsSnap = await db.collection('enrollments').orderBy('enrollment_date', 'desc').get();

    const enrollments = [];
    for (const eDoc of enrollmentsSnap.docs) {
      const e = eDoc.data();
      const userSnap = await db.collection('users').doc(e.user_id.toString()).get();
      const u = userSnap.data();
      const courseSnap = await db.collection('courses').doc(e.course_id.toString()).get();
      const c = courseSnap.data();
      enrollments.push({
        id: e.id,
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

    await db.collection('enrollments').doc(id.toString()).update({
      status,
      progress,
      completion_date: completion_date ? new Date(completion_date) : null
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

    await db.collection('enrollments').doc(id.toString()).delete();

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

    const courses = coursesSnap.docs.map(d => d.data());

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

    const id = await getNextId('courses');
    await db.collection('courses').doc(id.toString()).set({
      id,
      title,
      description,
      instructor_name,
      duration_weeks,
      difficulty_level,
      category,
      price,
      thumbnail: null,
      is_active: is_active || true,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    });

    res.status(201).json({ 
      message: 'Course created successfully',
      courseId: id
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

    await db.collection('courses').doc(id.toString()).update({
      title,
      description,
      instructor_name,
      duration_weeks,
      difficulty_level,
      category,
      price,
      is_active,
      updated_at: admin.firestore.Timestamp.now()
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
    const enrollmentsSnap = await db.collection('enrollments').where('course_id', '==', parseInt(id)).get();
    if (!enrollmentsSnap.empty) {
      return res.status(400).json({ error: 'Cannot delete course with active enrollments' });
    }

    await db.collection('courses').doc(id.toString()).delete();

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

    await db.collection('courses').doc(id.toString()).update({
      thumbnail: thumbnailPath,
      updated_at: admin.firestore.Timestamp.now()
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
      const resource = doc.data();
      return {
        ...resource,
        allowed_account_types: JSON.parse(resource.allowed_account_types || '[]')
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

    const id = await getNextId('resources');
    await db.collection('resources').doc(id.toString()).set({
      id,
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
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    });

    res.status(201).json({ 
      message: 'Resource created successfully',
      resourceId: id
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

    await db.collection('resources').doc(id.toString()).update({
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
      updated_at: admin.firestore.Timestamp.now()
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

    await db.collection('resources').doc(id.toString()).delete();

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
    for (const aDoc of assignmentsSnap.docs) {
      const a = aDoc.data();
      const courseSnap = await db.collection('courses').doc(a.course_id.toString()).get();
      const c = courseSnap.data();
      const submissionsSnap = await db.collection('assignment_submissions').where('assignment_id', '==', a.id).get();
      const submissionCount = submissionsSnap.size;
      const gradedCount = submissionsSnap.docs.filter(d => d.data().status === 'graded').length;

      assignments.push({
        id: a.id,
        course_id: a.course_id,
        title: a.title,
        description: a.description,
        due_date: a.due_date,
        max_points: a.max_points,
        created_at: a.created_at,
        course_title: c.title,
        course_category: c.category,
        submission_count: submissionCount,
        graded_count: gradedCount
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

    const id = await getNextId('assignments');
    await db.collection('assignments').doc(id.toString()).set({
      id,
      title,
      course_id: parseInt(course_id),
      description,
      due_date: new Date(due_date),
      max_points,
      created_at: admin.firestore.Timestamp.now()
    });

    res.status(201).json({ 
      message: 'Assignment created successfully',
      assignmentId: id
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

    await db.collection('assignments').doc(id.toString()).update({
      title,
      course_id: parseInt(course_id),
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

    const submissionsSnap = await db.collection('assignment_submissions').where('assignment_id', '==', parseInt(id)).get();
    if (!submissionsSnap.empty) {
      return res.status(400).json({ error: 'Cannot delete assignment with existing submissions' });
    }

    await db.collection('assignments').doc(id.toString()).delete();

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// ==================== ADMIN CONTACT MESSAGES ENDPOINTS ====================

// Get contact messages (admin only)
app.get('/api/admin/contact-messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const messagesSnap = await db.collection('contact_messages').orderBy('created_at', 'desc').get();

    let messages = messagesSnap.docs.map(d => d.data());
    const totalMessages = messages.length;
    messages = messages.slice(offset, offset + limit);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages,
      hasNextPage: page < Math.ceil(totalMessages / limit),
      hasPreviousPage: page > 1
    };

    res.json({
      messages,
      pagination
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

    await db.collection('contact_messages').doc(id.toString()).update({
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

    await db.collection('contact_messages').doc(id.toString()).delete();

    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ error: 'Failed to delete contact message' });
  }
});

// ==================== ADMIN SERVICE REQUEST MANAGEMENT PAGE ====================

// GET service requests (admin only)
app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requestsSnap = await db.collection('service_requests').orderBy('created_at', 'desc').get();

    const requests = [];
    for (const srDoc of requestsSnap.docs) {
      const sr = srDoc.data();
      const scSnap = await db.collection('service_subcategories').doc(sr.subcategory_id.toString()).get();
      const sc = scSnap.data();
      const userSnap = await db.collection('users').doc(sr.user_id.toString()).get();
      const u = userSnap.data();
      requests.push({
        id: sr.id,
        name: sr.full_name,
        service: sc.name,
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

// PUT update service request (admin only)
app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, project_details, budget_range, timeline, additional_requirements } = req.body;

    await db.collection('service_requests').doc(id.toString()).update({
      status,
      project_details,
      budget_range,
      timeline,
      additional_requirements,
      updated_at: admin.firestore.Timestamp.now()
    });

    res.json({ message: 'Service request updated successfully' });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ error: 'Failed to update service request', details: error.message });
  }
});

// DELETE service request (admin only)
app.delete('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection('service_requests').doc(id.toString()).delete();

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