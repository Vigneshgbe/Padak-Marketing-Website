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
const uploadsBaseDir = path.join(__dirname, 'uploads');
const assignmentsDir = path.join(uploadsBaseDir, 'assignments');
const avatarsDir = path.join(uploadsBaseDir, 'avatars');
const paymentsDir = path.join(uploadsBaseDir, 'payments');
const socialDir = path.join(__dirname, 'public', 'uploads', 'social');

// Ensure all directories exist
[uploadsBaseDir, assignmentsDir, avatarsDir, paymentsDir, socialDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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

// ===== PAYMENT SCREENSHOT MULTER CONFIGURATION =====
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

// ===== SOCIAL POST MULTER CONFIGURATION =====
const socialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, socialDir);
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

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/social', express.static(path.join(__dirname, 'public', 'uploads', 'social')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Helper function to get full URL for images
const getFullImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  
  let cleanPath = imagePath;
  if (cleanPath.startsWith('public/')) {
    cleanPath = cleanPath.replace(/^public\//, '');
  }
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  return `${req.protocol}://${req.get('host')}${cleanPath}`;
};

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
      'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = ?',
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

// ==================== PROFILE SECTION ROUTES ==================== 
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
      profileImage: user.profile_image ? getFullImageUrl(req, user.profile_image) : null,
      company: user.company,
      website: user.website,
      bio: user.bio,
      isActive: user.is_active,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login
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
      profileImage: user.profile_image ? getFullImageUrl(req, user.profile_image) : null,
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

    // Send success response with URL path
    res.status(200).send(getFullImageUrl(req, profileImage));

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
// --- GET All Posts (with Pagination, Likes, Comments, etc.) ---
app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  try {
    // Step 1: Get total count
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

    // Step 2: Fetch paginated posts
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
    
    // Fixed SQL query for fetching comments
    const commentsQuery = `
    SELECT
      c.id, c.user_id, c.content, c.created_at, c.target_id,
      u.first_name, u.last_name, u.profile_image, u.account_type
    FROM social_activities c JOIN users u ON c.user_id = u.id
    WHERE c.activity_type = 'comment' AND c.target_id IN (${postIds.map(() => '?').join(',')})
    ORDER BY c.created_at ASC
    `;
    
    const [comments] = await pool.execute(commentsQuery, [...postIds]);

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
            profile_image: getFullImageUrl(req, c.profile_image),
            account_type: c.account_type,
          }
        }));

      return {
        ...post,
        has_liked: !!post.has_liked,
        has_bookmarked: !!post.has_bookmarked,
        image_url: getFullImageUrl(req, post.image_url),
        user: {
          id: post.user_id,
          first_name: post.first_name,
          last_name: post.last_name,
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

      // Save a clean URL path instead of a filesystem path
      const imageUrl = req.file ? `/uploads/social/${req.file.filename}` : null;

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

    if (post.user_id !== userId && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    // Delete the post record (ON DELETE CASCADE in DB should handle comments, likes, etc.)
    await pool.execute('DELETE FROM social_activities WHERE id = ?', [id]);

    // If there was an image, delete it from the filesystem
    if (post.image_url) {
      const imagePath = path.join(__dirname, 'public', post.image_url.replace(/^\//, ''));
      fs.unlink(imagePath, (err) => {
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
      SELECT c.*, u.first_name, u.last_name, u.profile_image, u.account_type
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
        profile_image: getFullImageUrl(req, newComment.profile_image),
        account_type: newComment.account_type
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
    // Check if post exists
    const [[post]] = await pool.execute('SELECT id FROM social_activities WHERE id = ? AND activity_type = "post"', [targetId]);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    
    // Check if already liked
    const [[existing]] = await pool.execute(
      'SELECT id FROM social_activities WHERE user_id = ? AND activity_type = "like" AND target_id = ?',
      [userId, targetId]
    );
    
    if (existing) {
      return res.status(200).json({ message: 'Post already liked.' });
    }
    
    // Add like
    await pool.execute(
      'INSERT INTO social_activities (user_id, activity_type, target_id) VALUES (?, "like", ?)',
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
    const [result] = await pool.execute(
      'DELETE FROM social_activities WHERE user_id = ? AND activity_type = "like" AND target_id = ?',
      [userId, targetId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Like not found.' });
    }
    
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
    // Check if post exists
    const [[post]] = await pool.execute('SELECT id FROM social_activities WHERE id = ? AND activity_type = "post"', [targetId]);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    
    // Check if already bookmarked
    const [[existing]] = await pool.execute(
      'SELECT id FROM social_activities WHERE user_id = ? AND activity_type = "bookmark" AND target_id = ?',
      [userId, targetId]
    );
    
    if (existing) {
      return res.status(200).json({ message: 'Post already bookmarked.' });
    }
    
    // Add bookmark
    await pool.execute(
      'INSERT INTO social_activities (user_id, activity_type, target_id) VALUES (?, "bookmark", ?)',
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
    const [result] = await pool.execute(
      'DELETE FROM social_activities WHERE user_id = ? AND activity_type = "bookmark" AND target_id = ?',
      [userId, targetId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Bookmark not found.' });
    }
    
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
    // Check if post exists
    const [[post]] = await pool.execute('SELECT id FROM social_activities WHERE id = ? AND activity_type = "post"', [postId]);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    
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
  if (parseInt(req.params.userId, 10) !== userId && req.user.account_type !== 'admin') {
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
        c.title AS courseTitle,
        c.instructor_name AS instructorName,
        c.duration_weeks AS durationWeeks,
        c.thumbnail_url AS thumbnailUrl
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ?
      ORDER BY e.enrollment_date DESC
    `, [userId]);

    // Format thumbnail URLs
    const formattedEnrollments = enrollments.map(enrollment => ({
      ...enrollment,
      thumbnailUrl: getFullImageUrl(req, enrollment.thumbnailUrl)
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

  if (parseInt(req.params.userId, 10) !== userId && req.user.account_type !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: You can only access your own internship submissions.' });
  }

  try {
    const [applications] = await pool.execute(
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
    console.error('Error fetching user internship applications for dashboard:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// =============== PROFESSIONAL DASHBOARD ENDPOINTS ====================
// Fetches all available services
app.get('/api/services', async (req, res) => {
  try {
    const [services] = await pool.execute(
      `SELECT
          s.id,
          s.name,
          s.category_id,
          sc.name AS categoryName,
          s.description,
          s.price,
          s.duration,
          s.rating,
          s.reviews,
          s.features,
          s.popular
       FROM services s
       JOIN service_categories sc ON s.category_id = sc.id
       WHERE sc.is_active = 1
       ORDER BY s.popular DESC, s.name ASC`
    );

    // Parse JSON fields from database strings to JavaScript arrays/objects
    const parsedServices = services.map(service => ({
      ...service,
      features: service.features ? JSON.parse(service.features) : []
    }));

    res.json(parsedServices);
  } catch (error) {
    console.error('Error fetching available services:', error);
    res.status(500).json({ message: 'Failed to fetch available services.', error: error.message });
  }
});

// FIXED: Fetch a user's submitted service requests
app.get('/api/users/:userId/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (parseInt(req.params.userId, 10) !== userId && req.user.account_type !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
  }

  try {
    const [requests] = await pool.execute(
      `SELECT
          sr.id,
          sr.user_id AS userId,
          sr.subcategory_id AS categoryId,
          ssc.name AS categoryName,
          ssc.category_id AS parentCategoryId,
          sc.name AS parentCategoryName,
          sr.full_name AS fullName,
          sr.email,
          sr.phone,
          sr.company,
          sr.website,
          sr.project_details AS projectDetails,
          sr.budget_range AS budgetRange,
          sr.timeline,
          sr.contact_method AS contactMethod,
          sr.additional_requirements AS additionalRequirements,
          sr.status,
          sr.created_at AS requestDate,
          sr.updated_at AS updatedAt
       FROM service_requests sr
       JOIN service_subcategories ssc ON sr.subcategory_id = ssc.id
       JOIN service_categories sc ON ssc.category_id = sc.id
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

// FIXED: Submit a new service request
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

  // Validate required fields
  if (!categoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
    return res.status(400).json({ message: 'Missing required fields for service request.' });
  }

  try {
    // Verify the subcategory exists
    const [[subcategory]] = await pool.execute(
      'SELECT id FROM service_subcategories WHERE id = ?',
      [categoryId]
    );

    if (!subcategory) {
      return res.status(404).json({ message: 'Invalid service category.' });
    }

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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        categoryId,
        fullName,
        email,
        phone,
        company || null,
        website || null,
        projectDetails,
        budgetRange,
        timeline,
        contactMethod,
        additionalRequirements || null
      ]
    );

    res.status(201).json({ message: 'Service request submitted successfully!', id: result.insertId });
  } catch (error) {
    console.error('Error submitting service request:', error);
    res.status(500).json({ message: 'Failed to submit service request.', error: error.message });
  }
});

// ==================== CALENDAR EVENTS ROUTES ====================
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

    // Get custom calendar events
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
      // Custom events table doesn't exist or other error
      console.error('Error fetching custom events:', error);
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
      status: event.status,
      color: event.status === 'completed' ? 'green' :
        event.status === 'overdue' ? 'red' :
          event.event_type === 'custom' ? 'purple' : 'orange'
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
      // Custom events table doesn't exist or other error
      console.error('Error fetching custom upcoming events:', error);
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

    // Check if custom_calendar_events table exists, create it if not
    try {
      await pool.execute(`
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
      `);
    } catch (error) {
      console.error('Error creating custom_calendar_events table:', error);
      return res.status(500).json({ error: 'Failed to set up calendar event storage' });
    }

    const [result] = await pool.execute(`
      INSERT INTO custom_calendar_events (user_id, title, description, event_date, event_time, event_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, title, description || null, date, time || null, type]);

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
    const [checkResult] = await pool.execute(
      'SELECT id FROM custom_calendar_events WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (checkResult.length === 0) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    // Validate date format if provided
    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
    }

    await pool.execute(`
      UPDATE custom_calendar_events 
      SET title = ?, description = ?, event_date = ?, event_time = ?, event_type = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [title, description || null, date, time || null, type || 'custom', id, userId]);

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

    const [result] = await pool.execute(
      'DELETE FROM custom_calendar_events WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    res.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

// --- Contact Messages Management ---
app.get('/api/admin/contact-messages', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '' } = req.query;
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
      status: (new Date(msg.created_at).getTime() > (Date.now() - 7 * 24 * 60 * 60 * 1000)) ? 'pending' : 'resolved'
    }));
    res.json({ messages: formattedMessages, total: totalResult[0].total });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ message: 'Failed to fetch contact messages', details: error.message });
  }
});

app.get('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, first_name, last_name, email, phone, company, message, DATE_FORMAT(created_at, \'%d %b %Y\') as created_at FROM contact_messages WHERE id = ?', 
      [req.params.id]
    );
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
app.get('/api/admin/service-categories', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '' } = req.query;
  let query = `SELECT id, name, description, icon, is_active, DATE_FORMAT(created_at, '%d %b %Y') as created_at FROM service_categories`;
  let countQuery = `SELECT COUNT(*) as total FROM service_categories`;
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
    const [categories] = await pool.execute('SELECT id, name FROM service_categories WHERE is_active = 1 ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching service category lookup:', error);
    res.status(500).json({ message: 'Failed to fetch service category lookup', details: error.message });
  }
});

app.get('/api/admin/service-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, description, icon, is_active, DATE_FORMAT(created_at, \'%d %b %Y\') as created_at FROM service_categories WHERE id = ?', 
      [req.params.id]
    );
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
    const [result] = await pool.execute(
      'INSERT INTO service_categories (name, description, icon, is_active) VALUES (?, ?, ?, ?)', 
      [name, description, icon, is_active]
    );
    res.status(201).json({ id: result.insertId, message: 'Service category created successfully' });
  } catch (error) {
    console.error('Error creating service category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Category with this name already exists' });
    }
    res.status(500).json({ message: 'Failed to create service category', details: error.message });
  }
});

app.put('/api/admin/service-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, icon, is_active } = req.body;
  const categoryId = req.params.id;
  try {
    const [result] = await pool.execute(
      'UPDATE service_categories SET name=?, description=?, icon=?, is_active=? WHERE id = ?', 
      [name, description, icon, is_active, categoryId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Service category not found' });
    res.json({ message: 'Service category updated successfully' });
  } catch (error) {
    console.error('Error updating service category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Category with this name already exists' });
    }
    res.status(500).json({ message: 'Failed to update service category', details: error.message });
  }
});

app.delete('/api/admin/service-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM service_categories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Service category not found' });
    res.json({ message: 'Service category deleted successfully' });
  } catch (error) {
    console.error('Error deleting service category:', error);
    res.status(500).json({ message: 'Failed to delete service category', details: error.message });
  }
});

// --- Service Subcategories Management ---
app.get('/api/admin/service-sub-categories', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '', category_id } = req.query;
  let query = `
    SELECT ssc.id, ssc.name, ssc.description, ssc.base_price, ssc.is_active, DATE_FORMAT(ssc.created_at, '%d %b %Y') as created_at,
           sc.name as category_name
    FROM service_subcategories ssc
    JOIN service_categories sc ON ssc.category_id = sc.id
  `;
  let countQuery = `SELECT COUNT(*) as total FROM service_subcategories ssc JOIN service_categories sc ON ssc.category_id = sc.id`;
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
    const [subcategories] = await pool.execute('SELECT id, name, category_id FROM service_subcategories WHERE is_active = 1 ORDER BY name');
    res.json(subcategories);
  } catch (error) {
    console.error('Error fetching service subcategory lookup:', error);
    res.status(500).json({ message: 'Failed to fetch service subcategory lookup', details: error.message });
  }
});

app.get('/api/admin/service-sub-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, category_id, name, description, base_price, is_active, DATE_FORMAT(created_at, \'%d %b %Y\') as created_at FROM service_subcategories WHERE id = ?', 
      [req.params.id]
    );
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
    const [result] = await pool.execute(
      'INSERT INTO service_subcategories (category_id, name, description, base_price, is_active) VALUES (?, ?, ?, ?, ?)',
      [category_id, name, description, base_price, is_active]
    );
    res.status(201).json({ id: result.insertId, message: 'Service subcategory created successfully' });
  } catch (error) {
    console.error('Error creating service subcategory:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Subcategory with this name already exists in this category' });
    }
    res.status(500).json({ message: 'Failed to create service subcategory', details: error.message });
  }
});

app.put('/api/admin/service-sub-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { category_id, name, description, base_price, is_active } = req.body;
  const subcategoryId = req.params.id;
  try {
    const [result] = await pool.execute(
      'UPDATE service_subcategories SET category_id=?, name=?, description=?, base_price=?, is_active=? WHERE id = ?',
      [category_id, name, description, base_price, is_active, subcategoryId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Service subcategory not found' });
    res.json({ message: 'Service subcategory updated successfully' });
  } catch (error) {
    console.error('Error updating service subcategory:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Subcategory with this name already exists in this category' });
    }
    res.status(500).json({ message: 'Failed to update service subcategory', details: error.message });
  }
});

app.delete('/api/admin/service-sub-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM service_subcategories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Service subcategory not found' });
    res.json({ message: 'Service subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting service subcategory:', error);
    res.status(500).json({ message: 'Failed to delete service subcategory', details: error.message });
  }
});

// --- Services (Offerings) Management ---
app.get('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '', category_id } = req.query;
  let query = `
    SELECT s.id, s.name, s.category_id, s.description, s.price, s.duration, s.rating, s.reviews, s.features, s.popular, DATE_FORMAT(s.created_at, '%d %b %Y') as created_at,
           sc.name as category_name
    FROM services s
    JOIN service_categories sc ON s.category_id = sc.id
  `;
  let countQuery = `SELECT COUNT(*) as total FROM services s JOIN service_categories sc ON s.category_id = sc.id`;
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
      FROM services s
      JOIN service_categories sc ON s.category_id = sc.id
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
      'INSERT INTO services (name, category_id, description, price, duration, features, popular) VALUES (?, ?, ?, ?, ?, ?, ?)',
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
      'UPDATE services SET name=?, category_id=?, description=?, price=?, duration=?, features=?, popular=? WHERE id = ?',
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
    const [result] = await pool.execute('DELETE FROM services WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Service offering not found' });
    res.json({ message: 'Service offering deleted successfully' });
  } catch (error) {
    console.error('Error deleting service offering:', error);
    res.status(500).json({ message: 'Failed to delete service offering', details: error.message });
  }
});

// --- Service Requests Management ---
app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  const { limit = 10, offset = 0, search = '', status = 'all' } = req.query;
  let query = `
    SELECT sr.id, sr.user_id, sr.subcategory_id, sr.full_name as name, sr.email, sr.phone, sr.company, sr.website, sr.project_details, sr.budget_range, sr.timeline, sr.contact_method, sr.additional_requirements, DATE_FORMAT(sr.created_at, '%d %b %Y') as date, sr.status,
           ssc.name as service_name
    FROM service_requests sr
    JOIN service_subcategories ssc ON sr.subcategory_id = ssc.id
  `;
  let countQuery = `SELECT COUNT(*) as total FROM service_requests sr JOIN service_subcategories ssc ON sr.subcategory_id = ssc.id`;
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
      FROM service_requests sr
      JOIN service_subcategories ssc ON sr.subcategory_id = ssc.id
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
  const { user_id, subcategory_id, full_name, email, phone, company, website, project_details, budget_range, timeline, contact_method, additional_requirements, status = 'pending' } = req.body;
  if (!user_id || !subcategory_id || !full_name || !email || !phone || !project_details || !budget_range || !timeline || !contact_method) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO service_requests (user_id, subcategory_id, full_name, email, phone, company, website, project_details, budget_range, timeline, contact_method, additional_requirements, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, subcategory_id, full_name, email, phone, company, website, project_details, budget_range, timeline, contact_method, additional_requirements, status]
    );
    res.status(201).json({ id: result.insertId, message: 'Service request created successfully' });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ message: 'Failed to create service request', details: error.message });
  }
});

app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { user_id, subcategory_id, full_name, email, phone, company, website, project_details, budget_range, timeline, contact_method, additional_requirements, status } = req.body;
  const requestId = req.params.id;
  try {
    const [result] = await pool.execute(
      'UPDATE service_requests SET user_id=?, subcategory_id=?, full_name=?, email=?, phone=?, company=?, website=?, project_details=?, budget_range=?, timeline=?, contact_method=?, additional_requirements=?, status=? WHERE id = ?',
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
    const [result] = await pool.execute('DELETE FROM service_requests WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Service request not found' });
    res.json({ message: 'Service request deleted successfully' });
  } catch (error) {
    console.error('Error deleting service request:', error);
    res.status(500).json({ message: 'Failed to delete service request', details: error.message });
  }
});

// --- Internships Management ---
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
    const [rows] = await pool.execute(
      'SELECT id, title, company, location, duration, type, level, description, requirements, benefits, DATE_FORMAT(posted_at, \'%Y-%m-%d\') as posted_at, applications_count, spots_available FROM internships WHERE id = ?', 
      [req.params.id]
    );
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