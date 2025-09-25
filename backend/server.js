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

const app = express();
const port = process.env.PORT || 5000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'startup-dbs-1.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Create necessary directories
const assignmentsDir = path.join(__dirname, 'uploads', 'assignments');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });

const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const paymentsDir = path.join(__dirname, 'uploads', 'payments');
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

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

// Social media upload configuration
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

// ======== AUTHENTICATION MIDDLEWARE ========

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
    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('email', '==', email).get();

    if (!existingUser.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user document
    const newUserRef = usersRef.doc();
    const userData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      password_hash: hashedPassword,
      account_type: accountType || 'student',
      is_active: true,
      email_verified: false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await newUserRef.set(userData);

    // Create user stats entry
    await db.collection('user_stats').doc(newUserRef.id).set({
      user_id: newUserRef.id,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('User registered successfully:', { userId: newUserRef.id, email });
    res.status(201).json({
      message: 'User registered successfully',
      userId: newUserRef.id
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
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('email', '==', email).where('is_active', '==', true).get();

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
        userId: user.id,
        email: user.email,
        accountType: user.account_type
      },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // Update last login timestamp
    await userDoc.ref.update({
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
    const userDoc = await db.collection('users').doc(userId).get();
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
      await db.collection('user_stats').doc(userId).set({
        user_id: userId,
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        last_activity: admin.firestore.FieldValue.serverTimestamp()
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

// ==================== SOCIAL FEED ROUTES ====================

// GET All Posts (with Pagination, Likes, Comments, etc.)
app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  try {
    // Get user's connections for visibility filtering
    const connectionsSnapshot = await db.collection('user_connections')
      .where('status', '==', 'accepted')
      .where(admin.firestore.Filter.or(
        admin.firestore.Filter.where('user_id_1', '==', userId),
        admin.firestore.Filter.where('user_id_2', '==', userId)
      ))
      .get();

    const connectionIds = new Set();
    connectionsSnapshot.forEach(doc => {
      const data = doc.data();
      connectionIds.add(data.user_id_1 === userId ? data.user_id_2 : data.user_id_1);
    });

    // Get posts
    let postsQuery = db.collection('social_activities')
      .where('activity_type', '==', 'post')
      .orderBy('created_at', 'desc');

    const postsSnapshot = await postsQuery.get();
    
    // Filter posts based on visibility
    const allPosts = [];
    for (const doc of postsSnapshot.docs) {
      const post = { id: doc.id, ...doc.data() };
      
      if (post.visibility === 'public' || 
          (post.visibility === 'private' && post.user_id === userId) ||
          (post.visibility === 'connections' && (post.user_id === userId || connectionIds.has(post.user_id)))) {
        
        // Get user info
        const userDoc = await db.collection('users').doc(post.user_id).get();
        const userData = userDoc.data();
        
        // Get likes count
        const likesSnapshot = await db.collection('social_activities')
          .where('activity_type', '==', 'like')
          .where('target_id', '==', doc.id)
          .get();
        
        // Get comments count
        const commentsSnapshot = await db.collection('social_activities')
          .where('activity_type', '==', 'comment')
          .where('target_id', '==', doc.id)
          .get();
        
        // Check if user has liked
        const hasLikedSnapshot = await db.collection('social_activities')
          .where('activity_type', '==', 'like')
          .where('target_id', '==', doc.id)
          .where('user_id', '==', userId)
          .get();
        
        // Check if user has bookmarked
        const hasBookmarkedSnapshot = await db.collection('social_activities')
          .where('activity_type', '==', 'bookmark')
          .where('target_id', '==', doc.id)
          .where('user_id', '==', userId)
          .get();
        
        // Get comments
        const comments = [];
        for (const commentDoc of commentsSnapshot.docs) {
          const comment = { id: commentDoc.id, ...commentDoc.data() };
          const commentUserDoc = await db.collection('users').doc(comment.user_id).get();
          const commentUserData = commentUserDoc.data();
          
          comments.push({
            ...comment,
            user: {
              id: comment.user_id,
              first_name: commentUserData.first_name,
              last_name: commentUserData.last_name,
              profile_image: getFullImageUrl(req, commentUserData.profile_image),
              account_type: commentUserData.account_type
            }
          });
        }
        
        allPosts.push({
          ...post,
          likes: likesSnapshot.size,
          comment_count: commentsSnapshot.size,
          has_liked: !hasLikedSnapshot.empty,
          has_bookmarked: !hasBookmarkedSnapshot.empty,
          image_url: getFullImageUrl(req, post.image_url),
          user: {
            id: post.user_id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            profile_image: getFullImageUrl(req, userData.profile_image),
            account_type: userData.account_type
          },
          comments: comments
        });
      }
    }

    // Paginate results
    const paginatedPosts = allPosts.slice(offset, offset + limit);
    const totalPosts = allPosts.length;
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts: paginatedPosts,
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

      const postRef = await db.collection('social_activities').add(postData);
      
      // Get user data
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      res.status(201).json({
        id: postRef.id,
        ...postData,
        has_liked: false,
        has_bookmarked: false,
        likes: 0,
        comment_count: 0,
        image_url: getFullImageUrl(req, imageUrl),
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

    if (postDoc.data().user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    await postDoc.ref.update({
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

    // Delete all related activities (comments, likes, bookmarks)
    const batch = db.batch();
    
    // Delete the post
    batch.delete(postDoc.ref);
    
    // Delete related activities
    const relatedActivities = await db.collection('social_activities')
      .where('target_id', '==', id)
      .get();
    
    relatedActivities.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();

    // Delete image if exists
    if (postData.image_url) {
      const imagePath = path.join(__dirname, 'public', postData.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
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

    const commentRef = await db.collection('social_activities').add(commentData);
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    res.status(201).json({
      id: commentRef.id,
      ...commentData,
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
      return res.status(400).json({ error: 'Already liked' });
    }

    await db.collection('social_activities').add({
      user_id: userId,
      activity_type: 'like',
      target_id: targetId,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

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
    const likeQuery = await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'like')
      .where('target_id', '==', targetId)
      .get();

    if (likeQuery.empty) {
      return res.status(404).json({ error: 'Like not found' });
    }

    const batch = db.batch();
    likeQuery.forEach(doc => {
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
      return res.status(400).json({ error: 'Already bookmarked' });
    }

    await db.collection('social_activities').add({
      user_id: userId,
      activity_type: 'bookmark',
      target_id: targetId,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

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
    const bookmarkQuery = await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'bookmark')
      .where('target_id', '==', targetId)
      .get();

    if (bookmarkQuery.empty) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    const batch = db.batch();
    bookmarkQuery.forEach(doc => {
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
    const postRef = db.collection('social_activities').doc(postId);
    await postRef.update({
      share_count: admin.firestore.FieldValue.increment(1)
    });

    res.json({ message: 'Share tracked.' });
  } catch (error) {
    console.error('Error tracking share:', error);
    res.status(500).json({ error: 'Failed to track share.' });
  }
});

// ==================== STUDENT DASHBOARD ROUTES ====================

// Get user's enrollments
app.get('/api/users/:userId/enrollments', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (parseInt(req.params.userId, 10) !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own enrollment data.' });
  }

  try {
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .orderBy('enrollment_date', 'desc')
      .get();

    const enrollments = [];
    for (const doc of enrollmentsSnapshot.docs) {
      const enrollmentData = { id: doc.id, ...doc.data() };
      
      // Get course details
      const courseDoc = await db.collection('courses').doc(enrollmentData.course_id).get();
      if (courseDoc.exists) {
        const courseData = courseDoc.data();
        enrollments.push({
          id: enrollmentData.id,
          progress: enrollmentData.progress,
          status: enrollmentData.status,
          enrollment_date: enrollmentData.enrollment_date,
          completion_date: enrollmentData.completion_date,
          course_id: enrollmentData.course_id,
          courseTitle: courseData.title,
          instructorName: courseData.instructor_name,
          durationWeeks: courseData.duration_weeks
        });
      }
    }

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    res.status(500).json({ error: 'Internal server error while fetching enrolled courses.' });
  }
});

// Get user's internship submissions
app.get('/api/users/:userId/internship-submissions', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (parseInt(req.params.userId, 10) !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own internship submissions.' });
  }

  try {
    const submissionsSnapshot = await db.collection('internship_submissions')
      .where('user_id', '==', userId)
      .orderBy('submitted_at', 'desc')
      .get();

    const applications = [];
    for (const doc of submissionsSnapshot.docs) {
      const submissionData = { id: doc.id, ...doc.data() };
      
      // Get internship details
      const internshipDoc = await db.collection('internships').doc(submissionData.internship_id).get();
      if (internshipDoc.exists) {
        const internshipData = internshipDoc.data();
        applications.push({
          id: submissionData.id,
          internship_id: submissionData.internship_id,
          applicationStatus: submissionData.status,
          applicationDate: submissionData.submitted_at,
          internshipTitle: internshipData.title,
          companyName: internshipData.company
        });
      }
    }

    res.json(applications);
  } catch (error) {
    console.error('Error fetching internship applications:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// ==================== PROFESSIONAL DASHBOARD ROUTES ====================

// Get services
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const servicesSnapshot = await db.collection('services')
      .where('is_active', '==', true)
      .orderBy('popular', 'desc')
      .orderBy('name', 'asc')
      .get();

    const services = [];
    for (const doc of servicesSnapshot.docs) {
      const serviceData = { id: doc.id, ...doc.data() };
      
      // Get category details
      const categoryDoc = await db.collection('service_categories').doc(serviceData.category_id).get();
      if (categoryDoc.exists) {
        const categoryData = categoryDoc.data();
        services.push({
          ...serviceData,
          categoryName: categoryData.name,
          features: serviceData.features || []
        });
      }
    }

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Failed to fetch available services.', error: error.message });
  }
});

// Get user's service requests
app.get('/api/users/:userId/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (parseInt(req.params.userId, 10) !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
  }

  try {
    const requestsSnapshot = await db.collection('service_requests')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const requests = [];
    for (const doc of requestsSnapshot.docs) {
      const requestData = { id: doc.id, ...doc.data() };
      
      // Get category details
      const categoryDoc = await db.collection('service_categories').doc(requestData.subcategory_id).get();
      if (categoryDoc.exists) {
        const categoryData = categoryDoc.data();
        requests.push({
          id: requestData.id,
          userId: requestData.user_id,
          categoryId: requestData.subcategory_id,
          categoryName: categoryData.name,
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
          requestDate: requestData.created_at,
          updatedAt: requestData.updated_at
        });
      }
    }

    res.json(requests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ message: 'Failed to fetch your service requests.', error: error.message });
  }
});

// Submit service request
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

  if (!userId || !categoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
    return res.status(400).json({ message: 'Missing required fields for service request.' });
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

    const requestRef = await db.collection('service_requests').add(requestData);

    res.status(201).json({ message: 'Service request submitted successfully!', id: requestRef.id });
  } catch (error) {
    console.error('Error submitting service request:', error);
    res.status(500).json({ message: 'Failed to submit service request.', error: error.message });
  }
});

// ==================== CALENDAR ROUTES ====================

// Get calendar events
app.get('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get enrolled courses
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .get();

    const courseEvents = [];
    const assignmentEvents = [];

    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data();
      
      // Get course details
      const courseDoc = await db.collection('courses').doc(enrollment.course_id).get();
      if (courseDoc.exists) {
        const course = courseDoc.data();
        
        // Add course start event
        courseEvents.push({
          id: `course-${courseDoc.id}`,
          title: `Course: ${course.title}`,
          description: course.description || 'Course enrollment',
          date: course.created_at,
          type: 'course_start',
          course: {
            id: courseDoc.id,
            title: course.title,
            category: course.category
          },
          color: 'blue'
        });

        // Get assignments for this course
        const assignmentsSnapshot = await db.collection('assignments')
          .where('course_id', '==', courseDoc.id)
          .get();

        for (const assignmentDoc of assignmentsSnapshot.docs) {
          const assignment = assignmentDoc.data();
          
          // Check submission status
          const submissionSnapshot = await db.collection('assignment_submissions')
            .where('assignment_id', '==', assignmentDoc.id)
            .where('user_id', '==', userId)
            .get();

          let status = 'pending';
          if (!submissionSnapshot.empty) {
            const submission = submissionSnapshot.docs[0].data();
            status = submission.status === 'graded' ? 'completed' : 'pending';
          } else if (new Date(assignment.due_date) < new Date()) {
            status = 'overdue';
          }

          assignmentEvents.push({
            id: `assignment-${assignmentDoc.id}`,
            title: assignment.title,
            description: assignment.description || 'Assignment due',
            date: assignment.due_date,
            type: 'assignment',
            course: {
              id: courseDoc.id,
              title: course.title,
              category: course.category
            },
            status: status,
                        color: status === 'completed' ? 'green' : status === 'overdue' ? 'red' : 'orange'
          });
        }
      }
    }

    // Get custom calendar events
    const customEventsSnapshot = await db.collection('custom_calendar_events')
      .where('user_id', '==', userId)
      .where('event_date', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .orderBy('event_date', 'asc')
      .get();

    const customEvents = customEventsSnapshot.docs.map(doc => ({
      id: `custom-${doc.id}`,
      title: doc.data().title,
      description: doc.data().description || '',
      date: doc.data().event_date,
      time: doc.data().event_time,
      type: doc.data().event_type || 'custom',
      color: 'purple'
    }));

    const allEvents = [...courseEvents, ...assignmentEvents, ...customEvents];
    res.json(allEvents);

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// Get events for specific date
app.get('/api/calendar/events/date/:date', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const targetDate = new Date(date);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    // Get assignments due on this date
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .get();

    const events = [];

    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data();
      
      const assignmentsSnapshot = await db.collection('assignments')
        .where('course_id', '==', enrollment.course_id)
        .where('due_date', '>=', targetDate)
        .where('due_date', '<', nextDate)
        .get();

      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignment = assignmentDoc.data();
        const courseDoc = await db.collection('courses').doc(enrollment.course_id).get();
        const course = courseDoc.data();

        events.push({
          id: `assignment-${assignmentDoc.id}`,
          title: assignment.title,
          description: assignment.description || '',
          date: assignment.due_date,
          type: 'assignment',
          course: {
            id: courseDoc.id,
            title: course.title,
            category: course.category
          },
          status: 'pending'
        });
      }
    }

    // Get custom events for this date
    const customEventsSnapshot = await db.collection('custom_calendar_events')
      .where('user_id', '==', userId)
      .where('event_date', '>=', targetDate)
      .where('event_date', '<', nextDate)
      .get();

    customEventsSnapshot.forEach(doc => {
      const event = doc.data();
      events.push({
        id: `custom-${doc.id}`,
        title: event.title,
        description: event.description || '',
        date: event.event_date,
        time: event.event_time,
        type: event.event_type || 'custom',
        status: 'pending'
      });
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching events for date:', error);
    res.status(500).json({ error: 'Failed to fetch events for specified date' });
  }
});

// Get upcoming events
app.get('/api/calendar/upcoming', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcomingEvents = [];

    // Get assignments due in next 7 days
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .get();

    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data();
      
      const assignmentsSnapshot = await db.collection('assignments')
        .where('course_id', '==', enrollment.course_id)
        .where('due_date', '>=', today)
        .where('due_date', '<=', nextWeek)
        .orderBy('due_date', 'asc')
        .limit(10)
        .get();

      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignment = assignmentDoc.data();
        const courseDoc = await db.collection('courses').doc(enrollment.course_id).get();
        const course = courseDoc.data();

        upcomingEvents.push({
          id: `assignment-${assignmentDoc.id}`,
          title: assignment.title,
          description: assignment.description || '',
          date: assignment.due_date,
          type: 'assignment',
          course: {
            id: courseDoc.id,
            title: course.title,
            category: course.category
          },
          status: 'pending',
          color: 'orange'
        });
      }
    }

    // Get custom events
    const customEventsSnapshot = await db.collection('custom_calendar_events')
      .where('user_id', '==', userId)
      .where('event_date', '>=', today)
      .where('event_date', '<=', nextWeek)
      .orderBy('event_date', 'asc')
      .limit(5)
      .get();

    customEventsSnapshot.forEach(doc => {
      const event = doc.data();
      upcomingEvents.push({
        id: `custom-${doc.id}`,
        title: event.title,
        description: event.description || '',
        date: event.event_date,
        time: event.event_time,
        type: event.event_type || 'custom',
        status: 'pending',
        color: 'purple'
      });
    });

    res.json(upcomingEvents);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// Get calendar stats
app.get('/api/calendar/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();

    let stats = {
      pending_assignments: 0,
      completed_assignments: 0,
      overdue_assignments: 0,
      active_courses: 0,
      completed_courses: 0
    };

    // Get enrollment stats
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .get();

    enrollmentsSnapshot.forEach(doc => {
      const enrollment = doc.data();
      if (enrollment.status === 'active') {
        stats.active_courses++;
      } else if (enrollment.status === 'completed') {
        stats.completed_courses++;
      }
    });

    // Get assignment stats
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data();
      
      const assignmentsSnapshot = await db.collection('assignments')
        .where('course_id', '==', enrollment.course_id)
        .get();

      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignment = assignmentDoc.data();
        
        const submissionSnapshot = await db.collection('assignment_submissions')
          .where('assignment_id', '==', assignmentDoc.id)
          .where('user_id', '==', userId)
          .get();

        if (!submissionSnapshot.empty) {
          const submission = submissionSnapshot.docs[0].data();
          if (submission.status === 'graded') {
            stats.completed_assignments++;
          }
        } else if (new Date(assignment.due_date) < today) {
          stats.overdue_assignments++;
        } else {
          stats.pending_assignments++;
        }
      }
    }

    res.json({
      ...stats,
      total_assignments: stats.pending_assignments + stats.completed_assignments + stats.overdue_assignments
    });
  } catch (error) {
    console.error('Error fetching calendar stats:', error);
    res.status(500).json({ error: 'Failed to fetch calendar statistics' });
  }
});

// Create custom calendar event
app.post('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, date, time, type = 'custom' } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const eventData = {
      user_id: userId,
      title: title,
      description: description || '',
      event_date: new Date(date),
      event_time: time || null,
      event_type: type,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const eventRef = await db.collection('custom_calendar_events').add(eventData);

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

// Update calendar event
app.put('/api/calendar/events/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, date, time, type } = req.body;

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists || eventDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    const updateData = {
      title: title,
      description: description || '',
      event_date: new Date(date),
      event_time: time || null,
      event_type: type || 'custom',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await eventDoc.ref.update(updateData);

    res.json({ message: 'Calendar event updated successfully' });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

// Delete calendar event
app.delete('/api/calendar/events/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists || eventDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    await eventDoc.ref.delete();

    res.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

// ==================== COURSE ENROLLMENT ROUTES ====================

// Submit enrollment request
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

      const requestRef = await db.collection('course_enroll_requests').add(enrollRequestData);

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

// Get all active courses
app.get('/api/courses', async (req, res) => {
  try {
    const coursesSnapshot = await db.collection('courses')
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

    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .orderBy('enrollment_date', 'desc')
      .get();

    const enrollments = [];
    for (const doc of enrollmentsSnapshot.docs) {
      const enrollmentData = { id: doc.id, ...doc.data() };
      
      const courseDoc = await db.collection('courses').doc(enrollmentData.course_id).get();
      if (courseDoc.exists) {
        const courseData = courseDoc.data();
        enrollments.push({
          id: enrollmentData.id,
          userId: enrollmentData.user_id,
          courseId: enrollmentData.course_id,
          progress: enrollmentData.progress,
          enrollmentDate: enrollmentData.enrollment_date,
          completionDate: enrollmentData.completion_date,
          status: enrollmentData.status,
          course: {
            id: courseDoc.id,
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
    await db.collection('enrollments').add({
      user_id: userId,
      course_id: courseId,
      enrollment_date: admin.firestore.FieldValue.serverTimestamp(),
      progress: 0,
      status: 'active'
    });

    // Update user stats
    const userStatsRef = db.collection('user_stats').doc(userId);
    await userStatsRef.update({
      courses_enrolled: admin.firestore.FieldValue.increment(1)
    });

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
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .get();

    const assignments = [];
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data();
      
      // Get assignments for each enrolled course
      const assignmentsSnapshot = await db.collection('assignments')
        .where('course_id', '==', enrollment.course_id)
        .orderBy('due_date', 'asc')
        .get();

      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignment = { id: assignmentDoc.id, ...assignmentDoc.data() };
        
        // Get course details
        const courseDoc = await db.collection('courses').doc(enrollment.course_id).get();
        const course = courseDoc.data();
        
        // Check for submission
        const submissionSnapshot = await db.collection('assignment_submissions')
          .where('assignment_id', '==', assignmentDoc.id)
          .where('user_id', '==', userId)
          .get();

        let submission = null;
        if (!submissionSnapshot.empty) {
          const submissionDoc = submissionSnapshot.docs[0];
          submission = { id: submissionDoc.id, ...submissionDoc.data() };
        }

        assignments.push({
          id: assignment.id,
          course_id: assignment.course_id,
          title: assignment.title,
          description: assignment.description,
          due_date: assignment.due_date,
          max_points: assignment.max_points,
          created_at: assignment.created_at,
          course: {
            id: enrollment.course_id,
            title: course.title,
            category: course.category
          },
          submission: submission
        });
      }
    }

    res.json(assignments);
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
    const assignmentDoc = await db.collection('assignments').doc(assignment_id).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentDoc.data();
    
    // Check enrollment
    const enrollmentSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('course_id', '==', assignment.course_id)
      .where('status', '==', 'active')
      .get();

    if (enrollmentSnapshot.empty) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    // Check if already submitted
    const existingSubmission = await db.collection('assignment_submissions')
      .where('assignment_id', '==', assignment_id)
      .where('user_id', '==', userId)
      .get();

    if (!existingSubmission.empty) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }

    // Create submission
    const submissionData = {
      assignment_id: assignment_id,
      user_id: userId,
      content: content || '',
      file_path: file_path,
      submitted_at: admin.firestore.FieldValue.serverTimestamp(),
      status: 'submitted'
    };

    const submissionRef = await db.collection('assignment_submissions').add(submissionData);

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

// Download submission file
app.get('/api/assignments/download-submission/:id', authenticateToken, async (req, res) => {
  try {
    const submissionId = req.params.id;
    const userId = req.user.id;

    const submissionDoc = await db.collection('assignment_submissions').doc(submissionId).get();
    
    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = submissionDoc.data();

    // Check permissions
    if (submission.user_id !== userId && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!submission.file_path) {
      return res.status(404).json({ error: 'No file attached to this submission' });
    }

    const filePath = path.join(__dirname, 'uploads', 'assignments', submission.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${submission.file_path}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading submission:', error);
    res.status(500).json({ error: 'Failed to download submission' });
  }
});

// ==================== RESOURCES ROUTES ====================

// Get resources for current user
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const accountType = req.user.account_type;
    
    // Get resources allowed for this account type
    const resourcesSnapshot = await db.collection('resources')
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

// Download resource
app.get('/api/resources/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const accountType = req.user.account_type;
    
    const resourceDoc = await db.collection('resources').doc(id).get();
    
    if (!resourceDoc.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    const resource = resourceDoc.data();
    
    // Check access
    if (!resource.allowed_account_types.includes(accountType)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if premium
    if (resource.is_premium && !['professional', 'business', 'agency', 'admin'].includes(accountType)) {
      return res.status(403).json({ error: 'Premium resource requires upgraded account' });
    }
    
    // For demo purposes, return a simple text file
    res.setHeader('Content-Disposition', `attachment; filename="${resource.title}.txt"`);
    res.setHeader('Content-Type', 'text/plain');
    
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

// Get user's certificates
app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const certificatesSnapshot = await db.collection('certificates')
      .where('user_id', '==', userId)
      .orderBy('issued_date', 'desc')
      .get();

    const certificates = [];
    for (const doc of certificatesSnapshot.docs) {
      const certData = { id: doc.id, ...doc.data() };
      
      // Get course details
      const courseDoc = await db.collection('courses').doc(certData.course_id).get();
      if (courseDoc.exists) {
        const courseData = courseDoc.data();
        
        // Get enrollment details
        const enrollmentSnapshot = await db.collection('enrollments')
          .where('user_id', '==', userId)
          .where('course_id', '==', certData.course_id)
          .get();
        
        let enrollmentData = {};
        if (!enrollmentSnapshot.empty) {
          enrollmentData = enrollmentSnapshot.docs[0].data();
        }
        
        // Calculate final grade from assignments
        const assignmentsSnapshot = await db.collection('assignments')
          .where('course_id', '==', certData.course_id)
          .get();
        
        let totalGrade = 0;
        let gradedCount = 0;
        
        for (const assignmentDoc of assignmentsSnapshot.docs) {
          const submissionSnapshot = await db.collection('assignment_submissions')
            .where('assignment_id', '==', assignmentDoc.id)
            .where('user_id', '==', userId)
            .where('status', '==', 'graded')
            .get();
          
          if (!submissionSnapshot.empty) {
            const submission = submissionSnapshot.docs[0].data();
            if (submission.grade) {
              totalGrade += submission.grade;
              gradedCount++;
            }
          }
        }
        
        const finalGrade = gradedCount > 0 ? Math.round(totalGrade / gradedCount) : 0;
        
        certificates.push({
          id: certData.id,
          userId: certData.user_id,
          courseId: certData.course_id,
          certificateUrl: certData.certificate_url,
          issuedDate: certData.issued_date,
          course: {
            id: courseDoc.id,
            title: courseData.title,
            description: courseData.description,
            instructorName: courseData.instructor_name,
            category: courseData.category,
            difficultyLevel: courseData.difficulty_level
          },
          enrollment: {
            completionDate: enrollmentData.completion_date,
            finalGrade: finalGrade,
            status: enrollmentData.status
          }
        });
      }
    }

    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Download certificate
app.get('/api/certificates/:certificateId/download', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;

    const certificateDoc = await db.collection('certificates').doc(certificateId).get();
    
    if (!certificateDoc.exists || certificateDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Certificate not found' });
        }

    const certificate = certificateDoc.data();
    
    // Get course and user details
    const courseDoc = await db.collection('courses').doc(certificate.course_id).get();
    const userDoc = await db.collection('users').doc(userId).get();
    
    const course = courseDoc.data();
    const user = userDoc.data();

    if (certificate.certificate_url) {
      return res.redirect(certificate.certificate_url);
    }

    // Generate certificate data
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

// ==================== INTERNSHIPS ROUTES ====================

// Get all internships
app.get('/api/internships', async (req, res) => {
  try {
    const internshipsSnapshot = await db.collection('internships')
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

// Get user's internship applications
app.get('/api/user/internship-applications', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const applicationsSnapshot = await db.collection('internship_submissions')
      .where('user_id', '==', userId)
      .orderBy('submitted_at', 'desc')
      .get();

    const applications = [];
    for (const doc of applicationsSnapshot.docs) {
      const submissionData = { submission_id: doc.id, ...doc.data() };
      
      // Get internship details
      const internshipDoc = await db.collection('internships').doc(submissionData.internship_id).get();
      if (internshipDoc.exists) {
        const internshipData = internshipDoc.data();
        applications.push({
          ...submissionData,
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
          internship_posted_at: internshipData.posted_at
        });
      }
    }

    res.json(applications);
  } catch (error) {
    console.error('Error fetching internship applications:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// Apply for internship
app.post('/api/internships/:id/apply', authenticateToken, async (req, res) => {
  const { id: internshipId } = req.params;
  const { full_name, email, phone, resume_url, cover_letter } = req.body;
  const userId = req.user.id;

  if (!full_name || !email || !resume_url) {
    return res.status(400).json({ message: 'Full name, email, and resume link are required.' });
  }

  try {
    // Use Firestore transaction
    await db.runTransaction(async (transaction) => {
      const internshipRef = db.collection('internships').doc(internshipId);
      const internshipDoc = await transaction.get(internshipRef);

      if (!internshipDoc.exists) {
        throw new Error('Internship not found.');
      }

      const internshipData = internshipDoc.data();
      if (internshipData.spots_available <= 0) {
        throw new Error('No available spots left for this internship.');
      }

      // Check if already applied
      const existingApplication = await db.collection('internship_submissions')
        .where('internship_id', '==', internshipId)
        .where('user_id', '==', userId)
        .get();

      if (!existingApplication.empty) {
        throw new Error('You have already applied for this internship.');
      }

      // Create submission
      const submissionData = {
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

      await db.collection('internship_submissions').add(submissionData);

      // Update internship counts
      transaction.update(internshipRef, {
        spots_available: admin.firestore.FieldValue.increment(-1),
        applications_count: admin.firestore.FieldValue.increment(1)
      });
    });

    res.status(201).json({ message: 'Internship application submitted successfully!' });

  } catch (error) {
    console.error('Error submitting internship application:', error);
    res.status(500).json({ message: error.message || 'Internal server error during application submission.' });
  }
});

// ==================== SERVICES ROUTES ====================

// Get service categories
app.get('/api/services/categories', async (req, res) => {
  try {
    const categoriesSnapshot = await db.collection('service_categories')
      .where('is_active', '==', true)
      .orderBy('name')
      .get();

    const categoriesWithSubs = [];
    for (const categoryDoc of categoriesSnapshot.docs) {
      const category = { id: categoryDoc.id, ...categoryDoc.data() };
      
      // Get subcategories
      const subcategoriesSnapshot = await db.collection('service_subcategories')
        .where('category_id', '==', categoryDoc.id)
        .where('is_active', '==', true)
        .orderBy('name')
        .get();

      const subcategories = subcategoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        categoryId: doc.data().category_id,
        name: doc.data().name,
        description: doc.data().description,
        basePrice: doc.data().base_price
      }));

      categoriesWithSubs.push({
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        subcategories: subcategories
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

    if (!subcategoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check if subcategory exists
    const subcategoryDoc = await db.collection('service_subcategories').doc(subcategoryId).get();

    if (!subcategoryDoc.exists || !subcategoryDoc.data().is_active) {
      return res.status(404).json({ error: 'Service subcategory not found' });
    }

    // Create service request
    const requestData = {
      user_id: userId,
      subcategory_id: subcategoryId,
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

    const requestRef = await db.collection('service_requests').add(requestData);

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

    const requestsSnapshot = await db.collection('service_requests')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const requests = [];
    for (const doc of requestsSnapshot.docs) {
      const request = { id: doc.id, ...doc.data() };
      
      // Get subcategory and category details
      const subcategoryDoc = await db.collection('service_subcategories').doc(request.subcategory_id).get();
      if (subcategoryDoc.exists) {
        const subcategory = subcategoryDoc.data();
        const categoryDoc = await db.collection('service_categories').doc(subcategory.category_id).get();
        const category = categoryDoc.data();

        requests.push({
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
          updatedAt: request.updated_at,
          categoryName: category.name,
          subcategoryName: subcategory.name
        });
      }
    }

    res.json(requests);

  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get counts from various collections
    const [
      usersSnapshot,
      coursesSnapshot,
      enrollmentsSnapshot,
      contactsSnapshot,
      serviceRequestsSnapshot
    ] = await Promise.all([
      db.collection('users').where('is_active', '==', true).get(),
      db.collection('courses').where('is_active', '==', true).get(),
      db.collection('enrollments').get(),
      db.collection('contact_messages')
        .where('created_at', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .get(),
      db.collection('service_requests').where('status', '==', 'pending').get()
    ]);

    // Calculate total revenue
    let totalRevenue = 0;
    const completedEnrollments = await db.collection('enrollments')
      .where('status', '==', 'completed')
      .get();

    for (const enrollmentDoc of completedEnrollments.docs) {
      const enrollment = enrollmentDoc.data();
      const courseDoc = await db.collection('courses').doc(enrollment.course_id).get();
      if (courseDoc.exists) {
        totalRevenue += parseFloat(courseDoc.data().price || 0);
      }
    }

    res.json({
      totalUsers: usersSnapshot.size,
      totalCourses: coursesSnapshot.size,
      totalEnrollments: enrollmentsSnapshot.size,
      totalRevenue: totalRevenue,
      pendingContacts: contactsSnapshot.size,
      pendingServiceRequests: serviceRequestsSnapshot.size
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

// Recent Users
app.get('/api/admin/recent-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users')
      .where('is_active', '==', true)
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();

    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        account_type: data.account_type,
        join_date: data.created_at ? new Date(data.created_at.toDate()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'
      };
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({ error: 'Failed to fetch recent users', details: error.message });
  }
});

// Recent Enrollments
app.get('/api/admin/recent-enrollments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const enrollmentsSnapshot = await db.collection('enrollments')
      .orderBy('enrollment_date', 'desc')
      .limit(5)
      .get();

    const enrollments = [];
    for (const doc of enrollmentsSnapshot.docs) {
      const enrollment = doc.data();
      
      // Get user and course details
      const [userDoc, courseDoc] = await Promise.all([
        db.collection('users').doc(enrollment.user_id).get(),
        db.collection('courses').doc(enrollment.course_id).get()
      ]);

      if (userDoc.exists && courseDoc.exists) {
        const user = userDoc.data();
        const course = courseDoc.data();
        
        enrollments.push({
          id: doc.id,
          user_name: `${user.first_name} ${user.last_name}`,
          course_name: course.title,
          date: enrollment.enrollment_date ? new Date(enrollment.enrollment_date.toDate()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
          status: enrollment.status
        });
      }
    }

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching recent enrollments:', error);
        res.status(500).json({ error: 'Failed to fetch recent enrollments', details: error.message });
  }
});

// ==================== CONTACT ROUTES ====================

// Submit contact form
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

    const contactRef = await db.collection('contact_messages').add(contactData);

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

// ==================== ADMIN USER MANAGEMENT ====================

// Get all users with pagination
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const accountType = req.query.accountType;
    const status = req.query.status;
    const search = req.query.search;

    let query = db.collection('users');

    // Apply filters
    if (accountType && accountType !== 'all') {
      query = query.where('account_type', '==', accountType);
    }

    if (status && status !== 'all') {
      const isActive = status === 'active';
      query = query.where('is_active', '==', isActive);
    }

    // Note: Firestore doesn't support text search natively
    // For production, consider using Algolia or ElasticSearch
    
    query = query.orderBy('created_at', 'desc');

    const snapshot = await query.get();
    
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply search filter in memory (not ideal for large datasets)
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.first_name.toLowerCase().includes(searchLower) ||
        user.last_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Paginate
    const totalUsers = users.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + limit);

    res.json({
      users: paginatedUsers,
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

// Get specific user
app.get('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new user
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, accountType, isActive, company, website, bio } = req.body;

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
    const existingUser = await db.collection('users').where('email', '==', email).get();
    if (!existingUser.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userData = {
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
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const userRef = await db.collection('users').add(userData);

    // Create user stats
    await db.collection('user_stats').doc(userRef.id).set({
      user_id: userRef.id,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: admin.firestore.FieldValue.serverTimestamp()
    });

    const newUserDoc = await userRef.get();
    
    res.status(201).json({
      message: 'User created successfully',
      user: { id: userRef.id, ...newUserDoc.data() }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, email, phone, accountType, isActive, company, website, bio } = req.body;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = userDoc.data();
    const updateData = {
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    // Only update provided fields
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (accountType !== undefined) updateData.account_type = accountType;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (company !== undefined) updateData.company = company;
    if (website !== undefined) updateData.website = website;
    if (bio !== undefined) updateData.bio = bio;

    // Handle email change
    if (email && email !== currentUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }

      const existingUser = await db.collection('users')
        .where('email', '==', email)
        .get();

      if (!existingUser.empty && existingUser.docs[0].id !== userId) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      updateData.email = email;
    }

    await userDoc.ref.update(updateData);

    const updatedUserDoc = await userDoc.ref.get();

    res.json({
      message: 'User updated successfully',
      user: { id: userId, ...updatedUserDoc.data() }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (soft delete)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id;

    if (userId === adminId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userDoc.ref.update({
      is_active: false,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error while deleting user' });
  }
});

// Reset user password
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

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await userDoc.ref.update({
      password_hash: hashedPassword,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ADMIN PAYMENTS MANAGEMENT ====================

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
      user_id: user_id || req.user.id,
      resource_id: resource_id || null,
      plan: plan,
      amount: amount,
      payment_method: payment_method,
      transaction_id: transaction_id,
      proof_file: req.file.filename,
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const paymentRef = await db.collection('payments').add(paymentData);

    res.json({ 
      message: 'Payment proof uploaded successfully', 
      paymentId: paymentRef.id 
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ error: 'Failed to upload payment proof' });
  }
});

// Get all payments (admin)
app.get('/api/admin/payments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const paymentsSnapshot = await db.collection('payments')
      .orderBy('created_at', 'desc')
      .get();

    const payments = [];
    for (const doc of paymentsSnapshot.docs) {
      const payment = { id: doc.id, ...doc.data() };
      
      // Get user details
      const userDoc = await db.collection('users').doc(payment.user_id).get();
      if (userDoc.exists) {
        const user = userDoc.data();
        payment.first_name = user.first_name;
        payment.last_name = user.last_name;
        payment.email = user.email;
      }
      
      // Get resource details if applicable
      if (payment.resource_id) {
        const resourceDoc = await db.collection('resources').doc(payment.resource_id).get();
        if (resourceDoc.exists) {
          payment.resource_title = resourceDoc.data().title;
        }
      }
      
      payments.push(payment);
    }

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Verify payment
app.put('/api/admin/payments/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const paymentDoc = await db.collection('payments').doc(id).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    await paymentDoc.ref.update({
      status: status,
      verified_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // If payment is approved, grant access
    if (status === 'approved') {
      const payment = paymentDoc.data();
      
      if (payment.plan === 'individual' && payment.resource_id) {
        // Grant access to specific resource
        await db.collection('user_resources').add({
          user_id: payment.user_id,
          resource_id: payment.resource_id,
          granted_at: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (payment.plan === 'premium') {
        // Upgrade user to premium
        await db.collection('users').doc(payment.user_id).update({
          subscription_plan: 'premium',
                    subscription_updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// ==================== ADMIN ENROLLMENT MANAGEMENT ====================

// Get all enrollments
app.get('/api/admin/enrollments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const enrollmentsSnapshot = await db.collection('enrollments')
      .orderBy('enrollment_date', 'desc')
      .get();

    const enrollments = [];
    for (const doc of enrollmentsSnapshot.docs) {
      const enrollment = { id: doc.id, ...doc.data() };
      
      // Get user and course details
      const [userDoc, courseDoc] = await Promise.all([
        db.collection('users').doc(enrollment.user_id).get(),
        db.collection('courses').doc(enrollment.course_id).get()
      ]);

      if (userDoc.exists && courseDoc.exists) {
        const user = userDoc.data();
        const course = courseDoc.data();
        
        enrollments.push({
          id: enrollment.id,
          user_id: enrollment.user_id,
          user_name: `${user.first_name} ${user.last_name}`,
          course_id: enrollment.course_id,
          course_name: course.title,
          progress: enrollment.progress,
          status: enrollment.status,
          enrollment_date: enrollment.enrollment_date,
          completion_date: enrollment.completion_date
        });
      }
    }

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Update enrollment
app.put('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, completion_date } = req.body;

    const enrollmentDoc = await db.collection('enrollments').doc(id).get();
    if (!enrollmentDoc.exists) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (status === 'completed') {
      updateData.completion_date = completion_date || admin.firestore.FieldValue.serverTimestamp();
    }

    await enrollmentDoc.ref.update(updateData);

    res.json({ message: 'Enrollment updated successfully' });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({ error: 'Failed to update enrollment' });
  }
});

// Delete enrollment
app.delete('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const enrollmentDoc = await db.collection('enrollments').doc(id).get();
    if (!enrollmentDoc.exists) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    await enrollmentDoc.ref.delete();

    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ error: 'Failed to delete enrollment' });
  }
});

// ==================== ADMIN COURSE MANAGEMENT ====================

// Get all courses (admin)
app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const coursesSnapshot = await db.collection('courses')
      .orderBy('created_at', 'desc')
      .get();

    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Create new course
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

    if (!title || !instructor_name || !duration_weeks || !difficulty_level || !category || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const courseData = {
      title,
      description,
      instructor_name,
      duration_weeks,
      difficulty_level,
      category,
      price,
      is_active: is_active !== undefined ? is_active : true,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const courseRef = await db.collection('courses').add(courseData);

    res.status(201).json({ 
      message: 'Course created successfully',
      courseId: courseRef.id
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
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

    if (!title || !instructor_name || !duration_weeks || !difficulty_level || !category || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const courseDoc = await db.collection('courses').doc(id).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await courseDoc.ref.update({
      title,
      description,
      instructor_name,
      duration_weeks,
      difficulty_level,
      category,
      price,
      is_active,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course
app.delete('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course has enrollments
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('course_id', '==', id)
      .limit(1)
      .get();

    if (!enrollmentsSnapshot.empty) {
      return res.status(400).json({ error: 'Cannot delete course with active enrollments' });
    }

    const courseDoc = await db.collection('courses').doc(id).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await courseDoc.ref.delete();

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// ==================== ADMIN RESOURCE MANAGEMENT ====================

// Get all resources (admin)
app.get('/api/admin/resources', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const resourcesSnapshot = await db.collection('resources')
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

// Create new resource
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

    if (!title || !description || !type || !category || !icon_name || !button_color || !allowed_account_types) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const accountTypesArray = Array.isArray(allowed_account_types) 
      ? allowed_account_types 
      : [allowed_account_types];

    const resourceData = {
      title,
      description,
      type,
      size: size || null,
      url: url || null,
      category,
      icon_name,
      button_color,
      allowed_account_types: accountTypesArray,
      is_premium: is_premium || false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const resourceRef = await db.collection('resources').add(resourceData);

    res.status(201).json({ 
      message: 'Resource created successfully',
      resourceId: resourceRef.id
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// Update resource
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

    if (!title || !description || !type || !category || !icon_name || !button_color || !allowed_account_types) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const resourceDoc = await db.collection('resources').doc(id).get();
    if (!resourceDoc.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const accountTypesArray = Array.isArray(allowed_account_types) 
      ? allowed_account_types 
      : [allowed_account_types];

    await resourceDoc.ref.update({
      title,
      description,
      type,
      size: size || null,
      url: url || null,
      category,
      icon_name,
      button_color,
      allowed_account_types: accountTypesArray,
      is_premium,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Resource updated successfully' });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

// Delete resource
app.delete('/api/admin/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const resourceDoc = await db.collection('resources').doc(id).get();
    if (!resourceDoc.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await resourceDoc.ref.delete();

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// ==================== ADMIN CONTACT MESSAGES ====================

// Get contact messages
app.get('/api/admin/contact-messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const messagesSnapshot = await db.collection('contact_messages')
      .orderBy('created_at', 'desc')
      .get();

    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      status: doc.data().status || 'pending'
    }));

    // Paginate
    const totalMessages = messages.length;
    const totalPages = Math.ceil(totalMessages / limit);
    const startIndex = (page - 1) * limit;
    const paginatedMessages = messages.slice(startIndex, startIndex + limit);

    res.json({
      messages: paginatedMessages,
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

// Update contact message status
app.put('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'contacted', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const messageDoc = await db.collection('contact_messages').doc(id).get();
    if (!messageDoc.exists) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    await messageDoc.ref.update({ status });

    res.json({ message: 'Contact message updated successfully' });
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500).json({ error: 'Failed to update contact message' });
  }
});

// Delete contact message
app.delete('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const messageDoc = await db.collection('contact_messages').doc(id).get();
    if (!messageDoc.exists) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    await messageDoc.ref.delete();

    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ error: 'Failed to delete contact message' });
  }
});

// ==================== UTILITY ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Server info
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Padak Dashboard API - Firebase Version',
        version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ==================== ADMIN SERVICE REQUEST MANAGEMENT ====================

// Get all service requests (admin)
app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requestsSnapshot = await db.collection('service_requests')
      .orderBy('created_at', 'desc')
      .get();

    const requests = [];
    for (const doc of requestsSnapshot.docs) {
      const request = { id: doc.id, ...doc.data() };
      
      // Get subcategory details
      const subcategoryDoc = await db.collection('service_subcategories').doc(request.subcategory_id).get();
      let serviceName = 'Unknown Service';
      if (subcategoryDoc.exists) {
        serviceName = subcategoryDoc.data().name;
      }
      
      // Get user details if exists
      let userData = {};
      if (request.user_id) {
        const userDoc = await db.collection('users').doc(request.user_id).get();
        if (userDoc.exists) {
          const user = userDoc.data();
          userData = {
            user_first_name: user.first_name,
            user_last_name: user.last_name,
            user_account_type: user.account_type
          };
        }
      }
      
      requests.push({
        id: request.id,
        name: request.full_name,
        service: serviceName,
        date: request.created_at ? new Date(request.created_at.toDate()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
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
        ...userData
      });
    }

    res.json(requests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests', details: error.message });
  }
});

// Update service request
app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, project_details, budget_range, timeline, additional_requirements } = req.body;

    const requestDoc = await db.collection('service_requests').doc(id).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    const updateData = {
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    if (status !== undefined) updateData.status = status;
    if (project_details !== undefined) updateData.project_details = project_details;
    if (budget_range !== undefined) updateData.budget_range = budget_range;
    if (timeline !== undefined) updateData.timeline = timeline;
    if (additional_requirements !== undefined) updateData.additional_requirements = additional_requirements;

    await requestDoc.ref.update(updateData);

    res.json({ message: 'Service request updated successfully' });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ error: 'Failed to update service request', details: error.message });
  }
});

// Delete service request
app.delete('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const requestDoc = await db.collection('service_requests').doc(id).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    await requestDoc.ref.delete();

    res.json({ message: 'Service request deleted successfully' });
  } catch (error) {
    console.error('Error deleting service request:', error);
    res.status(500).json({ error: 'Failed to delete service request', details: error.message });
  }
});

// ==================== ADMIN ANALYTICS ====================

// Get analytics data
app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // User growth data
    const usersSnapshot = await db.collection('users')
      .where('created_at', '>=', sixMonthsAgo)
      .orderBy('created_at')
      .get();

    const userGrowth = {};
    usersSnapshot.forEach(doc => {
      const date = doc.data().created_at.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      userGrowth[monthKey] = (userGrowth[monthKey] || 0) + 1;
    });

    const userGrowthArray = Object.entries(userGrowth).map(([month, count]) => ({
      month,
      count
    }));

    // Course enrollment data
    const coursesSnapshot = await db.collection('courses')
      .where('is_active', '==', true)
      .get();

    const courseEnrollments = [];
    for (const courseDoc of coursesSnapshot.docs) {
      const course = courseDoc.data();
      const enrollmentsSnapshot = await db.collection('enrollments')
        .where('course_id', '==', courseDoc.id)
        .get();

      courseEnrollments.push({
        title: course.title,
        enrollments: enrollmentsSnapshot.size
      });
    }

    // Sort by enrollments and take top 10
    courseEnrollments.sort((a, b) => b.enrollments - a.enrollments);
    const topCourseEnrollments = courseEnrollments.slice(0, 10);

    // Revenue data
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('enrollment_date', '>=', sixMonthsAgo)
      .orderBy('enrollment_date')
      .get();

    const revenueByMonth = {};
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data();
      const date = enrollment.enrollment_date.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const courseDoc = await db.collection('courses').doc(enrollment.course_id).get();
      if (courseDoc.exists) {
        const price = parseFloat(courseDoc.data().price || 0);
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + price;
      }
    }

    const revenueData = Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue
    }));

    res.json({
      userGrowth: userGrowthArray,
      courseEnrollments: topCourseEnrollments,
      revenueData: revenueData
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ADMIN ASSIGNMENT MANAGEMENT ====================

// Get all assignments (admin)
app.get('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentsSnapshot = await db.collection('assignments')
      .orderBy('created_at', 'desc')
      .get();

    const assignments = [];
    for (const doc of assignmentsSnapshot.docs) {
      const assignment = { id: doc.id, ...doc.data() };
      
      // Get course details
      const courseDoc = await db.collection('courses').doc(assignment.course_id).get();
      if (courseDoc.exists) {
        assignment.course_title = courseDoc.data().title;
      }
      
      assignments.push(assignment);
    }

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Create new assignment
app.post('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      course_id,
      description,
      due_date,
      max_points
    } = req.body;

    if (!title || !course_id || !due_date || !max_points) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const assignmentData = {
      title,
      course_id,
      description,
      due_date: new Date(due_date),
      max_points,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const assignmentRef = await db.collection('assignments').add(assignmentData);

    res.status(201).json({ 
      message: 'Assignment created successfully',
      assignmentId: assignmentRef.id
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Update assignment
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

    if (!title || !course_id || !due_date || !max_points) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const assignmentDoc = await db.collection('assignments').doc(id).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await assignmentDoc.ref.update({
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

// Delete assignment
app.delete('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if assignment has submissions
    const submissionsSnapshot = await db.collection('assignment_submissions')
      .where('assignment_id', '==', id)
      .limit(1)
      .get();

    if (!submissionsSnapshot.empty) {
      return res.status(400).json({ error: 'Cannot delete assignment with existing submissions' });
    }

    const assignmentDoc = await db.collection('assignments').doc(id).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await assignmentDoc.ref.delete();

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
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
  console.log(`🔥 Connected to Firebase Firestore`);
});

module.exports = app;