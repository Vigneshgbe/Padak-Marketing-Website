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

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Registration endpoint (your existing code)
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, phone, password, accountType } = req.body;

  try {
    // Check if email exists
    const emailCheckQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(emailCheckQuery, [email], async (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      
      if (results.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const insertQuery = `
        INSERT INTO users 
        (first_name, last_name, email, phone, password, account_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.query(insertQuery, 
        [firstName, lastName, email, phone, hashedPassword, accountType],
        (err, result) => {
          if (err) return res.status(500).json({ error: 'Registration failed' });
          
          res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertId
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint (NEW)
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
        console.error('Database error:', err);
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
    if (err) return res.status(500).json({ error: 'Database error' });
    
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});