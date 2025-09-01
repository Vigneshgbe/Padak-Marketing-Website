// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 5000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Create necessary directories
const assignmentsDir = path.join(__dirname, 'uploads', 'assignments');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });

const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'padak_digital_marketing',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}

testConnection();

// // Multer configuration for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   },
//   fileFilter: function (req, file, cb) {
//     if (file.fieldname === 'avatar') {
//       // Check if file is an image
//       if (file.mimetype.startsWith('image/')) {
//         cb(null, true);
//       } else {
//         cb(new Error('Only image files are allowed for avatar'));
//       }
//     } else {
//       cb(null, true);
//     }
//   }
// });

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

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);


app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'], // Add your frontend URLs
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
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ? AND is_active = true',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = users[0];
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
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await pool.execute(
      `INSERT INTO users 
       (first_name, last_name, email, phone, password_hash, account_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [firstName.trim(), lastName.trim(), email.trim(), phone || null, hashedPassword, accountType || 'student']
    );

    // Create user stats entry
    await pool.execute(
      'INSERT INTO user_stats (user_id) VALUES (?)',
      [result.insertId]
    );

    console.log('User registered successfully:', { userId: result.insertId, email });
    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId
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
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = true',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const user = users[0];

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
    await pool.execute(
      'UPDATE users SET updated_at = NOW() WHERE id = ?',
      [user.id]
    );

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

    await pool.execute(
      `UPDATE users SET 
       first_name = ?, last_name = ?, phone = ?, company = ?, website = ?, bio = ?, updated_at = NOW()
       WHERE id = ?`,
      [firstName, lastName, phone, company, website, bio, userId]
    );

    // Get updated user data
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    const user = users[0];
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

// ==================== PROFILE SECTION ROUTES ==================== 

// Get current user profile (UNIFIED)
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

// Update user profile (UNIFIED)
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, company, website, bio } = req.body;
    const userId = req.user.id;

    await pool.execute(
      `UPDATE users SET 
       first_name = ?, last_name = ?, phone = ?, company = ?, website = ?, bio = ?, updated_at = NOW()
       WHERE id = ?`,
      [firstName, lastName, phone, company, website, bio, userId]
    );

    // Get updated user data
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    const user = users[0];
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

    await pool.execute(
      'UPDATE users SET profile_image = ?, updated_at = NOW() WHERE id = ?',
      [profileImage, userId]
    );

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

    const [stats] = await pool.execute(
      'SELECT * FROM user_stats WHERE user_id = ?',
      [userId]
    );

    if (stats.length === 0) {
      // Create default stats if not exists
      await pool.execute(
        'INSERT INTO user_stats (user_id) VALUES (?)',
        [userId]
      );

      res.json({
        coursesEnrolled: 0,
        coursesCompleted: 0,
        certificatesEarned: 0,
        learningStreak: 0,
        lastActivity: new Date().toISOString()
      });
    } else {
      const userStats = stats[0];
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
    // Step 1: Get total count (no changes here)
    const [[{ totalPosts }]] = await pool.execute(`
    SELECT COUNT(DISTINCT p.id) as totalPosts FROM social_activities p
    WHERE p.activity_type = 'post'
    AND (
      p.visibility = 'public' OR (p.visibility = 'private' AND p.user_id = ?) OR
      (p.visibility = 'connections' AND (p.user_id = ? OR p.user_id IN (
          SELECT user_id_2 FROM user_connections WHERE user_id_1 = ? AND status = 'accepted'
          UNION
          SELECT user_id_1 FROM user_connections WHERE user_id_2 = ? AND status = 'accepted'
      )))
    )
  `, [userId, userId, userId, userId]);

    const totalPages = Math.ceil(totalPosts / limit);

    // Step 2: Fetch paginated posts (no changes here)
    const [posts] = await pool.execute(`
    SELECT
      p.id, p.user_id, p.content, p.image_url, p.created_at, p.updated_at,
      p.visibility, p.achievement, p.share_count,
      u.first_name, u.last_name, u.profile_image, u.account_type,
      (SELECT COUNT(*) FROM social_activities WHERE activity_type = 'like' AND target_id = p.id) AS likes,
      (SELECT COUNT(*) FROM social_activities WHERE activity_type = 'comment' AND target_id = p.id) AS comment_count,
      EXISTS(SELECT 1 FROM social_activities WHERE activity_type = 'like' AND target_id = p.id AND user_id = ?) AS has_liked,
      EXISTS(SELECT 1 FROM social_activities WHERE activity_type = 'bookmark' AND target_id = p.id AND user_id = ?) AS has_bookmarked
    FROM social_activities p JOIN users u ON p.user_id = u.id
    WHERE p.activity_type = 'post'
    AND (
        p.visibility = 'public' OR (p.visibility = 'private' AND p.user_id = ?) OR
        (p.visibility = 'connections' AND (p.user_id = ? OR p.user_id IN (
            SELECT user_id_2 FROM user_connections WHERE user_id_1 = ? AND status = 'accepted'
            UNION
            SELECT user_id_1 FROM user_connections WHERE user_id_2 = ? AND status = 'accepted'
        )))
    )
    ORDER BY p.created_at DESC LIMIT ? OFFSET ?
  `, [userId, userId, userId, userId, userId, userId, limit, offset]);

    if (posts.length === 0) {
      return res.json({ posts: [], pagination: { page, totalPages, totalPosts } });
    }

    // Step 3: Fetch comments for the retrieved posts
    const postIds = posts.map(p => p.id);
    let comments = [];

    // ============================ SQL FIX IS HERE ============================
    // We construct the query string by safely escaping the array of IDs.
    // This correctly generates WHERE ... IN (1, 2, 3) and prevents the error.
    const commentsQuery = `
    SELECT
      c.id, c.user_id, c.content, c.created_at, c.target_id,
      u.first_name, u.last_name, u.profile_image, u.account_type
    FROM social_activities c JOIN users u ON c.user_id = u.id
    WHERE c.activity_type = 'comment' AND c.target_id IN (${pool.escape(postIds)})
    ORDER BY c.created_at ASC
  `;
    const [fetchedComments] = await pool.query(commentsQuery); // Use .query for non-prepared statements
    comments = fetchedComments;
    // ============================= SQL FIX ENDS HERE =============================

    // Step 4: Map comments and format image URLs
    const postsWithData = posts.map(post => {
      const postComments = comments
        .filter(comment => comment.target_id === post.id)
        .map(c => ({
          ...c,
          user: {
            id: c.user_id,
            first_name: c.first_name,
            last_name: c.last_name,
            // Use the simplified helper for comment author images
            profile_image: getFullImageUrl(req, c.profile_image),
            account_type: c.account_type,
          }
        }));

      return {
        ...post,
        has_liked: !!post.has_liked,
        has_bookmarked: !!post.has_bookmarked,
        // Use the simplified helper for post images
        image_url: getFullImageUrl(req, post.image_url),
        user: {
          id: post.user_id,
          first_name: post.first_name,
          last_name: post.last_name,
          // Use the simplified helper for post author images
          profile_image: getFullImageUrl(req, post.profile_image),
          account_type: post.account_type,
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

      // ============================ IMAGE PATH FIX IS HERE ============================
      // Save a clean URL path instead of a filesystem path.
      const imageUrl = req.file ? `/uploads/social/${req.file.filename}` : null;
      // ============================ IMAGE PATH FIX ENDS HERE ==========================

      const isAchievement = achievement === 'true';

      const [result] = await pool.execute(
        `INSERT INTO social_activities 
                  (user_id, activity_type, content, image_url, achievement, visibility) 
              VALUES (?, 'post', ?, ?, ?, ?)`,
        [userId, content || '', imageUrl, isAchievement, visibility]
      );

      const postId = result.insertId;

      // Fetch the newly created post to return to the frontend
      const [[newPost]] = await pool.execute(`
              SELECT p.*, u.first_name, u.last_name, u.profile_image, u.account_type
              FROM social_activities p JOIN users u ON p.user_id = u.id
              WHERE p.id = ?
          `, [postId]);

      res.status(201).json({
        ...newPost,
        has_liked: false,
        has_bookmarked: false,
        likes: 0,
        comment_count: 0,
        image_url: getFullImageUrl(req, newPost.image_url),
        user: {
          id: newPost.user_id,
          first_name: newPost.first_name,
          last_name: newPost.last_name,
          profile_image: getFullImageUrl(req, newPost.profile_image),
          account_type: newPost.account_type,
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
    const [[post]] = await pool.execute('SELECT user_id FROM social_activities WHERE id = ?', [id]);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    await pool.execute(
      'UPDATE social_activities SET content = ?, updated_at = NOW() WHERE id = ?',
      [content, id]
    );

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
    const [[post]] = await pool.execute('SELECT user_id, image_url FROM social_activities WHERE id = ?', [id]);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    // Delete the post record (ON DELETE CASCADE in DB should handle comments, likes, etc.)
    await pool.execute('DELETE FROM social_activities WHERE id = ?', [id]);

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
    const [result] = await pool.execute(
      `INSERT INTO social_activities (user_id, activity_type, content, target_id) VALUES (?, 'comment', ?, ?)`,
      [userId, content, targetId]
    );

    const commentId = result.insertId;

    // Fetch the new comment with user info to return
    const [[newComment]] = await pool.execute(`
            SELECT c.*, u.first_name, u.last_name, u.profile_image
            FROM social_activities c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [commentId]);

    res.status(201).json({
      ...newComment,
      user: {
        id: newComment.user_id,
        first_name: newComment.first_name,
        last_name: newComment.last_name,
        profile_image: getFullImageUrl(req, newComment.profile_image)
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
    await pool.execute(
      `INSERT IGNORE INTO social_activities (user_id, activity_type, target_id) VALUES (?, 'like', ?)`,
      [userId, targetId]
    );
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
    await pool.execute(
      `DELETE FROM social_activities WHERE user_id = ? AND activity_type = 'like' AND target_id = ?`,
      [userId, targetId]
    );
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
    await pool.execute(
      `INSERT IGNORE INTO social_activities (user_id, activity_type, target_id) VALUES (?, 'bookmark', ?)`,
      [userId, targetId]
    );
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
    await pool.execute(
      `DELETE FROM social_activities WHERE user_id = ? AND activity_type = 'bookmark' AND target_id = ?`,
      [userId, targetId]
    );
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
    await pool.execute(
      'UPDATE social_activities SET share_count = share_count + 1 WHERE id = ?',
      [postId]
    );
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
  // unless you have admin roles that can view other users' data.
  if (parseInt(req.params.userId, 10) !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own enrollment data.' });
  }

  try {
    const [enrollments] = await pool.execute(`
      SELECT
        e.id,
        e.progress,
        e.status,
        e.enrollment_date,
        e.completion_date,
        c.id AS course_id,
        c.title AS courseTitle,             -- Alias for frontend
        c.instructor_name AS instructorName, -- Alias for frontend (assuming column exists)
        c.duration_weeks AS durationWeeks    -- Alias for frontend (assuming column exists)
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ?
      ORDER BY e.enrollment_date DESC
    `, [userId]); // Use userId from token

    // The data is already aliased correctly for the frontend in the SQL query
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
    const [applications] = await pool.query( // Using pool.query or pool.execute is fine, just be consistent
      `SELECT
         sub.id,
         sub.internship_id,
         sub.status AS applicationStatus,
         sub.submitted_at AS applicationDate, 
         i.title AS internshipTitle,
         i.company AS companyName
       FROM internship_submissions sub
       JOIN internships i ON sub.internship_id = i.id
       WHERE sub.user_id = ?
       ORDER BY sub.submitted_at DESC`,
      [userId]
    );

    res.json(applications);
  } catch (error) {
    console.error('Error fetching user internship applications for dashboard:', error); // <--- CHECK THIS IN YOUR BACKEND CONSOLE
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// =============== NEW PROFESSIONAL DASHBOARD ENDPOINTS ====================

// Assumes a 'services' table with detailed service info, joined with 'service_categories'
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const [services] = await pool.execute(
      `SELECT
          s.id,
          s.name,          -- The specific service name (e.g., "Advanced SEO Package")
          sc.id AS category_id, -- The ID of the category
          sc.name AS categoryName, -- The category name (e.g., "SEO")
          s.description,
          s.price,
          s.duration,
          s.rating,
          s.reviews,
          s.features,      -- Assuming this is still a JSON string in 'services' table
          s.popular
       FROM services s  -- This 'services' table is assumed to contain detailed service offerings
       JOIN service_categories sc ON s.category_id = sc.id
       WHERE sc.is_active = 1 -- Only fetch services belonging to active categories
       ORDER BY s.popular DESC, s.name ASC`
    );

    // Parse JSON fields from database strings to JavaScript arrays/objects
    const parsedServices = services.map(service => ({
      ...service,
      features: JSON.parse(service.features || '[]')
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

  if (parseInt(req.params.userId, 10) !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
  }

  try {
    const [requests] = await pool.execute(
      `SELECT
          sr.id,
          sr.user_id AS userId,
          sr.subcategory_id AS categoryId, -- Maps to categoryId on frontend
          sc.name AS categoryName,         -- Fetched from service_categories.name
          sr.full_name AS fullName,
          sr.email,
          sr.phone,
          sr.company,
          sr.website,
          sr.project_details AS projectDetails, -- Maps to projectDetails on frontend
          sr.budget_range AS budgetRange,     -- Maps to budgetRange on frontend
          sr.timeline,                        -- Maps to timeline on frontend
          sr.contact_method AS contactMethod,
          sr.additional_requirements AS additionalRequirements,
          sr.status,
          sr.created_at AS requestDate,       -- Maps to requestDate on frontend
          sr.updated_at AS updatedAt          -- Optional, for display if needed
       FROM service_requests sr
       JOIN service_categories sc ON sr.subcategory_id = sc.id -- Join with service_categories
       WHERE sr.user_id = ?
       ORDER BY sr.created_at DESC`,
      [userId]
    );

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
    const [result] = await pool.execute(
      `INSERT INTO service_requests (
         user_id,
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
         additional_requirements,
         status
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`, // New requests are 'pending' by default
      [
        userId,
        categoryId,
        fullName,
        email,
        phone,
        company || null, // Allow NULL for optional fields if not provided
        website || null,
        projectDetails,
        budgetRange,
        timeline,
        contactMethod,
        additionalRequirements || null
      ]
    );

    // Return the ID of the newly created request
    res.status(201).json({ message: 'Service request submitted successfully!', id: result.insertId });
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
    const courseEventsQuery = `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.created_at as date,
        'course_start' as type,
        c.id as course_id,
        c.title as course_title,
        c.category as course_category
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.user_id = ? AND e.status = 'active'
      ORDER BY c.created_at ASC
    `;

    // Get assignment deadlines
    const assignmentEventsQuery = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date as date,
        'assignment' as type,
        c.id as course_id,
        c.title as course_title,
        c.category as course_category,
        CASE 
          WHEN s.status = 'graded' THEN 'completed'
          WHEN a.due_date < CURDATE() AND s.id IS NULL THEN 'overdue'
          ELSE 'pending'
        END as status
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.user_id = ?
      WHERE e.user_id = ? AND e.status = 'active'
      ORDER BY a.due_date ASC
    `;

    // Get custom calendar events if the table exists
    const customEventsQuery = `
      SELECT 
        id,
        title,
        description,
        event_date as date,
        event_time as time,
        event_type as type,
        'custom' as color
      FROM custom_calendar_events 
      WHERE user_id = ? AND event_date >= CURDATE() - INTERVAL 30 DAY
      ORDER BY event_date ASC
    `;

    // Execute queries
    const [courseEventsResult] = await pool.execute(courseEventsQuery, [userId]);
    const [assignmentEventsResult] = await pool.execute(assignmentEventsQuery, [userId, userId]);

    let customEventsResult = [];
    try {
      [customEventsResult] = await pool.execute(customEventsQuery, [userId]);
    } catch (error) {
      // Custom events table doesn't exist, skip
      console.log('Custom events table not found, skipping...');
    }

    // Format course events
    const courseEvents = courseEventsResult.map(event => ({
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

    // Format assignment events
    const assignmentEvents = assignmentEventsResult.map(assignment => ({
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

    // Format custom events
    const customEvents = customEventsResult.map(event => ({
      id: `custom-${event.id}`,
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time,
      type: event.type || 'custom',
      color: 'purple'
    }));

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

    const eventsQuery = `
      SELECT 
        'assignment' as event_type,
        a.id,
        a.title,
        a.description,
        a.due_date as date,
        NULL as time,
        c.id as course_id,
        c.title as course_title,
        c.category as course_category,
        CASE 
          WHEN s.status = 'graded' THEN 'completed'
          WHEN a.due_date < CURDATE() AND s.id IS NULL THEN 'overdue'
          ELSE 'pending'
        END as status
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.user_id = ?
      WHERE e.user_id = ? AND e.status = 'active' AND DATE(a.due_date) = ?
      
      UNION ALL
      
      SELECT 
        'course_start' as event_type,
        c.id,
        CONCAT('Course: ', c.title) as title,
        c.description,
        c.created_at as date,
        NULL as time,
        c.id as course_id,
        c.title as course_title,
        c.category as course_category,
        'active' as status
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.user_id = ? AND e.status = 'active' AND DATE(c.created_at) = ?
      
      ORDER BY date ASC
    `;

    const [eventsResult] = await pool.execute(eventsQuery, [userId, userId, date, userId, date]);

    // Try to get custom events for the date
    let customEvents = [];
    try {
      const customQuery = `
        SELECT 
          'custom' as event_type,
          id,
          title,
          description,
          event_date as date,
          event_time as time,
          NULL as course_id,
          NULL as course_title,
          NULL as course_category,
          'pending' as status
        FROM custom_calendar_events
        WHERE user_id = ? AND DATE(event_date) = ?
      `;
      const [customResult] = await pool.execute(customQuery, [userId, date]);
      customEvents = customResult;
    } catch (error) {
      // Custom events table doesn't exist
    }

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

    const upcomingEventsQuery = `
      SELECT 
        'assignment' as event_type,
        a.id,
        a.title,
        a.description,
        a.due_date as date,
        NULL as time,
        c.id as course_id,
        c.title as course_title,
        c.category as course_category,
        CASE 
          WHEN s.status = 'graded' THEN 'completed'
          WHEN a.due_date < CURDATE() AND s.id IS NULL THEN 'overdue'
          ELSE 'pending'
        END as status
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.user_id = ?
      WHERE e.user_id = ? AND e.status = 'active'
        AND a.due_date >= CURDATE() 
        AND a.due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      
      ORDER BY date ASC
      LIMIT 10
    `;

    const [upcomingResult] = await pool.execute(upcomingEventsQuery, [userId, userId]);

    // Try to get upcoming custom events
    let customUpcoming = [];
    try {
      const customQuery = `
        SELECT 
          'custom' as event_type,
          id,
          title,
          description,
          event_date as date,
          event_time as time,
          NULL as course_id,
          NULL as course_title,
          NULL as course_category,
          'pending' as status
        FROM custom_calendar_events
        WHERE user_id = ? 
          AND event_date >= CURDATE() 
          AND event_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        ORDER BY event_date ASC
        LIMIT 5
      `;
      const [customResult] = await pool.execute(customQuery, [userId]);
      customUpcoming = customResult;
    } catch (error) {
      // Custom events table doesn't exist
    }

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

    const statsQuery = `
      SELECT 
        COUNT(CASE WHEN s.id IS NULL AND a.due_date >= CURDATE() THEN 1 END) as pending_assignments,
        COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as completed_assignments,
        COUNT(CASE WHEN s.id IS NULL AND a.due_date < CURDATE() THEN 1 END) as overdue_assignments,
        COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_courses,
        COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed_courses
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.user_id = ?
      WHERE e.user_id = ?
    `;

    const [statsResult] = await pool.execute(statsQuery, [userId, userId]);
    const stats = statsResult[0];

    res.json({
      pending_assignments: stats.pending_assignments || 0,
      completed_assignments: stats.completed_assignments || 0,
      overdue_assignments: stats.overdue_assignments || 0,
      active_courses: stats.active_courses || 0,
      completed_courses: stats.completed_courses || 0,
      total_assignments: (stats.pending_assignments || 0) + (stats.completed_assignments || 0) + (stats.overdue_assignments || 0)
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

    const assignmentsQuery = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.max_points,
        c.id as course_id,
        c.title as course_title,
        c.category as course_category,
        s.id as submission_id,
        s.status as submission_status,
        s.grade as submission_grade
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.user_id = ?
      WHERE e.user_id = ? AND e.status = 'active'
      ORDER BY a.due_date ASC
    `;

    const [assignmentsResult] = await pool.execute(assignmentsQuery, [userId, userId]);

    const assignments = assignmentsResult.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date,
      max_points: assignment.max_points,
      course: {
        id: assignment.course_id,
        title: assignment.course_title,
        category: assignment.course_category
      },
      submission: assignment.submission_id ? {
        id: assignment.submission_id,
        status: assignment.submission_status,
        grade: assignment.submission_grade
      } : null
    }));

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

    // Check if custom_calendar_events table exists, if not create it
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS custom_calendar_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        event_time TIME,
        event_type VARCHAR(50) DEFAULT 'custom',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, event_date)
      )
    `;

    await pool.execute(createTableQuery);

    const insertQuery = `
      INSERT INTO custom_calendar_events (user_id, title, description, event_date, event_time, event_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.execute(insertQuery, [userId, title, description, date, time, type]);

    res.status(201).json({
      id: result.insertId,
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
    const checkQuery = `
      SELECT id FROM custom_calendar_events 
      WHERE id = ? AND user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [id, userId]);

    if (checkResult.length === 0) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    const updateQuery = `
      UPDATE custom_calendar_events 
      SET title = ?, description = ?, event_date = ?, event_time = ?, event_type = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;

    await pool.execute(updateQuery, [title, description, date, time, type, id, userId]);

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

    const deleteQuery = `
      DELETE FROM custom_calendar_events 
      WHERE id = ? AND user_id = ?
    `;

    const [result] = await pool.execute(deleteQuery, [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

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

    const userQuery = `
      SELECT 
        id,
        first_name,
        last_name,
        email,
        account_type,
        profile_image,
        company,
        website,
        bio,
        is_active,
        email_verified,
        created_at,
        last_login
      FROM users 
      WHERE id = ?
    `;

    const [userResult] = await pool.execute(userQuery, [userId]);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];

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
      // req.user.id comes from authenticateToken middleware
      const userId = req.user ? req.user.id : null; // Added check for req.user in case auth fails silently
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
          error: `Missing required fields: ${missingFields.join(', ')}`, // More specific error
          missingFields
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Payment screenshot is required' });
      }

      // Insert into database (corrected table name)
      const [result] = await pool.execute(
        `INSERT INTO course_enroll_requests (
          user_id, course_id, full_name, email, phone, address, city, state, pincode, 
          payment_method, transaction_id, payment_screenshot
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, // Can be null if not logged in (user_id INT(11) DEFAULT NULL)
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
          `/uploads/payments/${req.file.filename}` // Path where Multer saves the file
        ]
      );

      res.status(201).json({
        message: 'Enrollment request submitted successfully',
        requestId: result.insertId
      });

    } catch (error) {
      console.error('Enrollment request error:', error);
      // More detailed error for debugging (remove in production)
      res.status(500).json({ error: 'Server error', details: error.message }); 
    }
  }
);

// ==================== COURSES ROUTES ====================

// Replace the existing /api/courses endpoint
app.get('/api/courses', async (req, res) => {
  try {
    // Use explicit column selection instead of SELECT *
    const [courses] = await pool.execute(
      `SELECT 
        id,
        title,
        description,
        instructor_name AS instructorName,
        duration_weeks AS durationWeeks,
        difficulty_level AS difficultyLevel,
        category,
        price,
        thumbnail,
        is_active AS isActive
      FROM courses 
      WHERE is_active = true 
      ORDER BY created_at DESC`
    );

    // Format price in JavaScript instead of SQL
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

    const [enrollments] = await pool.execute(
      `SELECT e.*, c.* FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.user_id = ? AND e.status = 'active'
         ORDER BY e.enrollment_date DESC`,
      [userId]
    );

    res.json(enrollments.map(enrollment => ({
      id: enrollment.id,
      userId: enrollment.user_id,
      courseId: enrollment.course_id,
      progress: enrollment.progress,
      enrollmentDate: enrollment.enrollment_date,
      completionDate: enrollment.completion_date,
      status: enrollment.status,
      course: {
        id: enrollment.course_id,
        title: enrollment.title,
        description: enrollment.description,
        instructorName: enrollment.instructor_name,
        durationWeeks: enrollment.duration_weeks,
        difficultyLevel: enrollment.difficulty_level,
        category: enrollment.category,
        price: enrollment.price,
        thumbnail: enrollment.thumbnail,
        isActive: enrollment.is_active
      }
    })));

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
    const [existing] = await pool.execute(
      'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const [courses] = await pool.execute(
      'SELECT * FROM courses WHERE id = ? AND is_active = true',
      [courseId]
    );

    if (courses.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    await pool.execute(
      'INSERT INTO enrollments (user_id, course_id, enrollment_date) VALUES (?, ?, NOW())',
      [userId, courseId]
    );

    // Update user stats
    await pool.execute(
      'UPDATE user_stats SET courses_enrolled = courses_enrolled + 1 WHERE user_id = ?',
      [userId]
    );

    res.status(201).json({ message: 'Successfully enrolled in course' });

  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ASSIGNMENTS ROUTES ====================

// GET /auth/me - Get current user info
app.get('/auth/me', authenticateToken, (req, res) => {
  const query = `
    SELECT id, first_name, last_name, email, phone, account_type, 
           profile_image, company, website, bio, is_active, email_verified
    FROM users 
    WHERE id = ?
  `;

  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(results[0]);
  });
});

// GET /assignments/my-assignments - Get user's assignments
app.get('/assignments/my-assignments', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      a.id,
      a.course_id,
      a.title,
      a.description,
      a.due_date,
      a.max_points,
      a.created_at,
      c.title as course_title,
      c.category as course_category,
      s.id as submission_id,
      s.content as submission_content,
      s.file_path as submission_file_path,
      s.submitted_at,
      s.grade,
      s.feedback,
      s.status as submission_status
    FROM assignments a
    INNER JOIN courses c ON a.course_id = c.id
    INNER JOIN enrollments e ON c.id = e.course_id
    LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.user_id = ?
    WHERE e.user_id = ? AND c.is_active = TRUE
    ORDER BY a.due_date ASC
  `;

  db.query(query, [req.user.id, req.user.id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
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
  });
});

// GET /assignments/all - Get all assignments (admin only)
app.get('/assignments/all', authenticateToken, (req, res) => {
  // Check if user is admin
  const userQuery = 'SELECT account_type FROM users WHERE id = ?';
  db.query(userQuery, [req.user.id], (err, userResults) => {
    if (err || userResults.length === 0) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (userResults[0].account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const query = `
      SELECT 
        a.id,
        a.course_id,
        a.title,
        a.description,
        a.due_date,
        a.max_points,
        a.created_at,
        c.title as course_title,
        c.category as course_category,
        COUNT(s.id) as submission_count,
        COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_count
      FROM assignments a
      INNER JOIN courses c ON a.course_id = c.id
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
      WHERE c.is_active = TRUE
      GROUP BY a.id, a.course_id, a.title, a.description, a.due_date, a.max_points, a.created_at, c.title, c.category
      ORDER BY a.due_date ASC
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
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
        submission_count: row.submission_count,
        graded_count: row.graded_count
      }));

      res.json(assignments);
    });
  });
});

// POST /assignments/submit - Submit assignment
app.post('/assignments/submit', authenticateToken, assignmentUpload.single('file'), (req, res) => {
  const { assignment_id, content } = req.body;
  const file_path = req.file ? req.file.filename : null;

  if (!assignment_id) {
    return res.status(400).json({ error: 'Assignment ID is required' });
  }

  if (!content && !file_path) {
    return res.status(400).json({ error: 'Either content or file is required' });
  }

  // Check if assignment exists and user is enrolled
  const checkQuery = `
    SELECT a.id, a.course_id, a.title
    FROM assignments a
    INNER JOIN courses c ON a.course_id = c.id
    INNER JOIN enrollments e ON c.id = e.course_id
    WHERE a.id = ? AND e.user_id = ?
  `;

  db.query(checkQuery, [assignment_id, req.user.id], (err, checkResults) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Assignment not found or not enrolled' });
    }

    // Check if already submitted
    const existingQuery = 'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND user_id = ?';
    db.query(existingQuery, [assignment_id, req.user.id], (err, existingResults) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingResults.length > 0) {
        return res.status(400).json({ error: 'Assignment already submitted' });
      }

      // Insert submission
      const insertQuery = `
        INSERT INTO assignment_submissions (assignment_id, user_id, content, file_path, submitted_at, status)
        VALUES (?, ?, ?, ?, NOW(), 'submitted')
      `;

      db.query(insertQuery, [assignment_id, req.user.id, content || '', file_path], (err, insertResult) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          success: true,
          message: 'Assignment submitted successfully',
          submission_id: insertResult.insertId
        });
      });
    });
  });
});

// GET /assignments/download-submission/:id - Download submission file
app.get('/assignments/download-submission/:id', authenticateToken, (req, res) => {
  const submissionId = req.params.id;

  // Get submission details
  const query = `
    SELECT s.file_path, s.user_id, a.title, u.account_type
    FROM assignment_submissions s
    INNER JOIN assignments a ON s.assignment_id = a.id
    INNER JOIN users u ON u.id = ?
    WHERE s.id = ?
  `;

  db.query(query, [req.user.id, submissionId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = results[0];

    // Check permissions - user can download their own submission or admin can download any
    if (submission.user_id !== req.user.id && submission.account_type !== 'admin') {
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
  });
});

// GET /assignments/course/:courseId - Get assignments for a specific course
app.get('/assignments/course/:courseId', authenticateToken, (req, res) => {
  const courseId = req.params.courseId;

  // Check if user is enrolled or admin
  const checkQuery = `
    SELECT e.user_id, u.account_type
    FROM enrollments e
    INNER JOIN users u ON u.id = ?
    WHERE e.course_id = ? AND e.user_id = ?
    UNION
    SELECT ? as user_id, account_type
    FROM users
    WHERE id = ? AND account_type = 'admin'
  `;

  db.query(checkQuery, [req.user.id, courseId, req.user.id, req.user.id, req.user.id], (err, checkResults) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (checkResults.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `
      SELECT 
        a.id,
        a.course_id,
        a.title,
        a.description,
        a.due_date,
        a.max_points,
        a.created_at,
        c.title as course_title,
        c.category as course_category,
        s.id as submission_id,
        s.content as submission_content,
        s.file_path as submission_file_path,
        s.submitted_at,
        s.grade,
        s.feedback,
        s.status as submission_status
      FROM assignments a
      INNER JOIN courses c ON a.course_id = c.id
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.user_id = ?
      WHERE a.course_id = ?
      ORDER BY a.due_date ASC
    `;

    db.query(query, [req.user.id, courseId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
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
    });
  });
});

// PUT /assignments/grade/:submissionId - Grade assignment (admin/instructor only)
app.put('/assignments/grade/:submissionId', authenticateToken, (req, res) => {
  const submissionId = req.params.submissionId;
  const { grade, feedback } = req.body;

  // Check if user is admin
  const userQuery = 'SELECT account_type FROM users WHERE id = ?';
  db.query(userQuery, [req.user.id], (err, userResults) => {
    if (err || userResults.length === 0) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (userResults[0].account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    // Validate grade
    if (grade < 0 || grade > 100) {
      return res.status(400).json({ error: 'Grade must be between 0 and 100' });
    }

    // Update submission
    const updateQuery = `
      UPDATE assignment_submissions 
      SET grade = ?, feedback = ?, status = 'graded'
      WHERE id = ?
    `;

    db.query(updateQuery, [grade, feedback || '', submissionId], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      res.json({
        success: true,
        message: 'Assignment graded successfully'
      });
    });
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


// ==================== CERTIFICATES ROUTES ====================


// Certificate Routes
app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [certificates] = await pool.execute(`
      SELECT 
        c.id,
        c.user_id as userId,
        c.course_id as courseId,
        c.certificate_url as certificateUrl,
        c.issued_date as issuedDate,
        co.title as courseTitle,
        co.description as courseDescription,
        co.instructor_name as instructorName,
        co.category,
        co.difficulty_level as difficultyLevel,
        e.completion_date as completionDate,
        e.status as enrollmentStatus,
        COALESCE(AVG(asub.grade), 0) as finalGrade
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      JOIN enrollments e ON c.user_id = e.user_id AND c.course_id = e.course_id
      LEFT JOIN assignments a ON a.course_id = co.id
      LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.user_id = c.user_id
      WHERE c.user_id = ?
      GROUP BY c.id, c.user_id, c.course_id, c.certificate_url, c.issued_date, 
               co.title, co.description, co.instructor_name, co.category, co.difficulty_level,
               e.completion_date, e.status
      ORDER BY c.issued_date DESC
    `, [userId]);

    // Transform the data to match the expected format
    const formattedCertificates = certificates.map(cert => ({
      id: cert.id,
      userId: cert.userId,
      courseId: cert.courseId,
      certificateUrl: cert.certificateUrl,
      issuedDate: cert.issuedDate,
      course: {
        id: cert.courseId,
        title: cert.courseTitle,
        description: cert.courseDescription,
        instructorName: cert.instructorName,
        category: cert.category,
        difficultyLevel: cert.difficultyLevel
      },
      enrollment: {
        completionDate: cert.completionDate,
        finalGrade: Math.round(cert.finalGrade),
        status: cert.enrollmentStatus
      }
    }));

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
    const [certificates] = await pool.execute(`
      SELECT c.*, co.title as courseTitle, u.first_name, u.last_name
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ? AND c.user_id = ?
    `, [certificateId, userId]);

    if (certificates.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = certificates[0];

    // If certificate_url exists, redirect to it
    if (certificate.certificate_url) {
      return res.redirect(certificate.certificate_url);
    }

    // Otherwise, generate a simple PDF certificate
    // For now, we'll return a JSON response - you can implement PDF generation later
    const certificateData = {
      recipientName: `${certificate.first_name} ${certificate.last_name}`,
      courseName: certificate.courseTitle,
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
  try {
    // Check if user is admin
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [certificates] = await pool.execute(`
      SELECT 
        c.id,
        c.user_id as userId,
        c.course_id as courseId,
        c.certificate_url as certificateUrl,
        c.issued_date as issuedDate,
        co.title as courseTitle,
        co.instructor_name as instructorName,
        co.category,
        co.difficulty_level as difficultyLevel,
        u.first_name,
        u.last_name,
        u.email,
        e.completion_date as completionDate
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON c.user_id = u.id
      JOIN enrollments e ON c.user_id = e.user_id AND c.course_id = e.course_id
      ORDER BY c.issued_date DESC
    `);

    const formattedCertificates = certificates.map(cert => ({
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
    // Check if user is admin
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId, courseId, certificateUrl } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'User ID and Course ID are required' });
    }

    // Check if user has completed the course
    const [enrollments] = await pool.execute(`
      SELECT * FROM enrollments 
      WHERE user_id = ? AND course_id = ? AND status = 'completed'
    `, [userId, courseId]);

    if (enrollments.length === 0) {
      return res.status(400).json({ error: 'User has not completed this course' });
    }

    // Check if certificate already exists
    const [existingCertificates] = await pool.execute(`
      SELECT * FROM certificates WHERE user_id = ? AND course_id = ?
    `, [userId, courseId]);

    if (existingCertificates.length > 0) {
      return res.status(400).json({ error: 'Certificate already exists for this user and course' });
    }

    // Create new certificate
    const [result] = await pool.execute(`
      INSERT INTO certificates (user_id, course_id, certificate_url, issued_date)
      VALUES (?, ?, ?, NOW())
    `, [userId, courseId, certificateUrl || null]);

    // Update user stats
    await pool.execute(`
      UPDATE user_stats 
      SET certificates_earned = certificates_earned + 1 
      WHERE user_id = ?
    `, [userId]);

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificateId: result.insertId
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

    const [result] = await pool.execute(`
      UPDATE certificates 
      SET certificate_url = ?, issued_date = NOW()
      WHERE id = ?
    `, [certificateUrl, certificateId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

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
    const [certificates] = await pool.execute(`
      SELECT user_id FROM certificates WHERE id = ?
    `, [certificateId]);

    if (certificates.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = certificates[0];

    // Delete certificate
    const [result] = await pool.execute(`
      DELETE FROM certificates WHERE id = ?
    `, [certificateId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Update user stats
    await pool.execute(`
      UPDATE user_stats 
      SET certificates_earned = GREATEST(certificates_earned - 1, 0)
      WHERE user_id = ?
    `, [certificate.user_id]);

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
    const [statsRows] = await pool.execute(
      'SELECT * FROM user_stats WHERE user_id = ?',
      [req.user.id]
    );

    let stats;
    if (statsRows.length === 0) {
      // Create default stats if none exist
      await pool.execute(
        'INSERT INTO user_stats (user_id, courses_enrolled, courses_completed, certificates_earned, learning_streak) VALUES (?, 0, 0, 0, 0)',
        [req.user.id]
      );

      stats = {
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0
      };
    } else {
      stats = statsRows[0];
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
    await pool.execute(
      'INSERT INTO download_logs (user_id, resource_id, resource_name) VALUES (?, ?, ?)',
      [req.user.id, resourceId, resource.title]
    );

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
    const [rows] = await pool.execute(`
      SELECT 
        c.id,
        c.title,
        c.category,
        c.difficulty_level,
        e.progress,
        e.status,
        e.enrollment_date
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ? AND e.status = 'active'
      ORDER BY e.enrollment_date DESC
    `, [req.user.id]);

    const courses = rows.map(row => ({
      id: row.id,
      title: row.title,
      category: row.category,
      difficulty_level: row.difficulty_level,
      progress: row.progress,
      isEnrolled: true
    }));

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
    const [rows] = await pool.query('SELECT * FROM internships ORDER BY posted_at DESC');
    // Parse JSON fields from database strings to JavaScript arrays/objects
    const internships = rows.map(row => ({
      ...row,
      requirements: JSON.parse(row.requirements),
      benefits: JSON.parse(row.benefits)
    }));
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
    const [applications] = await pool.query(
      `SELECT
         sub.id AS submission_id,
         sub.submitted_at,
         sub.status,
         sub.resume_url,
         sub.cover_letter,
         i.id AS internship_id,
         i.title,
         i.company,
         i.location,
         i.duration,
         i.type,
         i.level,
         i.description,
         i.requirements,
         i.benefits,
         i.applications_count,
         i.spots_available,
         i.posted_at AS internship_posted_at
       FROM internship_submissions sub
       JOIN internships i ON sub.internship_id = i.id
       WHERE sub.user_id = ?
       ORDER BY sub.submitted_at DESC`,
      [userId]
    );

    // Parse JSON fields from database strings to JavaScript arrays/objects
    const parsedApplications = applications.map(app => ({
      ...app,
      requirements: JSON.parse(app.requirements || '[]'), // Handle potential null/empty JSON
      benefits: JSON.parse(app.benefits || '[]')
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

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [internshipRows] = await connection.query(
      'SELECT spots_available FROM internships WHERE id = ? FOR UPDATE',
      [internshipId]
    );

    if (internshipRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Internship not found.' });
    }
    if (internshipRows[0].spots_available <= 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'No available spots left for this internship.' });
    }

    const [existingApplication] = await connection.query(
      'SELECT id FROM internship_submissions WHERE internship_id = ? AND user_id = ?',
      [internshipId, userId]
    );
    if (existingApplication.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'You have already applied for this internship.' });
    }

    await connection.query(
      'INSERT INTO internship_submissions (internship_id, user_id, full_name, email, phone, resume_url, cover_letter) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [internshipId, userId, full_name, email, phone || null, resume_url, cover_letter || null]
    );

    await connection.query(
      'UPDATE internships SET spots_available = spots_available - 1, applications_count = applications_count + 1 WHERE id = ?',
      [internshipId]
    );

    await connection.commit();
    res.status(201).json({ message: 'Internship application submitted successfully!' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error submitting internship application:', error);
    res.status(500).json({ message: 'Internal server error during application submission.' });
  } finally {
    if (connection) connection.release();
  }
});

// ==================== SERVICES ROUTES ====================

// Get service categories
app.get('/api/services/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM service_categories WHERE is_active = true ORDER BY name'
    );

    const categoriesWithSubs = await Promise.all(categories.map(async (category) => {
      const [subcategories] = await pool.execute(
        'SELECT * FROM service_subcategories WHERE category_id = ? AND is_active = true ORDER BY name',
        [category.id]
      );

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
    const [subcategories] = await pool.execute(
      'SELECT * FROM service_subcategories WHERE id = ? AND is_active = true',
      [subcategoryId]
    );

    if (subcategories.length === 0) {
      return res.status(404).json({ error: 'Service subcategory not found' });
    }

    // Create service request
    const [result] = await pool.execute(
      `INSERT INTO service_requests 
         (user_id, subcategory_id, full_name, email, phone, company, website, 
          project_details, budget_range, timeline, contact_method, additional_requirements, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, subcategoryId, fullName, email, phone, company, website,
        projectDetails, budgetRange, timeline, contactMethod, additionalRequirements]
    );

    res.status(201).json({
      message: 'Service request submitted successfully',
      requestId: result.insertId
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

    const [requests] = await pool.execute(
      `SELECT sr.*, sc.name as category_name, ss.name as subcategory_name 
         FROM service_requests sr
         JOIN service_subcategories ss ON sr.subcategory_id = ss.id
         JOIN service_categories sc ON ss.category_id = sc.id
         WHERE sr.user_id = ?
         ORDER BY sr.created_at DESC`,
      [userId]
    );

    res.json(requests.map(request => ({
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

// ==================== ADMIN DASHBOARD ROUTES ====================

// ==================== ADMIN DASHBOARD ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsersResult,
      totalCoursesResult,
      totalEnrollmentsResult,
      totalRevenueResult,
      pendingContactsResult,
      pendingServiceRequestsResult
    ] = await Promise.all([
      pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = 1'),
      pool.execute('SELECT COUNT(*) as count FROM courses WHERE is_active = 1'),
      pool.execute('SELECT COUNT(*) as count FROM enrollments'),
      // Revenue based on completed or active enrollments
      pool.execute('SELECT COALESCE(SUM(c.price), 0) as total FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.status IN ("active", "completed")'),
      // Fix: contact_messages table has no 'status' column. Using date for 'pending'.
      pool.execute('SELECT COUNT(*) as count FROM contact_messages WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'),
      // Fix: Using singular 'service_request' table name
      pool.execute('SELECT COUNT(*) as count FROM service_request WHERE status = "pending"')
    ]);

    res.json({
      totalUsers: totalUsersResult[0][0].count || 0,
      totalCourses: totalCoursesResult[0][0].count || 0,
      totalEnrollments: totalEnrollmentsResult[0][0].count || 0,
      totalRevenue: parseFloat(totalRevenueResult[0][0].total) || 0,
      pendingContacts: pendingContactsResult[0][0].count || 0,
      pendingServiceRequests: pendingServiceRequestsResult[0][0].count || 0
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

// Recent Users
app.get('/api/admin/recent-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT id, first_name, last_name, email, account_type, 
             DATE_FORMAT(created_at, '%d %b %Y') as join_date
      FROM users 
      WHERE is_active = 1
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    res.json(users);
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({ error: 'Failed to fetch recent users', details: error.message });
  }
});

// Recent Enrollments
app.get('/api/admin/recent-enrollments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [enrollments] = await pool.execute(`
      SELECT e.id, 
             CONCAT(u.first_name, ' ', u.last_name) as user_name,
             c.title as course_name,
             DATE_FORMAT(e.enrollment_date, '%d %b %Y') as date,
             e.status
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN courses c ON e.course_id = c.id
      ORDER BY e.enrollment_date DESC
      LIMIT 5
    `);
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching recent enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch recent enrollments', details: error.message });
  }
});

// Recent Service Requests
app.get('/api/admin/recent-service-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Fix: Using singular 'service_request' and 'service_sub_category' table names
    const [requests] = await pool.execute(`
      SELECT sr.id, sr.full_name as name, 
             ssc.name as service, -- Alias ssc.name as 'service' for frontend display
             DATE_FORMAT(sr.created_at, '%d %b %Y') as date,
             sr.status
      FROM service_request sr
      JOIN service_sub_category ssc ON sr.subcategory_id = ssc.id
      ORDER BY sr.created_at DESC
      LIMIT 5
    `);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching recent service requests:', error);
    res.status(500).json({ error: 'Failed to fetch recent service requests', details: error.message });
  }
});


// ==================== ANALYTICS ROUTES ====================

// Get analytics data (admin only)
app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // User growth data (last 6 months)
    const [userGrowth] = await pool.execute(
      `SELECT
           DATE_FORMAT(created_at, '%Y-%m') as month,
           COUNT(*) as count
         FROM users
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m')
         ORDER BY month`
    );

    // Course enrollment data
    const [courseEnrollments] = await pool.execute(
      `SELECT
           c.title,
           COUNT(e.id) as enrollments
         FROM courses c
         LEFT JOIN enrollments e ON c.id = e.course_id
         WHERE c.is_active = 1 -- Assuming 1 for active courses
         GROUP BY c.id, c.title
         ORDER BY enrollments DESC
         LIMIT 10`
    );

    // Revenue by month (consistent with dashboard, only 'active' or 'completed' enrollments count)
    const [revenueData] = await pool.execute(
      `SELECT
           DATE_FORMAT(e.enrollment_date, '%Y-%m') as month,
           SUM(c.price) as revenue
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.enrollment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH) AND e.status IN ("active", "completed")
         GROUP BY DATE_FORMAT(e.enrollment_date, '%Y-%m')
         ORDER BY month`
    );

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

// ==================== GENERIC CRUD ENDPOINTS FOR MANAGEMENT ====================
// These endpoints include basic pagination (limit, offset)
// and lookup data endpoints for foreign key dropdowns.

// --- Users Management ---
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '', filter = 'all' } = req.query;
  let query = `SELECT id, first_name, last_name, email, phone, account_type, company, website, bio, is_active, email_verified, DATE_FORMAT(created_at, '%d %b %Y') as created_at FROM users`;
  let countQuery = `SELECT COUNT(*) as total FROM users`;
  const queryParams = [];
  const countParams = [];
  const conditions = [];

  if (search) {
    conditions.push(`(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)`);
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (filter !== 'all') {
    if (filter === 'active') {
      conditions.push('is_active = 1');
    } else if (filter === 'inactive') {
      conditions.push('is_active = 0');
    } else if (['student', 'professional', 'business', 'agency', 'admin'].includes(filter)) { // 'admin' as a potential filter
      conditions.push('account_type = ?');
      queryParams.push(filter);
      countParams.push(filter);
    }
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
    countQuery += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  queryParams.push(parseInt(limit), parseInt(offset));

  try {
    const [users] = await pool.execute(query, queryParams);
    const [totalResult] = await pool.execute(countQuery, countParams);
    res.json({ users, total: totalResult[0].total });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', details: error.message });
  }
});

app.get('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, first_name, last_name, email, phone, account_type, company, website, bio, is_active, email_verified, DATE_FORMAT(created_at, \'%d %b %Y\') as created_at, DATE_FORMAT(updated_at, \'%d %b %Y\') as updated_at FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user', details: error.message });
  }
});

app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  const { first_name, last_name, email, phone, password, account_type, company, website, bio, is_active, email_verified } = req.body;
  if (!first_name || !last_name || !email || !password || !account_type) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  // IMPORTANT: 'admin' is not in your original ENUM. If you need to add an admin type,
  // you must alter your DB schema `users.account_type` to include 'admin'.
  const allowedAccountTypes = ['student', 'professional', 'business', 'agency', 'admin'];
  if (!allowedAccountTypes.includes(account_type)) {
    return res.status(400).json({ message: `Invalid account type. Allowed are: ${allowedAccountTypes.join(', ')}` });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, phone, password_hash, account_type, profile_image, company, website, bio, is_active, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, phone, hashedPassword, account_type, null, company, website, bio, is_active, email_verified]
    );
    res.status(201).json({ id: result.insertId, message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'ER_DUP_ENTRY') { // Assuming email is unique
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    res.status(500).json({ message: 'Failed to create user', details: error.message });
  }
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { first_name, last_name, email, phone, password, account_type, company, website, bio, is_active, email_verified, profile_image } = req.body;
  const userId = req.params.id;

  const allowedAccountTypes = ['student', 'professional', 'business', 'agency', 'admin'];
  if (account_type && !allowedAccountTypes.includes(account_type)) {
    return res.status(400).json({ message: `Invalid account type. Allowed are: ${allowedAccountTypes.join(', ')}` });
  }

  try {
    let updateFields = [];
    const updateValues = [];

    if (first_name !== undefined) { updateFields.push('first_name=?'); updateValues.push(first_name); }
    if (last_name !== undefined) { updateFields.push('last_name=?'); updateValues.push(last_name); }
    if (email !== undefined) { updateFields.push('email=?'); updateValues.push(email); }
    if (phone !== undefined) { updateFields.push('phone=?'); updateValues.push(phone); }
    if (account_type !== undefined) { updateFields.push('account_type=?'); updateValues.push(account_type); }
    if (company !== undefined) { updateFields.push('company=?'); updateValues.push(company); }
    if (website !== undefined) { updateFields.push('website=?'); updateValues.push(website); }
    if (bio !== undefined) { updateFields.push('bio=?'); updateValues.push(bio); }
    if (is_active !== undefined) { updateFields.push('is_active=?'); updateValues.push(is_active); }
    if (email_verified !== undefined) { updateFields.push('email_verified=?'); updateValues.push(email_verified); }
    if (profile_image !== undefined) { updateFields.push('profile_image=?'); updateValues.push(profile_image); }

    if (password) { // Only update password if provided
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password_hash=?');
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(userId);

    const [result] = await pool.execute(updateQuery, updateValues);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 'ER_DUP_ENTRY') { // Assuming email is unique
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    res.status(500).json({ message: 'Failed to update user', details: error.message });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', details: error.message });
  }
});

// User Lookup for forms (simple list of users)
app.get('/api/admin/users/lookup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id, first_name, last_name FROM users ORDER BY first_name');
    res.json(users);
  } catch (error) {
    console.error('Error fetching user lookup:', error);
    res.status(500).json({ message: 'Failed to fetch user lookup', details: error.message });
  }
});


// --- Courses Management ---
app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '', filter = 'all' } = req.query;
  let query = `SELECT id, title, description, image_url, duration, level, category, price, thumbnail_url, is_active, DATE_FORMAT(created_at, '%d %b %Y') as created_at FROM courses`;
  let countQuery = `SELECT COUNT(*) as total FROM courses`;
  const queryParams = [];
  const countParams = [];
  const conditions = [];

  if (search) {
    conditions.push(`(title LIKE ? OR description LIKE ? OR category LIKE ?)`);
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (filter !== 'all') {
    if (filter === 'active') {
      conditions.push('is_active = 1');
    } else if (filter === 'inactive') {
      conditions.push('is_active = 0');
    } else if (['beginner', 'intermediate', 'advanced'].includes(filter)) {
      conditions.push('level = ?');
      queryParams.push(filter);
      countParams.push(filter);
    }
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
    countQuery += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  queryParams.push(parseInt(limit), parseInt(offset));

  try {
    const [courses] = await pool.execute(query, queryParams);
    const [totalResult] = await pool.execute(countQuery, countParams);
    res.json({ courses, total: totalResult[0].total });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Failed to fetch courses', details: error.message });
  }
});

app.get('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, title, description, image_url, duration, level, category, price, thumbnail_url, is_active, DATE_FORMAT(created_at, \'%d %b %Y\') as created_at, DATE_FORMAT(updated_at, \'%d %b %Y\') as updated_at FROM courses WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Course not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Failed to fetch course', details: error.message });
  }
});

app.post('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  // Fix: Removed instructor_name as it's not in schema. Used 'duration' instead of 'duration_weeks'
  const { title, description, image_url, duration, level, category, price, thumbnail_url, is_active } = req.body;
  if (!title || !level || !category || !price) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO courses (title, description, image_url, duration, level, category, price, thumbnail_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, image_url, duration, level, category, price, thumbnail_url, is_active]
    );
    res.status(201).json({ id: result.insertId, message: 'Course created successfully' });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Failed to create course', details: error.message });
  }
});

app.put('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Fix: Removed instructor_name. Used 'duration' instead of 'duration_weeks'
  const { title, description, image_url, duration, level, category, price, thumbnail_url, is_active } = req.body;
  const courseId = req.params.id;
  try {
    const [result] = await pool.execute(
      'UPDATE courses SET title=?, description=?, image_url=?, duration=?, level=?, category=?, price=?, thumbnail_url=?, is_active=? WHERE id = ?',
      [title, description, image_url, duration, level, category, price, thumbnail_url, is_active, courseId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Failed to update course', details: error.message });
  }
});

app.delete('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM courses WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Failed to delete course', details: error.message });
  }
});

// Course Lookup for forms
app.get('/api/admin/courses/lookup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [courses] = await pool.execute('SELECT id, title FROM courses ORDER BY title');
    res.json(courses);
  } catch (error) {
    console.error('Error fetching course lookup:', error);
    res.status(500).json({ message: 'Failed to fetch course lookup', details: error.message });
  }
});


// --- Assignments Management ---
app.get('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '', course_id } = req.query;
  let query = `
    SELECT a.id, a.title, a.description, a.due_date, a.max_points, DATE_FORMAT(a.created_at, '%d %b %Y') as created_at,
           c.id as course_id, c.title as course_title
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
  `;
  let countQuery = `SELECT COUNT(*) as total FROM assignments a JOIN courses c ON a.course_id = c.id`;
  const queryParams = [];
  const countParams = [];
  const conditions = [];

  if (search) {
    conditions.push(`(a.title LIKE ? OR a.description LIKE ? OR c.title LIKE ?)`);
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (course_id) {
    conditions.push('a.course_id = ?');
    queryParams.push(course_id);
    countParams.push(course_id);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
    countQuery += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
  queryParams.push(parseInt(limit), parseInt(offset));

  try {
    const [assignments] = await pool.execute(query, queryParams);
    const [totalResult] = await pool.execute(countQuery, countParams);
    res.json({ assignments, total: totalResult[0].total });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Failed to fetch assignments', details: error.message });
  }
});

app.get('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT a.id, a.course_id, a.title, a.description, DATE_FORMAT(a.due_date, '%Y-%m-%d') as due_date, a.max_points, DATE_FORMAT(a.created_at, '%d %b %Y') as created_at,
             c.title as course_title
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Assignment not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ message: 'Failed to fetch assignment', details: error.message });
  }
});

app.post('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  const { course_id, title, description, due_date, max_points } = req.body;
  if (!course_id || !title || !due_date || !max_points) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO assignments (course_id, title, description, due_date, max_points) VALUES (?, ?, ?, ?, ?)',
      [course_id, title, description, due_date, max_points]
    );
    res.status(201).json({ id: result.insertId, message: 'Assignment created successfully' });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Failed to create assignment', details: error.message });
  }
});

app.put('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { course_id, title, description, due_date, max_points } = req.body;
  const assignmentId = req.params.id;
  try {
    const [result] = await pool.execute(
      'UPDATE assignments SET course_id=?, title=?, description=?, due_date=?, max_points=? WHERE id = ?',
      [course_id, title, description, due_date, max_points, assignmentId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Assignment not found' });
    res.json({ message: 'Assignment updated successfully' });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Failed to update assignment', details: error.message });
  }
});

app.delete('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM assignments WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Assignment not found' });
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Failed to delete assignment', details: error.message });
  }
});


// --- Enrollments Management ---
app.get('/api/admin/enrollments', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '', status = 'all' } = req.query;
  let query = `
    SELECT e.id, e.user_id, e.course_id, e.progress, DATE_FORMAT(e.enrollment_date, '%d %b %Y') as date, DATE_FORMAT(e.completion_date, '%d %b %Y') as completion_date, e.status,
           CONCAT(u.first_name, ' ', u.last_name) as user_name,
           c.title as course_name
    FROM enrollments e
    JOIN users u ON e.user_id = u.id
    JOIN courses c ON e.course_id = c.id
  `;
  let countQuery = `SELECT COUNT(*) as total FROM enrollments e JOIN users u ON e.user_id = u.id JOIN courses c ON e.course_id = c.id`;
  const queryParams = [];
  const countParams = [];
  const conditions = [];

  if (search) {
    conditions.push(`(u.first_name LIKE ? OR u.last_name LIKE ? OR c.title LIKE ?)`);
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status !== 'all') {
    conditions.push('e.status = ?');
    queryParams.push(status);
    countParams.push(status);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
    countQuery += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY e.enrollment_date DESC LIMIT ? OFFSET ?`;
  queryParams.push(parseInt(limit), parseInt(offset));

  try {
    const [enrollments] = await pool.execute(query, queryParams);
    const [totalResult] = await pool.execute(countQuery, countParams);
    res.json({ enrollments, total: totalResult[0].total });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ message: 'Failed to fetch enrollments', details: error.message });
  }
});

app.get('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT e.id, e.user_id, e.course_id, e.progress, DATE_FORMAT(e.enrollment_date, '%d %b %Y') as date, DATE_FORMAT(e.completion_date, '%Y-%m-%d') as completion_date, e.status,
             CONCAT(u.first_name, ' ', u.last_name) as user_name,
             c.title as course_name
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Enrollment not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    res.status(500).json({ message: 'Failed to fetch enrollment', details: error.message });
  }
});

app.post('/api/admin/enrollments', authenticateToken, requireAdmin, async (req, res) => {
  const { user_id, course_id, progress, completion_date, status } = req.body;
  if (!user_id || !course_id) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO enrollments (user_id, course_id, progress, completion_date, status) VALUES (?, ?, ?, ?, ?)',
      [user_id, course_id, progress, completion_date, status]
    );
    res.status(201).json({ id: result.insertId, message: 'Enrollment created successfully' });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    res.status(500).json({ message: 'Failed to create enrollment', details: error.message });
  }
});

app.put('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { user_id, course_id, progress, completion_date, status } = req.body;
  const enrollmentId = req.params.id;
  try {
    const [result] = await pool.execute(
      'UPDATE enrollments SET user_id=?, course_id=?, progress=?, completion_date=?, status=? WHERE id = ?',
      [user_id, course_id, progress, completion_date, status, enrollmentId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Enrollment not found' });
    res.json({ message: 'Enrollment updated successfully' });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({ message: 'Failed to update enrollment', details: error.message });
  }
});

app.delete('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM enrollments WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Enrollment not found' });
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ message: 'Failed to delete enrollment', details: error.message });
  }
});


// --- Certificates Management ---
app.get('/api/admin/certificates', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '' } = req.query;
  let query = `
    SELECT ce.id, ce.user_id, ce.course_id, ce.certificate_url, DATE_FORMAT(ce.issued_date, '%d %b %Y') as issued_date,
           CONCAT(u.first_name, ' ', u.last_name) as user_name,
           c.title as course_title
    FROM certificates ce
    JOIN users u ON ce.user_id = u.id
    JOIN courses c ON ce.course_id = c.id
  `;
  let countQuery = `SELECT COUNT(*) as total FROM certificates ce JOIN users u ON ce.user_id = u.id JOIN courses c ON ce.course_id = c.id`;
  const queryParams = [];
  const countParams = [];
  const conditions = [];

  if (search) {
    conditions.push(`(u.first_name LIKE ? OR u.last_name LIKE ? OR c.title LIKE ?)`);
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
    countQuery += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY ce.issued_date DESC LIMIT ? OFFSET ?`;
  queryParams.push(parseInt(limit), parseInt(offset));

  try {
    const [certificates] = await pool.execute(query, queryParams);
    const [totalResult] = await pool.execute(countQuery, countParams);
    res.json({ certificates, total: totalResult[0].total });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ message: 'Failed to fetch certificates', details: error.message });
  }
});

app.get('/api/admin/certificates/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT ce.id, ce.user_id, ce.course_id, ce.certificate_url, DATE_FORMAT(ce.issued_date, '%Y-%m-%d') as issued_date,
             CONCAT(u.first_name, ' ', u.last_name) as user_name,
             c.title as course_title
      FROM certificates ce
      JOIN users u ON ce.user_id = u.id
      JOIN courses c ON ce.course_id = c.id
      WHERE ce.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Certificate not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ message: 'Failed to fetch certificate', details: error.message });
  }
});

app.post('/api/admin/certificates', authenticateToken, requireAdmin, async (req, res) => {
  const { user_id, course_id, certificate_url, issued_date } = req.body;
  if (!user_id || !course_id || !certificate_url || !issued_date) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO certificates (user_id, course_id, certificate_url, issued_date) VALUES (?, ?, ?, ?)',
      [user_id, course_id, certificate_url, issued_date]
    );
    res.status(201).json({ id: result.insertId, message: 'Certificate created successfully' });
  } catch (error) {
    console.error('Error creating certificate:', error);
    res.status(500).json({ message: 'Failed to create certificate', details: error.message });
  }
});

app.put('/api/admin/certificates/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { user_id, course_id, certificate_url, issued_date } = req.body;
  const certificateId = req.params.id;
  try {
    const [result] = await pool.execute(
      'UPDATE certificates SET user_id=?, course_id=?, certificate_url=?, issued_date=? WHERE id = ?',
      [user_id, course_id, certificate_url, issued_date, certificateId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Certificate not found' });
    res.json({ message: 'Certificate updated successfully' });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ message: 'Failed to update certificate', details: error.message });
  }
});

app.delete('/api/admin/certificates/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM certificates WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Certificate not found' });
    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ message: 'Failed to delete certificate', details: error.message });
  }
});


// --- Contact Messages Management ---
// Fix: contact_messages table has no 'status' column.
// Frontend will display a 'pending' status based on recent messages, but cannot update it.
app.get('/api/admin/contact-messages', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '' } = req.query; // Removed 'status' filter
  let query = `SELECT id, first_name, last_name, email, phone, company, message, DATE_FORMAT(created_at, '%d %b %Y') as created_at FROM contact_messages`;
  let countQuery = `SELECT COUNT(*) as total FROM contact_messages`;
  const queryParams = [];
  const countParams = [];
  const conditions = [];

  if (search) {
    conditions.push(`(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR message LIKE ?)`);
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  // Removed status condition: if (status !== 'all') { conditions.push('status = ?'); ... }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
    countQuery += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  queryParams.push(parseInt(limit), parseInt(offset));

  try {
    const [messages] = await pool.execute(query, queryParams);
    const [totalResult] = await pool.execute(countQuery, countParams);
    // For frontend display, assign a 'pending' status conceptually if it's recent for consistency
    const formattedMessages = messages.map(msg => ({
      ...msg,
      status: (new Date(msg.created_at).getTime() > (Date.now() - 7 * 24 * 60 * 60 * 1000)) ? 'pending' : 'resolved' // Simple logic
    }));
    res.json({ messages: formattedMessages, total: totalResult[0].total });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ message: 'Failed to fetch contact messages', details: error.message });
  }
});

app.get('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, first_name, last_name, email, phone, company, message, DATE_FORMAT(created_at, \'%d %b %Y\') as created_at FROM contact_messages WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Contact message not found' });
    const message = rows[0];
    // Assign a conceptual status for frontend display
    message.status = (new Date(message.created_at).getTime() > (Date.now() - 7 * 24 * 60 * 60 * 1000)) ? 'pending' : 'resolved';
    res.json(message);
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({ message: 'Failed to fetch contact message', details: error.message });
  }
});

app.post('/api/admin/contact-messages', authenticateToken, requireAdmin, async (req, res) => {
  // Fix: Removed 'status' field from insert
  const { first_name, last_name, email, phone, company, message } = req.body;
  if (!first_name || !last_name || !email || !message) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO contact_messages (first_name, last_name, email, phone, company, message) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, phone, company, message]
    );
    res.status(201).json({ id: result.insertId, message: 'Contact message created successfully' });
  } catch (error) {
    console.error('Error creating contact message:', error);
    res.status(500).json({ message: 'Failed to create contact message', details: error.message });
  }
});

app.put('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Fix: Removed 'status' field from update
  const { first_name, last_name, email, phone, company, message } = req.body;
  const messageId = req.params.id;
  try {
    const [result] = await pool.execute(
      'UPDATE contact_messages SET first_name=?, last_name=?, email=?, phone=?, company=?, message=? WHERE id = ?',
      [first_name, last_name, email, phone, company, message, messageId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Contact message not found' });
    res.json({ message: 'Contact message updated successfully' });
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500).json({ message: 'Failed to update contact message', details: error.message });
  }
});

app.delete('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Contact message not found' });
    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ message: 'Failed to delete contact message', details: error.message });
  }
});


// --- Calendar Events Management ---
app.get('/api/admin/calendar-events', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '', event_type = 'all' } = req.query;
  let query = `
    SELECT cce.id, cce.user_id, cce.title, cce.description, DATE_FORMAT(cce.event_date, '%Y-%m-%d') as event_date, TIME_FORMAT(cce.event_time, '%H:%i') as event_time, cce.event_type, DATE_FORMAT(cce.created_at, '%d %b %Y') as created_at,
           CONCAT(u.first_name, ' ', u.last_name) as user_name
    FROM custom_calendar_events cce
    JOIN users u ON cce.user_id = u.id
  `;
  let countQuery = `SELECT COUNT(*) as total FROM custom_calendar_events cce JOIN users u ON cce.user_id = u.id`;
  const queryParams = [];
  const countParams = [];
  const conditions = [];

  if (search) {
    conditions.push(`(cce.title LIKE ? OR cce.description LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`);
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (event_type !== 'all') {
    conditions.push('cce.event_type = ?');
    queryParams.push(event_type);
    countParams.push(event_type);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
    countQuery += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY cce.event_date DESC, cce.event_time DESC LIMIT ? OFFSET ?`;
  queryParams.push(parseInt(limit), parseInt(offset));

  try {
    const [events] = await pool.execute(query, queryParams);
    const [totalResult] = await pool.execute(countQuery, countParams);
    res.json({ events, total: totalResult[0].total });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ message: 'Failed to fetch calendar events', details: error.message });
  }
});

app.get('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT cce.id, cce.user_id, cce.title, cce.description, DATE_FORMAT(cce.event_date, '%Y-%m-%d') as event_date, TIME_FORMAT(cce.event_time, '%H:%i') as event_time, cce.event_type, DATE_FORMAT(cce.created_at, '%d %b %Y') as created_at,
             CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM custom_calendar_events cce
      JOIN users u ON cce.user_id = u.id
      WHERE cce.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Event not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    res.status(500).json({ message: 'Failed to fetch calendar event', details: error.message });
  }
});

app.post('/api/admin/calendar-events', authenticateToken, requireAdmin, async (req, res) => {
  const { user_id, title, description, event_date, event_time, event_type = 'custom' } = req.body;
  if (!user_id || !title || !event_date) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO custom_calendar_events (user_id, title, description, event_date, event_time, event_type) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, title, description, event_date, event_time, event_type]
    );
    res.status(201).json({ id: result.insertId, message: 'Calendar event created successfully' });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ message: 'Failed to create calendar event', details: error.message });
  }
});

app.put('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { user_id, title, description, event_date, event_time, event_type } = req.body;
  const eventId = req.params.id;
  try {
    const [result] = await pool.execute(
      'UPDATE custom_calendar_events SET user_id=?, title=?, description=?, event_date=?, event_time=?, event_type=? WHERE id = ?',
      [user_id, title, description, event_date, event_time, event_type, eventId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Calendar event not found' });
    res.json({ message: 'Calendar event updated successfully' });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ message: 'Failed to update calendar event', details: error.message });
  }
});

app.delete('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM custom_calendar_events WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Calendar event not found' });
    res.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ message: 'Failed to delete calendar event', details: error.message });
  }
});


// --- Service Categories Management ---
// Using plural 'service-categories' for API consistency with frontend expectation
app.get('/api/admin/service-categories', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '' } = req.query;
  let query = `SELECT id, name, description, icon, is_active, DATE_FORMAT(created_at, '%d %b %Y') as created_at FROM service_category`;
  let countQuery = `SELECT COUNT(*) as total FROM service_category`;
  const queryParams = [];
  const countParams = [];
  const conditions = [];

  if (search) {
    conditions.push(`(name LIKE ? OR description LIKE ?)`);
    queryParams.push(`%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
    countQuery += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY name LIMIT ? OFFSET ?`;
  queryParams.push(parseInt(limit), parseInt(offset));

  try {
    const [categories] = await pool.execute(query, queryParams);
    const [totalResult] = await pool.execute(countQuery, countParams);
    res.json({ categories, total: totalResult[0].total });
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({ message: 'Failed to fetch service categories', details: error.message });
  }
});

app.get('/api/admin/service-categories/lookup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [categories] = await pool.execute('SELECT id, name FROM service_category WHERE is_active = 1 ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching service category lookup:', error);
    res.status(500).json({ message: 'Failed to fetch service category lookup', details: error.message });
  }
});

app.get('/api/admin/service-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, description, icon, is_active, DATE_FORMAT(created_at, \'%d %b %Y\') as created_at FROM service_category WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Service category not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching service category:', error);
    res.status(500).json({ message: 'Failed to fetch service category', details: error.message });
  }
});

app.post('/api/admin/service-categories', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, icon, is_active } = req.body;
  if (!name) return res.status(400).json({ message: 'Category name is required' });
  try {
    const [result] = await pool.execute('INSERT INTO service_category (name, description, icon, is_active) VALUES (?, ?, ?, ?)', [name, description, icon, is_active]);
    res.status(201).json({ id: result.insertId, message: 'Service category created successfully' });
  } catch (error) {
    console.error('Error creating service category:', error);
    if (error.code === 'ER_DUP_ENTRY') { // Assuming name is unique
      return res.status(409).json({ message: 'Category with this name already exists' });
    }
    res.status(500).json({ message: 'Failed to create service category', details: error.message });
  }
});

app.put('/api/admin/service-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, icon, is_active } = req.body;
  const categoryId = req.params.id;
  try {
    const [result] = await pool.execute('UPDATE service_category SET name=?, description=?, icon=?, is_active=? WHERE id = ?', [name, description, icon, is_active, categoryId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Service category not found' });
    res.json({ message: 'Service category updated successfully' });
  } catch (error) {
    console.error('Error updating service category:', error);
    if (error.code === 'ER_DUP_ENTRY') { // Assuming name is unique
      return res.status(409).json({ message: 'Category with this name already exists' });
    }
    res.status(500).json({ message: 'Failed to update service category', details: error.message });
  }
});

app.delete('/api/admin/service-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM service_category WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Service category not found' });
    res.json({ message: 'Service category deleted successfully' });
  } catch (error) {
    console.error('Error deleting service category:', error);
    res.status(500).json({ message: 'Failed to delete service category', details: error.message });
  }
});


// --- Service Subcategories Management ---
// Using plural 'service-sub-categories' for consistency in API
app.get('/api/admin/service-sub-categories', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '', category_id } = req.query;
  let query = `
    SELECT ssc.id, ssc.name, ssc.description, ssc.base_price, ssc.is_active, DATE_FORMAT(ssc.created_at, '%d %b %Y') as created_at,
           sc.name as category_name
    FROM service_sub_category ssc
    JOIN service_category sc ON ssc.category_id = sc.id
  `;
  let countQuery = `SELECT COUNT(*) as total FROM service_sub_category ssc JOIN service_category sc ON ssc.category_id = sc.id`;
  const queryParams = [];
  const countParams = [];
  const conditions = [];

  if (search) {
    conditions.push(`(ssc.name LIKE ? OR ssc.description LIKE ? OR sc.name LIKE ?)`);
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category_id) {
    conditions.push('ssc.category_id = ?');
    queryParams.push(category_id);
    countParams.push(category_id);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
    countQuery += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY ssc.name LIMIT ? OFFSET ?`;
  queryParams.push(parseInt(limit), parseInt(offset));

  try {
    const [subcategories] = await pool.execute(query, queryParams);
    const [totalResult] = await pool.execute(countQuery, countParams);
    res.json({ subcategories, total: totalResult[0].total });
  } catch (error) {
    console.error('Error fetching service subcategories:', error);
    res.status(500).json({ message: 'Failed to fetch service subcategories', details: error.message });
  }
});

app.get('/api/admin/service-sub-categories/lookup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [subcategories] = await pool.execute('SELECT id, name, category_id FROM service_sub_category WHERE is_active = 1 ORDER BY name');
    res.json(subcategories);
  } catch (error) {
    console.error('Error fetching service subcategory lookup:', error);
    res.status(500).json({ message: 'Failed to fetch service subcategory lookup', details: error.message });
  }
});


app.get('/api/admin/service-sub-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, category_id, name, description, base_price, is_active, DATE_FORMAT(created_at, \'%d %b %Y\') as created_at FROM service_sub_category WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Service subcategory not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching service subcategory:', error);
    res.status(500).json({ message: 'Failed to fetch service subcategory', details: error.message });
  }
});

app.post('/api/admin/service-sub-categories', authenticateToken, requireAdmin, async (req, res) => {
  const { category_id, name, description, base_price, is_active } = req.body;
  if (!category_id || !name) return res.status(400).json({ message: 'Category ID and name are required' });
  try {
    const [result] = await pool.execute('INSERT INTO service_sub_category (category_id, name, description, base_price, is_active) VALUES (?, ?, ?, ?, ?)', [category_id, name, description, base_price, is_active]);
    res.status(201).json({ id: result.insertId, message: 'Service subcategory created successfully' });
  } catch (error) {
    console.error('Error creating service subcategory:', error);
    if (error.code === 'ER_DUP_ENTRY') { // Assuming name is unique within a category
      return res.status(409).json({ message: 'Subcategory with this name already exists in this category' });
    }
    res.status(500).json({ message: 'Failed to create service subcategory', details: error.message });
  }
});

app.put('/api/admin/service-sub-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { category_id, name, description, base_price, is_active } = req.body;
  const subcategoryId = req.params.id;
  try {
    const [result] = await pool.execute('UPDATE service_sub_category SET category_id=?, name=?, description=?, base_price=?, is_active=? WHERE id = ?', [category_id, name, description, base_price, is_active, subcategoryId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Service subcategory not found' });
    res.json({ message: 'Service subcategory updated successfully' });
  } catch (error) {
    console.error('Error updating service subcategory:', error);
    if (error.code === 'ER_DUP_ENTRY') { // Assuming name is unique within a category
      return res.status(409).json({ message: 'Subcategory with this name already exists in this category' });
    }
    res.status(500).json({ message: 'Failed to update service subcategory', details: error.message });
  }
});

app.delete('/api/admin/service-sub-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM service_sub_category WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Service subcategory not found' });
    res.json({ message: 'Service subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting service subcategory:', error);
    res.status(500).json({ message: 'Failed to delete service subcategory', details: error.message });
  }
});


// --- Services (Offerings) Management ---
// Fix: Using singular 'service' table name. Frontend also expects a list of 'service offerings' for selection.
app.get('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '', category_id } = req.query;
  let query = `
    SELECT s.id, s.name, s.category_id, s.description, s.price, s.duration, s.rating, s.reviews, s.features, s.popular, DATE_FORMAT(s.created_at, '%d %b %Y') as created_at,
           sc.name as category_name
    FROM service s
    JOIN service_category sc ON s.category_id = sc.id
  `;
  let countQuery = `SELECT COUNT(*) as total FROM service s JOIN service_category sc ON s.category_id = sc.id`;
  const queryParams = [];
  const countParams = [];
  const conditions = [];

  if (search) {
    conditions.push(`(s.name LIKE ? OR s.description LIKE ? OR sc.name LIKE ?)`);
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category_id) {
    conditions.push('s.category_id = ?');
    queryParams.push(category_id);
    countParams.push(category_id);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
    countQuery += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY s.name LIMIT ? OFFSET ?`;
  queryParams.push(parseInt(limit), parseInt(offset));

  try {
    const [services] = await pool.execute(query, queryParams);
    const [totalResult] = await pool.execute(countQuery, countParams);
    res.json({ services, total: totalResult[0].total });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Failed to fetch services', details: error.message });
  }
});

app.get('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT s.id, s.name, s.category_id, s.description, s.price, s.duration, s.rating, s.reviews, s.features, s.popular, DATE_FORMAT(s.created_at, '%d %b %Y') as created_at,
             sc.name as category_name
      FROM service s
      JOIN service_category sc ON s.category_id = sc.id
      WHERE s.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Service offering not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching service offering:', error);
    res.status(500).json({ message: 'Failed to fetch service offering', details: error.message });
  }
});

app.post('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  const { name, category_id, description, price, duration, features, popular } = req.body;
  if (!name || !category_id || !price) return res.status(400).json({ message: 'Name, category ID, and price are required' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO service (name, category_id, description, price, duration, features, popular) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, category_id, description, price, duration, features, popular]
    );
    res.status(201).json({ id: result.insertId, message: 'Service offering created successfully' });
  } catch (error) {
    console.error('Error creating service offering:', error);
    res.status(500).json({ message: 'Failed to create service offering', details: error.message });
  }
});

app.put('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, category_id, description, price, duration, features, popular } = req.body;
  const serviceId = req.params.id;
  try {
    const [result] = await pool.execute(
      'UPDATE service SET name=?, category_id=?, description=?, price=?, duration=?, features=?, popular=? WHERE id = ?',
      [name, category_id, description, price, duration, features, popular, serviceId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Service offering not found' });
    res.json({ message: 'Service offering updated successfully' });
  } catch (error) {
    console.error('Error updating service offering:', error);
    res.status(500).json({ message: 'Failed to update service offering', details: error.message });
  }
});

app.delete('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM service WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Service offering not found' });
    res.json({ message: 'Service offering deleted successfully' });
  } catch (error) {
    console.error('Error deleting service offering:', error);
    res.status(500).json({ message: 'Failed to delete service offering', details: error.message });
  }
});


// --- Service Requests Management ---
// Fix: Endpoint name now matches the singular table name `service_request`
app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '', status = 'all' } = req.query;
  let query = `
    SELECT sr.id, sr.user_id, sr.subcategory_id, sr.full_name as name, sr.email, sr.phone, sr.company, sr.website, sr.project_details, sr.budget_range, sr.timeline, sr.contact_method, sr.additional_requirements, DATE_FORMAT(sr.created_at, '%d %b %Y') as date, sr.status,
           ssc.name as service_name
    FROM service_request sr
    JOIN service_sub_category ssc ON sr.subcategory_id = ssc.id
  `;
  let countQuery = `SELECT COUNT(*) as total FROM service_request sr JOIN service_sub_category ssc ON sr.subcategory_id = ssc.id`;
  const queryParams = [];
  const countParams = [];
  const conditions = [];

  if (search) {
    conditions.push(`(sr.full_name LIKE ? OR sr.email LIKE ? OR ssc.name LIKE ?)`);
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status !== 'all') {
    conditions.push('sr.status = ?');
    queryParams.push(status);
    countParams.push(status);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
    countQuery += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY sr.created_at DESC LIMIT ? OFFSET ?`;
  queryParams.push(parseInt(limit), parseInt(offset));

  try {
    const [requests] = await pool.execute(query, queryParams);
    const [totalResult] = await pool.execute(countQuery, countParams);
    res.json({ requests, total: totalResult[0].total });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ message: 'Failed to fetch service requests', details: error.message });
  }
});

app.get('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT sr.id, sr.user_id, sr.subcategory_id, sr.full_name as name, sr.email, sr.phone, sr.company, sr.website, sr.project_details, sr.budget_range, sr.timeline, sr.contact_method, sr.additional_requirements, DATE_FORMAT(sr.created_at, '%d %b %Y') as date, sr.status,
             ssc.name as service_name
      FROM service_request sr
      JOIN service_sub_category ssc ON sr.subcategory_id = ssc.id
      WHERE sr.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Service request not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({ message: 'Failed to fetch service request', details: error.message });
  }
});

app.post('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  // Fix: user_id is NOT NULL in schema, so must be provided.
  const { user_id, subcategory_id, full_name, email, phone, company, website, project_details, budget_range, timeline, contact_method, additional_requirements, status = 'pending' } = req.body;
  if (!user_id || !subcategory_id || !full_name || !email || !phone || !project_details || !budget_range || !timeline || !contact_method) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO service_request (user_id, subcategory_id, full_name, email, phone, company, website, project_details, budget_range, timeline, contact_method, additional_requirements, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, subcategory_id, full_name, email, phone, company, website, project_details, budget_range, timeline, contact_method, additional_requirements, status]
    );
    res.status(201).json({ id: result.insertId, message: 'Service request created successfully' });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ message: 'Failed to create service request', details: error.message });
  }
});

app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Fix: user_id is NOT NULL in schema, so must be provided.
  const { user_id, subcategory_id, full_name, email, phone, company, website, project_details, budget_range, timeline, contact_method, additional_requirements, status } = req.body;
  const requestId = req.params.id;
  try {
    const [result] = await pool.execute(
      'UPDATE service_request SET user_id=?, subcategory_id=?, full_name=?, email=?, phone=?, company=?, website=?, project_details=?, budget_range=?, timeline=?, contact_method=?, additional_requirements=?, status=? WHERE id = ?',
      [user_id, subcategory_id, full_name, email, phone, company, website, project_details, budget_range, timeline, contact_method, additional_requirements, status, requestId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Service request not found' });
    res.json({ message: 'Service request updated successfully' });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ message: 'Failed to update service request', details: error.message });
  }
});

app.delete('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM service_request WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Service request not found' });
    res.json({ message: 'Service request deleted successfully' });
  } catch (error) {
    console.error('Error deleting service request:', error);
    res.status(500).json({ message: 'Failed to delete service request', details: error.message });
  }
});


// --- Internships Management --- (Frontend has a basic listing for this)
app.get('/api/admin/internships', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '' } = req.query;
  let query = `SELECT id, title, company, location, duration, type, level, description, requirements, benefits, DATE_FORMAT(posted_at, '%d %b %Y') as posted_at, applications_count, spots_available FROM internships`;
  let countQuery = `SELECT COUNT(*) as total FROM internships`;
  const queryParams = [];
  const countParams = [];
  const conditions = [];

  if (search) {
    conditions.push(`(title LIKE ? OR company LIKE ? OR location LIKE ?)`);
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
    countQuery += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY posted_at DESC LIMIT ? OFFSET ?`;
  queryParams.push(parseInt(limit), parseInt(offset));

  try {
    const [internships] = await pool.execute(query, queryParams);
    const [totalResult] = await pool.execute(countQuery, countParams);
    res.json({ internships, total: totalResult[0].total });
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ message: 'Failed to fetch internships', details: error.message });
  }
});

app.get('/api/admin/internships/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, title, company, location, duration, type, level, description, requirements, benefits, DATE_FORMAT(posted_at, \'%Y-%m-%d\') as posted_at, applications_count, spots_available FROM internships WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Internship not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching internship:', error);
    res.status(500).json({ message: 'Failed to fetch internship', details: error.message });
  }
});

app.post('/api/admin/internships', authenticateToken, requireAdmin, async (req, res) => {
  const { title, company, location, duration, type, level, description, requirements, benefits, applications_count = 0, spots_available } = req.body;
  if (!title || !company || !location || !duration || !type || !level || !description || !requirements || !benefits || !spots_available) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO internships (title, company, location, duration, type, level, description, requirements, benefits, applications_count, spots_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, company, location, duration, type, level, description, requirements, benefits, applications_count, spots_available]
    );
    res.status(201).json({ id: result.insertId, message: 'Internship created successfully' });
  } catch (error) {
    console.error('Error creating internship:', error);
    res.status(500).json({ message: 'Failed to create internship', details: error.message });
  }
});

app.put('/api/admin/internships/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { title, company, location, duration, type, level, description, requirements, benefits, applications_count, spots_available } = req.body;
  const internshipId = req.params.id;
  try {
    const [result] = await pool.execute(
      'UPDATE internships SET title=?, company=?, location=?, duration=?, type=?, level=?, description=?, requirements=?, benefits=?, applications_count=?, spots_available=? WHERE id = ?',
      [title, company, location, duration, type, level, description, requirements, benefits, applications_count, spots_available, internshipId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Internship not found' });
    res.json({ message: 'Internship updated successfully' });
  } catch (error) {
    console.error('Error updating internship:', error);
    res.status(500).json({ message: 'Failed to update internship', details: error.message });
  }
});

app.delete('/api/admin/internships/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM internships WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Internship not found' });
    res.json({ message: 'Internship deleted successfully' });
  } catch (error) {
    console.error('Error deleting internship:', error);
    res.status(500).json({ message: 'Failed to delete internship', details: error.message });
  }
});

// Add similar CRUD endpoints for other tables not yet implemented if needed:
// - assignment_submission
// - download_log
// - user_bookmarks
// - user_stats
// - course_enroll_requests
// - social_activities

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
    const [result] = await pool.execute(
      `INSERT INTO contact_messages 
         (first_name, last_name, email, phone, company, message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [firstName.trim(), lastName.trim(), email.trim(), phone || null, company || null, message.trim()]
    );

    console.log('Contact message saved successfully:', {
      id: result.insertId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim()
    });

    res.status(201).json({
      message: 'Contact message sent successfully',
      contactId: result.insertId
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get contact messages (admin only)
app.get('/api/admin/contact-messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [messages] = await pool.execute(
      `SELECT id, first_name, last_name, email, phone, company, message, created_at
         FROM contact_messages 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [totalCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM contact_messages'
    );

    res.json({
      messages: messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount[0].total / limit),
        totalMessages: totalCount[0].total,
        hasNextPage: page < Math.ceil(totalCount[0].total / limit),
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ANALYTICS ROUTES ====================

// Get analytics data (admin only)
app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // User growth data (last 6 months)
    const [userGrowth] = await pool.execute(
      `SELECT 
           DATE_FORMAT(created_at, '%Y-%m') as month,
           COUNT(*) as count
         FROM users 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m')
         ORDER BY month`
    );

    // Course enrollment data
    const [courseEnrollments] = await pool.execute(
      `SELECT 
           c.title,
           COUNT(e.id) as enrollments
         FROM courses c
         LEFT JOIN enrollments e ON c.id = e.course_id
         WHERE c.is_active = true
         GROUP BY c.id, c.title
         ORDER BY enrollments DESC
         LIMIT 10`
    );

    // Revenue by month (mock calculation)
    const [revenueData] = await pool.execute(
      `SELECT 
           DATE_FORMAT(e.enrollment_date, '%Y-%m') as month,
           SUM(c.price) as revenue
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.enrollment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(e.enrollment_date, '%Y-%m')
         ORDER BY month`
    );

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
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Graceful shutdown...');
  await pool.end();
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`📚 API Info: http://localhost:${port}/api/info`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
