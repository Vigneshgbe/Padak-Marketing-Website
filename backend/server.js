require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // You'll need to install this: npm install jsonwebtoken

const app = express();
const port = process.env.PORT || 5000;

// JWT Secret (add this to your .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Database connection with better error handling
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
});

// Handle database disconnection
db.on('error', function(err) {
  console.error('Database error:', err);
  if(err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Attempting to reconnect...');
  }
});

// Middleware with better CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  next();
});

// Registration endpoint (improved with better validation)
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
    const emailCheckQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(emailCheckQuery, [email], async (err, results) => {
      if (err) {
        console.error('Database error in registration:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      try {
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const insertQuery = `
          INSERT INTO users 
          (first_name, last_name, email, phone, password, account_type, created_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        db.query(insertQuery, 
          [firstName.trim(), lastName.trim(), email.trim(), phone || null, hashedPassword, accountType || 'user'],
          (err, result) => {
            if (err) {
              console.error('Database error in user insertion:', err);
              return res.status(500).json({ error: 'Registration failed' });
            }
            
            console.log('User registered successfully:', { userId: result.insertId, email });
            res.status(201).json({
              message: 'User registered successfully',
              userId: result.insertId
            });
          }
        );
      } catch (hashError) {
        console.error('Password hashing error:', hashError);
        return res.status(500).json({ error: 'Password processing failed' });
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint (improved)
app.post('/api/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const userQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(userQuery, [email], async (err, results) => {
      if (err) {
        console.error('Database error in login:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'No account found with this email' });
      }

      const user = results[0];

      try {
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
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

        // Update last login timestamp (optional)
        const updateLastLoginQuery = 'UPDATE users SET last_login = NOW() WHERE id = ?';
        db.query(updateLastLoginQuery, [user.id], (err) => {
          if (err) console.error('Error updating last login:', err);
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
            accountType: user.account_type
          }
        });

      } catch (bcryptError) {
        console.error('Password verification error:', bcryptError);
        return res.status(500).json({ error: 'Authentication error' });
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Contact form endpoint (improved with better validation)
app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, phone, company, message } = req.body;

  try {
    console.log('Contact form submission received:', { firstName, lastName, email, phone, company, message });

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ 
        error: 'First name, last name, email, and message are required' 
      });
    }

    // Trim whitespace from inputs
    const trimmedData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : null,
      company: company ? company.trim() : null,
      message: message.trim()
    };

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedData.email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Basic phone validation (if provided)
    if (trimmedData.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(trimmedData.phone.replace(/[\s\-\(\)]/g, ''))) {
        return res.status(400).json({ error: 'Please provide a valid phone number' });
      }
    }

    // Validate message length
    if (trimmedData.message.length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters long' });
    }

    // Insert contact form data into database
    const insertQuery = `
      INSERT INTO contact_messages 
      (first_name, last_name, email, phone, company, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    db.query(insertQuery, 
      [
        trimmedData.firstName,
        trimmedData.lastName,
        trimmedData.email,
        trimmedData.phone,
        trimmedData.company,
        trimmedData.message
      ],
      (err, result) => {
        if (err) {
          console.error('Database error in contact form:', err);
          return res.status(500).json({ error: 'Failed to save contact message' });
        }
        
        console.log('Contact message saved successfully:', {
          id: result.insertId,
          firstName: trimmedData.firstName,
          lastName: trimmedData.lastName,
          email: trimmedData.email
        });

        res.status(201).json({
          message: 'Contact message sent successfully',
          contactId: result.insertId
        });
      }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Middleware to verify JWT token (for protected routes)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Protected route example (optional)
app.get('/api/profile', authenticateToken, (req, res) => {
  const userQuery = 'SELECT id, first_name, last_name, email, phone, account_type FROM users WHERE id = ?';
  db.query(userQuery, [req.user.userId], (err, results) => {
    if (err) {
      console.error('Database error in profile:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = results[0];
    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      accountType: user.account_type
    });
  });
});

// Protected route to get contact messages (optional - for admin dashboard)
app.get('/api/contact-messages', authenticateToken, (req, res) => {
  // Only allow admin users to view contact messages
  if (req.user.accountType !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Get total count
  const countQuery = 'SELECT COUNT(*) as total FROM contact_messages';
  db.query(countQuery, (err, countResults) => {
    if (err) {
      console.error('Database error in contact messages count:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const totalMessages = countResults[0].total;

    // Get paginated messages
    const messagesQuery = `
      SELECT id, first_name, last_name, email, phone, company, message, created_at
      FROM contact_messages 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    db.query(messagesQuery, [limit, offset], (err, results) => {
      if (err) {
        console.error('Database error in contact messages:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        messages: results,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalMessages / limit),
          totalMessages: totalMessages,
          hasNextPage: page < Math.ceil(totalMessages / limit),
          hasPreviousPage: page > 1
        }
      });
    });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at: http://localhost:${port}/api/health`);
});