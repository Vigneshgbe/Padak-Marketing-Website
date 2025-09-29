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

// Firebase Client SDK Imports
const { initializeApp } = require('firebase/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase/firestore');
const { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit: firebaseLimit, startAfter } = require('firebase/firestore');

// Firebase Configuration (from .env or config file)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase Client SDK
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const avatarsDir = path.join(uploadsDir, 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const assignmentsDir = path.join(uploadsDir, 'assignments');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });

const paymentsDir = path.join(uploadsDir, 'payments');
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

const socialUploadDir = path.join(uploadsDir, 'social');
if (!fs.existsSync(socialUploadDir)) fs.mkdirSync(socialUploadDir, { recursive: true });

const courseThumbnailsDir = path.join(uploadsDir, 'courses'); // New directory for course thumbnails
if (!fs.existsSync(courseThumbnailsDir)) fs.mkdirSync(courseThumbnailsDir, { recursive: true });


// ===== MULTER CONFIGURATIONS =====

// AVATAR MULTER CONFIGURATION
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

// ASSIGNMENT MULTER CONFIGURATION
const assignmentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, assignmentsDir);
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

// PAYMENT SCREENSHOT MULTER CONFIGURATION
const paymentScreenshotStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, paymentsDir);
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

// PAYMENT PROOF RESOURCES NEW MULTER CONFIGURATION (Same as paymentScreenshot for simplicity if they use same dir)
const paymentProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paymentsDir);
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

// SOCIAL POST IMAGE MULTER CONFIGURATION
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

// Course Thumbnail Multer Configuration
const courseThumbnailStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, courseThumbnailsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'course-thumbnail-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const courseThumbnailUpload = multer({
  storage: courseThumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for course thumbnails'));
    }
  }
});


// ===== CORS configuration =====
const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*', // Use specific origins if available, otherwise allow all (for testing)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'))); // Original, if public/uploads exists
app.use('/uploads/avatars', express.static(avatarsDir)); // Directly serve from our new structure
app.use('/uploads/social', express.static(socialUploadDir)); // Serve social images
app.use('/uploads/assignments', express.static(assignmentsDir)); // Serve assignments
app.use('/uploads/payments', express.static(paymentsDir)); // Serve payments
app.use('/uploads/courses', express.static(courseThumbnailsDir)); // Serve course thumbnails


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
    // Use Client SDK Firestore methods
    const userDocRef = doc(db, 'users', decoded.userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists() || !userDoc.data().is_active) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = userDoc.data();
    req.user.id = decoded.userId;
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
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
  let cleanPath = imagePath.replace(/^\/uploads\//, ''); // Adjust path if it stored with `/uploads/` prefix
  if (!cleanPath.startsWith('/')) { // Ensure it has leading slash for static serving if not already
    cleanPath = '/' + cleanPath;
  }
  // This assumes your static middleware correctly serves '/uploads'
  return `${req.protocol}://${req.get('host')}/uploads${cleanPath}`;
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
    const usersCollection = collection(db, 'users');
    const existingUsersQuery = query(usersCollection, where('email', '==', email));
    const existingUsers = await getDocs(existingUsersQuery);

    if (!existingUsers.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const userRef = doc(usersCollection); // Client SDK generates ID automatically here
    await setDoc(userRef, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      password_hash: hashedPassword,
      account_type: accountType || 'student',
      is_active: true,
      email_verified: false,
      created_at: Timestamp.now(), // Client SDK Timestamp
      updated_at: Timestamp.now() // Client SDK Timestamp
    });

    // Create user stats entry
    const userStatsRef = doc(db, 'user_stats', userRef.id);
    await setDoc(userStatsRef, {
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: Timestamp.now() // Client SDK Timestamp
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
    const usersCollection = collection(db, 'users');
    const usersQuery = query(usersCollection, where('email', '==', email), where('is_active', '==', true));
    const usersSnap = await getDocs(usersQuery);

    if (usersSnap.empty) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const user = usersSnap.docs[0].data();
    const userId = usersSnap.docs[0].id;

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
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      updated_at: Timestamp.now() // Client SDK Timestamp
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

// Get current user profile (used for dashboard info)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      email: req.user.email,
      phone: req.user.phone,
      accountType: req.user.account_type,
      profileImage: req.user.profile_image,
      company: req.user.company,
      website: req.user.website,
      bio: req.user.bio,
      isActive: req.user.is_active,
      emailVerified: req.user.email_verified,
      createdAt: req.user.created_at,
      updatedAt: req.user.updated_at
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

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      company: company,
      website: website,
      bio: bio,
      updated_at: Timestamp.now() // Client SDK Timestamp
    });

    const updatedUserDoc = await getDoc(userRef);
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

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      profile_image: profileImage,
      updated_at: Timestamp.now() // Client SDK Timestamp
    });

    // Send success response with plain text
    res.status(200).send(profileImage);

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user stats (dashboard)
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const statsRef = doc(db, 'user_stats', userId);
    const stats = await getDoc(statsRef);

    if (!stats.exists()) {
      // Create default stats if not exists
      await setDoc(statsRef, {
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        last_activity: Timestamp.now() // Client SDK Timestamp
      });

      res.json({
        coursesEnrolled: 0,
        coursesCompleted: 0,
        certificatesEarned: 0,
        learningStreak: 0,
        lastActivity: Timestamp.now() // Client SDK Timestamp
      });
    } else {
      const userStats = stats.data();
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

// --- GET All Posts (with Pagination, Likes, Comments, etc.) ---
app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limitCount = parseInt(req.query.limit, 10) || 10; // Renamed to avoid conflict with `limit` from firestore query
  const offset = (page - 1) * limitCount;

  try {
    const socialActivitiesCollection = collection(db, 'social_activities');
    const usersCollection = collection(db, 'users');
    const userConnectionsCollection = collection(db, 'user_connections');

    // Fetch all posts (initial filter for visibility)
    const allPostsQuery = query(socialActivitiesCollection, where('activity_type', '==', 'post'), orderBy('created_at', 'desc'));
    const allPostsSnap = await getDocs(allPostsQuery);

    const connections1Query = query(userConnectionsCollection, where('user_id_1', '==', userId), where('status', '==', 'accepted'));
    const connections1Snap = await getDocs(connections1Query);
    const connections2Query = query(userConnectionsCollection, where('user_id_2', '==', userId), where('status', '==', 'accepted'));
    const connections2Snap = await getDocs(connections2Query);
    const connections = [
      ...connections1Snap.docs.map(d => d.data().user_id_2),
      ...connections2Snap.docs.map(d => d.data().user_id_1)
    ];

    const visiblePosts = [];
    allPostsSnap.docs.forEach(docSnapshot => {
      const p = docSnapshot.data();
      if (
        p.visibility === 'public' ||
        (p.visibility === 'private' && p.user_id === userId) ||
        (p.visibility === 'connections' && (p.user_id === userId || connections.includes(p.user_id)))
      ) {
        visiblePosts.push({ id: docSnapshot.id, ...p });
      }
    });

    const totalPosts = visiblePosts.length;
    const totalPages = Math.ceil(totalPosts / limitCount);

    // Manual pagination of filtered posts
    const paginatedPosts = visiblePosts.slice(offset, offset + limitCount);

    const posts = [];
    for (const postDoc of paginatedPosts) {
      const post = { ...postDoc }; // Create a mutable copy

      const userDocRef = doc(usersCollection, post.user_id);
      const userDoc = await getDoc(userDocRef);
      const u = userDoc.data();

      const likesQuery = query(socialActivitiesCollection, where('activity_type', '==', 'like'), where('target_id', '==', post.id));
      const likesSnap = await getDocs(likesQuery);
      post.likes = likesSnap.size;

      const commentsQuery = query(socialActivitiesCollection, where('activity_type', '==', 'comment'), where('target_id', '==', post.id));
      const commentsSnap = await getDocs(commentsQuery);
      post.comment_count = commentsSnap.size;

      const userLikeQuery = query(socialActivitiesCollection, where('activity_type', '==', 'like'), where('target_id', '==', post.id), where('user_id', '==', userId));
      const userLikeSnap = await getDocs(userLikeQuery);
      post.has_liked = !userLikeSnap.empty;

      const userBookmarkQuery = query(socialActivitiesCollection, where('activity_type', '==', 'bookmark'), where('target_id', '==', post.id), where('user_id', '==', userId));
      const userBookmarkSnap = await getDocs(userBookmarkQuery);
      post.has_bookmarked = !userBookmarkSnap.empty;

      post.image_url = getFullImageUrl(req, post.image_url);

      post.user = {
        id: post.user_id,
        first_name: u.first_name,
        last_name: u.last_name,
        profile_image: getFullImageUrl(req, u.profile_image),
        account_type: u.account_type
      };

      const commentsForPostQuery = query(socialActivitiesCollection, where('activity_type', '==', 'comment'), where('target_id', '==', post.id), orderBy('created_at'));
      const commentsForPostSnap = await getDocs(commentsForPostQuery);

      post.comments = [];
      for (const commentDoc of commentsForPostSnap.docs) {
        const c = { id: commentDoc.id, ...commentDoc.data() };
        const commentUserDocRef = doc(usersCollection, c.user_id);
        const commentUserDoc = await getDoc(commentUserDocRef);
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

      const socialActivitiesCollection = collection(db, 'social_activities');
      const postRef = doc(socialActivitiesCollection);
      await setDoc(postRef, {
        user_id: userId,
        activity_type: 'post',
        content: content || '',
        image_url: imageUrl,
        achievement: isAchievement,
        visibility: visibility,
        created_at: Timestamp.now(), // Client SDK Timestamp
        updated_at: Timestamp.now(), // Client SDK Timestamp
        share_count: 0
      });

      const postId = postRef.id;

      const newPostDoc = await getDoc(postRef);
      const newPost = newPostDoc.data();

      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
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
    const postRef = doc(db, 'social_activities', id);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = postDoc.data();

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    await updateDoc(postRef, {
      content: content,
      updated_at: Timestamp.now() // Client SDK Timestamp
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
    const postRef = doc(db, 'social_activities', id);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = postDoc.data();

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    // Delete the post record
    await deleteDoc(postRef);

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
    const socialActivitiesCollection = collection(db, 'social_activities');
    const commentRef = doc(socialActivitiesCollection);
    await setDoc(commentRef, {
      user_id: userId,
      activity_type: 'comment',
      content: content,
      target_id: targetId,
      created_at: Timestamp.now() // Client SDK Timestamp
    });

    const commentId = commentRef.id;

    // Fetch the new comment with user info to return
    const newCommentDoc = await getDoc(commentRef);
    const newComment = newCommentDoc.data();

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    const u = userDoc.data();

    res.status(201).json({
      ...newComment,
      id: commentId,
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
    const socialActivitiesCollection = collection(db, 'social_activities');
    const likeQuery = query(socialActivitiesCollection, where('user_id', '==', userId), where('activity_type', '==', 'like'), where('target_id', '==', targetId));
    const likeSnap = await getDocs(likeQuery);

    if (!likeSnap.empty) {
      return res.status(400).json({ error: 'Post already liked.' });
    }

    const likeRef = doc(socialActivitiesCollection);
    await setDoc(likeRef, {
      user_id: userId,
      activity_type: 'like',
      target_id: targetId,
      created_at: Timestamp.now() // Client SDK Timestamp
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
    const socialActivitiesCollection = collection(db, 'social_activities');
    const likeQuery = query(socialActivitiesCollection, where('user_id', '==', userId), where('activity_type', '==', 'like'), where('target_id', '==', targetId));
    const likeSnap = await getDocs(likeQuery);

    if (likeSnap.empty) {
      return res.status(404).json({ error: 'Like not found' });
    }

    await deleteDoc(likeSnap.docs[0].ref); // Delete the document found

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
    const socialActivitiesCollection = collection(db, 'social_activities');
    const bookmarkQuery = query(socialActivitiesCollection, where('user_id', '==', userId), where('activity_type', '==', 'bookmark'), where('target_id', '==', targetId));
    const bookmarkSnap = await getDocs(bookmarkQuery);

    if (!bookmarkSnap.empty) {
      return res.status(400).json({ error: 'Post already bookmarked.' });
    }

    const bookmarkRef = doc(socialActivitiesCollection);
    await setDoc(bookmarkRef, {
      user_id: userId,
      activity_type: 'bookmark',
      target_id: targetId,
      created_at: Timestamp.now() // Client SDK Timestamp
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
    const socialActivitiesCollection = collection(db, 'social_activities');
    const bookmarkQuery = query(socialActivitiesCollection, where('user_id', '==', userId), where('activity_type', '==', 'bookmark'), where('target_id', '==', targetId));
    const bookmarkSnap = await getDocs(bookmarkQuery);

    if (bookmarkSnap.empty) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    await deleteDoc(bookmarkSnap.docs[0].ref); // Delete the document found

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
    const postRef = doc(db, 'social_activities', postId);
    await updateDoc(postRef, {
      share_count: FieldValue.increment(1) // Client SDK FieldValue
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
  if (req.params.userId !== userId) { // userId is string from Firebase, so no parseInt
    return res.status(403).json({ message: 'Forbidden: You can only access your own enrollment data.' });
  }

  try {
    const enrollmentsCollection = collection(db, 'enrollments');
    const coursesCollection = collection(db, 'courses');

    const enrollmentsQuery = query(enrollmentsCollection, where('user_id', '==', userId), orderBy('enrollment_date', 'desc'));
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    const enrollments = [];
    for (const docSnapshot of enrollmentsSnap.docs) {
      const e = docSnapshot.data();
      const courseDocRef = doc(coursesCollection, e.course_id);
      const course = await getDoc(courseDocRef);
      const c = course.data();
      enrollments.push({
        id: docSnapshot.id,
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

  if (req.params.userId !== userId) { // userId is string from Firebase, so no parseInt
    return res.status(403).json({ message: 'Forbidden: You can only access your own internship submissions.' });
  }

  try {
    const internshipSubmissionsCollection = collection(db, 'internship_submissions');
    const internshipsCollection = collection(db, 'internships');

    const submissionsQuery = query(internshipSubmissionsCollection, where('user_id', '==', userId), orderBy('submitted_at', 'desc'));
    const submissionsSnap = await getDocs(submissionsQuery);

    const applications = [];
    for (const docSnapshot of submissionsSnap.docs) {
      const sub = docSnapshot.data();
      const internshipDocRef = doc(internshipsCollection, sub.internship_id);
      const internship = await getDoc(internshipDocRef);
      const i = internship.data();
      applications.push({
        id: docSnapshot.id,
        internship_id: sub.internship_id,
        status: sub.status,
        submitted_at: sub.submitted_at,
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

// Assumes a 'services' table with detailed service info, joined with 'service_categories'
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const servicesCollection = collection(db, 'services');
    const serviceCategoriesCollection = collection(db, 'service_categories');

    const servicesSnap = await getDocs(servicesCollection);
    const services = [];
    for (const docSnapshot of servicesSnap.docs) {
      const s = docSnapshot.data();
      const categoryDocRef = doc(serviceCategoriesCollection, s.category_id);
      const categoryDoc = await getDoc(categoryDocRef);
      if (categoryDoc.exists() && categoryDoc.data().is_active) {
        services.push({
          id: docSnapshot.id,
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

  if (req.params.userId !== userId) { // userId is string from Firebase, so no parseInt
    return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
  }

  try {
    const serviceRequestsCollection = collection(db, 'service_requests');
    const serviceSubcategoriesCollection = collection(db, 'service_subcategories');
    const serviceCategoriesCollection = collection(db, 'service_categories');

    const requestsQuery = query(serviceRequestsCollection, where('user_id', '==', userId), orderBy('created_at', 'desc'));
    const requestsSnap = await getDocs(requestsQuery);

    const requests = [];
    for (const docSnapshot of requestsSnap.docs) {
      const sr = docSnapshot.data();
      const subcategoryDocRef = doc(serviceSubcategoriesCollection, sr.subcategory_id);
      const subcategoryDoc = await getDoc(subcategoryDocRef);
      const sc = subcategoryDoc.data();
      const categoryDocRef = doc(serviceCategoriesCollection, sc.category_id);
      const categoryDoc = await getDoc(categoryDocRef);
      const category = categoryDoc.data();
      requests.push({
        id: docSnapshot.id,
        userId: sr.user_id,
        subcategory_id: sr.subcategory_id, // Renamed from categoryId for clarity
        categoryName: category.name,
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
        updated_at: sr.updated_at
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
    subcategory_id,
    full_name,
    email,
    phone,
    company,
    website,
    project_details,
    budget_range,
    timeline,
    contact_method,
    additional_requirements
  } = req.body;

  // Validate required fields based on your 'service_requests' table schema
  if (!subcategory_id || !full_name || !email || !phone || !project_details || !budget_range || !timeline || !contact_method) {
    return res.status(400).json({ message: 'Missing required fields for service request. Please fill in all necessary details.' });
  }

  try {
    const serviceRequestsCollection = collection(db, 'service_requests');
    const requestRef = doc(serviceRequestsCollection);
    await setDoc(requestRef, {
      user_id: userId,
      subcategory_id,
      full_name,
      email,
      phone,
      company: company || null,
      website: website || null,
      project_details,
      budget_range,
      timeline,
      contact_method,
      additional_requirements: additional_requirements || null,
      status: 'pending',
      created_at: Timestamp.now(), // Client SDK Timestamp
      updated_at: Timestamp.now() // Client SDK Timestamp
    });

    // Return the ID of the newly created request
    res.status(201).json({ message: 'Service request submitted successfully!', id: requestRef.id });
  } catch (error) {
    console.error('Error submitting service request:', error);
    res.status(500).json({ message: 'Failed to submit service request. An internal server error occurred.', error: error.message });
  }
});

// ==================== CALENDAR EVENTS ROUTES ====================

// GET /api/calendar/events - Get all calendar events for current user
app.get('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsCollection = collection(db, 'enrollments');
    const coursesCollection = collection(db, 'courses');
    const assignmentsCollection = collection(db, 'assignments');
    const assignmentSubmissionsCollection = collection(db, 'assignment_submissions');
    const customCalendarEventsCollection = collection(db, 'custom_calendar_events');

    // Get course start/end dates for enrolled courses
    const enrollmentsQuery = query(enrollmentsCollection, where('user_id', '==', userId), where('status', '==', 'active'));
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    const courseEvents = [];
    for (const docSnapshot of enrollmentsSnap.docs) {
      const e = docSnapshot.data();
      const courseDocRef = doc(coursesCollection, e.course_id);
      const course = await getDoc(courseDocRef);
      const c = course.data();
      courseEvents.push({
        id: course.id,
        title: c.title,
        description: c.description,
        date: c.created_at,
        type: 'course_start',
        course_id: course.id,
        course_title: c.title,
        course_category: c.category
      });
    }

    // Get assignment deadlines
    const assignmentEvents = [];
    for (const docSnapshot of enrollmentsSnap.docs) {
      const e = docSnapshot.data();
      const assignmentsQuery = query(assignmentsCollection, where('course_id', '==', e.course_id));
      const assignmentsSnap = await getDocs(assignmentsQuery);
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        const submissionQuery = query(assignmentSubmissionsCollection, where('assignment_id', '==', aDoc.id), where('user_id', '==', userId));
        const submissionSnap = await getDocs(submissionQuery);
        let status = 'pending';
        if (!submissionSnap.empty) {
          if (submissionSnap.docs[0].data().status === 'graded') status = 'completed';
        } else if (a.due_date.toDate() < new Date()) {
          status = 'overdue';
        }
        const courseDocRef = doc(coursesCollection, e.course_id);
        const course = await getDoc(courseDocRef);
        const c = course.data();
        assignmentEvents.push({
          id: aDoc.id,
          title: a.title,
          description: a.description,
          date: a.due_date,
          type: 'assignment',
          course_id: e.course_id,
          course_title: c.title,
          course_category: c.category,
          status
        });
      }
    }

    // Get custom calendar events
    const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
    const customEventsQuery = query(customCalendarEventsCollection, where('user_id', '==', userId), where('event_date', '>=', Timestamp.fromDate(thirtyDaysAgo)), orderBy('event_date'));
    const customEventsSnap = await getDocs(customEventsQuery);

    const customEvents = customEventsSnap.docs.map(docSnapshot => {
      const event = docSnapshot.data();
      return {
        id: docSnapshot.id,
        title: event.title,
        description: event.description,
        date: event.event_date,
        time: event.event_time,
        type: event.event_type,
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
    // For Firestore queries, we need to define the start and end of the day
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const enrollmentsCollection = collection(db, 'enrollments');
    const coursesCollection = collection(db, 'courses');
    const assignmentsCollection = collection(db, 'assignments');
    const assignmentSubmissionsCollection = collection(db, 'assignment_submissions');
    const customCalendarEventsCollection = collection(db, 'custom_calendar_events');

    const enrollmentsQuery = query(enrollmentsCollection, where('user_id', '==', userId), where('status', '==', 'active'));
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    const eventsResult = [];
    for (const docSnapshot of enrollmentsSnap.docs) {
      const e = docSnapshot.data();
      const courseDocRef = doc(coursesCollection, e.course_id);
      const course = await getDoc(courseDocRef);
      const c = course.data();

      if (c.created_at.toDate().toISOString().split('T')[0] === date) {
        eventsResult.push({
          event_type: 'course_start',
          id: course.id,
          title: `Course: ${c.title}`,
          description: c.description,
          date: c.created_at,
          time: null,
          course_id: course.id,
          course_title: c.title,
          course_category: c.category,
          status: 'active'
        });
      }

      const assignmentsQuery = query(assignmentsCollection, where('course_id', '==', e.course_id));
      const assignmentsSnap = await getDocs(assignmentsQuery);
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        if (a.due_date.toDate().toISOString().split('T')[0] === date) {
          const submissionQuery = query(assignmentSubmissionsCollection, where('assignment_id', '==', aDoc.id), where('user_id', '==', userId));
          const submissionSnap = await getDocs(submissionQuery);
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

    // Custom events
    const customQuery = query(customCalendarEventsCollection, where('user_id', '==', userId), where('event_date', '>=', Timestamp.fromDate(startOfDay)), where('event_date', '<=', Timestamp.fromDate(endOfDay)));
    const customResult = await getDocs(customQuery);

    const customEvents = customResult.docs.map(docSnapshot => {
      const event = docSnapshot.data();
      return {
        event_type: 'custom',
        id: docSnapshot.id,
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

    const upcomingEvents = [];

    const enrollmentsCollection = collection(db, 'enrollments');
    const coursesCollection = collection(db, 'courses');
    const assignmentsCollection = collection(db, 'assignments');
    const assignmentSubmissionsCollection = collection(db, 'assignment_submissions');
    const customCalendarEventsCollection = collection(db, 'custom_calendar_events');


    const enrollmentsQuery = query(enrollmentsCollection, where('user_id', '==', userId), where('status', '==', 'active'));
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    for (const docSnapshot of enrollmentsSnap.docs) {
      const e = docSnapshot.data();
      const assignmentsQuery = query(assignmentsCollection, where('course_id', '==', e.course_id), where('due_date', '>=', Timestamp.fromDate(now)), where('due_date', '<=', Timestamp.fromDate(sevenDaysLater)), orderBy('due_date'), firebaseLimit(10));
      const assignmentsSnap = await getDocs(assignmentsQuery);
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        const courseDocRef = doc(coursesCollection, e.course_id);
        const course = await getDoc(courseDocRef);
        const c = course.data();
        const submissionQuery = query(assignmentSubmissionsCollection, where('assignment_id', '==', aDoc.id), where('user_id', '==', userId));
        const submissionSnap = await getDocs(submissionQuery);
        let status = 'pending';
        if (!submissionSnap.empty) {
          if (submissionSnap.docs[0].data().status === 'graded') status = 'completed';
        } else if (a.due_date.toDate() < new Date()) { // Compare with current date
          status = 'overdue';
        }
        upcomingEvents.push({
          id: aDoc.id,
          title: a.title,
          description: a.description,
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

    // Custom events
    const customQuery = query(customCalendarEventsCollection, where('user_id', '==', userId), where('event_date', '>=', Timestamp.fromDate(now)), where('event_date', '<=', Timestamp.fromDate(sevenDaysLater)), orderBy('event_date'), firebaseLimit(5));
    const customSnap = await getDocs(customQuery);

    customSnap.docs.forEach(docSnapshot => {
      const event = docSnapshot.data();
      upcomingEvents.push({
        id: docSnapshot.id,
        title: event.title,
        description: event.description,
        date: event.event_date,
        time: event.event_time,
        type: event.event_type,
        color: 'purple'
      });
    });

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

    const enrollmentsCollection = collection(db, 'enrollments');
    const assignmentsCollection = collection(db, 'assignments');
    const assignmentSubmissionsCollection = collection(db, 'assignment_submissions');

    const enrollmentsQuery = query(enrollmentsCollection, where('user_id', '==', userId));
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    let totalAssignments = 0;
    let pendingAssignments = 0;
    let completedAssignments = 0;
    let overdueAssignments = 0;
    let activeCourses = 0;
    let completedCourses = 0;

    for (const docSnapshot of enrollmentsSnap.docs) {
      const e = docSnapshot.data();
      if (e.status === 'active') activeCourses++;
      if (e.status === 'completed') completedCourses++;

      const assignmentsQuery = query(assignmentsCollection, where('course_id', '==', e.course_id));
      const assignmentsSnap = await getDocs(assignmentsQuery);
      for (const aDoc of assignmentsSnap.docs) {
        totalAssignments++;
        const a = aDoc.data();
        const submissionQuery = query(assignmentSubmissionsCollection, where('assignment_id', '==', aDoc.id), where('user_id', '==', userId));
        const submissionSnap = await getDocs(submissionQuery);
        if (!submissionSnap.empty) {
          if (submissionSnap.docs[0].data().status === 'graded') completedAssignments++;
        } else {
          if (a.due_date.toDate() >= new Date()) pendingAssignments++;
          else overdueAssignments++;
        }
      }
    }

    res.json({
      pendingAssignments,
      completedAssignments,
      overdueAssignments,
      activeCourses,
      completedCourses,
      totalAssignments
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

    const enrollmentsCollection = collection(db, 'enrollments');
    const assignmentsCollection = collection(db, 'assignments');
    const coursesCollection = collection(db, 'courses');
    const assignmentSubmissionsCollection = collection(db, 'assignment_submissions');

    const enrollmentsQuery = query(enrollmentsCollection, where('user_id', '==', userId), where('status', '==', 'active'));
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    const assignments = [];
    for (const docSnapshot of enrollmentsSnap.docs) {
      const e = docSnapshot.data();
      const assignmentsQuery = query(assignmentsCollection, where('course_id', '==', e.course_id), orderBy('due_date'));
      const assignmentsSnap = await getDocs(assignmentsQuery);
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        const courseDocRef = doc(coursesCollection, e.course_id);
        const course = await getDoc(courseDocRef);
        const c = course.data();
        const submissionQuery = query(assignmentSubmissionsCollection, where('assignment_id', '==', aDoc.id), where('user_id', '==', userId));
        const submissionSnap = await getDocs(submissionQuery);
        let submission = null;
        if (!submissionSnap.empty) {
          submission = submissionSnap.docs[0].data();
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

    const customCalendarEventsCollection = collection(db, 'custom_calendar_events');
    const eventRef = doc(customCalendarEventsCollection);
    await setDoc(eventRef, {
      user_id: userId,
      title,
      description,
      event_date: new Date(date), // Store as Date object
      event_time: time,
      event_type: type,
      created_at: Timestamp.now(), // Client SDK Timestamp
      updated_at: Timestamp.now() // Client SDK Timestamp
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

    const eventRef = doc(db, 'custom_calendar_events', id);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists() || eventDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    await updateDoc(eventRef, {
      title,
      description,
      event_date: new Date(date), // Store as Date object
      event_time: time,
      event_type: type,
      updated_at: Timestamp.now() // Client SDK Timestamp
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

    const eventRef = doc(db, 'custom_calendar_events', id);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists() || eventDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    await deleteDoc(eventRef);

    res.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
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

      const courseEnrollRequestsCollection = collection(db, 'course_enroll_requests');
      const requestRef = doc(courseEnrollRequestsCollection);
      await setDoc(requestRef, {
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
        payment_screenshot: `/uploads/payments/${req.file.filename}`,
        created_at: Timestamp.now(), // Client SDK Timestamp
        status: 'pending' // Initial status
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
    const coursesCollection = collection(db, 'courses');
    const coursesQuery = query(coursesCollection, where('is_active', '==', true), orderBy('created_at', 'desc'));
    const coursesSnap = await getDocs(coursesQuery);

    const formattedCourses = coursesSnap.docs.map(docSnapshot => {
      const course = docSnapshot.data();
      return {
        id: docSnapshot.id,
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

// Get user's enrolled courses (duplicate from above, but kept if clients use this path)
app.get('/api/enrollments/my-courses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsCollection = collection(db, 'enrollments');
    const coursesCollection = collection(db, 'courses');

    const enrollmentsQuery = query(enrollmentsCollection, where('user_id', '==', userId), where('status', '==', 'active'), orderBy('enrollment_date', 'desc'));
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    const myCourses = [];
    for (const docSnapshot of enrollmentsSnap.docs) {
      const e = docSnapshot.data();
      const courseDocRef = doc(coursesCollection, e.course_id);
      const course = await getDoc(courseDocRef);
      const c = course.data();
      myCourses.push({
        id: docSnapshot.id,
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

    res.json(myCourses);

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

    const enrollmentsCollection = collection(db, 'enrollments');
    const coursesCollection = collection(db, 'courses');
    const userStatsCollection = collection(db, 'user_stats');

    // Check if already enrolled
    const existingEnrollmentQuery = query(enrollmentsCollection, where('user_id', '==', userId), where('course_id', '==', courseId));
    const existingEnrollmentSnap = await getDocs(existingEnrollmentQuery);

    if (!existingEnrollmentSnap.empty) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const courseDocRef = doc(coursesCollection, courseId);
    const course = await getDoc(courseDocRef);

    if (!course.exists() || !course.data().is_active) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    const enrollmentRef = doc(enrollmentsCollection);
    await setDoc(enrollmentRef, {
      user_id: userId,
      course_id: courseId,
      enrollment_date: Timestamp.now(), // Client SDK Timestamp
      progress: 0,
      status: 'active'
    });

    // Update user stats
    const userStatsRef = doc(userStatsCollection, userId);
    await updateDoc(userStatsRef, {
      courses_enrolled: FieldValue.increment(1) // Client SDK FieldValue
    });

    res.status(201).json({ message: 'Successfully enrolled in course' });

  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get enrolled courses (dedicated for dashboard, consistent with original structure)
app.get('/api/courses/enrolled', authenticateToken, async (req, res) => {
  try {
    const enrollmentsCollection = collection(db, 'enrollments');
    const coursesCollection = collection(db, 'courses');

    const enrollmentsQuery = query(
      enrollmentsCollection,
      where('user_id', '==', req.user.id),
      where('status', '==', 'active'),
      orderBy('enrollment_date', 'desc')
    );
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    const courses = [];
    for (const docSnapshot of enrollmentsSnap.docs) {
      const e = docSnapshot.data();
      const courseDocRef = doc(coursesCollection, e.course_id);
      const course = await getDoc(courseDocRef);
      const c = course.data();
      courses.push({
        id: e.course_id,
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


// ==================== ASSIGNMENTS ROUTES ====================

// GET /assignments/my-assignments - Get user's assignments
app.get('/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsCollection = collection(db, 'enrollments');
    const coursesCollection = collection(db, 'courses');
    const assignmentsCollection = collection(db, 'assignments');
    const assignmentSubmissionsCollection = collection(db, 'assignment_submissions');

    const enrollmentsQuery = query(enrollmentsCollection, where('user_id', '==', userId));
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    const results = [];
    for (const docSnapshot of enrollmentsSnap.docs) {
      const e = docSnapshot.data();
      const courseDocRef = doc(coursesCollection, e.course_id);
      const course = await getDoc(courseDocRef);
      const c = course.data();
      if (c && c.is_active) { // Check if course exists and is active
        const assignmentsQuery = query(assignmentsCollection, where('course_id', '==', e.course_id), orderBy('due_date'));
        const assignmentsSnap = await getDocs(assignmentsQuery);
        for (const aDoc of assignmentsSnap.docs) {
          const a = aDoc.data();
          const submissionQuery = query(assignmentSubmissionsCollection, where('assignment_id', '==', aDoc.id), where('user_id', '==', userId));
          const submissionSnap = await getDocs(submissionQuery);
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
app.get('/assignments/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentsCollection = collection(db, 'assignments');
    const coursesCollection = collection(db, 'courses');
    const assignmentSubmissionsCollection = collection(db, 'assignment_submissions');

    const assignmentsSnap = await getDocs(assignmentsCollection);
    const results = [];
    const promises = assignmentsSnap.docs.map(async (aDoc) => {
      const a = aDoc.data();
      const courseDocRef = doc(coursesCollection, a.course_id);
      const course = await getDoc(courseDocRef);
      const c = course.data();
      if (c && c.is_active) {
        const submissionsQuery = query(assignmentSubmissionsCollection, where('assignment_id', '==', aDoc.id));
        const submissionsSnap = await getDocs(submissionsQuery);
        let submission_count = submissionsSnap.size;
        let graded_count = 0;
        submissionsSnap.docs.forEach(s => {
          if (s.data().status === 'graded') graded_count++;
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
    });

    await Promise.all(promises);
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
    const assignmentsCollection = collection(db, 'assignments');
    const enrollmentsCollection = collection(db, 'enrollments');
    const assignmentSubmissionsCollection = collection(db, 'assignment_submissions');

    // Check if assignment exists and user is enrolled
    const assignmentDocRef = doc(assignmentsCollection, assignment_id);
    const aDoc = await getDoc(assignmentDocRef);

    if (!aDoc.exists()) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const course_id = aDoc.data().course_id;

    const enrollmentQuery = query(enrollmentsCollection, where('course_id', '==', course_id), where('user_id', '==', req.user.id));
    const enrollmentSnap = await getDocs(enrollmentQuery);

    if (enrollmentSnap.empty) {
      return res.status(403).json({ error: 'User not enrolled in this course' });
    }

    const existingSubmissionQuery = query(assignmentSubmissionsCollection, where('assignment_id', '==', assignment_id), where('user_id', '==', req.user.id));
    const existingSubmissionSnap = await getDocs(existingSubmissionQuery);

    if (!existingSubmissionSnap.empty) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }

    const submissionRef = doc(assignmentSubmissionsCollection);
    await setDoc(submissionRef, {
      assignment_id,
      user_id: req.user.id,
      content: content || '',
      file_path,
      submitted_at: Timestamp.now(), // Client SDK Timestamp
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
    const submissionDocRef = doc(db, 'assignment_submissions', submissionId);
    const sDoc = await getDoc(submissionDocRef);

    if (!sDoc.exists()) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const s = sDoc.data();

    const assignmentDocRef = doc(db, 'assignments', s.assignment_id);
    await getDoc(assignmentDocRef); // Ensure assignment exists, though not used further

    if (s.user_id !== req.user.id && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!s.file_path) {
      return res.status(404).json({ error: 'No file attached to this submission' });
    }

    const filePath = path.join(assignmentsDir, s.file_path); // Use the correct local directory

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
    const enrollmentsCollection = collection(db, 'enrollments');
    const assignmentsCollection = collection(db, 'assignments');
    const coursesCollection = collection(db, 'courses');
    const assignmentSubmissionsCollection = collection(db, 'assignment_submissions');

    const enrollmentQuery = query(enrollmentsCollection, where('course_id', '==', courseId), where('user_id', '==', req.user.id));
    const enrollmentSnap = await getDocs(enrollmentQuery);

    if (enrollmentSnap.empty && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignmentsQuery = query(assignmentsCollection, where('course_id', '==', courseId), orderBy('due_date'));
    const assignmentsSnap = await getDocs(assignmentsQuery);

    const results = [];
    const promises = assignmentsSnap.docs.map(async (aDoc) => {
      const a = aDoc.data();
      const submissionQuery = query(assignmentSubmissionsCollection, where('assignment_id', '==', aDoc.id), where('user_id', '==', req.user.id));
      const submissionSnap = await getDocs(submissionQuery);
      let sub = null;
      if (!submissionSnap.empty) {
        sub = submissionSnap.docs[0].data();
      }
      const courseDocRef = doc(coursesCollection, courseId);
      const course = await getDoc(courseDocRef);
      const c = course.data();
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
    });

    await Promise.all(promises);
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
app.put('/assignments/grade/:submissionId', authenticateToken, requireAdmin, async (req, res) => {
  const submissionId = req.params.submissionId;
  const { grade, feedback } = req.body;

  // Validate grade
  if (grade < 0 || grade > 100) {
    return res.status(400).json({ error: 'Grade must be between 0 and 100' });
  }

  try {
    const submissionRef = doc(db, 'assignment_submissions', submissionId);
    await updateDoc(submissionRef, {
      grade,
      feedback: feedback || '',
      status: 'graded'
    });
    res.json({
      success: true,
      message: 'Assignment graded successfully'
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ==================== INTERNSHIPS SECTION ROUTES ====================

// GET /api/internships - Fetch all internships
app.get('/api/internships', async (req, res) => {
  try {
    const internshipsCollection = collection(db, 'internships');
    const internshipsQuery = query(internshipsCollection, orderBy('posted_at', 'desc'));
    const internshipsSnap = await getDocs(internshipsQuery);

    const data = internshipsSnap.docs.map(docSnapshot => {
      const i = docSnapshot.data();
      return {
        id: docSnapshot.id,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: i.requirements,
        benefits: i.benefits,
        posted_at: i.posted_at,
        applications_count: i.applications_count,
        spots_available: i.spots_available
      };
    });

    res.json(data);
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
    const internshipSubmissionsCollection = collection(db, 'internship_submissions');
    const internshipsCollection = collection(db, 'internships');

    const applicationsQuery = query(internshipSubmissionsCollection, where('user_id', '==', userId), orderBy('submitted_at', 'desc'));
    const applicationsSnap = await getDocs(applicationsQuery);

    const parsedApplications = [];
    for (const docSnapshot of applicationsSnap.docs) {
      const app = docSnapshot.data();
      const internshipDocRef = doc(internshipsCollection, app.internship_id);
      const internship = await getDoc(internshipDocRef);
      const i = internship.data();
      parsedApplications.push({
        id: docSnapshot.id,
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
        requirements: i.requirements || '[]',
        benefits: i.benefits || '[]',
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
    const internshipsCollection = collection(db, 'internships');
    const internshipSubmissionsCollection = collection(db, 'internship_submissions');

    const internshipDocRef = doc(internshipsCollection, internshipId);
    const internship = await getDoc(internshipDocRef);

    if (!internship.exists()) {
      return res.status(404).json({ message: 'Internship not found.' });
    }

    const i = internship.data();

    if (i.spots_available <= 0) {
      return res.status(400).json({ message: 'No available spots left for this internship.' });
    }

    const existingApplicationQuery = query(internshipSubmissionsCollection, where('internship_id', '==', internshipId), where('user_id', '==', userId));
    const existingApplicationSnap = await getDocs(existingApplicationQuery);

    if (!existingApplicationSnap.empty) {
      return res.status(409).json({ message: 'You have already applied for this internship.' });
    }

    const newSubmissionRef = doc(internshipSubmissionsCollection); // Auto-generate ID
    await setDoc(newSubmissionRef, {
      internship_id: internshipId,
      user_id: userId,
      full_name,
      email,
      phone: phone || null,
      resume_url,
      cover_letter: cover_letter || null,
      submitted_at: Timestamp.now(), // Client SDK Timestamp
      status: 'pending'
    });

    await updateDoc(internshipDocRef, {
      spots_available: FieldValue.increment(-1), // Client SDK FieldValue
      applications_count: FieldValue.increment(1) // Client SDK FieldValue
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
    const serviceCategoriesCollection = collection(db, 'service_categories');
    const serviceSubcategoriesCollection = collection(db, 'service_subcategories');

    const categoriesQuery = query(serviceCategoriesCollection, where('is_active', '==', true), orderBy('name'));
    const categoriesSnap = await getDocs(categoriesQuery);

    const categoriesWithSubs = [];
    for (const docSnapshot of categoriesSnap.docs) {
      const category = docSnapshot.data();
      const subsQuery = query(serviceSubcategoriesCollection, where('category_id', '==', docSnapshot.id), where('is_active', '==', true), orderBy('name'));
      const subsSnap = await getDocs(subsQuery);
      categoriesWithSubs.push({
        id: docSnapshot.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        subcategories: subsSnap.docs.map(sDoc => ({
          id: sDoc.id,
          categoryId: sDoc.data().category_id,
          name: sDoc.data().name,
          description: sDoc.data().description,
          basePrice: sDoc.data().base_price
        }))
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
    const subcategoryDocRef = doc(db, 'service_subcategories', subcategoryId);
    const subcategory = await getDoc(subcategoryDocRef);

    if (!subcategory.exists() || !subcategory.data().is_active) {
      return res.status(404).json({ error: 'Service subcategory not found' });
    }

    // Create service request
    const serviceRequestsCollection = collection(db, 'service_requests');
    const requestRef = doc(serviceRequestsCollection);
    await setDoc(requestRef, {
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
      created_at: Timestamp.now(), // Client SDK Timestamp
      status: 'pending'
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

    const serviceRequestsCollection = collection(db, 'service_requests');
    const serviceSubcategoriesCollection = collection(db, 'service_subcategories');
    const serviceCategoriesCollection = collection(db, 'service_categories');

    const requestsQuery = query(serviceRequestsCollection, where('user_id', '==', userId), orderBy('created_at', 'desc'));
    const requestsSnap = await getDocs(requestsQuery);

    const formattedRequests = [];
    for (const docSnapshot of requestsSnap.docs) {
      const r = docSnapshot.data();
      const subcategoryDocRef = doc(serviceSubcategoriesCollection, r.subcategory_id);
      const subcategory = await getDoc(subcategoryDocRef);
      const ss = subcategory.data();
      const categoryDocRef = doc(serviceCategoriesCollection, ss.category_id);
      const category = await getDoc(categoryDocRef);
      const sc = category.data();
      formattedRequests.push({
        id: docSnapshot.id,
        user_id: r.user_id,
        subcategory_id: r.subcategory_id,
        full_name: r.full_name,
        email: r.email,
        phone: r.phone,
        company: r.company,
        website: r.website,
        project_details: r.project_details,
        budget_range: r.budget_range,
        timeline: r.timeline,
        contact_method: r.contact_method,
        additional_requirements: r.additional_requirements,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
        category_name: sc.name,
        subcategory_name: ss.name
      });
    }

    res.json(formattedRequests.map(request => ({
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
      categoryName: request.category_name,
      subcategoryName: request.subcategory_name
    })));

  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== CERTIFICATES ROUTES ====================

// Certificate Routes
app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const certificatesCollection = collection(db, 'certificates');
    const coursesCollection = collection(db, 'courses');
    const enrollmentsCollection = collection(db, 'enrollments');
    const assignmentsCollection = collection(db, 'assignments');
    const assignmentSubmissionsCollection = collection(db, 'assignment_submissions');

    const certificatesQuery = query(certificatesCollection, where('user_id', '==', userId), orderBy('issued_date', 'desc'));
    const certificatesSnap = await getDocs(certificatesQuery);

    const formattedCertificates = [];
    for (const docSnapshot of certificatesSnap.docs) {
      const c = docSnapshot.data();
      const courseDocRef = doc(coursesCollection, c.course_id);
      const course = await getDoc(courseDocRef);
      const co = course.data();
      const enrollmentQuery = query(enrollmentsCollection, where('user_id', '==', userId), where('course_id', '==', c.course_id));
      const enrollmentSnap = await getDocs(enrollmentQuery);
      const e = enrollmentSnap.docs[0].data(); // Assuming one enrollment per user/course

      const assignmentsQuery = query(assignmentsCollection, where('course_id', '==', c.course_id));
      const assignmentsSnap = await getDocs(assignmentsQuery);
      let avgGrade = 0;
      let count = 0;
      for (const aDoc of assignmentsSnap.docs) {
        const submissionQuery = query(assignmentSubmissionsCollection, where('assignment_id', '==', aDoc.id), where('user_id', '==', userId));
        const submissionSnap = await getDocs(submissionQuery);
        if (!submissionSnap.empty) {
          avgGrade += submissionSnap.docs[0].data().grade || 0;
          count++;
        }
      }
      formattedCertificates.push({
        id: docSnapshot.id,
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
          completionDate: e.completion_date,
          finalGrade: Math.round(avgGrade / count || 0),
          status: e.status
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
    const certificateDocRef = doc(db, 'certificates', certificateId);
    const certificate = await getDoc(certificateDocRef);

    if (!certificate.exists() || certificate.data().user_id !== userId) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const cert = certificate.data();

    const courseDocRef = doc(db, 'courses', cert.course_id);
    const course = await getDoc(courseDocRef);
    const co = course.data();

    const userDocRef = doc(db, 'users', userId);
    const user = await getDoc(userDocRef);
    const u = user.data();

    // If certificate_url exists, redirect to it
    if (cert.certificate_url) {
      return res.redirect(cert.certificate_url);
    }

    // Otherwise, generate a simple PDF certificate
    const certificateData = {
      recipientName: `${u.first_name} ${u.last_name}`,
      courseName: co.title,
      completionDate: cert.issued_date,
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
app.get('/api/certificates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const certificatesCollection = collection(db, 'certificates');
    const coursesCollection = collection(db, 'courses');
    const usersCollection = collection(db, 'users');
    const enrollmentsCollection = collection(db, 'enrollments');

    const certificatesQuery = query(certificatesCollection, orderBy('issued_date', 'desc'));
    const certificatesSnap = await getDocs(certificatesQuery);

    const formattedCertificates = [];
    for (const docSnapshot of certificatesSnap.docs) {
      const c = docSnapshot.data();
      const courseDocRef = doc(coursesCollection, c.course_id);
      const course = await getDoc(courseDocRef);
      const co = course.data();
      const userDocRef = doc(usersCollection, c.user_id);
      const user = await getDoc(userDocRef);
      const u = user.data();
      const enrollmentQuery = query(enrollmentsCollection, where('user_id', '==', c.user_id), where('course_id', '==', c.course_id));
      const enrollmentSnap = await getDocs(enrollmentQuery);
      const e = enrollmentSnap.docs[0].data();
      formattedCertificates.push({
        id: docSnapshot.id,
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
          completionDate: e.completion_date
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
app.post('/api/certificates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, courseId, certificateUrl } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'User ID and Course ID are required' });
    }

    const enrollmentsCollection = collection(db, 'enrollments');
    const certificatesCollection = collection(db, 'certificates');
    const userStatsCollection = collection(db, 'user_stats');

    // Check if user has completed the course
    const enrollmentsQuery = query(enrollmentsCollection, where('user_id', '==', userId), where('course_id', '==', courseId), where('status', '==', 'completed'));
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    if (enrollmentsSnap.empty) {
      return res.status(400).json({ error: 'User has not completed this course' });
    }

    // Check if certificate already exists
    const existingCertificatesQuery = query(certificatesCollection, where('user_id', '==', userId), where('course_id', '==', courseId));
    const existingCertificatesSnap = await getDocs(existingCertificatesQuery);

    if (!existingCertificatesSnap.empty) {
      return res.status(400).json({ error: 'Certificate already exists for this user and course' });
    }

    // Create new certificate
    const certRef = doc(certificatesCollection);
    await setDoc(certRef, {
      user_id: userId,
      course_id: courseId,
      certificate_url: certificateUrl || null,
      issued_date: Timestamp.now() // Client SDK Timestamp
    });

    // Update user stats
    const userStatsRef = doc(userStatsCollection, userId);
    await updateDoc(userStatsRef, {
      certificates_earned: FieldValue.increment(1) // Client SDK FieldValue
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
app.put('/api/certificates/:certificateId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { certificateUrl } = req.body;

    const certificateRef = doc(db, 'certificates', certificateId);
    await updateDoc(certificateRef, {
      certificate_url: certificateUrl,
      issued_date: Timestamp.now() // Client SDK Timestamp
    });

    res.json({ message: 'Certificate updated successfully' });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ error: 'Failed to update certificate' });
  }
});

// Delete certificate (admin only)
app.delete('/api/certificates/:certificateId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificatesCollection = collection(db, 'certificates');
    const userStatsCollection = collection(db, 'user_stats');

    // Get certificate details before deletion
    const certificateRef = doc(certificatesCollection, certificateId);
    const certificate = await getDoc(certificateRef);

    if (!certificate.exists()) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const cert = certificate.data();

    // Delete certificate
    await deleteDoc(certificateRef);

    // Update user stats
    const userStatsRef = doc(userStatsCollection, cert.user_id);
    await updateDoc(userStatsRef, {
      certificates_earned: FieldValue.increment(-1) // Client SDK FieldValue
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
    // Student Resources
    {
      id: 1,
      title: "Digital Marketing Fundamentals",
      description: "Complete beginner's guide to digital marketing",
      type: "pdf",
      size: "3.2 MB",
      category: "Course Materials",
      allowedAccountTypes: ['student', 'professional', 'business', 'agency', 'admin'],
      isPremium: false
    },
    {
      id: 2,
      title: "SEO Checklist Template",
      description: "Step-by-step SEO optimization checklist",
      type: "excel",
      size: "1.5 MB",
      category: "Templates",
      allowedAccountTypes: ['student', 'professional', 'business', 'agency', 'admin'],
      isPremium: false
    },
    {
      id: 3,
      title: "Content Calendar Template",
      description: "Monthly content planning spreadsheet",
      type: "template",
      size: "2.1 MB",
      category: "Templates",
      allowedAccountTypes: ['student', 'professional', 'business', 'agency', 'admin'],
      isPremium: false
    },

    // Professional Resources
    {
      id: 4,
      title: "Advanced Analytics Guide",
      description: "Deep dive into Google Analytics 4",
      type: "pdf",
      size: "4.8 MB",
      category: "Professional Tools",
      allowedAccountTypes: ['professional', 'business', 'agency', 'admin'],
      isPremium: true
    },
    {
      id: 5,
      title: "Client Reporting Template",
      description: "Professional client performance reports",
      type: "excel",
      size: "2.3 MB",
      category: "Templates",
      allowedAccountTypes: ['professional', 'business', 'agency', 'admin'],
      isPremium: true
    },

    // Business Resources
    {
      id: 6,
      title: "Marketing Strategy Framework",
      description: "Complete business marketing strategy guide",
      type: "pdf",
      size: "6.1 MB",
      category: "Business Tools",
      allowedAccountTypes: ['business', 'agency', 'admin'],
      isPremium: true
    },
    {
      id: 7,
      title: "ROI Calculator Template",
      description: "Marketing ROI calculation spreadsheet",
      type: "excel",
      size: "1.8 MB",
      category: "Templates",
      allowedAccountTypes: ['business', 'agency', 'admin'],
      isPremium: true
    },

    // Agency Resources
    {
      id: 8,
      title: "Multi-Client Dashboard",
      description: "Agency client management system",
      type: "template",
      size: "5.2 MB",
      category: "Agency Tools",
      allowedAccountTypes: ['agency', 'admin'],
      isPremium: true
    },
    {
      id: 9,
      title: "White Label Reports",
      description: "Customizable client report templates",
      type: "template",
      size: "3.7 MB",
      category: "Agency Tools",
      allowedAccountTypes: ['agency', 'admin'],
      isPremium: true
    },

    // Tools (External Links)
    {
      id: 10,
      title: "Google Analytics",
      description: "Web analytics platform",
      type: "tool",
      url: "https://analytics.google.com",
      category: "External Tools",
      allowedAccountTypes: ['student', 'professional', 'business', 'agency', 'admin'],
      isPremium: false
    },
    {
      id: 11,
      title: "SEMrush",
      description: "SEO & marketing toolkit",
      type: "tool",
      url: "https://semrush.com",
      category: "External Tools",
      allowedAccountTypes: ['professional', 'business', 'agency', 'admin'],
      isPremium: false
    }
  ];

  return allResources.filter(resource =>
    resource.allowedAccountTypes.includes(accountType)
  );
};

// Get resources for current user
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
    const downloadLogsCollection = collection(db, 'download_logs');
    await setDoc(doc(downloadLogsCollection), { // Auto-ID document
      user_id: req.user.id,
      resource_id: resourceId,
      resource_name: resource.title,
      downloaded_at: Timestamp.now()
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


// ==================== ADMIN DASHBOARD ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersCollection = collection(db, 'users');
    const coursesCollection = collection(db, 'courses');
    const enrollmentsCollection = collection(db, 'enrollments');
    const contactMessagesCollection = collection(db, 'contact_messages');
    const serviceRequestsCollection = collection(db, 'service_requests');

    const usersQuery = query(usersCollection, where('is_active', '==', true));
    const usersSnap = await getDocs(usersQuery);
    const totalUsers = usersSnap.size;

    const coursesQuery = query(coursesCollection, where('is_active', '==', true));
    const coursesSnap = await getDocs(coursesQuery);
    const totalCourses = coursesSnap.size;

    const enrollmentsSnap = await getDocs(enrollmentsCollection);
    const totalEnrollments = enrollmentsSnap.size;

    let totalRevenue = 0;
    for (const docSnapshot of enrollmentsSnap.docs) {
      const e = docSnapshot.data();
      if (e.status === 'completed') {
        const courseDocRef = doc(coursesCollection, e.course_id);
        const course = await getDoc(courseDocRef);
        totalRevenue += course.data() ? (course.data().price || 0) : 0; // Handle missing course or price
      }
    }

    const sevenDaysAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
    const contactsQuery = query(contactMessagesCollection, where('created_at', '>=', Timestamp.fromDate(sevenDaysAgo)));
    const contactsSnap = await getDocs(contactsQuery);
    const pendingContacts = contactsSnap.size;

    const serviceRequestsQuery = query(serviceRequestsCollection, where('status', '==', 'pending'));
    const serviceRequestsSnap = await getDocs(serviceRequestsQuery);
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
app.get('/api/admin/recent-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersCollection = collection(db, 'users');
    const usersQuery = query(usersCollection, where('is_active', '==', true), orderBy('created_at', 'desc'), firebaseLimit(5)); // Assuming 'is_active' is boolean
    const usersSnap = await getDocs(usersQuery);

    const recentUsers = usersSnap.docs.map(docSnapshot => {
      const u = docSnapshot.data();
      return {
        id: docSnapshot.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        account_type: u.account_type,
        join_date: u.created_at.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
    });

    res.json(recentUsers);
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({ error: 'Failed to fetch recent users', details: error.message });
  }
});

// Recent Enrollments
app.get('/api/admin/recent-enrollments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const enrollmentsCollection = collection(db, 'enrollments');
    const usersCollection = collection(db, 'users');
    const coursesCollection = collection(db, 'courses');

    const enrollmentsQuery = query(enrollmentsCollection, orderBy('enrollment_date', 'desc'), firebaseLimit(5));
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    const recentEnrollments = [];
    for (const docSnapshot of enrollmentsSnap.docs) {
      const e = docSnapshot.data();
      const userDocRef = doc(usersCollection, e.user_id);
      const user = await getDoc(userDocRef);
      const u = user.data();
      const courseDocRef = doc(coursesCollection, e.course_id);
      const course = await getDoc(courseDocRef);
      const c = course.data();
      recentEnrollments.push({
        id: docSnapshot.id,
        user_name: u ? `${u.first_name} ${u.last_name}` : 'N/A',
        course_name: c ? c.title : 'N/A',
        date: e.enrollment_date.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: e.status
      });
    }

    res.json(recentEnrollments);
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
    const contactMessagesCollection = collection(db, 'contact_messages');
    const contactRef = doc(contactMessagesCollection); // Auto-generate ID
    await setDoc(contactRef, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      company: company || null,
      message: message.trim(),
      created_at: Timestamp.now() // Client SDK Timestamp
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

    const usersCollection = collection(db, 'users');
    const coursesCollection = collection(db, 'courses');
    const enrollmentsCollection = collection(db, 'enrollments');

    // User growth data (last 6 months)
    const usersQuery = query(usersCollection, where('created_at', '>=', Timestamp.fromDate(sixMonthsAgo)));
    const usersSnap = await getDocs(usersQuery);
    const userGrowth = {};
    usersSnap.docs.forEach(docSnapshot => {
      const created = docSnapshot.data().created_at.toDate();
      const month = created.toISOString().slice(0, 7);
      userGrowth[month] = (userGrowth[month] || 0) + 1;
    });

    // Course enrollment data
    const coursesQuery = query(coursesCollection, where('is_active', '==', true));
    const coursesSnap = await getDocs(coursesQuery);
    const courseEnrollments = [];
    for (const docSnapshot of coursesSnap.docs) {
      const enrollmentsQuery = query(enrollmentsCollection, where('course_id', '==', docSnapshot.id));
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      courseEnrollments.push({
        title: docSnapshot.data().title,
        enrollments: enrollmentsSnap.size
      });
    }
    courseEnrollments.sort((a, b) => b.enrollments - a.enrollments);
    const top10 = courseEnrollments.slice(0, 10);

    // Revenue by month
    const enrollmentsQueryForRevenue = query(enrollmentsCollection, where('enrollment_date', '>=', Timestamp.fromDate(sixMonthsAgo)));
    const enrollmentsSnapForRevenue = await getDocs(enrollmentsQueryForRevenue);
    const revenueData = {};
    for (const docSnapshot of enrollmentsSnapForRevenue.docs) {
      const e = docSnapshot.data();
      const month = e.enrollment_date.toDate().toISOString().slice(0, 7);
      const courseDocRef = doc(coursesCollection, e.course_id);
      const course = await getDoc(courseDocRef);
      revenueData[month] = (revenueData[month] || 0) + (course.data() ? course.data().price : 0); // Handle potential missing course data
    }

    res.json({
      userGrowth: Object.entries(userGrowth).map(([month, count]) => ({ month, count })),
      courseEnrollments: top10,
      revenueData: Object.entries(revenueData).map(([month, revenue]) => ({ month, revenue }))
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ADMIN USER MANAGEMENT ENDPOINTS ====================

// GET /api/admin/users - Get all users with pagination and filtering
// For `search`, Firestore doesn't support 'OR' queries across multiple fields directly.
// The current implementation for 'search' fetches all matching documents for each field and merges.
// For pagination, `offset` is simulated by fetching `offset + limit` documents and slicing.
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const accountType = req.query.accountType;
    const status = req.query.status;
    const search = req.query.search;

    const usersCollection = collection(db, 'users');
    let baseQuery = query(usersCollection, orderBy('created_at', 'desc'));
    let totalQuery = query(usersCollection); // For total count

    if (accountType && accountType !== 'all') {
      baseQuery = query(baseQuery, where('account_type', '==', accountType));
      totalQuery = query(totalQuery, where('account_type', '==', accountType));
    }

    if (status && status !== 'all') {
      const isActive = status === 'active' ? true : false;
      baseQuery = query(baseQuery, where('is_active', '==', isActive));
      totalQuery = query(totalQuery, where('is_active', '==', isActive));
    }

    let allUsersDocs = [];

    if (search) {
      // Simulate OR search by fetching and merging results
      const searchLower = search.toLowerCase();

      // For first_name
      const firstNameQuery = query(usersCollection, orderBy('first_name'), startAfter(searchLower), firebaseLimit(100)); // Limit to prevent massive fetches
      const firstNameSnap = await getDocs(firstNameQuery);
      firstNameSnap.docs.filter(d => d.data().first_name.toLowerCase().startsWith(searchLower)).forEach(doc => allUsersDocs.push(doc));

      // For last_name
      const lastNameQuery = query(usersCollection, orderBy('last_name'), startAfter(searchLower), firebaseLimit(100));
      const lastNameSnap = await getDocs(lastNameQuery);
      lastNameSnap.docs.filter(d => d.data().last_name.toLowerCase().startsWith(searchLower)).forEach(doc => allUsersDocs.push(doc));

      // For email
      const emailQuery = query(usersCollection, orderBy('email'), startAfter(searchLower), firebaseLimit(100));
      const emailSnap = await getDocs(emailQuery);
      emailSnap.docs.filter(d => d.data().email.toLowerCase().startsWith(searchLower)).forEach(doc => allUsersDocs.push(doc));

      // Deduplicate results
      const uniqueUserMap = new Map();
      allUsersDocs.forEach(doc => uniqueUserMap.set(doc.id, doc));
      allUsersDocs = Array.from(uniqueUserMap.values());

      // Apply other filters to the in-memory results
      allUsersDocs = allUsersDocs.filter(doc => {
        const u = doc.data();
        let matches = true;
        if (accountType && accountType !== 'all' && u.account_type !== accountType) matches = false;
        if (status && status !== 'all') {
          const isActive = status === 'active' ? true : false;
          if (u.is_active !== isActive) matches = false;
        }
        return matches;
      });

      // Sort in memory for search results
      allUsersDocs.sort((a, b) => {
        const dateA = a.data().created_at.toDate();
        const dateB = b.data().created_at.toDate();
        return dateB.getTime() - dateA.getTime(); // Descending order
      });

      const total = allUsersDocs.length;
      const paginatedUsers = allUsersDocs.slice(offset, offset + limit);

      res.json({
        users: paginatedUsers.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1
        }
      });
      return;
    }

    // Normal pagination (without search)
    const totalSnap = await getDocs(totalQuery);
    const total = totalSnap.size;

    // Simulate offset by fetching more and slicing locally
    const usersQueryWithOffset = query(baseQuery, firebaseLimit(offset + limit));
    const usersSnap = await getDocs(usersQueryWithOffset);

    const data = usersSnap.docs.slice(offset).map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() }));

    res.json({
      users: data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNextPage: page < Math.ceil(total / limit),
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

    const userDocRef = doc(db, 'users', id);
    const user = await getDoc(userDocRef);

    if (!user.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = user.data();
    data.id = id;

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
    const usersCollection = collection(db, 'users');
    const existingUserQuery = query(usersCollection, where('email', '==', email));
    const existingSnap = await getDocs(existingUserQuery);

    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const userRef = doc(usersCollection); // Auto-generate ID
    await setDoc(userRef, {
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
      created_at: Timestamp.now(), // Client SDK Timestamp
      updated_at: Timestamp.now() // Client SDK Timestamp
    });

    // Create user stats entry
    const userStatsRef = doc(db, 'user_stats', userRef.id);
    await setDoc(userStatsRef, {
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: Timestamp.now() // Client SDK Timestamp
    });

    console.log('User created successfully by admin:', { userId: userRef.id, email });

    const newUserDoc = await getDoc(userRef);
    const data = newUserDoc.data();
    data.id = userRef.id;

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

    const userRef = doc(db, 'users', id);
    const user = await getDoc(userRef);

    if (!user.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const u = user.data();

    if (email && email !== u.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }

      // Check for existing email for other users
      const usersCollection = collection(db, 'users');
      const existingEmailQuery = query(usersCollection, where('email', '==', email));
      const existingEmailSnap = await getDocs(existingEmailQuery);

      for (const docSnapshot of existingEmailSnap.docs) {
        if (docSnapshot.id !== id) {
          return res.status(400).json({ error: 'Email already exists for another user' });
        }
      }
    }

    await updateDoc(userRef, {
      first_name: firstName || u.first_name,
      last_name: lastName || u.last_name,
      email: email || u.email,
      phone: phone || u.phone,
      account_type: accountType || u.account_type,
      is_active: isActive !== undefined ? isActive : u.is_active,
      company: company || u.company,
      website: website || u.website,
      bio: bio || u.bio,
      updated_at: Timestamp.now() // Client SDK Timestamp
    });

    const updatedDoc = await getDoc(userRef);
    const data = updatedDoc.data();
    data.id = id;

    res.json({
      message: 'User updated successfully',
      user: data
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id - Delete a user (soft delete)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    if (id === adminId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const userRef = doc(db, 'users', id);
    const user = await getDoc(userRef);

    if (!user.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    await updateDoc(userRef, {
      is_active: false,
      updated_at: Timestamp.now() // Client SDK Timestamp
    });

    res.json({ message: 'User deactivated successfully' }); // Changed message to reflect soft delete

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

    const userRef = doc(db, 'users', id);
    const user = await getDoc(userRef);

    if (!user.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await updateDoc(userRef, {
      password_hash: hashedPassword,
      updated_at: Timestamp.now() // Client SDK Timestamp
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
    const { transaction_id, payment_method, resource_id, plan, amount, user_id } = req.body; // user_id might be from token or body

    if (!req.file) {
      return res.status(400).json({ error: 'Payment proof file is required' });
    }

    if (!transaction_id) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const effectiveUserId = user_id || req.user.id; // Use user from token if not provided in body

    // Save payment record to database
    const paymentsCollection = collection(db, 'payments');
    const paymentRef = doc(paymentsCollection); // Auto-generate ID
    await setDoc(paymentRef, {
      user_id: effectiveUserId,
      resource_id: resource_id || null,
      plan,
      amount: parseFloat(amount) || 0, // Ensure amount is number
      payment_method,
      transaction_id,
      proof_file: req.file.filename,
      status: 'pending',
      created_at: Timestamp.now(), // Client SDK Timestamp
      // No updated_at for payments unless it's changed
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
    const paymentsCollection = collection(db, 'payments');
    const usersCollection = collection(db, 'users');
    const resourcesCollection = collection(db, 'resources');

    const paymentsQuery = query(paymentsCollection, orderBy('created_at', 'desc'));
    const paymentsSnap = await getDocs(paymentsQuery);

    const data = [];
    for (const docSnapshot of paymentsSnap.docs) {
      const p = docSnapshot.data();
      const userDocRef = doc(usersCollection, p.user_id);
      const user = await getDoc(userDocRef);
      const u = user.data();
      let rTitle = null;
      if (p.resource_id) {
        const resourceDocRef = doc(resourcesCollection, p.resource_id);
        const resource = await getDoc(resourceDocRef);
        if (resource.exists()) {
          rTitle = resource.data().title;
        }
      }
      data.push({
        ...p,
        id: docSnapshot.id,
        first_name: u ? u.first_name : 'N/A', // Handle case where user might be deleted
        last_name: u ? u.last_name : 'N/A',
        email: u ? u.email : 'N/A',
        resource_title: rTitle
      });
    }

    res.json(data);
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

    const paymentRef = doc(db, 'payments', id);
    await updateDoc(paymentRef, {
      status: status,
      verified_at: Timestamp.now() // Client SDK Timestamp
    });

    // If payment is approved, grant access to the resource
    if (status === 'approved') {
      const payment = await getDoc(paymentRef);
      const p = payment.data();

      if (p.plan === 'individual' && p.resource_id) {
        // Grant access to specific resource
        const userResourcesCollection = collection(db, 'user_resources');
        await setDoc(doc(userResourcesCollection), { // Auto-generate ID
          user_id: p.user_id,
          resource_id: p.resource_id,
          granted_at: Timestamp.now()
        });
      } else if (p.plan === 'premium') {
        // Upgrade user to premium
        const userRef = doc(db, 'users', p.user_id);
        await updateDoc(userRef, {
          subscription_plan: "premium",
          updated_at: Timestamp.now()
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
    const enrollmentsCollection = collection(db, 'enrollments');
    const usersCollection = collection(db, 'users');
    const coursesCollection = collection(db, 'courses');

    const enrollmentsQuery = query(enrollmentsCollection, orderBy('enrollment_date', 'desc'));
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    const data = [];
    for (const docSnapshot of enrollmentsSnap.docs) {
      const e = docSnapshot.data();
      const userDocRef = doc(usersCollection, e.user_id);
      const user = await getDoc(userDocRef);
      const u = user.data();
      const courseDocRef = doc(coursesCollection, e.course_id);
      const course = await getDoc(courseDocRef);
      const c = course.data();
      data.push({
        id: docSnapshot.id,
        user_id: e.user_id,
        user_name: u ? `${u.first_name} ${u.last_name}` : 'N/A', // Handle potential missing user
        course_id: e.course_id,
        course_name: c ? c.title : 'N/A', // Handle potential missing course
        progress: e.progress,
        status: e.status,
        enrollment_date: e.enrollment_date,
        completion_date: e.completion_date
      });
    }

    res.json(data);
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

    const enrollmentRef = doc(db, 'enrollments', id);
    await updateDoc(enrollmentRef, {
      status: status,
      progress: progress,
      completion_date: status === 'completed' ? (completion_date || Timestamp.now()) : null // Client SDK Timestamp
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

    const enrollmentRef = doc(db, 'enrollments', id);
    await deleteDoc(enrollmentRef);

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
    const coursesCollection = collection(db, 'courses');
    const coursesQuery = query(coursesCollection, orderBy('created_at', 'desc'));
    const coursesSnap = await getDocs(coursesQuery);

    const data = coursesSnap.docs.map(docSnapshot => {
      const c = docSnapshot.data();
      return {
        id: docSnapshot.id,
        title: c.title,
        description: c.description,
        instructor_name: c.instructor_name,
        duration_weeks: c.duration_weeks,
        difficulty_level: c.difficulty_level,
        category: c.category,
        price: c.price,
        thumbnail: c.thumbnail,
        is_active: c.is_active,
        created_at: c.created_at,
        updated_at: c.updated_at
      };
    });

    res.json(data);
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

    if (!title || !instructor_name || !duration_weeks || !difficulty_level || !category || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const coursesCollection = collection(db, 'courses');
    const courseRef = doc(coursesCollection); // Auto-generate ID
    await setDoc(courseRef, {
      title,
      description,
      instructor_name,
      duration_weeks: parseInt(duration_weeks), // Ensure numeric type
      difficulty_level,
      category,
      price: parseFloat(price), // Ensure numeric type
      is_active: is_active || true, // Default to true if not provided
      created_at: Timestamp.now(), // Client SDK Timestamp
      updated_at: Timestamp.now() // Client SDK Timestamp
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

    if (!title || !instructor_name || !duration_weeks || !difficulty_level || !category || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const courseRef = doc(db, 'courses', id);
    await updateDoc(courseRef, {
      title,
      description,
      instructor_name,
      duration_weeks: parseInt(duration_weeks), // Ensure numeric type
      difficulty_level,
      category,
      price: parseFloat(price), // Ensure numeric type
      is_active,
      updated_at: Timestamp.now() // Client SDK Timestamp
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

    const enrollmentsCollection = collection(db, 'enrollments');
    const enrollmentsQuery = query(enrollmentsCollection, where('course_id', '==', id));
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    if (!enrollmentsSnap.empty) {
      return res.status(400).json({ error: 'Cannot delete course with active enrollments' });
    }

    const courseRef = doc(db, 'courses', id);
    await deleteDoc(courseRef);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Upload course thumbnail
app.post('/api/admin/courses/:id/thumbnail', authenticateToken, requireAdmin, courseThumbnailUpload.single('thumbnail'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const thumbnailPath = `/uploads/courses/${req.file.filename}`;

    const courseRef = doc(db, 'courses', id);
    await updateDoc(courseRef, {
      thumbnail: thumbnailPath,
      updated_at: Timestamp.now() // Client SDK Timestamp
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
    const resourcesCollection = collection(db, 'resources');
    const resourcesQuery = query(resourcesCollection, orderBy('created_at', 'desc'));
    const resourcesSnap = await getDocs(resourcesQuery);

    const data = resourcesSnap.docs.map(docSnapshot => {
      const r = docSnapshot.data();
      return {
        id: docSnapshot.id,
        title: r.title,
        description: r.description,
        type: r.type,
        size: r.size,
        url: r.url,
        category: r.category,
        icon_name: r.icon_name,
        button_color: r.button_color,
        allowed_account_types: r.allowed_account_types,
        is_premium: r.is_premium,
        created_at: r.created_at,
        updated_at: r.updated_at
      };
    });

    res.json(data);
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

    if (!title || !description || !type || !category || !icon_name || !button_color || !allowed_account_types) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const accountTypesArray = Array.isArray(allowed_account_types) ? allowed_account_types : [allowed_account_types];

    const resourcesCollection = collection(db, 'resources');
    const resourceRef = doc(resourcesCollection); // Auto-generate ID
    await setDoc(resourceRef, {
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
      created_at: Timestamp.now(), // Client SDK Timestamp
      updated_at: Timestamp.now() // Client SDK Timestamp
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

    if (!title || !description || !type || !category || !icon_name || !button_color || !allowed_account_types) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const accountTypesArray = Array.isArray(allowed_account_types) ? allowed_account_types : [allowed_account_types];

    const resourceRef = doc(db, 'resources', id);
    await updateDoc(resourceRef, {
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
      updated_at: Timestamp.now() // Client SDK Timestamp
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

    const resourceRef = doc(db, 'resources', id);
    await deleteDoc(resourceRef);

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
    const assignmentsCollection = collection(db, 'assignments');
    const coursesCollection = collection(db, 'courses');

    const assignmentsQuery = query(assignmentsCollection, orderBy('created_at', 'desc'));
    const assignmentsSnap = await getDocs(assignmentsQuery);

    const data = [];
    for (const docSnapshot of assignmentsSnap.docs) {
      const a = docSnapshot.data();
      const courseDocRef = doc(coursesCollection, a.course_id);
      const course = await getDoc(courseDocRef);
      data.push({
        id: docSnapshot.id,
        course_id: a.course_id,
        title: a.title,
        description: a.description,
        due_date: a.due_date,
        max_points: a.max_points,
        created_at: a.created_at,
        course_title: course.data() ? course.data().title : 'N/A' // Handle potential missing course
      });
    }

    res.json(data);
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

    if (!title || !course_id || !due_date || !max_points) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const assignmentsCollection = collection(db, 'assignments');
    const assignmentRef = doc(assignmentsCollection); // Auto-generate ID
    await setDoc(assignmentRef, {
      title,
      course_id,
      description,
      due_date: new Date(due_date), // Store as Date object or convert to Timestamp
      max_points: parseInt(max_points), // Ensure numeric
      created_at: Timestamp.now() // Client SDK Timestamp
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

    if (!title || !course_id || !due_date || !max_points) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const assignmentRef = doc(db, 'assignments', id);
    await updateDoc(assignmentRef, {
      title,
      course_id,
      description,
      due_date: new Date(due_date), // Store as Date object or convert to Timestamp
      max_points: parseInt(max_points), // Ensure numeric
      updated_at: Timestamp.now() // Client SDK Timestamp (if you want to track updates)
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

    const assignmentSubmissionsCollection = collection(db, 'assignment_submissions');
    const submissionsQuery = query(assignmentSubmissionsCollection, where('assignment_id', '==', id));
    const submissionsSnap = await getDocs(submissionsQuery);

    if (!submissionsSnap.empty) {
      return res.status(400).json({ error: 'Cannot delete assignment with existing submissions' });
    }

    const assignmentRef = doc(db, 'assignments', id);
    await deleteDoc(assignmentRef);

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

    const contactMessagesCollection = collection(db, 'contact_messages');

    // Get total for pagination
    const totalSnap = await getDocs(contactMessagesCollection);
    const total = totalSnap.size;

    // Simulate offset by fetching more and slicing locally
    const messagesQuery = query(contactMessagesCollection, orderBy('created_at', 'desc'), firebaseLimit(offset + limit));
    const messagesSnap = await getDocs(messagesQuery);

    const data = messagesSnap.docs.slice(offset).map(docSnapshot => {
      const m = docSnapshot.data();
      return {
        id: docSnapshot.id,
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


    res.json({
      messages: data,
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

    if (!status || !['pending', 'resolved', 'contacted', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const contactMessageRef = doc(db, 'contact_messages', id);
    await updateDoc(contactMessageRef, {
      status: status,
      updated_at: Timestamp.now() // Track when status was last updated
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

    const contactMessageRef = doc(db, 'contact_messages', id);
    await deleteDoc(contactMessageRef);

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
    const servicesCollection = collection(db, 'services');
    const serviceCategoriesCollection = collection(db, 'service_categories');

    const servicesQuery = query(servicesCollection, orderBy('created_at', 'desc'));
    const servicesSnap = await getDocs(servicesQuery);

    const data = [];
    for (const docSnapshot of servicesSnap.docs) {
      const s = docSnapshot.data();
      const categoryDocRef = doc(serviceCategoriesCollection, s.category_id);
      const category = await getDoc(categoryDocRef);
      data.push({
        id: docSnapshot.id,
        name: s.name,
        category_id: s.category_id,
        category_name: category.data() ? category.data().name : 'N/A', // Handle potential missing category
        description: s.description,
        price: s.price,
        duration: s.duration,
        rating: s.rating,
        reviews: s.reviews,
        features: s.features,
        popular: s.popular
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get service by ID (admin only)
app.get('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const serviceDocRef = doc(db, 'services', id);
    const service = await getDoc(serviceDocRef);

    if (!service.exists()) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const s = service.data();
    const categoryDocRef = doc(db, 'service_categories', s.category_id);
    const category = await getDoc(categoryDocRef);

    res.json({
      id: id,
      name: s.name,
      category_id: s.category_id,
      category_name: category.data() ? category.data().name : 'N/A',
      description: s.description,
      price: s.price,
      duration: s.duration,
      rating: s.rating,
      reviews: s.reviews,
      features: s.features,
      popular: s.popular,
      is_active: s.is_active
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
      rating,
      reviews,
      features,
      popular,
      is_active
    } = req.body;

    // Basic validation
    if (!name || !category_id || !description || price === undefined || duration === undefined) {
      return res.status(400).json({ error: 'Missing required fields for service creation' });
    }

    const servicesCollection = collection(db, 'services');
    const serviceRef = doc(servicesCollection); // Auto-generate ID
    await setDoc(serviceRef, {
      name,
      category_id,
      description,
      price: parseFloat(price),
      duration: parseInt(duration),
      rating: rating || 0,
      reviews: reviews || 0,
      features: features || [], // Assuming features is an array or stringified JSON
      popular: popular || false,
      is_active: is_active || true,
      created_at: Timestamp.now(), // Client SDK Timestamp
      updated_at: Timestamp.now() // Client SDK Timestamp
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
      rating,
      reviews,
      features,
      popular,
      is_active
    } = req.body;

    // Basic validation
    if (!name || !category_id || !description || price === undefined || duration === undefined) {
      return res.status(400).json({ error: 'Missing required fields for service update' });
    }

    const serviceRef = doc(db, 'services', id);
    await updateDoc(serviceRef, {
      name,
      category_id,
      description,
      price: parseFloat(price),
      duration: parseInt(duration),
      rating: rating,
      reviews: reviews,
      features: features,
      popular: popular,
      is_active: is_active,
      updated_at: Timestamp.now() // Client SDK Timestamp
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

    const serviceRef = doc(db, 'services', id);
    await deleteDoc(serviceRef);

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Get service categories (admin only)
app.get('/api/admin/service-categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const serviceCategoriesCollection = collection(db, 'service_categories');
    const categoriesQuery = query(serviceCategoriesCollection, where('is_active', '==', true), orderBy('created_at'));
    const categoriesSnap = await getDocs(categoriesQuery);

    res.json(categoriesSnap.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() }))); // Include ID in response
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({ error: 'Failed to fetch service categories' });
  }
});

// ==================== ADMIN CALENDAR MANAGEMENT ENDPOINTS ====================

// Get all calendar events (admin only)
app.get('/api/admin/calendar-events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const customCalendarEventsCollection = collection(db, 'custom_calendar_events');
    const usersCollection = collection(db, 'users');

    const eventsQuery = query(customCalendarEventsCollection, orderBy('created_at', 'desc'));
    const eventsSnap = await getDocs(eventsQuery);

    const data = [];
    for (const docSnapshot of eventsSnap.docs) {
      const e = docSnapshot.data();
      let userFirstName = 'N/A';
      let userLastName = 'N/A';
      let userEmail = 'N/A';

      if (e.user_id) {
        const userDocRef = doc(usersCollection, e.user_id);
        const user = await getDoc(userDocRef);
        const u = user.data();
        if (u) {
          userFirstName = u.first_name;
          userLastName = u.last_name;
          userEmail = u.email;
        }
      }

      data.push({
        ...e,
        id: docSnapshot.id,
        first_name: userFirstName,
        last_name: userLastName,
        email: userEmail
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// Get calendar event by ID (admin only)
app.get('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const eventDocRef = doc(db, 'custom_calendar_events', id);
    const event = await getDoc(eventDocRef);

    if (!event.exists()) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    const e = event.data();
    let userFirstName = 'N/A';
    let userLastName = 'N/A';
    let userEmail = 'N/A';

    if (e.user_id) {
      const userDocRef = doc(db, 'users', e.user_id);
      const user = await getDoc(userDocRef);
      const u = user.data();
      if (u) {
        userFirstName = u.first_name;
        userLastName = u.last_name;
        userEmail = u.email;
      }
    }


    res.json({
      ...e,
      id: id,
      first_name: userFirstName,
      last_name: userLastName,
      email: userEmail
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

    if (!title || !event_date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(event_date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const customCalendarEventsCollection = collection(db, 'custom_calendar_events');
    const eventRef = doc(customCalendarEventsCollection); // Auto-generate ID
    await setDoc(eventRef, {
      user_id: user_id || null, // Can be null if it's a general admin event
      title,
      description: description || null,
      event_date: new Date(event_date), // Store as Date object
      event_time: event_time || null,
      event_type: event_type || 'custom',
      created_at: Timestamp.now(), // Client SDK Timestamp
      updated_at: Timestamp.now() // Client SDK Timestamp
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

    if (event_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(event_date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
    }

    const eventRef = doc(db, 'custom_calendar_events', id);
    await updateDoc(eventRef, {
      user_id: user_id || null,
      title,
      description: description || null,
      event_date: new Date(event_date), // Store as Date object
      event_time: event_time || null,
      event_type: event_type || 'custom',
      updated_at: Timestamp.now() // Client SDK Timestamp
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

    const eventRef = doc(db, 'custom_calendar_events', id);
    await deleteDoc(eventRef);

    res.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

// Get all users for dropdown (admin only)
// NOTE: This endpoint is duplicated (already one at /api/admin/users for full management)
// Renaming this one to avoid conflict, typically such a specific endpoint would be '/api/admin/users/list-for-dropdown'
app.get('/api/admin/users-for-dropdown', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersCollection = collection(db, 'users');
    const usersQuery = query(usersCollection, where('is_active', '==', true), orderBy('first_name'), orderBy('last_name'));
    const usersSnap = await getDocs(usersQuery);

    const data = usersSnap.docs.map(docSnapshot => ({
      id: docSnapshot.id,
      first_name: docSnapshot.data().first_name,
      last_name: docSnapshot.data().last_name
    }));

    res.json(data);
  } catch (error) {
    console.error('Error fetching users for dropdown:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ==================== ADMIN SERVICE REQUEST MANAGEMENT PAGE ====================

// GET /api/admin/service-requests
app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const serviceRequestsCollection = collection(db, 'service_requests');
    const serviceSubcategoriesCollection = collection(db, 'service_subcategories');
    const usersCollection = collection(db, 'users');

    const requestsQuery = query(serviceRequestsCollection, orderBy('created_at', 'desc'));
    const requestsSnap = await getDocs(requestsQuery);

    const data = [];
    for (const docSnapshot of requestsSnap.docs) {
      const sr = docSnapshot.data();

      // Fetch subcategory
      const subcategoryDocRef = doc(serviceSubcategoriesCollection, sr.subcategory_id);
      const subcategorySnap = await getDoc(subcategoryDocRef);
      const subcategoryName = subcategorySnap.exists() ? subcategorySnap.data().name : 'N/A';

      // Fetch user details
      let userFirstName = 'N/A';
      let userLastName = 'N/A';
      let userAccountType = 'N/A';
      if (sr.user_id) {
        const userDocRef = doc(usersCollection, sr.user_id);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const u = userSnap.data();
          userFirstName = u.first_name;
          userLastName = u.last_name;
          userAccountType = u.account_type;
        }
      }

      data.push({
        id: docSnapshot.id,
        name: sr.full_name,
        service: subcategoryName,
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
        user_first_name: userFirstName,
        user_last_name: userLastName,
        user_account_type: userAccountType
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests', details: error.message });
  }
});

// PUT /api/admin/service-requests/:id - Update service request (both status and details)
// NOTE: There were two PUT endpoints with the same path. Merged them into one.
app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, project_details, budget_range, timeline, additional_requirements } = req.body;

    const updateData = { updated_at: Timestamp.now() }; // Client SDK Timestamp

    if (status) updateData.status = status;
    if (project_details !== undefined) updateData.project_details = project_details;
    if (budget_range !== undefined) updateData.budget_range = budget_range;
    if (timeline !== undefined) updateData.timeline = timeline;
    if (additional_requirements !== undefined) updateData.additional_requirements = additional_requirements;

    const serviceRequestRef = doc(db, 'service_requests', id);
    await updateDoc(serviceRequestRef, updateData);

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

    const serviceRequestRef = doc(db, 'service_requests', id);
    await deleteDoc(serviceRequestRef);

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

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  if (err.message.includes('Only image files are allowed for avatar') ||
      err.message.includes('Invalid file type') ||
      err.message.includes('Only images and PDF files are allowed') ||
      err.message.includes('Only image files are allowed for course thumbnails')) {
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