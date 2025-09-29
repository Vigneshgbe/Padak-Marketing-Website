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

// For Firebase JS SDK
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, query, where, orderBy, limit, startAfter, arrayUnion, arrayRemove, increment, Timestamp } = require('firebase/firestore');

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

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Create necessary directories
const assignmentsDir = path.join(__dirname, 'uploads', 'assignments');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });

const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

//Newly added after new resourse payment proof function multer
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
    const userRef = doc(db, 'users', decoded.userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = userSnap.data();
    if (!user.is_active) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = { id: userSnap.id, ...user };
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
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const userRef = await addDoc(collection(db, 'users'), {
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
      bio: null,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });

    const userId = userRef.id;

    // Create user stats entry
    await addDoc(collection(db, 'user_stats'), {
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
      userId
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
    const q = query(collection(db, 'users'), where('email', '==', email), where('is_active', '==', true));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const userDoc = querySnapshot.docs[0];
    const user = userDoc.data();
    user.id = userDoc.id;

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
    await updateDoc(doc(db, 'users', user.id), {
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

    await updateDoc(doc(db, 'users', userId), {
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      company: company,
      website: website,
      bio: bio,
      updated_at: Timestamp.now()
    });

    // Get updated user data
    const updatedUserSnap = await getDoc(doc(db, 'users', userId));
    const user = updatedUserSnap.data();
    user.id = userId;

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

    await updateDoc(doc(db, 'users', userId), {
      profile_image: profileImage,
      updated_at: Timestamp.now()
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

    const statsQuery = query(collection(db, 'user_stats'), where('user_id', '==', userId));
    const statsSnapshot = await getDocs(statsQuery);

    if (statsSnapshot.empty) {
      // Create default stats if not exists
      await addDoc(collection(db, 'user_stats'), {
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
      const userStats = statsSnapshot.docs[0].data();
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
    // Get connections
    const connectionsQuery1 = query(collection(db, 'user_connections'), where('user_id_1', '==', userId), where('status', '==', 'accepted'));
    const connectionsSnapshot1 = await getDocs(connectionsQuery1);
    const connections1 = connectionsSnapshot1.docs.map(d => d.data().user_id_2);

    const connectionsQuery2 = query(collection(db, 'user_connections'), where('user_id_2', '==', userId), where('status', '==', 'accepted'));
    const connectionsSnapshot2 = await getDocs(connectionsQuery2);
    const connections2 = connectionsSnapshot2.docs.map(d => d.data().user_id_1);

    const connections = [...new Set([...connections1, ...connections2])];
    connections.push(userId); // include self

    // Fetch all posts (assume not too many for simplicity)
    const postsQuery = query(collection(db, 'social_activities'), where('activity_type', '==', 'post'), orderBy('created_at', 'desc'));
    const postsSnapshot = await getDocs(postsQuery);
    let posts = postsSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    // Filter visible posts
    posts = posts.filter(post => {
      return post.visibility === 'public' ||
             (post.visibility === 'private' && post.user_id === userId) ||
             (post.visibility === 'connections' && connections.includes(post.user_id));
    });

    const totalPosts = posts.length;
    const totalPages = Math.ceil(totalPosts / limit);

    // Slice for pagination
    posts = posts.slice(offset, offset + limit);

    if (posts.length === 0) {
      return res.json({ posts: [], pagination: { page, totalPages, totalPosts } });
    }

    const postIds = posts.map(p => p.id);

    // Fetch users for posts
    const userIds = [...new Set(posts.map(p => p.user_id))];
    const usersQuery = query(collection(db, 'users'), where('__name__', 'in', userIds.length ? userIds : ['dummy']));
    const usersSnapshot = await getDocs(usersQuery);
    const usersMap = {};
    usersSnapshot.docs.forEach(u => {
      const data = u.data();
      usersMap[u.id] = {
        first_name: data.first_name,
        last_name: data.last_name,
        profile_image: data.profile_image,
        account_type: data.account_type
      };
    });

    // Fetch likes, comments count, has_liked, has_bookmarked for each post
    for (let post of posts) {
      // likes count
      const likesQuery = query(collection(db, 'social_activities'), where('activity_type', '==', 'like'), where('target_id', '==', post.id));
      const likesSnapshot = await getDocs(likesQuery);
      post.likes = likesSnapshot.size;

      // comment count
      const commentsQuery = query(collection(db, 'social_activities'), where('activity_type', '==', 'comment'), where('target_id', '==', post.id));
      const commentsSnapshot = await getDocs(commentsQuery);
      post.comment_count = commentsSnapshot.size;

      // has_liked
      const hasLikedQuery = query(collection(db, 'social_activities'), where('activity_type', '==', 'like'), where('target_id', '==', post.id), where('user_id', '==', userId));
      const hasLikedSnapshot = await getDocs(hasLikedQuery);
      post.has_liked = !hasLikedSnapshot.empty;

      // has_bookmarked
      const hasBookmarkedQuery = query(collection(db, 'social_activities'), where('activity_type', '==', 'bookmark'), where('target_id', '==', post.id), where('user_id', '==', userId));
      const hasBookmarkedSnapshot = await getDocs(hasBookmarkedQuery);
      post.has_bookmarked = !hasBookmarkedSnapshot.empty;

      // user data
      post.user = {
        id: post.user_id,
        ...usersMap[post.user_id]
      };

      // image_url
      post.image_url = getFullImageUrl(req, post.image_url);
      post.user.profile_image = getFullImageUrl(req, post.user.profile_image);
    }

    // Fetch all comments for these posts
    const allCommentsQuery = query(collection(db, 'social_activities'), where('activity_type', '==', 'comment'), where('target_id', 'in', postIds.length ? postIds : ['dummy']));
    const allCommentsSnapshot = await getDocs(allCommentsQuery);
    let comments = allCommentsSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    // Fetch users for comments
    const commentUserIds = [...new Set(comments.map(c => c.user_id))];
    const commentUsersQuery = query(collection(db, 'users'), where('__name__', 'in', commentUserIds.length ? commentUserIds : ['dummy']));
    const commentUsersSnapshot = await getDocs(commentUsersQuery);
    const commentUsersMap = {};
    commentUsersSnapshot.docs.forEach(u => {
      const data = u.data();
      commentUsersMap[u.id] = {
        first_name: data.first_name,
        last_name: data.last_name,
        profile_image: data.profile_image,
        account_type: data.account_type
      };
    });

    // Map comments to posts
    const postsWithData = posts.map(post => {
      const postComments = comments
        .filter(comment => comment.target_id === post.id)
        .sort((a,b) => a.created_at.toDate() - b.created_at.toDate())
        .map(c => ({
          ...c,
          user: {
            id: c.user_id,
            first_name: commentUsersMap[c.user_id]?.first_name,
            last_name: commentUsersMap[c.user_id]?.last_name,
            profile_image: getFullImageUrl(req, commentUsersMap[c.user_id]?.profile_image),
            account_type: commentUsersMap[c.user_id]?.account_type
          }
        }));

      return {
        ...post,
        has_liked: !!post.has_liked,
        has_bookmarked: !!post.has_bookmarked,
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
// --- CORRECTED IMAGE PATH SAVING ---
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

      const postRef = await addDoc(collection(db, 'social_activities'), {
        user_id: userId,
        activity_type: 'post',
        content: content || '',
        image_url: imageUrl,
        achievement: isAchievement,
        visibility: visibility,
        share_count: 0,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });

      const postId = postRef.id;

      // Fetch the newly created post to return to the frontend
      const postSnap = await getDoc(postRef);
      const newPost = postSnap.data();
      newPost.id = postId;

      // Fetch user
      const userSnap = await getDoc(doc(db, 'users', userId));
      const userData = userSnap.data();

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
    const postRef = doc(db, 'social_activities', id);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = postSnap.data();

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    await updateDoc(postRef, {
      content: content,
      updated_at: Timestamp.now()
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
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = postSnap.data();

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    // Delete the post
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
    const commentRef = await addDoc(collection(db, 'social_activities'), {
      user_id: userId,
      activity_type: 'comment',
      content: content,
      target_id: targetId,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });

    const commentId = commentRef.id;

    // Fetch the new comment with user info to return
    const commentSnap = await getDoc(commentRef);
    const newComment = commentSnap.data();
    newComment.id = commentId;

    const userSnap = await getDoc(doc(db, 'users', userId));
    const user = userSnap.data();

    res.status(201).json({
      ...newComment,
      user: {
        id: userId,
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

// --- POST (like) a post ---
app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    // Check if already liked
    const likeQuery = query(collection(db, 'social_activities'), where('user_id', '==', userId), where('activity_type', '==', 'like'), where('target_id', '==', targetId));
    const likeSnapshot = await getDocs(likeQuery);

    if (!likeSnapshot.empty) {
      return res.status(400).json({ error: 'Already liked.' });
    }

    await addDoc(collection(db, 'social_activities'), {
      user_id: userId,
      activity_type: 'like',
      target_id: targetId,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
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
    const likeQuery = query(collection(db, 'social_activities'), where('user_id', '==', userId), where('activity_type', '==', 'like'), where('target_id', '==', targetId));
    const likeSnapshot = await getDocs(likeQuery);

    if (likeSnapshot.empty) {
      return res.status(404).json({ error: 'Like not found.' });
    }

    await deleteDoc(likeSnapshot.docs[0].ref);

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
    const bookmarkQuery = query(collection(db, 'social_activities'), where('user_id', '==', userId), where('activity_type', '==', 'bookmark'), where('target_id', '==', targetId));
    const bookmarkSnapshot = await getDocs(bookmarkQuery);

    if (!bookmarkSnapshot.empty) {
      return res.status(400).json({ error: 'Already bookmarked.' });
    }

    await addDoc(collection(db, 'social_activities'), {
      user_id: userId,
      activity_type: 'bookmark',
      target_id: targetId,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
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
    const bookmarkQuery = query(collection(db, 'social_activities'), where('user_id', '==', userId), where('activity_type', '==', 'bookmark'), where('target_id', '==', targetId));
    const bookmarkSnapshot = await getDocs(bookmarkQuery);

    if (bookmarkSnapshot.empty) {
      return res.status(404).json({ error: 'Bookmark not found.' });
    }

    await deleteDoc(bookmarkSnapshot.docs[0].ref);

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
      share_count: increment(1)
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
    const enrollmentsQuery = query(collection(db, 'enrollments'), where('user_id', '==', userId), orderBy('enrollment_date', 'desc'));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const enrollments = enrollmentsSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const courseIds = enrollments.map(e => e.course_id);
    const coursesQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds.length ? courseIds : ['dummy']));
    const coursesSnapshot = await getDocs(coursesQuery);
    const coursesMap = {};
    coursesSnapshot.docs.forEach(c => {
      const data = c.data();
      coursesMap[c.id] = {
        title: data.title,
        instructor_name: data.instructor_name,
        duration_weeks: data.duration_weeks
      };
    });

    const formattedEnrollments = enrollments.map(e => ({
      id: e.id,
      progress: e.progress,
      status: e.status,
      enrollment_date: e.enrollment_date,
      completion_date: e.completion_date,
      course_id: e.course_id,
      courseTitle: coursesMap[e.course_id]?.title,
      instructorName: coursesMap[e.course_id]?.instructor_name,
      durationWeeks: coursesMap[e.course_id]?.duration_weeks
    }));

    res.json(formattedEnrollments);
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
    const applicationsQuery = query(collection(db, 'internship_submissions'), where('user_id', '==', userId), orderBy('submitted_at', 'desc'));
    const applicationsSnapshot = await getDocs(applicationsQuery);
    const applications = applicationsSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const internshipIds = applications.map(a => a.internship_id);
    const internshipsQuery = query(collection(db, 'internships'), where('__name__', 'in', internshipIds.length ? internshipIds : ['dummy']));
    const internshipsSnapshot = await getDocs(internshipsQuery);
    const internshipsMap = {};
    internshipsSnapshot.docs.forEach(i => {
      const data = i.data();
      internshipsMap[i.id] = {
        title: data.title,
        company: data.company
      };
    });

    const formattedApplications = applications.map(app => ({
      id: app.id,
      internship_id: app.internship_id,
      applicationStatus: app.status,
      applicationDate: app.submitted_at,
      internshipTitle: internshipsMap[app.internship_id]?.title,
      companyName: internshipsMap[app.internship_id]?.company
    }));

    res.json(formattedApplications);
  } catch (error) {
    console.error('Error fetching user internship applications for dashboard:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// =============== NEW PROFESSIONAL DASHBOARD ENDPOINTS ====================

// Assumes a 'services' table with detailed service info, joined with 'service_categories'
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const servicesQuery = query(collection(db, 'services'), where('__name__', 'in', []), orderBy('popular', 'desc'), orderBy('name'));
    const servicesSnapshot = await getDocs(servicesQuery);
    const services = servicesSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const categoryIds = [...new Set(services.map(s => s.category_id))];
    const categoriesQuery = query(collection(db, 'service_categories'), where('__name__', 'in', categoryIds.length ? categoryIds : ['dummy']), where('is_active', '==', true));
    const categoriesSnapshot = await getDocs(categoriesQuery);
    const categoriesMap = {};
    categoriesSnapshot.docs.forEach(c => {
      const data = c.data();
      categoriesMap[c.id] = data.name;
    });

    // Parse JSON fields
    const parsedServices = services.map(service => ({
      ...service,
      features: service.features ? JSON.parse(service.features) : [],
      categoryName: categoriesMap[service.category_id]
    }));

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
    const requestsQuery = query(collection(db, 'service_requests'), where('user_id', '==', userId), orderBy('created_at', 'desc'));
    const requestsSnapshot = await getDocs(requestsQuery);
    const requests = requestsSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const subcategoryIds = requests.map(r => r.subcategory_id);
    const subcategoriesQuery = query(collection(db, 'service_categories'), where('__name__', 'in', subcategoryIds.length ? subcategoryIds : ['dummy']));
    const subcategoriesSnapshot = await getDocs(subcategoriesQuery);
    const subcategoriesMap = {};
    subcategoriesSnapshot.docs.forEach(sc => {
      const data = sc.data();
      subcategoriesMap[sc.id] = data.name;
    });

    const formattedRequests = requests.map(sr => ({
      id: sr.id,
      userId: sr.user_id,
      categoryId: sr.subcategory_id,
      categoryName: subcategoriesMap[sr.subcategory_id],
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
    }));

    res.json(formattedRequests);
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
    const result = await addDoc(collection(db, 'service_requests'), {
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
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });

    // Return the ID of the newly created request
    res.status(201).json({ message: 'Service request submitted successfully!', id: result.id });
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
    const enrollmentsQuery = query(collection(db, 'enrollments'), where('user_id', '==', userId), where('status', '==', 'active'));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const courseIds = enrollmentsSnapshot.docs.map(e => e.data().course_id);

    // Get courses
    const coursesQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds.length ? courseIds : ['dummy']));
    const coursesSnapshot = await getDocs(coursesQuery);
    const courseEvents = coursesSnapshot.docs.map(c => {
      const data = c.data();
      return {
        id: c.id,
        title: data.title,
        description: data.description,
        date: data.created_at,
        type: 'course_start',
        course_id: c.id,
        course_title: data.title,
        course_category: data.category
      };
    });

    // Get assignments
    const assignmentsQuery = query(collection(db, 'assignments'), where('course_id', 'in', courseIds.length ? courseIds : ['dummy']));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignments = assignmentsSnapshot.docs.map(a => ({id: a.id, ...a.data()}));

    // Get submissions
    const submissionsQuery = query(collection(db, 'assignment_submissions'), where('user_id', '==', userId));
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submissionsMap = {};
    submissionsSnapshot.docs.forEach(s => {
      const data = s.data();
      submissionsMap[data.assignment_id] = data;
    });

    const assignmentEvents = assignments.map(a => {
      const course = coursesSnapshot.docs.find(c => c.id === a.course_id)?.data();
      const submission = submissionsMap[a.id];
      let status = 'pending';
      if (submission && submission.status === 'graded') status = 'completed';
      else if (a.due_date.toDate() < new Date() && !submission) status = 'overdue';

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        date: a.due_date,
        type: 'assignment',
        course_id: a.course_id,
        course_title: course?.title,
        course_category: course?.category,
        status
      };
    });

    // Get custom events
    let customEvents = [];
    try {
      const customQuery = query(collection(db, 'custom_calendar_events'), where('user_id', '==', userId), where('event_date', '>=', Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))), orderBy('event_date', 'asc'));
      const customSnapshot = await getDocs(customQuery);
      customEvents = customSnapshot.docs.map(c => {
        const data = c.data();
        return {
          id: c.id,
          title: data.title,
          description: data.description,
          date: data.event_date,
          time: data.event_time,
          type: data.event_type,
          color: 'custom'
        };
      });
    } catch (error) {
      console.log('Custom events not found, skipping...');
    }

    // Format and combine
    const formattedCourseEvents = courseEvents.map(event => ({
      id: `course-${event.id}`,
      title: `Course: ${event.title}`,
      description: event.description || 'Course enrollment',
      date: event.date,
      type: 'course_start',
      course: {
        id: event.course_id,
        title: event.course_title,
        category: event.course_category
      },
      color: 'blue'
    }));

    const formattedAssignmentEvents = assignmentEvents.map(assignment => ({
      id: `assignment-${assignment.id}`,
      title: assignment.title,
      description: assignment.description || 'Assignment due',
      date: assignment.date,
      type: 'assignment',
      course: {
        id: assignment.course_id,
        title: assignment.course_title,
        category: assignment.course_category
      },
      status: assignment.status,
      color: assignment.status === 'completed' ? 'green' :
             assignment.status === 'overdue' ? 'red' : 'orange'
    }));

    const formattedCustomEvents = customEvents.map(event => ({
      id: `custom-${event.id}`,
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time,
      type: event.type || 'custom',
      color: 'purple'
    }));

    const allEvents = [...formattedCourseEvents, ...formattedAssignmentEvents, ...formattedCustomEvents];

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
    const enrollmentsQuery = query(collection(db, 'enrollments'), where('user_id', '==', userId), where('status', '==', 'active'));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const courseIds = enrollmentsSnapshot.docs.map(e => e.data().course_id);

    // Get assignments on this date
    const assignmentsQuery = query(collection(db, 'assignments'), where('course_id', 'in', courseIds.length ? courseIds : ['dummy']));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignments = assignmentsSnapshot.docs.map(a => ({id: a.id, ...a.data()} )).filter(a => a.due_date.toDate().toDateString() === parsedDate.toDateString());

    // Get courses started on this date
    const coursesQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds.length ? courseIds : ['dummy']));
    const coursesSnapshot = await getDocs(coursesQuery);
    const courses = coursesSnapshot.docs.map(c => ({id: c.id, ...c.data()} )).filter(c => c.created_at.toDate().toDateString() === parsedDate.toDateString());

    // Get submissions
    const submissionIds = assignments.map(a => a.id);
    const submissionsQuery = query(collection(db, 'assignment_submissions'), where('assignment_id', 'in', submissionIds.length ? submissionIds : ['dummy']), where('user_id', '==', userId));
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submissionsMap = {};
    submissionsSnapshot.docs.forEach(s => {
      const data = s.data();
      submissionsMap[data.assignment_id] = data;
    });

    const assignmentEvents = assignments.map(a => {
      const course = coursesSnapshot.docs.find(c => c.id === a.course_id)?.data() || {};
      const submission = submissionsMap[a.id];
      let status = 'pending';
      if (submission && submission.status === 'graded') status = 'completed';
      else if (a.due_date.toDate() < new Date() && !submission) status = 'overdue';

      return {
        event_type: 'assignment',
        id: a.id,
        title: a.title,
        description: a.description,
        date: a.due_date,
        time: null,
        course_id: a.course_id,
        course_title: course.title,
        course_category: course.category,
        status
      };
    });

    const courseEvents = courses.map(c => ({
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
    }));

    // Try to get custom events for the date
    let customEvents = [];
    try {
      const customQuery = query(collection(db, 'custom_calendar_events'), where('user_id', '==', userId), where('event_date', '==', Timestamp.fromDate(parsedDate)));
      const customSnapshot = await getDocs(customQuery);
      customEvents = customSnapshot.docs.map(c => {
        const data = c.data();
        return {
          event_type: 'custom',
          id: c.id,
          title: data.title,
          description: data.description,
          date: data.event_date,
          time: data.event_time,
          course_id: null,
          course_title: null,
          course_category: null,
          status: 'pending'
        };
      });
    } catch (error) {
      // Custom events table doesn't exist
    }

    const allEvents = [...assignmentEvents, ...courseEvents, ...customEvents];

    const formattedEvents = allEvents.map(event => ({
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

    res.json(formattedEvents);
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
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    // Get enrolled courses
    const enrollmentsQuery = query(collection(db, 'enrollments'), where('user_id', '==', userId), where('status', '==', 'active'));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const courseIds = enrollmentsSnapshot.docs.map(e => e.data().course_id);

    // Get upcoming assignments
    const assignmentsQuery = query(collection(db, 'assignments'), where('course_id', 'in', courseIds.length ? courseIds : ['dummy']));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignments = assignmentsSnapshot.docs.map(a => ({id: a.id, ...a.data()} )).filter(a => {
      const dueDate = a.due_date.toDate();
      return dueDate >= today && dueDate <= sevenDaysLater;
    }).sort((a,b) => a.due_date.toDate() - b.due_date.toDate()).slice(0, 10);

    // Get submissions
    const submissionIds = assignments.map(a => a.id);
    const submissionsQuery = query(collection(db, 'assignment_submissions'), where('assignment_id', 'in', submissionIds.length ? submissionIds : ['dummy']), where('user_id', '==', userId));
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submissionsMap = {};
    submissionsSnapshot.docs.forEach(s => {
      const data = s.data();
      submissionsMap[data.assignment_id] = data;
    });

    const coursesMap = {};
    const coursesSnapshot = await getDocs(query(collection(db, 'courses'), where('__name__', 'in', courseIds.length ? courseIds : ['dummy'])));
    coursesSnapshot.docs.forEach(c => {
      coursesMap[c.id] = c.data();
    });

    const assignmentEvents = assignments.map(a => {
      const course = coursesMap[a.course_id] || {};
      const submission = submissionsMap[a.id];
      let status = 'pending';
      if (submission && submission.status === 'graded') status = 'completed';
      else if (a.due_date.toDate() < today && !submission) status = 'overdue';

      return {
        event_type: 'assignment',
        id: a.id,
        title: a.title,
        description: a.description,
        date: a.due_date,
        time: null,
        course_id: a.course_id,
        course_title: course.title,
        course_category: course.category,
        status
      };
    });

    // Try to get upcoming custom events
    let customUpcoming = [];
    try {
      const customQuery = query(collection(db, 'custom_calendar_events'), where('user_id', '==', userId), where('event_date', '>=', Timestamp.fromDate(today)), where('event_date', '<=', Timestamp.fromDate(sevenDaysLater)), orderBy('event_date', 'asc'), limit(5));
      const customSnapshot = await getDocs(customQuery);
      customUpcoming = customSnapshot.docs.map(c => {
        const data = c.data();
        return {
          event_type: 'custom',
          id: c.id,
          title: data.title,
          description: data.description,
          date: data.event_date,
          time: data.event_time,
          course_id: null,
          course_title: null,
          course_category: null,
          status: 'pending'
        };
      });
    } catch (error) {
      // Custom events table doesn't exist
    }

    const allUpcoming = [...assignmentEvents, ...customUpcoming];

    const formattedUpcoming = allUpcoming.map(event => ({
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

    res.json(formattedUpcoming);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// GET /api/calendar/stats - Get calendar statistics
app.get('/api/calendar/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get enrollments
    const enrollmentsQuery = query(collection(db, 'enrollments'), where('user_id', '==', userId));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const enrollments = enrollmentsSnapshot.docs.map(e => e.data());

    const courseIds = enrollments.map(e => e.course_id);

    // Get assignments
    const assignmentsQuery = query(collection(db, 'assignments'), where('course_id', 'in', courseIds.length ? courseIds : ['dummy']));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignments = assignmentsSnapshot.docs.map(a => a.id);

    // Get submissions
    const submissionsQuery = query(collection(db, 'assignment_submissions'), where('user_id', '==', userId), where('assignment_id', 'in', assignments.length ? assignments : ['dummy']));
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submissions = submissionsSnapshot.docs.map(s => s.data());

    const pendingAssignments = assignments.length - submissions.length;
    const completedAssignments = submissions.filter(s => s.status === 'graded').length;
    const overdueAssignments = assignmentsSnapshot.docs.filter(a => {
      return a.data().due_date.toDate() < new Date() && !submissions.find(s => s.assignment_id === a.id);
    }).length;

    const activeCourses = enrollments.filter(e => e.status === 'active').length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;

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

    // Get enrollments
    const enrollmentsQuery = query(collection(db, 'enrollments'), where('user_id', '==', userId), where('status', '==', 'active'));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const courseIds = enrollmentsSnapshot.docs.map(e => e.data().course_id);

    // Get assignments
    const assignmentsQuery = query(collection(db, 'assignments'), where('course_id', 'in', courseIds.length ? courseIds : ['dummy']), orderBy('due_date', 'asc'));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignments = assignmentsSnapshot.docs.map(a => ({id: a.id, ...a.data()}));

    // Get submissions
    const assignmentIds = assignments.map(a => a.id);
    const submissionsQuery = query(collection(db, 'assignment_submissions'), where('assignment_id', 'in', assignmentIds.length ? assignmentIds : ['dummy']), where('user_id', '==', userId));
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submissionsMap = {};
    submissionsSnapshot.docs.forEach(s => {
      const data = s.data();
      submissionsMap[data.assignment_id] = {
        id: s.id,
        status: data.status,
        grade: data.grade
      };
    });

    // Get courses
    const coursesQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds.length ? courseIds : ['dummy']));
    const coursesSnapshot = await getDocs(coursesQuery);
    const coursesMap = {};
    coursesSnapshot.docs.forEach(c => {
      const data = c.data();
      coursesMap[c.id] = {
        title: data.title,
        category: data.category
      };
    });

    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date,
      max_points: assignment.max_points,
      course: {
        id: assignment.course_id,
        title: coursesMap[assignment.course_id]?.title,
        category: coursesMap[assignment.course_id]?.category
      },
      submission: submissionsMap[assignment.id] || null
    }));

    res.json(formattedAssignments);
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

    const eventRef = await addDoc(collection(db, 'custom_calendar_events'), {
      user_id: userId,
      title: title,
      description: description,
      event_date: Timestamp.fromDate(new Date(date)),
      event_time: time,
      event_type: type,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
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
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    const eventData = eventSnap.data();
    if (eventData.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await updateDoc(eventRef, {
      title: title,
      description: description,
      event_date: Timestamp.fromDate(new Date(date)),
      event_time: time,
      event_type: type,
      updated_at: Timestamp.now()
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
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    const eventData = eventSnap.data();
    if (eventData.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
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

      // Insert into database
      const requestRef = await addDoc(collection(db, 'course_enroll_requests'), {
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
        created_at: Timestamp.now()
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
    const coursesQuery = query(collection(db, 'courses'), where('is_active', '==', true), orderBy('created_at', 'desc'));
    const coursesSnapshot = await getDocs(coursesQuery);
    const courses = coursesSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

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

    const enrollmentsQuery = query(collection(db, 'enrollments'), where('user_id', '==', userId), where('status', '==', 'active'), orderBy('enrollment_date', 'desc'));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const enrollments = enrollmentsSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const courseIds = enrollments.map(e => e.course_id);
    const coursesQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds.length ? courseIds : ['dummy']));
    const coursesSnapshot = await getDocs(coursesQuery);
    const coursesMap = {};
    coursesSnapshot.docs.forEach(c => {
      coursesMap[c.id] = c.data();
    });

    const formattedEnrollments = enrollments.map(enrollment => ({
      id: enrollment.id,
      userId: enrollment.user_id,
      courseId: enrollment.course_id,
      progress: enrollment.progress,
      enrollmentDate: enrollment.enrollment_date,
      completionDate: enrollment.completion_date,
      status: enrollment.status,
      course: {
        id: enrollment.course_id,
        title: coursesMap[enrollment.course_id]?.title,
        description: coursesMap[enrollment.course_id]?.description,
        instructorName: coursesMap[enrollment.course_id]?.instructor_name,
        durationWeeks: coursesMap[enrollment.course_id]?.duration_weeks,
        difficultyLevel: coursesMap[enrollment.course_id]?.difficulty_level,
        category: coursesMap[enrollment.course_id]?.category,
        price: coursesMap[enrollment.course_id]?.price,
        thumbnail: coursesMap[enrollment.course_id]?.thumbnail,
        isActive: coursesMap[enrollment.course_id]?.is_active
      }
    }));

    res.json(formattedEnrollments);

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
    const enrollmentQuery = query(collection(db, 'enrollments'), where('user_id', '==', userId), where('course_id', '==', courseId));
    const enrollmentSnapshot = await getDocs(enrollmentQuery);

    if (!enrollmentSnapshot.empty) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const courseSnap = await getDoc(doc(db, 'courses', courseId));
    if (!courseSnap.exists() || !courseSnap.data().is_active) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    await addDoc(collection(db, 'enrollments'), {
      user_id: userId,
      course_id: courseId,
      progress: 0,
      status: 'active',
      enrollment_date: Timestamp.now(),
      completion_date: null
    });

    // Update user stats
    const statsQuery = query(collection(db, 'user_stats'), where('user_id', '==', userId));
    const statsSnapshot = await getDocs(statsQuery);
    if (!statsSnapshot.empty) {
      await updateDoc(statsSnapshot.docs[0].ref, {
        courses_enrolled: increment(1)
      });
    }

    res.status(201).json({ message: 'Successfully enrolled in course' });

  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ASSIGNMENTS ROUTES ====================

// GET /auth/me - Get current user info
app.get('/auth/me', authenticateToken, (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
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
    email_verified: user.email_verified
  });
});

// GET /assignments/my-assignments - Get user's assignments
app.get('/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get enrollments
    const enrollmentsQuery = query(collection(db, 'enrollments'), where('user_id', '==', userId), where('status', '==', 'active'));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const courseIds = enrollmentsSnapshot.docs.map(e => e.data().course_id);

    // Get assignments
    const assignmentsQuery = query(collection(db, 'assignments'), where('course_id', 'in', courseIds.length ? courseIds : ['dummy']), orderBy('due_date', 'asc'));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignments = assignmentsSnapshot.docs.map(a => ({id: a.id, ...a.data()}));

    // Get submissions
    const assignmentIds = assignments.map(a => a.id);
    const submissionsQuery = query(collection(db, 'assignment_submissions'), where('assignment_id', 'in', assignmentIds.length ? assignmentIds : ['dummy']), where('user_id', '==', userId));
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submissionsMap = {};
    submissionsSnapshot.docs.forEach(s => {
      const data = s.data();
      submissionsMap[data.assignment_id] = {
        id: s.id,
        content: data.content,
        file_path: data.file_path,
        submitted_at: data.submitted_at,
        grade: data.grade,
        feedback: data.feedback,
        status: data.status
      };
    });

    // Get courses
    const coursesQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds.length ? courseIds : ['dummy']));
    const coursesSnapshot = await getDocs(coursesQuery);
    const coursesMap = {};
    coursesSnapshot.docs.forEach(c => {
      const data = c.data();
      coursesMap[c.id] = {
        title: data.title,
        category: data.category
      };
    });

    const formattedAssignments = assignments.map(row => ({
      id: row.id,
      course_id: row.course_id,
      title: row.title,
      description: row.description,
      due_date: row.due_date,
      max_points: row.max_points,
      created_at: row.created_at,
      course: {
        id: row.course_id,
        title: coursesMap[row.course_id]?.title,
        category: coursesMap[row.course_id]?.category
      },
      submission: submissionsMap[row.id] || null
    }));

    res.json(formattedAssignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /assignments/all - Get all assignments (admin only)
app.get('/assignments/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const assignmentsQuery = query(collection(db, 'assignments'), orderBy('due_date', 'asc'));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignments = assignmentsSnapshot.docs.map(a => ({id: a.id, ...a.data()}));

    const courseIds = [...new Set(assignments.map(a => a.course_id))];
    const coursesQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds.length ? courseIds : ['dummy']));
    const coursesSnapshot = await getDocs(coursesQuery);
    const coursesMap = {};
    coursesSnapshot.docs.forEach(c => {
      const data = c.data();
      coursesMap[c.id] = {
        title: data.title,
        category: data.category
      };
    });

    const assignmentIds = assignments.map(a => a.id);
    const submissionsQuery = query(collection(db, 'assignment_submissions'), where('assignment_id', 'in', assignmentIds.length ? assignmentIds : ['dummy']));
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submissions = submissionsSnapshot.docs.map(s => s.data());

    const formattedAssignments = assignments.map(row => ({
      id: row.id,
      course_id: row.course_id,
      title: row.title,
      description: row.description,
      due_date: row.due_date,
      max_points: row.max_points,
      created_at: row.created_at,
      course: {
        id: row.course_id,
        title: coursesMap[row.course_id]?.title,
        category: coursesMap[row.course_id]?.category
      },
      submission_count: submissions.filter(s => s.assignment_id === row.id).length,
      graded_count: submissions.filter(s => s.assignment_id === row.id && s.status === 'graded').length
    }));

    res.json(formattedAssignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
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
    const assignmentSnap = await getDoc(doc(db, 'assignments', assignment_id));
    if (!assignmentSnap.exists()) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentSnap.data();
    const courseId = assignment.course_id;

    const enrollmentQuery = query(collection(db, 'enrollments'), where('user_id', '==', req.user.id), where('course_id', '==', courseId));
    const enrollmentSnapshot = await getDocs(enrollmentQuery);

    if (enrollmentSnapshot.empty) {
      return res.status(404).json({ error: 'Not enrolled in course' });
    }

    // Check if already submitted
    const submissionQuery = query(collection(db, 'assignment_submissions'), where('assignment_id', '==', assignment_id), where('user_id', '==', req.user.id));
    const submissionSnapshot = await getDocs(submissionQuery);

    if (!submissionSnapshot.empty) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }

    // Insert submission
    const submissionRef = await addDoc(collection(db, 'assignment_submissions'), {
      assignment_id: assignment_id,
      user_id: req.user.id,
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
      submission_id: submissionRef.id
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /assignments/download-submission/:id - Download submission file
app.get('/assignments/download-submission/:id', authenticateToken, async (req, res) => {
  const submissionId = req.params.id;

  try {
    const submissionSnap = await getDoc(doc(db, 'assignment_submissions', submissionId));
    if (!submissionSnap.exists()) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = submissionSnap.data();

    const assignmentSnap = await getDoc(doc(db, 'assignments', submission.assignment_id));
    const assignment = assignmentSnap.data();

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
    console.error('Error downloading submission:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /assignments/course/:courseId - Get assignments for a specific course
app.get('/assignments/course/:courseId', authenticateToken, async (req, res) => {
  const courseId = req.params.courseId;

  try {
    // Check if user is enrolled or admin
    const enrollmentQuery = query(collection(db, 'enrollments'), where('user_id', '==', req.user.id), where('course_id', '==', courseId));
    const enrollmentSnapshot = await getDocs(enrollmentQuery);

    if (enrollmentSnapshot.empty && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignmentsQuery = query(collection(db, 'assignments'), where('course_id', '==', courseId), orderBy('due_date', 'asc'));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignments = assignmentsSnapshot.docs.map(a => ({id: a.id, ...a.data()}));

    const courseSnap = await getDoc(doc(db, 'courses', courseId));
    const course = courseSnap.data();

    const assignmentIds = assignments.map(a => a.id);
    const submissionsQuery = query(collection(db, 'assignment_submissions'), where('assignment_id', 'in', assignmentIds.length ? assignmentIds : ['dummy']), where('user_id', '==', req.user.id));
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submissionsMap = {};
    submissionsSnapshot.docs.forEach(s => {
      const data = s.data();
      submissionsMap[data.assignment_id] = {
        id: s.id,
        content: data.content,
        file_path: data.file_path,
        submitted_at: data.submitted_at,
        grade: data.grade,
        feedback: data.feedback,
        status: data.status
      };
    });

    const formattedAssignments = assignments.map(row => ({
      id: row.id,
      course_id: row.course_id,
      title: row.title,
      description: row.description,
      due_date: row.due_date,
      max_points: row.max_points,
      created_at: row.created_at,
      course: {
        id: row.course_id,
        title: course.title,
        category: course.category
      },
      submission: submissionsMap[row.id] || null
    }));

    res.json(formattedAssignments);
  } catch (error) {
    console.error('Error fetching assignments for course:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /assignments/grade/:submissionId - Grade assignment (admin/instructor only)
app.put('/assignments/grade/:submissionId', authenticateToken, async (req, res) => {
  const submissionId = req.params.submissionId;
  const { grade, feedback } = req.body;

  try {
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    // Validate grade
    if (grade < 0 || grade > 100) {
      return res.status(400).json({ error: 'Grade must be between 0 and 100' });
    }

    const submissionRef = doc(db, 'assignment_submissions', submissionId);
    const submissionSnap = await getDoc(submissionRef);

    if (!submissionSnap.exists()) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    await updateDoc(submissionRef, {
      grade: grade,
      feedback: feedback || '',
      status: 'graded'
    });

    res.json({
      success: true,
      message: 'Assignment graded successfully'
    });
  } catch (error) {
    console.error('Error grading assignment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== RESOURCES ROUTES ======================
// GET resources for current user
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const accountType = req.user.account_type;
    
    // Get all resources
    const resourcesQuery = query(collection(db, 'resources'), orderBy('created_at', 'desc'));
    const resourcesSnapshot = await getDocs(resourcesQuery);
    const resources = resourcesSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    // Filter by allowed_account_types
    const filteredResources = resources.filter(resource => {
      const allowedTypes = JSON.parse(resource.allowed_account_types || '[]');
      return allowedTypes.includes(accountType);
    });

    res.json(filteredResources);
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
    
    const resourceSnap = await getDoc(doc(db, 'resources', id));
    if (!resourceSnap.exists()) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const resource = resourceSnap.data();
    const allowedTypes = JSON.parse(resource.allowed_account_types || '[]');
    if (!allowedTypes.includes(req.user.account_type)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if resource is premium and user doesn't have access
    if (resource.is_premium && !['professional', 'business', 'agency', 'admin'].includes(req.user.account_type)) {
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

    const certificatesQuery = query(collection(db, 'certificates'), where('user_id', '==', userId), orderBy('issued_date', 'desc'));
    const certificatesSnapshot = await getDocs(certificatesQuery);
    const certificates = certificatesSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const courseIds = certificates.map(c => c.course_id);
    const coursesQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds.length ? courseIds : ['dummy']));
    const coursesSnapshot = await getDocs(coursesQuery);
    const coursesMap = {};
    coursesSnapshot.docs.forEach(c => {
      coursesMap[c.id] = c.data();
    });

    const enrollmentQuery = query(collection(db, 'enrollments'), where('user_id', '==', userId), where('course_id', 'in', courseIds.length ? courseIds : ['dummy']));
    const enrollmentSnapshot = await getDocs(enrollmentQuery);
    const enrollmentsMap = {};
    enrollmentSnapshot.docs.forEach(e => {
      const data = e.data();
      enrollmentsMap[data.course_id] = data;
    });

    const assignmentIds = await getDocs(query(collection(db, 'assignments'), where('course_id', 'in', courseIds.length ? courseIds : ['dummy'])));
    const assignmentMap = {};
    assignmentIds.docs.forEach(a => {
      if (!assignmentMap[a.data().course_id]) assignmentMap[a.data().course_id] = [];
      assignmentMap[a.data().course_id].push(a.id);
    });

    const formattedCertificates = [];
    for (let cert of certificates) {
      const course = coursesMap[cert.course_id] || {};
      const enrollment = enrollmentsMap[cert.course_id] || {};

      // Get average grade
      let finalGrade = 0;
      if (assignmentMap[cert.course_id]) {
        const subQuery = query(collection(db, 'assignment_submissions'), where('assignment_id', 'in', assignmentMap[cert.course_id]), where('user_id', '==', userId));
        const subSnapshot = await getDocs(subQuery);
        const grades = subSnapshot.docs.map(s => s.data().grade).filter(g => g != null);
        finalGrade = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
      }

      formattedCertificates.push({
        id: cert.id,
        userId: cert.user_id,
        courseId: cert.course_id,
        certificateUrl: cert.certificate_url,
        issuedDate: cert.issued_date,
        course: {
          id: cert.course_id,
          title: course.title,
          description: course.description,
          instructorName: course.instructor_name,
          category: course.category,
          difficultyLevel: course.difficulty_level
        },
        enrollment: {
          completionDate: enrollment.completion_date,
          finalGrade: Math.round(finalGrade),
          status: enrollment.status
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
    const certificateSnap = await getDoc(doc(db, 'certificates', certificateId));
    if (!certificateSnap.exists() || certificateSnap.data().user_id !== userId) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = certificateSnap.data();

    const courseSnap = await getDoc(doc(db, 'courses', certificate.course_id));
    const course = courseSnap.data();

    const userSnap = await getDoc(doc(db, 'users', userId));
    const user = userSnap.data();

    // If certificate_url exists, redirect to it
    if (certificate.certificate_url) {
      return res.redirect(certificate.certificate_url);
    }

    // Otherwise, generate a simple JSON response (PDF generation can be added later)
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
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const certificatesQuery = query(collection(db, 'certificates'), orderBy('issued_date', 'desc'));
    const certificatesSnapshot = await getDocs(certificatesQuery);
    const certificates = certificatesSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const courseIds = certificates.map(c => c.course_id);
    const coursesQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds.length ? courseIds : ['dummy']));
    const coursesSnapshot = await getDocs(coursesQuery);
    const coursesMap = {};
    coursesSnapshot.docs.forEach(c => {
      coursesMap[c.id] = c.data();
    });

    const userIds = certificates.map(c => c.user_id);
    const usersQuery = query(collection(db, 'users'), where('__name__', 'in', userIds.length ? userIds : ['dummy']));
    const usersSnapshot = await getDocs(usersQuery);
    const usersMap = {};
    usersSnapshot.docs.forEach(u => {
      usersMap[u.id] = u.data();
    });

    const enrollmentQuery = query(collection(db, 'enrollments'), where('course_id', 'in', courseIds.length ? courseIds : ['dummy']));
    const enrollmentSnapshot = await getDocs(enrollmentQuery);
    const enrollmentsMap = {};
    enrollmentSnapshot.docs.forEach(e => {
      const data = e.data();
      enrollmentsMap[`${data.user_id}-${data.course_id}`] = data;
    });

    const formattedCertificates = certificates.map(cert => ({
      id: cert.id,
      userId: cert.user_id,
      courseId: cert.course_id,
      certificateUrl: cert.certificate_url,
      issuedDate: cert.issued_date,
      course: {
        id: cert.course_id,
        title: coursesMap[cert.course_id]?.title,
        instructorName: coursesMap[cert.course_id]?.instructor_name,
        category: coursesMap[cert.course_id]?.category,
        difficultyLevel: coursesMap[cert.course_id]?.difficulty_level
      },
      user: {
        firstName: usersMap[cert.user_id]?.first_name,
        lastName: usersMap[cert.user_id]?.last_name,
        email: usersMap[cert.user_id]?.email
      },
      enrollment: {
        completionDate: enrollmentsMap[`${cert.user_id}-${cert.course_id}`]?.completion_date
      }
    }));

    res.json(formattedCertificates);
  } catch (error) {
    console.error('Error fetching all certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Issue new certificate (admin only)
app.post('/api/certificates', authenticateToken, async (req, res) => {
  try {
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId, courseId, certificateUrl } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'User ID and Course ID are required' });
    }

    // Check if user has completed the course
    const enrollmentQuery = query(collection(db, 'enrollments'), where('user_id', '==', userId), where('course_id', '==', courseId), where('status', '==', 'completed'));
    const enrollmentSnapshot = await getDocs(enrollmentQuery);

    if (enrollmentSnapshot.empty) {
      return res.status(400).json({ error: 'User has not completed this course' });
    }

    // Check if certificate already exists
    const certificateQuery = query(collection(db, 'certificates'), where('user_id', '==', userId), where('course_id', '==', courseId));
    const certificateSnapshot = await getDocs(certificateQuery);

    if (!certificateSnapshot.empty) {
      return res.status(400).json({ error: 'Certificate already exists for this user and course' });
    }

    // Create new certificate
    const result = await addDoc(collection(db, 'certificates'), {
      user_id: userId,
      course_id: courseId,
      certificate_url: certificateUrl || null,
      issued_date: Timestamp.now()
    });

    // Update user stats
    const statsQuery = query(collection(db, 'user_stats'), where('user_id', '==', userId));
    const statsSnapshot = await getDocs(statsQuery);
    if (!statsSnapshot.empty) {
      await updateDoc(statsSnapshot.docs[0].ref, {
        certificates_earned: increment(1)
      });
    }

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificateId: result.id
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ error: 'Failed to issue certificate' });
  }
});

// Update certificate
app.put('/api/certificates/:certificateId', authenticateToken, async (req, res) => {
  try {
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { certificateId } = req.params;
    const { certificateUrl } = req.body;

    const certificateRef = doc(db, 'certificates', certificateId);
    await updateDoc(certificateRef, {
      certificate_url: certificateUrl,
      issued_date: Timestamp.now()
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
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { certificateId } = req.params;

    const certificateSnap = await getDoc(doc(db, 'certificates', certificateId));
    if (!certificateSnap.exists()) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = certificateSnap.data();

    await deleteDoc(doc(db, 'certificates', certificateId));

    // Update user stats
    const statsQuery = query(collection(db, 'user_stats'), where('user_id', '==', certificate.user_id));
    const statsSnapshot = await getDocs(statsQuery);
    if (!statsSnapshot.empty) {
      const current = statsSnapshot.docs[0].data().certificates_earned;
      await updateDoc(statsSnapshot.docs[0].ref, {
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
    const statsQuery = query(collection(db, 'user_stats'), where('user_id', '==', req.user.id));
    const statsSnapshot = await getDocs(statsQuery);

    let stats;
    if (statsSnapshot.empty) {
      // Create default stats if none exist
      await addDoc(collection(db, 'user_stats'), {
        user_id: req.user.id,
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        last_activity: Timestamp.now()
      });

      stats = {
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0
      };
    } else {
      stats = statsSnapshot.docs[0].data();
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
    await addDoc(collection(db, 'download_logs'), {
      user_id: req.user.id,
      resource_id: resourceId,
      resource_name: resource.title,
      created_at: Timestamp.now()
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
    const enrollmentsQuery = query(collection(db, 'enrollments'), where('user_id', '==', req.user.id), orderBy('enrollment_date', 'desc'));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const enrollments = enrollmentsSnapshot.docs.map(d => d.data());

    const courseIds = enrollments.map(e => e.course_id);
    const coursesQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds.length ? courseIds : ['dummy']));
    const coursesSnapshot = await getDocs(coursesQuery);
    const courses = coursesSnapshot.docs.map(c => ({id: c.id, ...c.data()}));

    const formattedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      category: course.category,
      difficulty_level: course.difficulty_level,
      progress: enrollments.find(e => e.course_id === course.id)?.progress || 0,
      isEnrolled: true
    }));

    res.json(formattedCourses);
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== INTERNSHIPS SECTION ROUTES ====================

// GET /api/internships - Fetch all internships
app.get('/api/internships', async (req, res) => {
  try {
    const internshipsQuery = query(collection(db, 'internships'), orderBy('posted_at', 'desc'));
    const internshipsSnapshot = await getDocs(internshipsQuery);
    const internships = internshipsSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const parsedInternships = internships.map(intern => ({
      ...intern,
      requirements: intern.requirements ? JSON.parse(intern.requirements) : [],
      benefits: intern.benefits ? JSON.parse(intern.benefits) : []
    }));

    res.json(parsedInternships);
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
    const applicationsQuery = query(collection(db, 'internship_submissions'), where('user_id', '==', userId), orderBy('submitted_at', 'desc'));
    const applicationsSnapshot = await getDocs(applicationsQuery);
    const applications = applicationsSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const internshipIds = applications.map(app => app.internship_id);
    const internshipsQuery = query(collection(db, 'internships'), where('__name__', 'in', internshipIds.length ? internshipIds : ['dummy']));
    const internshipsSnapshot = await getDocs(internshipsQuery);
    const internshipsMap = {};
    internshipsSnapshot.docs.forEach(i => {
      const data = i.data();
      internshipsMap[i.id] = data;
    });

    const parsedApplications = applications.map(app => ({
      ...app,
      requirements: internshipsMap[app.internship_id]?.requirements ? JSON.parse(internshipsMap[app.internship_id].requirements) : [],
      benefits: internshipsMap[app.internship_id]?.benefits ? JSON.parse(internshipsMap[app.internship_id].benefits) : [],
      internshipTitle: internshipsMap[app.internship_id]?.title,
      companyName: internshipsMap[app.internship_id]?.company,
      internship_posted_at: internshipsMap[app.internship_id]?.posted_at
    }));

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
    const internshipRef = doc(db, 'internships', internshipId);
    const internshipSnap = await getDoc(internshipRef);

    if (!internshipSnap.exists()) {
      return res.status(404).json({ message: 'Internship not found.' });
    }

    const internship = internshipSnap.data();
    if (internship.spots_available <= 0) {
      return res.status(400).json({ message: 'No available spots left for this internship.' });
    }

    const existingQuery = query(collection(db, 'internship_submissions'), where('internship_id', '==', internshipId), where('user_id', '==', userId));
    const existingSnapshot = await getDocs(existingQuery);
    if (!existingSnapshot.empty) {
      return res.status(409).json({ message: 'You have already applied for this internship.' });
    }

    await addDoc(collection(db, 'internship_submissions'), {
      internship_id: internshipId,
      user_id: userId,
      full_name: full_name,
      email: email,
      phone: phone || null,
      resume_url: resume_url,
      cover_letter: cover_letter || null,
      status: 'pending',
      submitted_at: Timestamp.now()
    });

    await updateDoc(internshipRef, {
      spots_available: increment(-1),
      applications_count: increment(1)
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
    const categoriesQuery = query(collection(db, 'service_categories'), where('is_active', '==', true), orderBy('name'));
    const categoriesSnapshot = await getDocs(categoriesQuery);
    const categories = categoriesSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const categoriesWithSubs = await Promise.all(categories.map(async (category) => {
      const subcategoriesQuery = query(collection(db, 'service_subcategories'), where('category_id', '==', category.id), where('is_active', '==', true), orderBy('name'));
      const subcategoriesSnapshot = await getDocs(subcategoriesQuery);
      const subcategories = subcategoriesSnapshot.docs.map(sub => ({id: sub.id, ...sub.data()}));

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        subcategories: subcategories.map(sub => ({
          id: sub.id,
          categoryId: sub.category_id,
          name: sub.name,
          description: sub.description,
          basePrice: sub.base_price
        }))
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
    const subcategorySnap = await getDoc(doc(db, 'service_subcategories', subcategoryId));
    if (!subcategorySnap.exists() || !subcategorySnap.data().is_active) {
      return res.status(404).json({ error: 'Service subcategory not found' });
    }

    // Create service request
    const result = await addDoc(collection(db, 'service_requests'), {
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
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });

    res.status(201).json({
      message: 'Service request submitted successfully',
      requestId: result.id
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

    const requestsQuery = query(collection(db, 'service_requests'), where('user_id', '==', userId), orderBy('created_at', 'desc'));
    const requestsSnapshot = await getDocs(requestsQuery);
    const requests = requestsSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const subcategoryIds = requests.map(r => r.subcategory_id);
    const subcategoriesQuery = query(collection(db, 'service_subcategories'), where('__name__', 'in', subcategoryIds.length ? subcategoryIds : ['dummy']));
    const subcategoriesSnapshot = await getDocs(subcategoriesQuery);
    const subcategoriesMap = {};
    subcategoriesSnapshot.docs.forEach(ss => {
      subcategoriesMap[ss.id] = ss.data().name;
    });

    const categoryIds = subcategoriesSnapshot.docs.map(ss => ss.data().category_id);
    const categoriesQuery = query(collection(db, 'service_categories'), where('__name__', 'in', categoryIds.length ? categoryIds : ['dummy']));
    const categoriesSnapshot = await getDocs(categoriesQuery);
    const categoriesMap = {};
    categoriesSnapshot.docs.forEach(sc => {
      categoriesMap[sc.id] = sc.data().name;
    });

    const formattedRequests = requests.map(request => ({
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
      categoryName: categoriesMap[request.subcategory_id ? subcategoriesSnapshot.docs.find(ss => ss.id === request.subcategory_id)?.data().category_id : null],
      subcategoryName: subcategoriesMap[request.subcategory_id]
    }));

    res.json(formattedRequests);

  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ADMIN DASHBOARD ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const usersQuery = query(collection(db, 'users'), where('is_active', '==', true));
    const usersSnapshot = await getDocs(usersQuery);
    const totalUsers = usersSnapshot.size;

    const coursesQuery = query(collection(db, 'courses'), where('is_active', '==', true));
    const coursesSnapshot = await getDocs(coursesQuery);
    const totalCourses = coursesSnapshot.size;

    const enrollmentsQuery = query(collection(db, 'enrollments'));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const totalEnrollments = enrollmentsSnapshot.size;

    let totalRevenue = 0;
    for (let e of enrollmentsSnapshot.docs) {
      const data = e.data();
      if (data.status === 'completed') {
        const courseSnap = await getDoc(doc(db, 'courses', data.course_id));
        if (courseSnap.exists()) totalRevenue += courseSnap.data().price || 0;
      }
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const contactsQuery = query(collection(db, 'contact_messages'), where('created_at', '>=', Timestamp.fromDate(sevenDaysAgo)));
    const contactsSnapshot = await getDocs(contactsQuery);
    const pendingContacts = contactsSnapshot.size;

    const serviceRequestsQuery = query(collection(db, 'service_requests'), where('status', '==', 'pending'));
    const serviceRequestsSnapshot = await getDocs(serviceRequestsQuery);
    const pendingServiceRequests = serviceRequestsSnapshot.size;

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
    const usersQuery = query(collection(db, 'users'), where('is_active', '==', true), orderBy('created_at', 'desc'), limit(5));
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(u => {
      const data = u.data();
      return {
        id: u.id,
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
    const enrollmentsQuery = query(collection(db, 'enrollments'), orderBy('enrollment_date', 'desc'), limit(5));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const enrollments = enrollmentsSnapshot.docs.map(e => e.data());

    const userIds = enrollments.map(e => e.user_id);
    const usersQuery = query(collection(db, 'users'), where('__name__', 'in', userIds.length ? userIds : ['dummy']));
    const usersSnapshot = await getDocs(usersQuery);
    const usersMap = {};
    usersSnapshot.docs.forEach(u => {
      const data = u.data();
      usersMap[u.id] = `${data.first_name} ${data.last_name}`;
    });

    const courseIds = enrollments.map(e => e.course_id);
    const coursesQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds.length ? courseIds : ['dummy']));
    const coursesSnapshot = await getDocs(coursesQuery);
    const coursesMap = {};
    coursesSnapshot.docs.forEach(c => {
      coursesMap[c.id] = c.data().title;
    });

    const formattedEnrollments = enrollments.map(e => ({
      id: e.id,
      user_name: usersMap[e.user_id],
      course_name: coursesMap[e.course_id],
      date: e.enrollment_date.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: e.status
    }));

    res.json(formattedEnrollments);
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
    const result = await addDoc(collection(db, 'contact_messages'), {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      company: company || null,
      message: message.trim(),
      created_at: Timestamp.now()
    });

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

// ==================== ANALYTICS ROUTES ====================

// Get analytics data (admin only)
app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // User growth data (last 6 months)
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    const usersQuery = query(collection(db, 'users'), where('created_at', '>=', Timestamp.fromDate(sixMonthsAgo)));
    const usersSnapshot = await getDocs(usersQuery);
    const userGrowth = {};
    usersSnapshot.docs.forEach(u => {
      const month = u.data().created_at.toDate().toISOString().slice(0,7);
      userGrowth[month] = (userGrowth[month] || 0) + 1;
    });

    const userGrowthArray = Object.entries(userGrowth).map(([month, count]) => ({month, count}));

    // Course enrollment data
    const coursesQuery = query(collection(db, 'courses'), where('is_active', '==', true));
    const coursesSnapshot = await getDocs(coursesQuery);
    const courseEnrollments = [];
    for (let c of coursesSnapshot.docs) {
      const data = c.data();
      const enrollQuery = query(collection(db, 'enrollments'), where('course_id', '==', c.id));
      const enrollSnapshot = await getDocs(enrollQuery);
      courseEnrollments.push({
        title: data.title,
        enrollments: enrollSnapshot.size
      });
    }
    courseEnrollments.sort((a, b) => b.enrollments - a.enrollments).slice(0,10);

    // Revenue by month
    const enrollmentsQuery = query(collection(db, 'enrollments'), where('enrollment_date', '>=', Timestamp.fromDate(sixMonthsAgo)));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const revenueData = {};
    for (let e of enrollmentsSnapshot.docs) {
      const data = e.data();
      const month = data.enrollment_date.toDate().toISOString().slice(0,7);
      const courseSnap = await getDoc(doc(db, 'courses', data.course_id));
      const price = courseSnap.data()?.price || 0;
      revenueData[month] = (revenueData[month] || 0) + price;
    }

    const revenueArray = Object.entries(revenueData).map(([month, revenue]) => ({month, revenue}));

    res.json({
      userGrowth: userGrowthArray,
      courseEnrollments,
      revenueData: revenueArray
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

    let usersQuery = query(collection(db, 'users'), orderBy('created_at', 'desc'));

    if (accountType && accountType !== 'all') {
      usersQuery = query(usersQuery, where('account_type', '==', accountType));
    }

    if (status && status !== 'all') {
      const isActive = status === 'active' ? true : false;
      usersQuery = query(usersQuery, where('is_active', '==', isActive));
    }

    if (search) {
      // Firestore doesn't support full text search, so client-side filter or use external search
      // For simplicity, fetch all and filter
      const allUsersSnapshot = await getDocs(usersQuery);
      let users = allUsersSnapshot.docs.map(d => ({id: d.id, ...d.data()}));
      users = users.filter(u => u.first_name.includes(search) || u.last_name.includes(search) || u.email.includes(search));
      const totalUsers = users.length;
      users = users.slice(offset, offset + limit);

      res.json({
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNextPage: page < Math.ceil(totalUsers / limit),
          hasPreviousPage: page > 1
        }
      });
    } else {
      usersQuery = query(usersQuery, limit(limit + offset));
      const usersSnapshot = await getDocs(usersQuery);
      let users = usersSnapshot.docs.map(d => ({id: d.id, ...d.data()}));
      const totalSnapshot = await getDocs(query(collection(db, 'users')));
      const totalUsers = totalSnapshot.size;
      users = users.slice(offset);

      res.json({
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNextPage: page < Math.ceil(totalUsers / limit),
          hasPreviousPage: page > 1
        }
      });
    }
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/users/:id - Get a specific user
app.get('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userSnap.data();
    user.id = userId;

    res.json(user);
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
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const userRef = await addDoc(collection(db, 'users'), {
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
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      profile_image: null,
      email_verified: false
    });

    const newUserId = userRef.id;

    // Create user stats entry
    await addDoc(collection(db, 'user_stats'), {
      user_id: newUserId,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: Timestamp.now()
    });

    console.log('User created successfully by admin:', { userId: newUserId, email });

    const newUser = {
      id: newUserId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      account_type: accountType || 'student',
      profile_image: null,
      company: company || null,
      website: website || null,
      bio: bio || null,
      is_active: isActive !== undefined ? isActive : true,
      email_verified: false,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
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

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = userSnap.data();

    // Validate email if changed
    if (email && email !== currentUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }

      const existingQuery = query(collection(db, 'users'), where('email', '==', email));
      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty && existingSnapshot.docs[0].id !== userId) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Update user
    await updateDoc(userRef, {
      first_name: firstName || currentUser.first_name,
      last_name: lastName || currentUser.last_name,
      email: email || currentUser.email,
      phone: phone || currentUser.phone,
      account_type: accountType || currentUser.account_type,
      is_active: isActive !== undefined ? isActive : currentUser.is_active,
      company: company || currentUser.company,
      website: website || currentUser.website,
      bio: bio || currentUser.bio,
      updated_at: Timestamp.now()
    });

    const updatedSnap = await getDoc(userRef);
    const updatedUser = updatedSnap.data();
    updatedUser.id = userId;

    res.json({
      message: 'User updated successfully',
      user: updatedUser
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

    if (userId === adminId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete
    await updateDoc(userRef, {
      is_active: false,
      updated_at: Timestamp.now()
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

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password
    await updateDoc(userRef, {
      password_hash: hashedPassword,
      updated_at: Timestamp.now()
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
    const result = await addDoc(collection(db, 'payments'), {
      user_id: user_id,
      resource_id: resource_id || null,
      plan: plan,
      amount: amount,
      payment_method: payment_method,
      transaction_id: transaction_id,
      proof_file: req.file.filename,
      status: 'pending',
      created_at: Timestamp.now(),
      verified_at: null
    });

    res.json({ 
      message: 'Payment proof uploaded successfully', 
      paymentId: result.id 
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ error: 'Failed to upload payment proof' });
  }
});

// Admin payment management endpoint
app.get('/api/admin/payments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const paymentsQuery = query(collection(db, 'payments'), orderBy('created_at', 'desc'));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const payments = paymentsSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const userIds = payments.map(p => p.user_id);
    const usersQuery = query(collection(db, 'users'), where('__name__', 'in', userIds.length ? userIds : ['dummy']));
    const usersSnapshot = await getDocs(usersQuery);
    const usersMap = {};
    usersSnapshot.docs.forEach(u => {
      const data = u.data();
      usersMap[u.id] = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email
      };
    });

    const resourceIds = payments.map(p => p.resource_id).filter(r => r);
    const resourcesQuery = query(collection(db, 'resources'), where('__name__', 'in', resourceIds.length ? resourceIds : ['dummy']));
    const resourcesSnapshot = await getDocs(resourcesQuery);
    const resourcesMap = {};
    resourcesSnapshot.docs.forEach(r => {
      resourcesMap[r.id] = r.data().title;
    });

    const formattedPayments = payments.map(p => ({
      ...p,
      first_name: usersMap[p.user_id]?.first_name,
      last_name: usersMap[p.user_id]?.last_name,
      email: usersMap[p.user_id]?.email,
      resource_title: resourcesMap[p.resource_id] || null
    }));

    res.json(formattedPayments);
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
      verified_at: Timestamp.now()
    });

    // If payment is approved, grant access to the resource
    if (status === 'approved') {
      const paymentSnap = await getDoc(paymentRef);
      const payment = paymentSnap.data();

      if (payment.plan === 'individual' && payment.resource_id) {
        // Grant access to specific resource
        await addDoc(collection(db, 'user_resources'), {
          user_id: payment.user_id,
          resource_id: payment.resource_id
        });
      } else if (payment.plan === 'premium') {
        // Upgrade user to premium
        const userRef = doc(db, 'users', payment.user_id);
        await updateDoc(userRef, {
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
    const enrollmentsQuery = query(collection(db, 'enrollments'), orderBy('enrollment_date', 'desc'));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const enrollments = enrollmentsSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const userIds = enrollments.map(e => e.user_id);
    const usersQuery = query(collection(db, 'users'), where('__name__', 'in', userIds.length ? userIds : ['dummy']));
    const usersSnapshot = await getDocs(usersQuery);
    const usersMap = {};
    usersSnapshot.docs.forEach(u => {
      usersMap[u.id] = `${u.data().first_name} ${u.data().last_name}`;
    });

    const courseIds = enrollments.map(e => e.course_id);
    const coursesQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds.length ? courseIds : ['dummy']));
    const coursesSnapshot = await getDocs(coursesQuery);
    const coursesMap = {};
    coursesSnapshot.docs.forEach(c => {
      coursesMap[c.id] = c.data().title;
    });

    const formattedEnrollments = enrollments.map(e => ({
      id: e.id,
      user_id: e.user_id,
      user_name: usersMap[e.user_id],
      course_id: e.course_id,
      course_name: coursesMap[e.course_id],
      progress: e.progress,
      status: e.status,
      enrollment_date: e.enrollment_date,
      completion_date: e.completion_date
    }));

    res.json(formattedEnrollments);
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
      completion_date: status === 'completed' ? (completion_date ? Timestamp.fromDate(new Date(completion_date)) : Timestamp.now()) : null
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

    await deleteDoc(doc(db, 'enrollments', id));

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
    const coursesQuery = query(collection(db, 'courses'), orderBy('created_at', 'desc'));
    const coursesSnapshot = await getDocs(coursesQuery);
    const courses = coursesSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

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

    const result = await addDoc(collection(db, 'courses'), {
      title,
      description,
      instructor_name,
      duration_weeks,
      difficulty_level,
      category,
      price,
      thumbnail: null,
      is_active: is_active || true,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });

    res.status(201).json({ 
      message: 'Course created successfully',
      courseId: result.id
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

    const courseRef = doc(db, 'courses', id);
    await updateDoc(courseRef, {
      title,
      description,
      instructor_name,
      duration_weeks,
      difficulty_level,
      category,
      price,
      is_active,
      updated_at: Timestamp.now()
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
    const enrollmentsQuery = query(collection(db, 'enrollments'), where('course_id', '==', id));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    if (!enrollmentsSnapshot.empty) {
      return res.status(400).json({ error: 'Cannot delete course with active enrollments' });
    }

    await deleteDoc(doc(db, 'courses', id));

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

    const courseRef = doc(db, 'courses', id);
    await updateDoc(courseRef, {
      thumbnail: thumbnailPath,
      updated_at: Timestamp.now()
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
    const resourcesQuery = query(collection(db, 'resources'), orderBy('created_at', 'desc'));
    const resourcesSnapshot = await getDocs(resourcesQuery);
    const resources = resourcesSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const parsedResources = resources.map(resource => ({
      ...resource,
      allowed_account_types: JSON.parse(resource.allowed_account_types || '[]')
    }));

    res.json(parsedResources);
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

    const result = await addDoc(collection(db, 'resources'), {
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
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });

    res.status(201).json({ 
      message: 'Resource created successfully',
      resourceId: result.id
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
      allowed_account_types: accountTypesJSON,
      is_premium,
      updated_at: Timestamp.now()
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

    await deleteDoc(doc(db, 'resources', id));

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
    const assignmentsQuery = query(collection(db, 'assignments'), orderBy('created_at', 'desc'));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignments = assignmentsSnapshot.docs.map(a => ({id: a.id, ...a.data()}));

    const courseIds = [...new Set(assignments.map(a => a.course_id))];
    const coursesQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds.length ? courseIds : ['dummy']));
    const coursesSnapshot = await getDocs(coursesQuery);
    const coursesMap = {};
    coursesSnapshot.docs.forEach(c => {
      coursesMap[c.id] = c.data().title;
    });

    const formattedAssignments = assignments.map(a => ({
      id: a.id,
      course_id: a.course_id,
      title: a.title,
      description: a.description,
      due_date: a.due_date,
      max_points: a.max_points,
      created_at: a.created_at,
      course_title: coursesMap[a.course_id]
    }));

    res.json(formattedAssignments);
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

    const result = await addDoc(collection(db, 'assignments'), {
      title,
      course_id,
      description,
      due_date: Timestamp.fromDate(new Date(due_date)),
      max_points,
      created_at: Timestamp.now()
    });

    res.status(201).json({ 
      message: 'Assignment created successfully',
      assignmentId: result.id
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

    const assignmentRef = doc(db, 'assignments', id);
    await updateDoc(assignmentRef, {
      title,
      course_id,
      description,
      due_date: Timestamp.fromDate(new Date(due_date)),
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

    const submissionsQuery = query(collection(db, 'assignment_submissions'), where('assignment_id', '==', id));
    const submissionsSnapshot = await getDocs(submissionsQuery);
    if (!submissionsSnapshot.empty) {
      return res.status(400).json({ error: 'Cannot delete assignment with existing submissions' });
    }

    await deleteDoc(doc(db, 'assignments', id));

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
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

// ==================== ADMIN CONTACT MESSAGES ENDPOINTS ====================

// Get contact messages (admin only) - CORRECTED VERSION
app.get('/api/admin/contact-messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const messagesQuery = query(collection(db, 'contact_messages'), orderBy('created_at', 'desc'));
    const messagesSnapshot = await getDocs(messagesQuery);
    let messages = messagesSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const totalMessages = messages.length;
    messages = messages.slice(offset, offset + limit);

    // Add default status if not present
    messages.forEach(message => {
      if (!message.status) message.status = 'pending';
    });

    res.json({
      messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        hasNextPage: page < Math.ceil(totalMessages / limit),
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

    const messageRef = doc(db, 'contact_messages', id);
    await updateDoc(messageRef, {
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

    await deleteDoc(doc(db, 'contact_messages', id));

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
    const requestsQuery = query(collection(db, 'service_requests'), orderBy('created_at', 'desc'));
    const requestsSnapshot = await getDocs(requestsQuery);
    const requests = requestsSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    const subcategoryIds = requests.map(r => r.subcategory_id);
    const subcategoriesQuery = query(collection(db, 'service_subcategories'), where('__name__', 'in', subcategoryIds.length ? subcategoryIds : ['dummy']));
    const subcategoriesSnapshot = await getDocs(subcategoriesQuery);
    const subcategoriesMap = {};
    subcategoriesSnapshot.docs.forEach(sc => {
      subcategoriesMap[sc.id] = sc.data().name;
    });

    const userIds = requests.map(r => r.user_id);
    const usersQuery = query(collection(db, 'users'), where('__name__', 'in', userIds.length ? userIds : ['dummy']));
    const usersSnapshot = await getDocs(usersQuery);
    const usersMap = {};
    usersSnapshot.docs.forEach(u => {
      const data = u.data();
      usersMap[u.id] = {
        first_name: data.first_name,
        last_name: data.last_name,
        account_type: data.account_type
      };
    });

    const formattedRequests = requests.map(sr => ({
      id: sr.id,
      name: sr.full_name,
      service: subcategoriesMap[sr.subcategory_id],
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
      user_first_name: usersMap[sr.user_id]?.first_name,
      user_last_name: usersMap[sr.user_id]?.last_name,
      user_account_type: usersMap[sr.user_id]?.account_type
    }));

    res.json(formattedRequests);
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

    const requestRef = doc(db, 'service_requests', id);
    await updateDoc(requestRef, {
      status,
      project_details,
      budget_range,
      timeline,
      additional_requirements,
      updated_at: Timestamp.now()
    });

    res.json({ message: 'Service request updated successfully' });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ error: 'Failed to update service request', details: error.message });
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

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;