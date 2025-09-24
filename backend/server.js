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
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: "googleapis.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "startup-dbs-1.firebasestorage.app"
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Create necessary directories for file uploads
const assignmentsDir = path.join(__dirname, 'uploads', 'assignments');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });

const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const paymentsDir = path.join(__dirname, 'uploads', 'payments');
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

// ===== FIREBASE HELPER FUNCTIONS =====

// Generate unique ID
const generateId = () => db.collection('temp').doc().id;

// Convert MySQL timestamp to Firestore timestamp
const toFirestoreTimestamp = (mysqlTimestamp) => {
  if (!mysqlTimestamp) return admin.firestore.FieldValue.serverTimestamp();
  return admin.firestore.Timestamp.fromDate(new Date(mysqlTimestamp));
};

// Convert Firestore data to plain object
const firestoreToObject = (doc) => {
  if (!doc.exists) return null;
  const data = doc.data();
  const obj = { id: doc.id, ...data };
  
  // Convert Firestore timestamps to JavaScript dates
  Object.keys(obj).forEach(key => {
    if (obj[key] && typeof obj[key] === 'object' && 'toDate' in obj[key]) {
      obj[key] = obj[key].toDate();
    }
  });
  
  return obj;
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

// ===== FIREBASE FILE UPLOAD FUNCTION =====
const uploadToFirebase = async (filePath, destinationPath) => {
  try {
    await bucket.upload(filePath, {
      destination: destinationPath,
      public: true,
    });
    
    // Get the public URL
    const file = bucket.file(destinationPath);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Far future expiration
    });
    
    // Delete local file after upload
    fs.unlinkSync(filePath);
    
    return url;
  } catch (error) {
    console.error('Error uploading to Firebase:', error);
    throw error;
  }
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
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (!usersSnapshot.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user data
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
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    // Insert new user
    const userRef = await db.collection('users').add(userData);
    const userId = userRef.id;

    // Create user stats entry
    await db.collection('user_stats').doc(userId).set({
      user_id: userId,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('User registered successfully:', { userId, email: email.trim() });
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
      .where('is_active', '==', true)
      .get();

    if (usersSnapshot.empty) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const userDoc = usersSnapshot.docs[0];
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

    await db.collection('users').doc(userId).update({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      company: company,
      website: website,
      bio: bio,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

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
    
    // Upload to Firebase Storage
    const firebasePath = `avatars/${userId}/${req.file.filename}`;
    const imageUrl = await uploadToFirebase(req.file.path, firebasePath);

    // Delete old avatar if exists
    if (req.user.profile_image) {
      try {
        const oldFileName = req.user.profile_image.split('/').pop();
        const oldFile = bucket.file(`avatars/${userId}/${oldFileName}`);
        await oldFile.delete();
      } catch (error) {
        console.error('Error deleting old avatar:', error);
      }
    }

    await db.collection('users').doc(userId).update({
      profile_image: imageUrl,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).send(imageUrl);

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
        coursesEnrolled: userStats.courses_enrolled || 0,
        coursesCompleted: userStats.courses_completed || 0,
        certificatesEarned: userStats.certificates_earned || 0,
        learningStreak: userStats.learning_streak || 0,
        lastActivity: userStats.last_activity?.toDate().toISOString() || new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== SOCIAL FEED FUNCTIONALITY ====================

// Helper function to get full URL for images
const getFullImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return imagePath; // Firebase URLs are already full URLs
};

// GET All Posts
app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    let postsQuery = db.collection('social_activities')
      .where('activity_type', '==', 'post')
      .orderBy('created_at', 'desc')
      .limit(limit * page);

    const postsSnapshot = await postsQuery.get();
    let allPosts = [];
    
    postsSnapshot.forEach(doc => {
      allPosts.push({ id: doc.id, ...doc.data() });
    });

    // Filter posts based on visibility (simplified for demo)
    const filteredPosts = allPosts.filter(post => {
      if (post.visibility === 'public') return true;
      if (post.visibility === 'private' && post.user_id === userId) return true;
      if (post.visibility === 'connections') {
        // Simplified connection check - in production, you'd check actual connections
        return post.user_id === userId; 
      }
      return false;
    });

    // Paginate results
    const startIndex = (page - 1) * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit);

    // Fetch comments and likes for the paginated posts
    const postsWithData = await Promise.all(paginatedPosts.map(async (post) => {
      // Get comments
      const commentsSnapshot = await db.collection('social_activities')
        .where('activity_type', '==', 'comment')
        .where('target_id', '==', post.id)
        .orderBy('created_at', 'asc')
        .get();

      const comments = [];
      commentsSnapshot.forEach(doc => {
        comments.push({ id: doc.id, ...doc.data() });
      });

      // Get likes count
      const likesSnapshot = await db.collection('social_activities')
        .where('activity_type', '==', 'like')
        .where('target_id', '==', post.id)
        .get();

      // Check if user liked the post
      const userLikeSnapshot = await db.collection('social_activities')
        .where('activity_type', '==', 'like')
        .where('target_id', '==', post.id)
        .where('user_id', '==', userId)
        .get();

      // Check if user bookmarked the post
      const userBookmarkSnapshot = await db.collection('social_activities')
        .where('activity_type', '==', 'bookmark')
        .where('target_id', '==', post.id)
        .where('user_id', '==', userId)
        .get();

      // Get user info
      const userDoc = await db.collection('users').doc(post.user_id).get();
      const user = userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;

      // Get comment authors
      const commentsWithUsers = await Promise.all(comments.map(async (comment) => {
        const commentUserDoc = await db.collection('users').doc(comment.user_id).get();
        const commentUser = commentUserDoc.exists ? { id: commentUserDoc.id, ...commentUserDoc.data() } : null;
        
        return {
          ...comment,
          user: commentUser ? {
            id: commentUser.id,
            first_name: commentUser.first_name,
            last_name: commentUser.last_name,
            profile_image: getFullImageUrl(req, commentUser.profile_image),
            account_type: commentUser.account_type,
          } : null
        };
      }));

      return {
        ...post,
        has_liked: !userLikeSnapshot.empty,
        has_bookmarked: !userBookmarkSnapshot.empty,
        likes: likesSnapshot.size,
        comment_count: commentsSnapshot.size,
        image_url: getFullImageUrl(req, post.image_url),
        user: user ? {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_image: getFullImageUrl(req, user.profile_image),
          account_type: user.account_type,
        } : null,
        comments: commentsWithUsers,
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

      let imageUrl = null;
      if (req.file) {
        // Upload to Firebase Storage
        const firebasePath = `social/${userId}/${req.file.filename}`;
        imageUrl = await uploadToFirebase(req.file.path, firebasePath);
      }

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
      const postId = postRef.id;

      // Get the newly created post with user info
      const postDoc = await db.collection('social_activities').doc(postId).get();
      const newPost = { id: postDoc.id, ...postDoc.data() };
      
      const userDoc = await db.collection('users').doc(userId).get();
      const user = userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;

      res.status(201).json({
        ...newPost,
        has_liked: false,
        has_bookmarked: false,
        likes: 0,
        comment_count: 0,
        image_url: getFullImageUrl(req, newPost.image_url),
        user: user ? {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_image: getFullImageUrl(req, user.profile_image),
          account_type: user.account_type,
        } : null,
        comments: [],
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post.' });
    }
  });
});

// Other social routes (PUT, DELETE, comments, likes, bookmarks) follow similar patterns...
// Due to length, I'll show a few more key examples:

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
    const commentId = commentRef.id;

    // Fetch the new comment with user info
    const commentDoc = await db.collection('social_activities').doc(commentId).get();
    const newComment = { id: commentDoc.id, ...commentDoc.data() };
    
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;

    res.status(201).json({
      ...newComment,
      user: user ? {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_image: getFullImageUrl(req, user.profile_image)
      } : null
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

// ==================== COURSES ROUTES ====================

// GET all courses
app.get('/api/courses', async (req, res) => {
  try {
    const coursesSnapshot = await db.collection('courses')
      .where('is_active', '==', true)
      .orderBy('created_at', 'desc')
      .get();

    const courses = [];
    coursesSnapshot.forEach(doc => {
      const course = { id: doc.id, ...doc.data() };
      // Format price
      course.price = course.price !== null ? `₹${parseFloat(course.price).toFixed(2)}` : '₹0.00';
      courses.push(course);
    });

    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Enroll in a course
app.post('/api/courses/enroll', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Check if already enrolled
    const enrollmentSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('course_id', '==', courseId)
      .get();

    if (!enrollmentSnapshot.empty) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    const enrollmentData = {
      user_id: userId,
      course_id: courseId,
      progress: 0,
      status: 'active',
      enrollment_date: admin.firestore.FieldValue.serverTimestamp(),
      completion_date: null
    };

    await db.collection('enrollments').add(enrollmentData);

    // Update user stats
    const statsDoc = await db.collection('user_stats').doc(userId).get();
    if (statsDoc.exists) {
      const currentStats = statsDoc.data();
      await db.collection('user_stats').doc(userId).update({
        courses_enrolled: (currentStats.courses_enrolled || 0) + 1,
        last_activity: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.status(201).json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
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
      const enrollment = { id: doc.id, ...doc.data() };
      const courseDoc = await db.collection('courses').doc(enrollment.course_id).get();
      
      if (courseDoc.exists) {
        const course = { id: courseDoc.id, ...courseDoc.data() };
        enrollments.push({
          id: enrollment.id,
          userId: enrollment.user_id,
          courseId: enrollment.course_id,
          progress: enrollment.progress,
          enrollmentDate: enrollment.enrollment_date,
          completionDate: enrollment.completion_date,
          status: enrollment.status,
          course: course
        });
      }
    }

    res.json(enrollments);
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ASSIGNMENTS ROUTES ====================

// Submit assignment
app.post('/assignments/submit', authenticateToken, assignmentUpload.single('file'), async (req, res) => {
  const { assignment_id, content } = req.body;
  const userId = req.user.id;

  if (!assignment_id) {
    return res.status(400).json({ error: 'Assignment ID is required' });
  }

  if (!content && !req.file) {
    return res.status(400).json({ error: 'Either content or file is required' });
  }

  try {
    // Check if assignment exists and user is enrolled
    const assignmentDoc = await db.collection('assignments').doc(assignment_id).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentDoc.data();
    const courseId = assignment.course_id;

    // Check if user is enrolled in the course
    const enrollmentSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('course_id', '==', courseId)
      .get();

    if (enrollmentSnapshot.empty) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Check if already submitted
    const existingSubmissionSnapshot = await db.collection('assignment_submissions')
      .where('assignment_id', '==', assignment_id)
      .where('user_id', '==', userId)
      .get();

    if (!existingSubmissionSnapshot.empty) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }

    let fileUrl = null;
    if (req.file) {
      // Upload to Firebase Storage
      const firebasePath = `assignments/${userId}/${assignment_id}/${req.file.filename}`;
      fileUrl = await uploadToFirebase(req.file.path, firebasePath);
    }

    // Insert submission
    const submissionData = {
      assignment_id: assignment_id,
      user_id: userId,
      content: content || '',
      file_path: fileUrl,
      submitted_at: admin.firestore.FieldValue.serverTimestamp(),
      status: 'submitted',
      grade: null,
      feedback: null
    };

    const submissionRef = await db.collection('assignment_submissions').add(submissionData);

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

// ==================== ADMIN ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total users
    const usersSnapshot = await db.collection('users').where('is_active', '==', true).get();
    const totalUsers = usersSnapshot.size;

    // Get total courses
    const coursesSnapshot = await db.collection('courses').where('is_active', '==', true).get();
    const totalCourses = coursesSnapshot.size;

    // Get total enrollments
    const enrollmentsSnapshot = await db.collection('enrollments').get();
    const totalEnrollments = enrollmentsSnapshot.size;

    // Get recent contact messages (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const contactsSnapshot = await db.collection('contact_messages')
      .where('created_at', '>=', weekAgo)
      .get();
    const pendingContacts = contactsSnapshot.size;

    // Get pending service requests
    const serviceRequestsSnapshot = await db.collection('service_requests')
      .where('status', '==', 'pending')
      .get();
    const pendingServiceRequests = serviceRequestsSnapshot.size;

    // Calculate revenue (simplified - sum of course prices for completed enrollments)
    let totalRevenue = 0;
    const completedEnrollmentsSnapshot = await db.collection('enrollments')
      .where('status', '==', 'completed')
      .get();

    for (const doc of completedEnrollmentsSnapshot.docs) {
      const enrollment = doc.data();
      const courseDoc = await db.collection('courses').doc(enrollment.course_id).get();
      if (courseDoc.exists) {
        const course = courseDoc.data();
        totalRevenue += parseFloat(course.price || 0);
      }
    }

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
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
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

    const result = await db.collection('contact_messages').add(contactData);

    console.log('Contact message saved successfully:', {
      id: result.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim()
    });

    res.status(201).json({
      message: 'Contact message sent successfully',
      contactId: result.id
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

      // Upload payment screenshot to Firebase
      const firebasePath = `payments/${userId}/${req.file.filename}`;
      const paymentScreenshotUrl = await uploadToFirebase(req.file.path, firebasePath);

      // Insert into Firestore
      const enrollmentRequestData = {
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
        payment_screenshot: paymentScreenshotUrl,
        status: 'pending',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };

      const result = await db.collection('course_enroll_requests').add(enrollmentRequestData);

      res.status(201).json({
        message: 'Enrollment request submitted successfully',
        requestId: result.id
      });

    } catch (error) {
      console.error('Enrollment request error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
);

// ==================== HEALTH CHECK AND INFO ====================

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