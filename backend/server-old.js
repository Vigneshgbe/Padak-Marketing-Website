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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'avatar') {
      // Check if file is an image
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for avatar'));
      }
    } else {
      cb(null, true);
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
  origin: ['http://localhost:8080', 'http://your-frontend-domain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

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

// Upload avatar
app.post('/api/auth/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const profileImage = `/uploads/${req.file.filename}`;

    // Delete old avatar if exists
    if (req.user.profile_image) {
      const oldPath = path.join(__dirname, req.user.profile_image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await pool.execute(
      'UPDATE users SET profile_image = ?, updated_at = NOW() WHERE id = ?',
      [profileImage, userId]
    );

    res.json({ profileImage });

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

// ==================== COURSES ROUTES ====================

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const [courses] = await pool.execute(
      'SELECT * FROM courses WHERE is_active = true ORDER BY created_at DESC'
    );

    res.json(courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      instructorName: course.instructor_name,
      durationWeeks: course.duration_weeks,
      difficultyLevel: course.difficulty_level,
      category: course.category,
      price: course.price,
      thumbnail: course.thumbnail,
      isActive: course.is_active
    })));

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error' });
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
  
  // Get user's assignments
  app.get('/api/assignments/my-assignments', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
  
      const [assignments] = await pool.execute(
        `SELECT a.*, c.title as course_title, s.* FROM assignments a
         JOIN courses c ON a.course_id = c.id
         JOIN enrollments e ON e.course_id = c.id AND e.user_id = ?
         LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.user_id = ?
         ORDER BY a.due_date ASC`,
        [userId, userId]
      );
  
      res.json(assignments.map(assignment => ({
        id: assignment.id,
        courseId: assignment.course_id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        maxPoints: assignment.max_points,
        course: {
          title: assignment.course_title
        },
        submission: assignment.assignment_id ? {
          id: assignment.assignment_id,
          assignmentId: assignment.assignment_id,
          userId: assignment.user_id,
          content: assignment.content,
          filePath: assignment.file_path,
          submittedAt: assignment.submitted_at,
          grade: assignment.grade,
          feedback: assignment.feedback,
          status: assignment.status
        } : null
      })));
  
    } catch (error) {
      console.error('Get assignments error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Submit assignment
  app.post('/api/assignments/submit', authenticateToken, upload.single('file'), async (req, res) => {
    try {
      const { assignmentId, content } = req.body;
      const userId = req.user.id;
      const filePath = req.file ? `/uploads/${req.file.filename}` : null;
  
      // Check if assignment exists and user is enrolled
      const [assignments] = await pool.execute(
        `SELECT a.* FROM assignments a
         JOIN enrollments e ON e.course_id = a.course_id AND e.user_id = ?
         WHERE a.id = ?`,
        [userId, assignmentId]
      );
  
      if (assignments.length === 0) {
        return res.status(404).json({ error: 'Assignment not found or not enrolled' });
      }
  
      // Check if already submitted
      const [existing] = await pool.execute(
        'SELECT * FROM assignment_submissions WHERE assignment_id = ? AND user_id = ?',
        [assignmentId, userId]
      );
  
      if (existing.length > 0) {
        // Update existing submission
        await pool.execute(
          'UPDATE assignment_submissions SET content = ?, file_path = ?, submitted_at = NOW() WHERE assignment_id = ? AND user_id = ?',
          [content, filePath, assignmentId, userId]
        );
      } else {
        // Create new submission
        await pool.execute(
          'INSERT INTO assignment_submissions (assignment_id, user_id, content, file_path, submitted_at) VALUES (?, ?, ?, ?, NOW())',
          [assignmentId, userId, content, filePath]
        );
      }
  
      res.status(201).json({ message: 'Assignment submitted successfully' });
  
    } catch (error) {
      console.error('Assignment submission error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // ==================== CERTIFICATES ROUTES ====================
  
  // Add these routes to your server.js file

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
  
  // ==================== ADMIN ROUTES ====================
  
  // Get admin dashboard stats
  app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
      // Get total users
      const [userCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM users WHERE is_active = true'
      );
  
      // Get total courses
      const [courseCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM courses WHERE is_active = true'
      );
  
      // Get total enrollments
      const [enrollmentCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM enrollments'
      );
  
      // Get pending service requests
      const [pendingRequests] = await pool.execute(
        'SELECT COUNT(*) as total FROM service_requests WHERE status = "pending"'
      );
  
      // Get total revenue (mock calculation)
      const [revenue] = await pool.execute(
        'SELECT SUM(c.price) as total FROM enrollments e JOIN courses c ON e.course_id = c.id'
      );
  
      res.json({
        totalUsers: userCount[0].total,
        totalCourses: courseCount[0].total,
        totalEnrollments: enrollmentCount[0].total,
        totalRevenue: `₹${(revenue[0].total || 0).toLocaleString()}`,
        activeInternships: 12, // Mock data
        pendingContacts: pendingRequests[0].total
      });
  
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Get all users (admin only)
  app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
  
      const [users] = await pool.execute(
        `SELECT id, first_name, last_name, email, phone, account_type, is_active, created_at
         FROM users 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
  
      const [totalCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM users'
      );
  
      res.json({
        users: users.map(user => ({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          accountType: user.account_type,
          isActive: user.is_active,
          createdAt: user.created_at
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount[0].total / limit),
          totalUsers: totalCount[0].total
        }
      });
  
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
// Continue from where we stopped in admin service requests

// Get all service requests (admin only)
app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const [requests] = await pool.execute(
        `SELECT sr.*, u.first_name, u.last_name, sc.name as category_name, ss.name as subcategory_name 
         FROM service_requests sr
         JOIN users u ON sr.user_id = u.id
         JOIN service_subcategories ss ON sr.subcategory_id = ss.id
         JOIN service_categories sc ON ss.category_id = sc.id
         ORDER BY sr.created_at DESC`
      );
  
      res.json(requests.map(request => ({
        id: request.id,
        userId: request.user_id,
        userName: `${request.first_name} ${request.last_name}`,
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
      console.error('Get admin service requests error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Update service request status (admin only)
  app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      if (!['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
  
      await pool.execute(
        'UPDATE service_requests SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );
  
      res.json({ message: 'Service request status updated successfully' });
  
    } catch (error) {
      console.error('Update service request error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Create new course (admin only)
  app.post('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const {
        title, description, instructorName, durationWeeks,
        difficultyLevel, category, price
      } = req.body;
  
      if (!title || !description || !instructorName || !durationWeeks || !difficultyLevel || !category || !price) {
        return res.status(400).json({ error: 'All fields are required' });
      }
  
      const [result] = await pool.execute(
        `INSERT INTO courses 
         (title, description, instructor_name, duration_weeks, difficulty_level, category, price, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [title, description, instructorName, durationWeeks, difficultyLevel, category, price]
      );
  
      res.status(201).json({
        message: 'Course created successfully',
        courseId: result.insertId
      });
  
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Update course (admin only)
  app.put('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title, description, instructorName, durationWeeks,
        difficultyLevel, category, price, isActive
      } = req.body;
  
      await pool.execute(
        `UPDATE courses SET 
         title = ?, description = ?, instructor_name = ?, duration_weeks = ?,
         difficulty_level = ?, category = ?, price = ?, is_active = ?, updated_at = NOW()
         WHERE id = ?`,
        [title, description, instructorName, durationWeeks, difficultyLevel, category, price, isActive, id]
      );
  
      res.json({ message: 'Course updated successfully' });
  
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Delete course (admin only)
  app.delete('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
  
      // Soft delete by setting is_active to false
      await pool.execute(
        'UPDATE courses SET is_active = false, updated_at = NOW() WHERE id = ?',
        [id]
      );
  
      res.json({ message: 'Course deleted successfully' });
  
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Get recent enrollments (admin only)
  app.get('/api/admin/recent-enrollments', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const [enrollments] = await pool.execute(
        `SELECT e.*, u.first_name, u.last_name, c.title as course_title
         FROM enrollments e
         JOIN users u ON e.user_id = u.id
         JOIN courses c ON e.course_id = c.id
         ORDER BY e.enrollment_date DESC
         LIMIT 10`
      );
  
      res.json(enrollments.map(enrollment => ({
        id: enrollment.id,
        userName: `${enrollment.first_name} ${enrollment.last_name}`,
        courseName: enrollment.course_title,
        date: enrollment.enrollment_date,
        status: enrollment.status
      })));
  
    } catch (error) {
      console.error('Get recent enrollments error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Get recent users (admin only)
  app.get('/api/admin/recent-users', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const [users] = await pool.execute(
        `SELECT id, first_name, last_name, email, account_type, created_at
         FROM users 
         WHERE is_active = true
         ORDER BY created_at DESC
         LIMIT 10`
      );
  
      res.json(users.map(user => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        type: user.account_type,
        joinDate: user.created_at.toISOString().split('T')[0]
      })));
  
    } catch (error) {
      console.error('Get recent users error:', error);
      res.status(500).json({ error: 'Server error' });
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
        