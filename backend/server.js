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

// Firebase Client SDK
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  increment,
  arrayUnion,
  arrayRemove,
  startAfter,
  serverTimestamp
} = require('firebase/firestore');

const app = express();
const port = process.env.PORT; // || 5000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Firebase Configuration
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

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Firestore Collections
const COLLECTIONS = {
  USERS: 'users',
  USER_STATS: 'user_stats',
  COURSES: 'courses',
  ENROLLMENTS: 'enrollments',
  ASSIGNMENTS: 'assignments',
  ASSIGNMENT_SUBMISSIONS: 'assignment_submissions',
  SOCIAL_ACTIVITIES: 'social_activities',
  CERTIFICATES: 'certificates',
  RESOURCES: 'resources',
  INTERNSHIPS: 'internships',
  INTERNSHIP_SUBMISSIONS: 'internship_submissions',
  SERVICE_CATEGORIES: 'service_categories',
  SERVICE_SUBCATEGORIES: 'service_subcategories',
  SERVICE_REQUESTS: 'service_requests',
  CONTACT_MESSAGES: 'contact_messages',
  PAYMENTS: 'payments',
  COURSE_ENROLL_REQUESTS: 'course_enroll_requests',
  CUSTOM_CALENDAR_EVENTS: 'custom_calendar_events',
  DOWNLOAD_LOGS: 'download_logs',
  USER_CONNECTIONS: 'user_connections'
};

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
  limits: { fileSize: 5 * 1024 * 1024 },
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

// ===== PAYMENT PROOF MULTER CONFIGURATION =====
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
    
    // Get user from Firestore
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, decoded.userId));
    
    if (!userDoc.exists() || !userDoc.data().is_active) {
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

// ==================== HELPER FUNCTIONS ====================

// Helper to generate unique IDs (since Firestore auto-IDs are not numeric)
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

// Helper to check if email exists
const checkEmailExists = async (email) => {
  const q = query(collection(db, COLLECTIONS.USERS), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

// Helper to get user by email
const getUserByEmail = async (email) => {
  const q = query(collection(db, COLLECTIONS.USERS), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() };
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
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user document
    const userId = generateId();
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
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    await setDoc(doc(db, COLLECTIONS.USERS, userId), userData);

    // Create user stats entry
    const userStatsData = {
      user_id: userId,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: serverTimestamp()
    };

    await setDoc(doc(db, COLLECTIONS.USER_STATS, userId), userStatsData);

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
    const user = await getUserByEmail(email);
    if (!user || !user.is_active) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

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
    await updateDoc(doc(db, COLLECTIONS.USERS, user.id), {
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

    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      company: company,
      website: website,
      bio: bio,
      updated_at: serverTimestamp()
    });

    // Get updated user data
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
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

    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
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

    const statsDoc = await getDoc(doc(db, COLLECTIONS.USER_STATS, userId));

    if (!statsDoc.exists()) {
      // Create default stats if not exists
      const defaultStats = {
        user_id: userId,
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        last_activity: serverTimestamp()
      };
      await setDoc(doc(db, COLLECTIONS.USER_STATS, userId), defaultStats);

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

// ==================== SOCIAL FEED FUNCTIONALITY ====================

// Multer Configuration for Social Post Images
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

// Helper function to get full URL for images
const getFullImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  let cleanPath = imagePath.replace(/^public\//, '');
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
  return `${req.protocol}://${req.get('host')}${cleanPath}`;
}

// GET All Posts (with Pagination, Likes, Comments, etc.)
app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const postsLimit = parseInt(req.query.limit, 10) || 10;

  try {
    // Get posts query
    let postsQuery = query(
      collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
      where('activity_type', '==', 'post'),
      orderBy('created_at', 'desc'),
      limit(postsLimit)
    );

    const postsSnapshot = await getDocs(postsQuery);
    let posts = [];

    for (const postDoc of postsSnapshot.docs) {
      const post = { id: postDoc.id, ...postDoc.data() };
      
      // Get user data
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, post.user_id));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Get likes count
      const likesQuery = query(
        collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
        where('activity_type', '==', 'like'),
        where('target_id', '==', post.id)
      );
      const likesSnapshot = await getDocs(likesQuery);
      
      // Get comments count
      const commentsQuery = query(
        collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
        where('activity_type', '==', 'comment'),
        where('target_id', '==', post.id)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      
      // Check if user liked the post
      const userLikeQuery = query(
        collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
        where('activity_type', '==', 'like'),
        where('target_id', '==', post.id),
        where('user_id', '==', userId)
      );
      const userLikeSnapshot = await getDocs(userLikeQuery);
      
      // Check if user bookmarked the post
      const userBookmarkQuery = query(
        collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
        where('activity_type', '==', 'bookmark'),
        where('target_id', '==', post.id),
        where('user_id', '==', userId)
      );
      const userBookmarkSnapshot = await getDocs(userBookmarkQuery);

      // Get comments with user data
      const commentsWithUsers = [];
      for (const commentDoc of commentsSnapshot.docs) {
        const comment = { id: commentDoc.id, ...commentDoc.data() };
        const commentUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, comment.user_id));
        const commentUser = commentUserDoc.exists() ? commentUserDoc.data() : {};
        
        commentsWithUsers.push({
          ...comment,
          user: {
            id: comment.user_id,
            first_name: commentUser.first_name,
            last_name: commentUser.last_name,
            profile_image: getFullImageUrl(req, commentUser.profile_image),
            account_type: commentUser.account_type
          }
        });
      }

      posts.push({
        ...post,
        user: {
          id: post.user_id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          profile_image: getFullImageUrl(req, userData.profile_image),
          account_type: userData.account_type
        },
        likes: likesSnapshot.size,
        comment_count: commentsSnapshot.size,
        has_liked: !userLikeSnapshot.empty,
        has_bookmarked: !userBookmarkSnapshot.empty,
        image_url: getFullImageUrl(req, post.image_url),
        comments: commentsWithUsers
      });
    }

    // Get total count for pagination
    const totalPostsQuery = query(
      collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
      where('activity_type', '==', 'post')
    );
    const totalPostsSnapshot = await getDocs(totalPostsQuery);
    const totalPosts = totalPostsSnapshot.size;
    const totalPages = Math.ceil(totalPosts / postsLimit);

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
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const postRef = await addDoc(collection(db, COLLECTIONS.SOCIAL_ACTIVITIES), postData);

      // Get user data for response
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      const userData = userDoc.exists() ? userDoc.data() : {};

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
    const postDoc = await getDoc(doc(db, COLLECTIONS.SOCIAL_ACTIVITIES, id));
    
    if (!postDoc.exists()) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = postDoc.data();
    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    await updateDoc(doc(db, COLLECTIONS.SOCIAL_ACTIVITIES, id), {
      content: content,
      updated_at: serverTimestamp()
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
    const postDoc = await getDoc(doc(db, COLLECTIONS.SOCIAL_ACTIVITIES, id));
    
    if (!postDoc.exists()) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = postDoc.data();
    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    // Delete the post and its associated activities (comments, likes, bookmarks)
    await deleteDoc(doc(db, COLLECTIONS.SOCIAL_ACTIVITIES, id));

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
      created_at: serverTimestamp()
    };

    const commentRef = await addDoc(collection(db, COLLECTIONS.SOCIAL_ACTIVITIES), commentData);

    // Get user data for response
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    const userData = userDoc.exists() ? userDoc.data() : {};

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
    const existingLikeQuery = query(
      collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
      where('activity_type', '==', 'like'),
      where('target_id', '==', targetId),
      where('user_id', '==', userId)
    );
    const existingLikeSnapshot = await getDocs(existingLikeQuery);

    if (existingLikeSnapshot.empty) {
      const likeData = {
        user_id: userId,
        activity_type: 'like',
        target_id: targetId,
        created_at: serverTimestamp()
      };
      await addDoc(collection(db, COLLECTIONS.SOCIAL_ACTIVITIES), likeData);
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
      await deleteDoc(doc(db, COLLECTIONS.SOCIAL_ACTIVITIES, likeSnapshot.docs[0].id));
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
      const bookmarkData = {
        user_id: userId,
        activity_type: 'bookmark',
        target_id: targetId,
        created_at: serverTimestamp()
      };
      await addDoc(collection(db, COLLECTIONS.SOCIAL_ACTIVITIES), bookmarkData);
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
      await deleteDoc(doc(db, COLLECTIONS.SOCIAL_ACTIVITIES, bookmarkSnapshot.docs[0].id));
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
    const postDoc = await getDoc(doc(db, COLLECTIONS.SOCIAL_ACTIVITIES, postId));
    if (postDoc.exists()) {
      const post = postDoc.data();
      await updateDoc(doc(db, COLLECTIONS.SOCIAL_ACTIVITIES, postId), {
        share_count: (post.share_count || 0) + 1
      });
    }

    res.json({ message: 'Share tracked.' });
  } catch (error) {
    console.error('Error tracking share:', error);
    res.status(500).json({ error: 'Failed to track share.' });
  }
});

// ============ STUDENT DASHBOARD SPECIFIC ENDPOINTS ====================

// Get user enrollments
app.get('/api/users/:userId/enrollments', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (req.params.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own enrollment data.' });
  }

  try {
    const enrollmentsQuery = query(
      collection(db, COLLECTIONS.ENROLLMENTS),
      where('user_id', '==', userId)
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

    const enrollments = [];
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data();
      const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, enrollment.course_id));
      
      if (courseDoc.exists()) {
        const course = courseDoc.data();
        enrollments.push({
          id: enrollmentDoc.id,
          progress: enrollment.progress,
          status: enrollment.status,
          enrollment_date: enrollment.enrollment_date,
          completion_date: enrollment.completion_date,
          course_id: enrollment.course_id,
          courseTitle: course.title,
          instructorName: course.instructor_name,
          durationWeeks: course.duration_weeks
        });
      }
    }

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching user enrollments for dashboard:', error);
    res.status(500).json({ error: 'Internal server error while fetching enrolled courses.' });
  }
});

// Get user internship submissions
app.get('/api/users/:userId/internship-submissions', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (req.params.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own internship submissions.' });
  }

  try {
    const submissionsQuery = query(
      collection(db, COLLECTIONS.INTERNSHIP_SUBMISSIONS),
      where('user_id', '==', userId)
    );
    const submissionsSnapshot = await getDocs(submissionsQuery);

    const applications = [];
    for (const submissionDoc of submissionsSnapshot.docs) {
      const submission = submissionDoc.data();
      const internshipDoc = await getDoc(doc(db, COLLECTIONS.INTERNSHIPS, submission.internship_id));
      
      if (internshipDoc.exists()) {
        const internship = internshipDoc.data();
        applications.push({
          id: submissionDoc.id,
          internship_id: submission.internship_id,
          applicationStatus: submission.status,
          applicationDate: submission.submitted_at,
          internshipTitle: internship.title,
          companyName: internship.company
        });
      }
    }

    res.json(applications);
  } catch (error) {
    console.error('Error fetching user internship applications for dashboard:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// =============== PROFESSIONAL DASHBOARD ENDPOINTS ====================

// Get services
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const servicesSnapshot = await getDocs(collection(db, COLLECTIONS.SERVICE_SUBCATEGORIES));
    const services = [];

    for (const serviceDoc of servicesSnapshot.docs) {
      const service = serviceDoc.data();
      const categoryDoc = await getDoc(doc(db, COLLECTIONS.SERVICE_CATEGORIES, service.category_id));
      
      if (categoryDoc.exists() && categoryDoc.data().is_active) {
        const category = categoryDoc.data();
        services.push({
          id: serviceDoc.id,
          name: service.name,
          category_id: service.category_id,
          categoryName: category.name,
          description: service.description,
          price: service.price,
          duration: service.duration,
          rating: service.rating,
          reviews: service.reviews,
          features: service.features || [],
          popular: service.popular
        });
      }
    }

    res.json(services);
  } catch (error) {
    console.error('Error fetching available services:', error);
    res.status(500).json({ message: 'Failed to fetch available services.', error: error.message });
  }
});

// Get user service requests
app.get('/api/users/:userId/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (req.params.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
  }

  try {
    const requestsQuery = query(
      collection(db, COLLECTIONS.SERVICE_REQUESTS),
      where('user_id', '==', userId)
    );
    const requestsSnapshot = await getDocs(requestsQuery);

    const requests = [];
    for (const requestDoc of requestsSnapshot.docs) {
      const request = requestDoc.data();
      const categoryDoc = await getDoc(doc(db, COLLECTIONS.SERVICE_CATEGORIES, request.subcategory_id));
      
      if (categoryDoc.exists()) {
        const category = categoryDoc.data();
        requests.push({
          id: requestDoc.id,
          userId: request.user_id,
          categoryId: request.subcategory_id,
          categoryName: category.name,
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
          requestDate: request.created_at,
          updatedAt: request.updated_at
        });
      }
    }

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
    return res.status(400).json({ message: 'Missing required fields for service request. Please fill in all necessary details.' });
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
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const requestRef = await addDoc(collection(db, COLLECTIONS.SERVICE_REQUESTS), requestData);

    res.status(201).json({ message: 'Service request submitted successfully!', id: requestRef.id });
  } catch (error) {
    console.error('Error submitting service request:', error);
    res.status(500).json({ message: 'Failed to submit service request. An internal server error occurred.', error: error.message });
  }
});

// ==================== COURSES ROUTES ====================

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const coursesQuery = query(
      collection(db, COLLECTIONS.COURSES),
      where('is_active', '==', true)
    );
    const coursesSnapshot = await getDocs(coursesQuery);

    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      price: doc.data().price !== null ? `₹${parseFloat(doc.data().price).toFixed(2)}` : '₹0.00'
    }));

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
      collection(db, COLLECTIONS.ENROLLMENTS),
      where('user_id', '==', userId),
      where('status', '==', 'active')
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

    const enrollments = [];
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data();
      const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, enrollment.course_id));
      
      if (courseDoc.exists()) {
        const course = courseDoc.data();
        enrollments.push({
          id: enrollmentDoc.id,
          userId: enrollment.user_id,
          courseId: enrollment.course_id,
          progress: enrollment.progress,
          enrollmentDate: enrollment.enrollment_date,
          completionDate: enrollment.completion_date,
          status: enrollment.status,
          course: {
            id: enrollment.course_id,
            ...course
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
      collection(db, COLLECTIONS.ENROLLMENTS),
      where('user_id', '==', userId),
      where('course_id', '==', courseId)
    );
    const existingEnrollmentSnapshot = await getDocs(existingEnrollmentQuery);

    if (!existingEnrollmentSnapshot.empty) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, courseId));
    if (!courseDoc.exists() || !courseDoc.data().is_active) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    const enrollmentData = {
      user_id: userId,
      course_id: courseId,
      enrollment_date: serverTimestamp(),
      progress: 0,
      status: 'active',
      completion_date: null
    };

    await addDoc(collection(db, COLLECTIONS.ENROLLMENTS), enrollmentData);

    // Update user stats
    const statsDoc = await getDoc(doc(db, COLLECTIONS.USER_STATS, userId));
    if (statsDoc.exists()) {
      const stats = statsDoc.data();
      await updateDoc(doc(db, COLLECTIONS.USER_STATS, userId), {
        courses_enrolled: (stats.courses_enrolled || 0) + 1
      });
    }

    res.status(201).json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    console.error('Course enrollment error:', error);
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
      const requestData = {
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

      const requestRef = await addDoc(collection(db, COLLECTIONS.COURSE_ENROLL_REQUESTS), requestData);

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

// ==================== ASSIGNMENTS ROUTES ====================

// Get user's assignments
app.get('/api/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's enrolled courses first
    const enrollmentsQuery = query(
      collection(db, COLLECTIONS.ENROLLMENTS),
      where('user_id', '==', userId),
      where('status', '==', 'active')
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    
    const courseIds = enrollmentsSnapshot.docs.map(doc => doc.data().course_id);
    
    if (courseIds.length === 0) {
      return res.json([]);
    }

    // Get assignments for enrolled courses
    const assignmentsQuery = query(
      collection(db, COLLECTIONS.ASSIGNMENTS),
      where('course_id', 'in', courseIds)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);

    const assignments = [];
    for (const assignmentDoc of assignmentsSnapshot.docs) {
      const assignment = assignmentDoc.data();
      
      // Get course data
      const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, assignment.course_id));
      const course = courseDoc.exists() ? courseDoc.data() : {};
      
      // Get submission if exists
      const submissionQuery = query(
        collection(db, COLLECTIONS.ASSIGNMENT_SUBMISSIONS),
        where('assignment_id', '==', assignmentDoc.id),
        where('user_id', '==', userId)
      );
      const submissionSnapshot = await getDocs(submissionQuery);
      const submission = !submissionSnapshot.empty ? submissionSnapshot.docs[0].data() : null;

      assignments.push({
        id: assignmentDoc.id,
        course_id: assignment.course_id,
        title: assignment.title,
        description: assignment.description,
        due_date: assignment.due_date,
        max_points: assignment.max_points,
        created_at: assignment.created_at,
        course: {
          id: assignment.course_id,
          title: course.title,
          category: course.category
        },
        submission: submission ? {
          id: submissionSnapshot.docs[0].id,
          content: submission.content,
          file_path: submission.file_path,
          submitted_at: submission.submitted_at,
          grade: submission.grade,
          feedback: submission.feedback,
          status: submission.status
        } : null
      });
    }

    res.json(assignments);
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
    const assignmentDoc = await getDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignment_id));
    if (!assignmentDoc.exists()) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentDoc.data();
    
    // Check if user is enrolled in the course
    const enrollmentQuery = query(
      collection(db, COLLECTIONS.ENROLLMENTS),
      where('user_id', '==', userId),
      where('course_id', '==', assignment.course_id),
      where('status', '==', 'active')
    );
    const enrollmentSnapshot = await getDocs(enrollmentQuery);
    
    if (enrollmentSnapshot.empty) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Check if already submitted
    const existingSubmissionQuery = query(
      collection(db, COLLECTIONS.ASSIGNMENT_SUBMISSIONS),
      where('assignment_id', '==', assignment_id),
      where('user_id', '==', userId)
    );
    const existingSubmissionSnapshot = await getDocs(existingSubmissionQuery);

    if (!existingSubmissionSnapshot.empty) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }

    // Create submission
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

    const submissionRef = await addDoc(collection(db, COLLECTIONS.ASSIGNMENT_SUBMISSIONS), submissionData);

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

// ==================== RESOURCES ROUTES ====================

// Get resources for current user
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user account type
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const accountType = userDoc.data().account_type;
    
    // Get all resources
    const resourcesSnapshot = await getDocs(collection(db, COLLECTIONS.RESOURCES));
    
    const resources = resourcesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(resource => 
        resource.allowed_account_types && 
        resource.allowed_account_types.includes(accountType)
      );
    
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// ==================== CERTIFICATES ROUTES ====================

// Get user certificates
app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const certificatesQuery = query(
      collection(db, COLLECTIONS.CERTIFICATES),
      where('user_id', '==', userId)
    );
    const certificatesSnapshot = await getDocs(certificatesQuery);

    const certificates = [];
    for (const certDoc of certificatesSnapshot.docs) {
      const certificate = certDoc.data();
      const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, certificate.course_id));
      
      if (courseDoc.exists()) {
        const course = courseDoc.data();
        
        // Get enrollment data
        const enrollmentQuery = query(
          collection(db, COLLECTIONS.ENROLLMENTS),
          where('user_id', '==', userId),
          where('course_id', '==', certificate.course_id)
        );
        const enrollmentSnapshot = await getDocs(enrollmentQuery);
        const enrollment = !enrollmentSnapshot.empty ? enrollmentSnapshot.docs[0].data() : {};
        
        // Calculate average grade from assignments
        const assignmentsQuery = query(
          collection(db, COLLECTIONS.ASSIGNMENTS),
          where('course_id', '==', certificate.course_id)
        );
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        
        let totalGrade = 0;
        let gradeCount = 0;
        
        for (const assignmentDoc of assignmentsSnapshot.docs) {
          const submissionQuery = query(
            collection(db, COLLECTIONS.ASSIGNMENT_SUBMISSIONS),
            where('assignment_id', '==', assignmentDoc.id),
            where('user_id', '==', userId)
          );
          const submissionSnapshot = await getDocs(submissionQuery);
          
          if (!submissionSnapshot.empty && submissionSnapshot.docs[0].data().grade) {
            totalGrade += submissionSnapshot.docs[0].data().grade;
            gradeCount++;
          }
        }
        
        const finalGrade = gradeCount > 0 ? Math.round(totalGrade / gradeCount) : 0;

        certificates.push({
          id: certDoc.id,
          userId: certificate.user_id,
          courseId: certificate.course_id,
          certificateUrl: certificate.certificate_url,
          issuedDate: certificate.issued_date,
          course: {
            id: certificate.course_id,
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
        });
      }
    }

    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// ==================== INTERNSHIPS ROUTES ====================

// Get all internships
app.get('/api/internships', async (req, res) => {
  try {
    const internshipsSnapshot = await getDocs(collection(db, COLLECTIONS.INTERNSHIPS));
    const internships = internshipsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(internships);
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ message: 'Internal server error while fetching internships.' });
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
    // Check internship exists and has spots
    const internshipDoc = await getDoc(doc(db, COLLECTIONS.INTERNSHIPS, internshipId));
    if (!internshipDoc.exists()) {
      return res.status(404).json({ message: 'Internship not found.' });
    }

    const internship = internshipDoc.data();
    if (internship.spots_available <= 0) {
      return res.status(400).json({ message: 'No available spots left for this internship.' });
    }

    // Check if already applied
    const existingApplicationQuery = query(
      collection(db, COLLECTIONS.INTERNSHIP_SUBMISSIONS),
      where('internship_id', '==', internshipId),
      where('user_id', '==', userId)
    );
    const existingApplicationSnapshot = await getDocs(existingApplicationQuery);

    if (!existingApplicationSnapshot.empty) {
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

    await addDoc(collection(db, COLLECTIONS.INTERNSHIP_SUBMISSIONS), applicationData);

    // Update internship spots
    await updateDoc(doc(db, COLLECTIONS.INTERNSHIPS, internshipId), {
      spots_available: internship.spots_available - 1,
      applications_count: (internship.applications_count || 0) + 1
    });

    res.status(201).json({ message: 'Internship application submitted successfully!' });
  } catch (error) {
    console.error('Error submitting internship application:', error);
    res.status(500).json({ message: 'Internal server error during application submission.' });
  }
});

// ==================== CONTACT ROUTES ====================

// Contact form endpoint
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
      created_at: serverTimestamp()
    };

    const contactRef = await addDoc(collection(db, COLLECTIONS.CONTACT_MESSAGES), contactData);

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

// ==================== PAYMENT ROUTES ====================

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

    const paymentRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), paymentData);

    res.json({ 
      message: 'Payment proof uploaded successfully', 
      paymentId: paymentRef.id 
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ error: 'Failed to upload payment proof' });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total users
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    const totalUsers = usersSnapshot.size;

    // Get total courses
    const coursesSnapshot = await getDocs(collection(db, COLLECTIONS.COURSES));
    const totalCourses = coursesSnapshot.size;

    // Get total enrollments
    const enrollmentsSnapshot = await getDocs(collection(db, COLLECTIONS.ENROLLMENTS));
    const totalEnrollments = enrollmentsSnapshot.size;

    // Calculate total revenue (sum of all course prices for completed enrollments)
    let totalRevenue = 0;
    const completedEnrollmentsQuery = query(
      collection(db, COLLECTIONS.ENROLLMENTS),
      where('status', '==', 'completed')
    );
    const completedEnrollmentsSnapshot = await getDocs(completedEnrollmentsQuery);
    
    for (const enrollmentDoc of completedEnrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data();
      const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, enrollment.course_id));
      if (courseDoc.exists()) {
        totalRevenue += parseFloat(courseDoc.data().price) || 0;
      }
    }

    // Get pending contacts (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentContactsQuery = query(
      collection(db, COLLECTIONS.CONTACT_MESSAGES),
      where('created_at', '>=', oneWeekAgo)
    );
    const recentContactsSnapshot = await getDocs(recentContactsQuery);
    const pendingContacts = recentContactsSnapshot.size;

    // Get pending service requests
    const pendingServiceRequestsQuery = query(
      collection(db, COLLECTIONS.SERVICE_REQUESTS),
      where('status', '==', 'pending')
    );
    const pendingServiceRequestsSnapshot = await getDocs(pendingServiceRequestsQuery);
    const pendingServiceRequests = pendingServiceRequestsSnapshot.size;

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

// Admin Users Management
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

    const usersSnapshot = await getDocs(usersQuery);
    let users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply search filter
    if (search) {
      users = users.filter(user => 
        user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      users: paginatedUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(users.length / limit),
        totalUsers: users.length,
        hasNextPage: page < Math.ceil(users.length / limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== CALENDAR ROUTES ====================

// Get calendar events
app.get('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get assignment events
    const assignmentsQuery = query(collection(db, COLLECTIONS.ASSIGNMENTS));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);

    const assignmentEvents = [];
    for (const assignmentDoc of assignmentsSnapshot.docs) {
      const assignment = assignmentDoc.data();
      
      // Check if user is enrolled in the course
      const enrollmentQuery = query(
        collection(db, COLLECTIONS.ENROLLMENTS),
        where('user_id', '==', userId),
        where('course_id', '==', assignment.course_id),
        where('status', '==', 'active')
      );
      const enrollmentSnapshot = await getDocs(enrollmentQuery);
      
      if (!enrollmentSnapshot.empty) {
        const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, assignment.course_id));
        const course = courseDoc.exists() ? courseDoc.data() : {};
        
        // Check submission status
        const submissionQuery = query(
          collection(db, COLLECTIONS.ASSIGNMENT_SUBMISSIONS),
          where('assignment_id', '==', assignmentDoc.id),
          where('user_id', '==', userId)
        );
        const submissionSnapshot = await getDocs(submissionQuery);
        const submission = !submissionSnapshot.empty ? submissionSnapshot.docs[0].data() : null;
        
        let status = 'pending';
        if (submission?.status === 'graded') {
          status = 'completed';
        } else if (assignment.due_date && new Date(assignment.due_date) < new Date() && !submission) {
          status = 'overdue';
        }

        assignmentEvents.push({
          id: `assignment-${assignmentDoc.id}`,
          title: assignment.title,
          description: assignment.description || 'Assignment due',
          date: assignment.due_date,
          type: 'assignment',
          course: {
            id: assignment.course_id,
            title: course.title,
            category: course.category
          },
          status: status,
          color: status === 'completed' ? 'green' :
                 status === 'overdue' ? 'red' : 'orange'
        });
      }
    }

    // Get custom events
    const customEventsQuery = query(
      collection(db, COLLECTIONS.CUSTOM_CALENDAR_EVENTS),
      where('user_id', '==', userId)
    );
    const customEventsSnapshot = await getDocs(customEventsQuery);
    
    const customEvents = customEventsSnapshot.docs.map(doc => ({
      id: `custom-${doc.id}`,
      title: doc.data().title,
      description: doc.data().description || '',
      date: doc.data().event_date,
      time: doc.data().event_time,
      type: doc.data().event_type || 'custom',
      color: 'purple'
    }));

    const allEvents = [...assignmentEvents, ...customEvents];
    res.json(allEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
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
      description: description,
      event_date: date,
      event_time: time,
      event_type: type,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const eventRef = await addDoc(collection(db, COLLECTIONS.CUSTOM_CALENDAR_EVENTS), eventData);

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
    timestamp: new Date().toISOString(),
    database: 'Firebase Firestore'
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
  console.log(`🗄️ Database: Firebase Firestore`);
});

module.exports = app;