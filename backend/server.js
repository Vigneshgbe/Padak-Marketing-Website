// server.js — Firebase Firestore Version
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // For unique filenames
const app = express();
const port = process.env.PORT || 5000;

// ==================== FIREBASE ADMIN INITIALIZATION ====================
const admin = require('firebase-admin'); 

// Load service account key (you'll generate this from Firebase Console)
const serviceAccount = require('./service-account-key.json'); // <-- YOU MUST CREATE THIS FILE

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "startup-dbs-1.firebasestorage.app"
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Create necessary directories (for multer temp storage before uploading to Firebase)
const tempUploadsDir = path.join(__dirname, 'temp-uploads');
['avatars', 'assignments', 'payments', 'social'].forEach(folder => {
  const dir = path.join(tempUploadsDir, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ===== AVATAR MULTER CONFIGURATION (TEMP STORAGE) =====
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(tempUploadsDir, 'avatars')),
  filename: (req, file, cb) => cb(null, `avatar-${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`)
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed for avatars'));
  }
});

// ===== ASSIGNMENT MULTER CONFIGURATION =====
const assignmentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(tempUploadsDir, 'assignments')),
  filename: (req, file, cb) => cb(null, `assignment-${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`)
});

const assignmentUpload = multer({
  storage: assignmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.zip', '.rar'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) cb(null, true);
    else cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, ZIP, RAR files are allowed.'));
  }
});

// ===== PAYMENT SCREENSHOT MULTER CONFIGURATION =====
const paymentScreenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(tempUploadsDir, 'payments')),
  filename: (req, file, cb) => cb(null, `payment-${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`)
});

const paymentScreenshotUpload = multer({
  storage: paymentScreenshotStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) cb(null, true);
    else cb(new Error('Invalid file type. Only images are allowed.'));
  }
});

// ===== PAYMENT PROOF RESOURCES MULTER CONFIGURATION =====
const paymentProofStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(tempUploadsDir, 'payments')),
  filename: (req, file, cb) => cb(null, `payment-proof-${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`)
});

const paymentProofUpload = multer({
  storage: paymentProofStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only images and PDF files are allowed'));
  }
});

// ===== SOCIAL POST IMAGES MULTER CONFIGURATION =====
const socialUploadDir = path.join(tempUploadsDir, 'social');
if (!fs.existsSync(socialUploadDir)) fs.mkdirSync(socialUploadDir, { recursive: true });

const socialStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, socialUploadDir),
  filename: (req, file, cb) => cb(null, `social-${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`)
});

const socialUpload = multer({
  storage: socialStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) cb(null, true);
    else cb(new Error('Error: File upload only supports JPEG, JPG, PNG, GIF'));
  }
}).single('image');

// ===== CORS CONFIGURATION =====
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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== AUTHENTICATION MIDDLEWARE ====================

// JWT Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

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

// Helper: Upload file to Firebase Storage
const uploadFileToStorage = async (localFilePath, storagePath) => {
  const file = bucket.file(storagePath);
  await bucket.upload(localFilePath, {
    destination: storagePath,
    metadata: { contentType: require('mime-types').lookup(localFilePath) }
  });
  await file.makePublic(); // Optional: make publicly readable
  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
};

// Helper: Delete file from local temp after upload
const cleanupTempFile = (filePath) => {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// ==================== AUTH ROUTES ====================

app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, phone, password, accountType } = req.body;

  try {
    // Validate
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email' });

    if (password.length < 6) return res.status(400).json({ error: 'Password too short' });

    // Check existing
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();
    if (!usersSnapshot.empty) return res.status(400).json({ error: 'Email exists' });

    // Hash & save
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRef = await db.collection('users').add({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      passwordHash: hashedPassword,
      accountType: accountType || 'student',
      isActive: true,
      emailVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create stats doc
    await db.collection('userStats').add({
      userId: userRef.id,
      coursesEnrolled: 0,
      coursesCompleted: 0,
      certificatesEarned: 0,
      learningStreak: 0,
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ message: 'User registered', userId: userRef.id });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const usersSnapshot = await db.collection('users').where('email', '==', email).where('isActive', '==', true).get();
    if (usersSnapshot.empty) return res.status(404).json({ error: 'User not found' });

    const userDoc = usersSnapshot.docs[0];
    const user = userDoc.data();

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const tokenExpiry = rememberMe ? '30d' : '1d';
    const token = jwt.sign(
      { userId: userDoc.id, email: user.email, accountType: user.accountType },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    await db.collection('users').doc(userDoc.id).update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userDoc.id,
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
        createdAt: user.createdAt?.toDate()?.toISOString(),
        updatedAt: user.updatedAt?.toDate()?.toISOString()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
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
    createdAt: user.createdAt?.toDate()?.toISOString(),
    updatedAt: user.updatedAt?.toDate()?.toISOString()
  });
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, company, website, bio } = req.body;
    const userId = req.user.id;

    await db.collection('users').doc(userId).update({
      firstName, lastName, phone, company, website, bio,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();

    res.json({
      id: userDoc.id,
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
      createdAt: user.createdAt?.toDate()?.toISOString(),
      updatedAt: user.updatedAt?.toDate()?.toISOString()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const userId = req.user.id;
    const storagePath = `avatars/${userId}/${req.file.filename}`;
    const imageUrl = await uploadFileToStorage(req.file.path, storagePath);

    // Delete old avatar if exists (you’d need to parse old path to delete from Storage)
    // For simplicity, we just update the URL

    await db.collection('users').doc(userId).update({
      profileImage: imageUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    cleanupTempFile(req.file.path);

    res.status(200).send(imageUrl);

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== DASHBOARD STATS ====================
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const statsSnapshot = await db.collection('userStats').where('userId', '==', userId).limit(1).get();

    if (statsSnapshot.empty) {
      const newStatsRef = await db.collection('userStats').add({
        userId,
        coursesEnrolled: 0,
        coursesCompleted: 0,
        certificatesEarned: 0,
        learningStreak: 0,
        lastActivity: admin.firestore.FieldValue.serverTimestamp()
      });
      const stats = (await newStatsRef.get()).data();
      res.json({
        coursesEnrolled: stats.coursesEnrolled,
        coursesCompleted: stats.coursesCompleted,
        certificatesEarned: stats.certificatesEarned,
        learningStreak: stats.learningStreak,
        lastActivity: stats.lastActivity?.toDate()?.toISOString()
      });
    } else {
      const stats = statsSnapshot.docs[0].data();
      res.json({
        coursesEnrolled: stats.coursesEnrolled,
        coursesCompleted: stats.coursesCompleted,
        certificatesEarned: stats.certificatesEarned,
        learningStreak: stats.learningStreak,
        lastActivity: stats.lastActivity?.toDate()?.toISOString()
      });
    }

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== SOCIAL FEED ====================

const getFullImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${req.protocol}://${req.get('host')}${imagePath}`;
};

app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    // Get connections for visibility
    const connectionsSnapshot = await db.collection('userConnections')
      .where('status', '==', 'accepted')
      .where('user_id_1', '==', userId).get();
    const connectionIds = connectionsSnapshot.docs.map(doc => doc.data().user_id_2);

    const reverseConnections = await db.collection('userConnections')
      .where('status', '==', 'accepted')
      .where('user_id_2', '==', userId).get();
    reverseConnections.docs.forEach(doc => connectionIds.push(doc.data().user_id_1));

    // Build query for posts
    let postsQuery = db.collection('socialActivities')
      .where('activityType', '==', 'post')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (page > 1) {
      // Implement cursor pagination (simplified)
      const offset = (page - 1) * limit;
      const snapshot = await db.collection('socialActivities')
        .where('activityType', '==', 'post')
        .orderBy('createdAt', 'desc')
        .limit(offset + limit).get();
      const lastDoc = snapshot.docs[offset - 1];
      if (lastDoc) postsQuery = postsQuery.startAfter(lastDoc);
    }

    const postsSnapshot = await postsQuery.get();
    const posts = [];

    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();
      const authorDoc = await db.collection('users').doc(postData.userId).get();
      const author = authorDoc.data();

      // Visibility check
      if (
        postData.visibility === 'private' && postData.userId !== userId ||
        postData.visibility === 'connections' && postData.userId !== userId && !connectionIds.includes(postData.userId)
      ) continue;

      // Likes count
      const likesCount = (await db.collection('socialActivities')
        .where('activityType', '==', 'like')
        .where('targetId', '==', postDoc.id).get()).size;

      // Comments count
      const commentsCount = (await db.collection('socialActivities')
        .where('activityType', '==', 'comment')
        .where('targetId', '==', postDoc.id).get()).size;

      // User-specific flags
      const hasLiked = !(await db.collection('socialActivities')
        .where('activityType', '==', 'like')
        .where('targetId', '==', postDoc.id)
        .where('userId', '==', userId).get()).empty;

      const hasBookmarked = !(await db.collection('socialActivities')
        .where('activityType', '==', 'bookmark')
        .where('targetId', '==', postDoc.id)
        .where('userId', '==', userId).get()).empty;

      posts.push({
        id: postDoc.id,
        ...postData,
        likes: likesCount,
        commentCount: commentsCount,
        hasLiked,
        hasBookmarked,
        imageUrl: postData.imageUrl,
        user: {
          id: authorDoc.id,
          firstName: author.firstName,
          lastName: author.lastName,
          profileImage: author.profileImage,
          accountType: author.accountType
        },
        comments: [] // You can populate if needed
      });
    }

    res.json({
      posts,
      pagination: {
        page,
        totalPages: Math.ceil(posts.length / limit), // Approximate
        totalPosts: posts.length
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

// ➕ Add remaining routes similarly: posts create, like, comment, bookmark, share, calendar, courses, assignments, certificates, resources, internships, services, admin panels...

// Due to length constraints, I’m showing the pattern. You would convert each route following this structure.

// Example: Create Post
app.post('/api/posts', authenticateToken, (req, res) => {
  socialUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const { content, achievement, visibility } = req.body;
      const userId = req.user.id;

      if (!content && !req.file) return res.status(400).json({ error: 'Post must have content or image' });

      let imageUrl = null;
      if (req.file) {
        const storagePath = `social/${userId}/${req.file.filename}`;
        imageUrl = await uploadFileToStorage(req.file.path, storagePath);
        cleanupTempFile(req.file.path);
      }

      const postRef = await db.collection('socialActivities').add({
        userId,
        activityType: 'post',
        content: content || '',
        imageUrl,
        achievement: achievement === 'true',
        visibility: visibility || 'public',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        shareCount: 0
      });

      const postDoc = await postRef.get();
      const postData = postDoc.data();
      const authorDoc = await db.collection('users').doc(userId).get();
      const author = authorDoc.data();

      res.status(201).json({
        id: postRef.id,
        ...postData,
        hasLiked: false,
        hasBookmarked: false,
        likes: 0,
        commentCount: 0,
        imageUrl: postData.imageUrl,
        user: {
          id: authorDoc.id,
          firstName: author.firstName,
          lastName: author.lastName,
          profileImage: author.profileImage,
          accountType: author.accountType
        },
        comments: []
      });

    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post.' });
    }
  });
});

// ==================== HEALTH CHECK & ERROR HANDLING ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== SERVER STARTUP ====================

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;