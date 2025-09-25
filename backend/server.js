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

// Firebase Admin SDK Initialization
const admin = require('firebase-admin');

const serviceAccount = {
  "type": "service_account",
  "project_id": "startup-dbs-1",
  "private_key_id": "379e14e75ef08331690e76197c989e62252e8f9f",
  "private_key": `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC8QMKq9c3jxxHw\nIRXDKF07ndJr0ju76IT5Iz2v6IXuBqxAMHej8mGm4mx5c/iA9J5tJ/p5DQylCL3s\nhnOyow6UVvaF2a6qcVic+nx4FeWFmXjn1kjmPZ8ARcQLco1UDGt2dx279AYDFb63\nsqqdDTnw5kGPfLK0HNz8OoWntRjuNPefRZ/XwnFSGg41dPFtUQKQ0Wkg6z6TWHmK\nY9o4TcRBvNA3ujLoE3988x6DCQaidX5O4LC3CqsU03YCJaZ//47gcVp3laj8v5LX\nqoXp0Oa+UOVq+3xudbzHHGC1ixoqSpXfcGo/n0MPudK0ezkpBgYNS/N5+De1kwUP\n+/3q2g1RAgMBAAECggEAAbVHNLnCNluIvFSM4pdkk/YwxcjsVHeAsCm4WSlG2dKz\nhoirBME3L+N6F35j0GEQkBa3+O1shVOeLS9IhZ4jab4orx1puh0gamQaDw1toNrP\ncUsz/VBICRnTIw8mnq4c5YH+XSaDNi4LjtQGYq4He4OXs6JuhXWFhoXheeJPw6TQ\nSH22RlYnjSRhsWpVojHVrSgyF4+Jqvv+eN3gOX3HHjv0XoTVSmFjQDj0bncv8Xa6\n39tP0NdMjkjo6DaaFDVifu9/wP+D0iKi+q0L/U3XQKxHMOhq4tOb9XNheY02z3RI\nU69Rr3Xnqu8myldbDMKpNbqxXQWAT73bW3S+VYnOLwKBgQDkxjsBXcn6GBMdGV1c\njl9F6i3M+GSJR5tApjoEPBerahL0eszxF5DLZVm2z5+2em4Zc6HV4aAmnTTVc2nJ\nwvMCRVL4R2gCs8t5XlmGHNSsVqzxIb1xILzQkgA+Flgr5oA9BpDorunm+Ea7EBYM\n/YewTi6Q+bTLuXVSH7CQzKBZBwKBgQDSqASsWV4UlCfB2SMIt1T9tNDmwo7oIamj\n1WwPxo3GY6GCpD4BqYZ+00aY4LhAhyeK7om9kLoxLkd1cpc1dVO1r4EuVU7HSnWC\nEA9ZDREEmVMJ8k42KFlLCT3P1m5O85DU/WwzK99ywXw5tRHfBu1inhsOLhG7OTiG\nFxgwULKI5wKBgQCkN1L1mSA5gHx/38wvexcSdZWo0wg/roHX9zof/g6zgbHXgiqI\nSPUruzWZzxGDCADuDh22DH5MGX5qVa0zIdgT4jU7eO5FOlAtb7dtWFak2pbLg/+b\nK/e884BvENT7tjqJE6SDEcNegwsqjdJ2QqrauFQexs+riRWY/JxeZDQZkwKBgQC6\ndYAVcdEFlBIQ0nrhJy1yl87kwsetjsZSPwG0gQJS3TNDqM89t2lV7vqpLRfJ/hex\nMOz4vxcfmyAjRDe1WNGsmtlUQqxFWJHkewSqxRcQJArNXg1+gH5xHY/53IqtFYhY\nDqzsKmRRdhPYHH7iE4ahaOL3zS1itAZlIiIF+hfddwKBgGpAx336Vg4zana4957d\n/iw9YrVkcZrH9h9naIYPPVndvIi8TDpMQAHrzQFFNdEM2vBgTLNGr008eXVFsjvd\nSU8fDl0jaxvQcfRcq1q4yRiwSmxt0WGzsK32F1UFknZOXEc47dcVoqWHNrtvSZOp\nRTQmoD23+iHGv75ueRYOlRQK\n-----END PRIVATE KEY-----\n`,
  "client_email": "firebase-adminsdk-fbsvc@startup-dbs-1.iam.gserviceaccount.com",
  "client_id": "110678261411363611678",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40startup-dbs-1.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

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
    destination: function(req, file, cb) {
        cb(null, avatarsDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for avatars'));
        }
    }
});

// ===== ASSIGNMENT MULTER CONFIGURATION =====
const assignmentStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads', 'assignments');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `assignment-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const assignmentUpload = multer({
    storage: assignmentStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function(req, file, cb) {
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
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads', 'payments');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `payment-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const paymentScreenshotUpload = multer({
    storage: paymentScreenshotStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
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

        const userDoc = await db.collection('users').doc(decoded.userId).get();

        if (!userDoc.exists || !userDoc.data().is_active) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = {id: userDoc.id, ...userDoc.data()};
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
        const existingUsersSnapshot = await db.collection('users').where('email', '==', email).get();

        if (!existingUsersSnapshot.empty) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const newUser = {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim(),
            phone: phone || null,
            password_hash: hashedPassword,
            account_type: accountType || 'student',
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            is_active: true,
            email_verified: false
        };

        const userRef = await db.collection('users').add(newUser);
        const userId = userRef.id;

        // Create user stats entry
        await db.collection('user_stats').doc(userId).set({user_id: userId,courses_enrolled:0,
            courses_completed:0,
            certificates_earned:0,
            learning_streak:0,
            last_activity: new Date().toISOString()});

        console.log('User registered successfully:', { userId: userId, email });
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
        const usersSnapshot = await db.collection('users').where('email', '==', email).where('is_active', '==', true).get();

        if (usersSnapshot.empty) {
            return res.status(404).json({ error: 'No account found with this email' });
        }

        let userDoc;
        usersSnapshot.forEach(doc => {
            userDoc = {id: doc.id, ...doc.data()};
        });

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, userDoc.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const tokenExpiry = rememberMe ? '30d' : '1d';
        const token = jwt.sign(
            {
                userId: userDoc.id,
                email: userDoc.email,
                accountType: userDoc.account_type
            },
            JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        // Update last login timestamp
        await db.collection('users').doc(userDoc.id).update({ updated_at: admin.firestore.FieldValue.serverTimestamp() });

        console.log('User logged in successfully:', { userId: userDoc.id, email: userDoc.email });

        // Send success response
        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: {
                id: userDoc.id,
                firstName: userDoc.first_name,
                lastName: userDoc.last_name,
                email: userDoc.email,
                phone: userDoc.phone,
                accountType: userDoc.account_type,
                profileImage: userDoc.profile_image,
                company: userDoc.company,
                website: userDoc.website,
                bio: userDoc.bio,
                isActive: userDoc.is_active,
                emailVerified: userDoc.email_verified,
                createdAt: userDoc.created_at,
                updatedAt: userDoc.updated_at
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

        const updateData = {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            company: company,
            website: website,
            bio: bio,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(userId).update(updateData);

        // Get updated user data
        const userDoc = await db.collection('users').doc(userId).get();
        const user = {id:userDoc.id,...userDoc.data()};

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

        await db.collection('users').doc(userId).update({ profile_image: profileImage, updated_at: admin.firestore.FieldValue.serverTimestamp() });

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

        const statsDoc = await db.collection('user_stats').doc(userId).get();

        if (!statsDoc.exists) {
            // Create default stats if not exists
            await db.collection('user_stats').doc(userId).set({
                user_id:userId,
                courses_enrolled: 0,
                courses_completed: 0,
                certificates_earned: 0,
                learning_streak: 0,
                last_activity: new Date().toISOString()
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
                lastActivity: userStats.last_activity || new Date().toISOString()
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
        // Step 1: Get total count
        let totalPosts = 0;

        const postsRef = db.collection('social_activities');
        let query = postsRef.where('activity_type', '==', 'post');

        const postsSnapshot = await query.get();
        totalPosts = postsSnapshot.size;

        const totalPages = Math.ceil(totalPosts / limit);

        // Step 2: Fetch paginated posts
        let posts = [];

        query = postsRef.where('activity_type', '==', 'post').orderBy('created_at', 'desc').offset(offset).limit(limit);
        const paginatedPostsSnapshot = await query.get();

        paginatedPostsSnapshot.forEach(doc => {
            posts.push({ id: doc.id, ...doc.data() });
        });

        if (posts.length === 0) {
            return res.json({ posts: [], pagination: { page, totalPages, totalPosts } });
        }

        // Step 3: Fetch comments for the retrieved posts
        const postIds = posts.map(p => p.id);
        let comments = [];

        for (const postId of postIds) {
            const commentsSnapshot = await db.collection('social_activities')
                .where('activity_type', '==', 'comment')
                .where('target_id', '==', postId)
                .orderBy('created_at', 'asc')
                .get();

            commentsSnapshot.forEach(doc => {
                comments.push({ id: doc.id, ...doc.data() });
            });
        }

        // Step 4: Map comments and format image URLs
        const postsWithData = await Promise.all(posts.map(async post => {

            const authorDoc = await db.collection('users').doc(post.user_id).get();
            const authorData = authorDoc.exists ? {id: authorDoc.id,...authorDoc.data()} : null;

            const postComments = comments
                .filter(comment => comment.target_id === post.id)
                .map(c => ({
                    ...c,
                    user: {
                        id: c.user_id,
                    }
                }));
                // Fetch user data for the comments
                 for (let i = 0; i < postComments.length; i++) {
                    const comment = postComments[i];
                    const userDoc = await db.collection('users').doc(comment.user_id).get();
                     if (userDoc.exists) {
                        const userData = userDoc.data();
                       comment.user = {
                            id: userDoc.id,
                            first_name: userData.first_name,
                            last_name: userData.last_name,
                            profile_image: getFullImageUrl(req, userData.profile_image),
                            account_type: userData.account_type
                         };
                    }
                    // else{
                    //  console.log('user not found')
                    // }
                }

             const likesSnapshot = await db.collection('social_activities')
                    .where('activity_type', '==', 'like')
                    .where('target_id', '==', post.id)
                    .get();

                const likesCount = likesSnapshot.size;

            let has_liked = false
              const likeSnapshot = await db.collection('social_activities')
                .where('activity_type', '==', 'like')
                .where('target_id', '==', post.id)
                .where('user_id', '==', userId)
                .get();
            has_liked = !likeSnapshot.empty
             
            const bookmarksSnapshot = await db.collection('social_activities')
                .where('activity_type', '==', 'bookmark')
                .where('target_id', '==', post.id)
                .get();

                // const bookmarksCount = bookmarksSnapshot.size;

            let has_bookmarked = false;

            const bookmarkSnapshot = await db.collection('social_activities')
                .where('activity_type', '==', 'bookmark')
                .where('target_id', '==', post.id)
                .where('user_id', '==', userId)
                .get();
            has_bookmarked = !bookmarkSnapshot.empty;


            return {
                ...post,
                has_liked: !!has_liked,
                has_bookmarked: !!has_bookmarked,
                // Use the simplified helper for post images
                image_url: getFullImageUrl(req, post.image_url),
                user: authorData ? {
                    id: authorData.id,
                    first_name: authorData.first_name,
                    last_name: authorData.last_name,
                    // Use the simplified helper for post author images
                    profile_image: getFullImageUrl(req, authorData.profile_image),
                    account_type: authorData.account_type,
                } : null,
                comments: postComments,
                likes : likesCount,
                comment_count : postComments.length
            };
        }));

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

            const imageUrl = req.file ? `/uploads/social/${req.file.filename}` : null;
            const isAchievement = achievement === 'true';

            const newPost = {
                user_id: userId,
                activity_type: 'post',
                content: content || '',
                image_url: imageUrl,
                achievement: isAchievement,
                visibility: visibility,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            };

            const postRef = await db.collection('social_activities').add(newPost);
            const postId = postRef.id;

            const postDoc = await db.collection('social_activities').doc(postId).get();
            const postData = {id:postDoc.id, ...postDoc.data()}

            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.exists ? userDoc.data() : null;

            res.status(201).json({
                ...postData,
                has_liked: false,
                has_bookmarked: false,
                likes: 0,
                comment_count: 0,
                image_url: getFullImageUrl(req, postData.image_url),
                user: userData ? {
                    id: userId,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    profile_image: getFullImageUrl(req, userData.profile_image),
                    account_type: userData.account_type,
                } : null,
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
        const postDoc = await db.collection('social_activities').doc(id).get();
        if (!postDoc.exists) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        const postData = postDoc.data();

        if (postData.user_id !== userId) {
            return res.status(403).json({ error: 'You are not authorized to edit this post.' });
        }

        await db.collection('social_activities').doc(id).update({
            content: content,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
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
        const postDoc = await db.collection('social_activities').doc(id).get();
        if (!postDoc.exists) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        const postData = postDoc.data();

        if (postData.user_id !== userId) {
            return res.status(403).json({ error: 'You are not authorized to delete this post.' });
        }

        // Delete the post document
        await db.collection('social_activities').doc(id).delete();

        // Delete comments related to the post
        const commentsSnapshot = await db.collection('social_activities')
            .where('activity_type', '==', 'comment')
            .where('target_id', '==', id)
            .get();

        commentsSnapshot.forEach(doc => {
            db.collection('social_activities').doc(doc.id).delete();
        });

        // Delete likes related to the post
        const likesSnapshot = await db.collection('social_activities')
            .where('activity_type', '==', 'like')
            .where('target_id', '==', id)
            .get();

        likesSnapshot.forEach(doc => {
            db.collection('social_activities').doc(doc.id).delete();
        });

        // If there was an image, delete it from the filesystem (optional)
        if (postData.image_url) {
            fs.unlink(path.join(__dirname, postData.image_url), (err) => {
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
        const newComment = {
            user_id: userId,
            activity_type: 'comment',
            content: content,
            target_id: targetId,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        };

        const commentRef = await db.collection('social_activities').add(newComment);
        const commentId = commentRef.id;

        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        res.status(201).json({
            id: commentId,
            ...newComment,
            user: userData ? {
                id: userId,
                first_name: userData.first_name,
                last_name: userData.last_name,
                profile_image: getFullImageUrl(req, userData.profile_image)
            } : null
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
        const likeDoc = await db.collection('social_activities')
          .where('user_id', '==', userId)
          .where('activity_type', '==', 'like')
          .where('target_id', '==', targetId)
          .get();
      if(likeDoc.empty){
          const like = {
              user_id: userId,
              activity_type: 'like',
              target_id: targetId,
              created_at: admin.firestore.FieldValue.serverTimestamp()
          };
           await db.collection('social_activities').add(like);
           res.status(201).json({ message: 'Post liked.' });
      }else{
           res.status(201).json({ message: 'Post already liked.' });
      }

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
        const likeSnapshot = await db.collection('social_activities')
            .where('user_id', '==', userId)
            .where('activity_type', '==', 'like')
            .where('target_id', '==', targetId)
            .get();

        likeSnapshot.forEach(async doc => {
            await db.collection('social_activities').doc(doc.id).delete();
        });

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
        const bookmarkDoc = await db.collection('social_activities')
          .where('user_id', '==', userId)
          .where('activity_type', '==', 'bookmark')
          .where('target_id', '==', targetId)
          .get();
      if(bookmarkDoc.empty){
          const bookmark = {
              user_id: userId,
              activity_type: 'bookmark',
              target_id: targetId,
              created_at: admin.firestore.FieldValue.serverTimestamp()
          };
           await db.collection('social_activities').add(bookmark);
           res.status(201).json({ message: 'Post bookmarked.' });
      }else{
           res.status(201).json({ message: 'Post already bookmarked.' });
      }

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
        const bookmarkSnapshot = await db.collection('social_activities')
            .where('user_id', '==', userId)
            .where('activity_type', '==', 'bookmark')
            .where('target_id', '==', targetId)
            .get();

        bookmarkSnapshot.forEach(async doc => {
            await db.collection('social_activities').doc(doc.id).delete();
        });

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
        const postRef = db.collection('social_activities').doc(postId);
        await postRef.update({
            share_count: admin.firestore.FieldValue.increment(1)
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
    // unless you have admin roles that can view other users' data.
    if (req.params.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden: You can only access your own enrollment data.' });
    }

    try {
        const enrollmentsRef = db.collection('enrollments');
        const query = enrollmentsRef.where('user_id', '==', userId);
        const snapshot = await query.get();

        const enrollments = [];
        for (const doc of snapshot.docs) {
            const enrollment = { id: doc.id, ...doc.data() };

            // Fetch course details from 'courses' collection
            const courseId = enrollment.course_id;
            const courseDoc = await db.collection('courses').doc(courseId).get();
            if (courseDoc.exists) {
                enrollment.course = {id: courseDoc.id, ...courseDoc.data()};
            } else {
                enrollment.course = null; // Or handle missing course data as needed
            }
            enrollments.push(enrollment);
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

    if (req.params.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden: You can only access your own internship submissions.' });
    }

    try {
        const applicationsRef = db.collection('internship_submissions');
        const query = applicationsRef.where('user_id', '==', userId);
        const snapshot = await query.get();

        const applications = [];
        for (const doc of snapshot.docs) {
            const application = { id: doc.id, ...doc.data() };

            // Fetch internship details from 'internships' collection
            const internshipId = application.internship_id;
            const internshipDoc = await db.collection('internships').doc(internshipId).get();
            if (internshipDoc.exists) {
                application.internship = {id: internshipDoc.id, ...internshipDoc.data()};
            } else {
                application.internship = null; // Or handle missing internship data as needed
            }
            applications.push(application);
        }

        const formattedApplications = applications.map(app => ({
             id: app.id,
             internship_id: app.internship_id,
             applicationStatus: app.status,
             applicationDate: app.submitted_at,
             internshipTitle: app.internship ? app.internship.title : 'Unknown Internship',
             companyName: app.internship? app.internship.company:'Unknown Company'
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
        const services = [];

        // First, get service categories
        const serviceCategoriesSnapshot = await db.collection('service_categories').where('is_active', '==', true).get();
        const serviceCategories = serviceCategoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Then, get services for each category
        for (const category of serviceCategories) {
            const servicesSnapshot = await db.collection('services')
                .where('category_id', '==', category.id)
                .orderBy('popular', 'desc')
                .orderBy('name', 'asc')
                .get();

            servicesSnapshot.docs.forEach(doc => {
                services.push({ id: doc.id, ...doc.data(), categoryName: category.name });
            });
        }
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

// ADJUSTED: GET /api/users/:userId/service-requests - Fetch a user's submitted service requests
app.get('/api/users/:userId/service-requests', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    if (req.params.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
    }

    try {
        const requestsRef = db.collection('service_requests');
        const query = requestsRef.where('user_id', '==', userId).orderBy('created_at', 'desc');
        const snapshot = await query.get();

        const requests = [];
        for (const doc of snapshot.docs) {
            const request = { id: doc.id, ...doc.data() };

            // Fetch service category name from 'service_categories' collection
            const categoryId = request.subcategory_id;
            const categoryDoc = await db.collection('service_categories').doc(categoryId).get();

            request.categoryName = categoryDoc.exists ? categoryDoc.data().name : null;

            requests.push(request);
        }

        const formattedRequests = requests.map(request => ({
            id: request.id,
            userId: request.user_id,
            categoryId: request.subcategory_id, // Maps to categoryId on frontend
            categoryName: request.categoryName,         // Fetched from service_categories.name
            fullName: request.full_name,
            email: request.email,
            phone: request.phone,
            company: request.company,
            website: request.website,
            projectDetails: request.project_details, // Changed from description
            budgetRange: request.budget_range,     // Maps to budgetRange on frontend
            timeline: request.timeline,                        // Maps to timeline on frontend
            contactMethod: request.contact_method,
            additionalRequirements: request.additional_requirements,
            status: request.status,
            requestDate: request.created_at,       // Maps to requestDate on frontend
            updatedAt: request.updated_at          // Optional, for display if needed
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
        const newRequest = {
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
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        };

        const requestRef = await db.collection('service_requests').add(newRequest);
        const requestId = requestRef.id;

        // Return the ID of the newly created request
        res.status(201).json({ message: 'Service request submitted successfully!', id: requestId });
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
        const courseEvents = [];
        const courseSnapshot = await db.collection('enrollments')
            .where('user_id', '==', userId)
            .where('status', '==', 'active').get();

        for (const doc of courseSnapshot.docs) {
            const enrollment = doc.data();
            const courseId = enrollment.course_id;

            const courseDoc = await db.collection('courses').doc(courseId).get();

            if (courseDoc.exists) {
                const course = courseDoc.data();

                courseEvents.push({
                    id: `course-${courseId}`,
                    title: `Course: ${course.title}`,
                    description: course.description || 'Course enrollment',
                    date: course.created_at,
                    type: 'course_start',
                    course: {
                        id: courseId,
                        title: course.title,
                        category: course.category
                    },
                    color: 'blue'
                });
            }
        }

        const assignmentEvents = [];
         const assignmentSnapshot = await db.collection('assignments').get()
        for (const doc of assignmentSnapshot.docs) {
            const assignData  = doc.data();
               const coursesShot = await db.collection('courses').doc(assignData.course_id).get()
             if(coursesShot.exists){
                const courses = coursesShot.data();

                assignmentEvents.push({
                    id: `assignment-${courses.id}`,
                    title: `Assignment: ${courses.title}`,
                    description: courses.description || 'Course assignment',
                    date: courses.created_at,
                    type: 'assignment',
                    course: {
                        id: courses.id,
                        title: courses.title,
                        category: courses.category
                    },
                    color: 'blue'
                });
            }
        }

        // Combine all events
        const allEvents = [...courseEvents,...assignmentEvents];

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
          const events = [];
         const assignmentSnapshot = await db.collection('assignments')
              .where('created_at','==',date)
               .get();
        for (const doc of assignmentSnapshot.docs) {
            const assignData  = doc.data();
               const coursesShot = await db.collection('courses').doc(assignData.course_id).get()
             if(coursesShot.exists){
                const courses = coursesShot.data();

                events.push({
                    id: `assignment-${courses.id}`,
                    title: `Assignment: ${courses.title}`,
                    description: courses.description || 'Course assignment',
                    date: courses.created_at,
                    type: 'assignment',
                    course: {
                        id: courses.id,
                        title: courses.title,
                        category: courses.category
                    },
                    color: 'blue'
                });
            }
        }

          const courseSnapshot = await db.collection('enrollments')
            .where('user_id', '==', userId)
               .get();

          const eventCourse  = [];
          for (const doc of courseSnapshot.docs) {
               const enroData  = doc.data()
               const coursesShot = await db.collection('courses').doc(enroData.course_id).get()
             if(coursesShot.exists){
                const courses = coursesShot.data();

                eventCourse.push({
                    id: `courses-${courses.id}`,
                    title: `Assignment: ${courses.title}`,
                    description: courses.description || 'Course assignment',
                    date: courses.created_at,
                    type: 'assignment',
                    course: {
                        id: courses.id,
                        title: courses.title,
                        category: courses.category
                    },
                    color: 'blue'
                });
            }
        }
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
        // Calculate the date 7 days from now
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const events = [];
         const assignmentSnapshot = await db.collection('assignments')
           .get()
        for (const doc of assignmentSnapshot.docs) {
            const assignData  = doc.data();
               const coursesShot = await db.collection('courses').doc(assignData.course_id).get()
             if(coursesShot.exists){
                const courses = coursesShot.data();

                events.push({
                    id: `assignment-${courses.id}`,
                    title: `Assignment: ${courses.title}`,
                    description: courses.description || 'Course assignment',
                    date: courses.created_at,
                    type: 'assignment',
                    course: {
                        id: courses.id,
                        title: courses.title,
                        category: courses.category
                    },
                    color: 'blue'
                });
            }
        }

        res.json(events);
    } catch (error) {
        console.error('Error fetching upcoming events:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming events' });
    }
});

// GET /api/calendar/stats - Get calendar statistics
app.get('/api/calendar/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Implement your logic to calculate calendar statistics here
        // Fetch data from Firestore and calculate the statistics
        res.json({
            pending_assignments: 0,
            completed_assignments: 0,
            overdue_assignments: 0,
            active_courses: 0,
            completed_courses: 0,
            total_assignments: 0
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

       const assignmentSnapshot = await db.collection('assignments').get()
        const assignments = [];
        for (const doc of assignmentSnapshot.docs) {
            const assignData  = doc.data();
               const coursesShot = await db.collection('courses').doc(assignData.course_id).get()
             if(coursesShot.exists){
                const courses = coursesShot.data();

                assignments.push({
                    id: `assignment-${courses.id}`,
                    title: `Assignment: ${courses.title}`,
                    description: courses.description || 'Course assignment',
                    date: courses.created_at,
                    type: 'assignment',
                    course: {
                        id: courses.id,
                        title: courses.title,
                        category: courses.category
                    },
                    color: 'blue'
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

        // Add new data
        const newEvent = {
            user_id:userId,
            title:title,
            description:description,
            event_date:date,
            event_time:time,
            event_type:type
        }

        // Add new data
        const addDoc = await db.collection('custom_calendar_events').add(newEvent);
          res.status(201).json({
            id: addDoc.id,
            title,
            description,
            date,
            time,
            type,
            message: 'Calendar event created successfully'
        });

        // const insertQuery = `
        //   INSERT INTO custom_calendar_events (user_id, title, description, event_date, event_time, event_type, created_at, updated_at)
        //   VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        // `;

        // const [result] = await pool.execute(insertQuery, [userId, title, description, date, time, type]);

        // res.status(201).json({
        //   id: result.insertId,
        //   title,
        //   description,
        //   date,
        //   time,
        //   type,
        //   message: 'Calendar event created successfully'
        // });
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
      const updateNewEvent = {
            title:title,
            description:description,
            event_date:date,
            event_time:time,
            event_type:type
        }

        const updateDoc = await db.collection('custom_calendar_events').doc(id).update(updateNewEvent);

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
    const deleteDoc = await db.collection('custom_calendar_events').doc(id).delete();

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
         const userDoc = await db.collection('users').doc(userId).get();
         if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = {id:userDoc.id,...userDoc.data()};
          res.json(user);

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

              const newCourseEnrollRequests = {
                   userId:userId,
                   courseId:courseId,
                   fullName:fullName,
                   email:email,
                   phone:phone,
                   address:address,
                   city:city,
                   state:state,
                   pincode:pincode,
                   paymentMethod:paymentMethod,
                   transactionId:transactionId,
                  payment_screenshot: `/uploads/payments/${req.file.filename}`
              }

              const addDoc = await db.collection('course_enroll_requests').add(newCourseEnrollRequests);
           res.status(201).json({
                message: 'Enrollment request submitted successfully',
                requestId:addDoc.id
            });

            // Insert into database (corrected table name)
            // const [result] = await pool.execute(
            //   `INSERT INTO course_enroll_requests (
            //     user_id, course_id, full_name, email, phone, address, city, state, pincode,
            //     payment_method, transaction_id, payment_screenshot
            //   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            //   [
            //     userId, // Can be null if not logged in (user_id INT(11) DEFAULT NULL)
            //     courseId,
            //     fullName,
            //     email,
            //     phone,
            //     address,
            //     city,
            //     state,
            //     pincode,
            //     paymentMethod,
            //     transactionId,
            //     `/uploads/payments/${req.file.filename}` // Path where Multer saves the file
            //   ]
            // );

            // res.status(201).json({
            //   message: 'Enrollment request submitted successfully',
            //   requestId: result.insertId
            // });

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
          const courses = [];
        const coursesSnapshot = await db.collection('courses')
          .where('is_active', '==', true)
          .orderBy('created_at', 'desc').get();

      coursesSnapshot.forEach(doc => {
                courses.push({ id: doc.id, ...doc.data() });
            });

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

    const eventCourse  = [];

            const courseSnapshot = await db.collection('enrollments')
            .where('user_id', '==', userId)
            .where('status','==','active')
               .get();

          for (const doc of courseSnapshot.docs) {
               const enroData  = doc.data()
               const coursesShot = await db.collection('courses').doc(enroData.course_id).get()
             if(coursesShot.exists){
                const courses = coursesShot.data();

                eventCourse.push({
                    id: `courses-${courses.id}`,
                    title: `Assignment: ${courses.title}`,
                    description: courses.description || 'Course assignment',
                    date: courses.created_at,
                    type: 'assignment',
                    course: {
                        id: courses.id,
                        title: courses.title,
                        category: courses.category
                    },
                    color: 'blue'
                });
            }
        }
        res.json(eventCourse)
        //  `SELECT e.*, c.* FROM enrollments e
        //  JOIN courses c ON e.course_id = c.id
        //  WHERE e.user_id = ? AND e.status = 'active'
        //  ORDER BY e.enrollment_date DESC`,
        // [userId]
        //  res.json(enrollments.map(enrollment => ({
        //   id: enrollment.id,
        //   userId: enrollment.user_id,
        //   courseId: enrollment.course_id,
        //   progress: enrollment.progress,
        //   enrollmentDate: enrollment.enrollment_date,
        //   completionDate: enrollment.completion_date,
        //   status: enrollment.status,
        //   course: {
        //     id: enrollment.course_id,
        //     title: enrollment.title,
        //     description: enrollment.description,
        //     instructorName: enrollment.instructor_name,
        //     durationWeeks: enrollment.duration_weeks,
        //     difficultyLevel: enrollment.difficulty_level,
        //     category: enrollment.category,
        //     price: enrollment.price,
        //     thumbnail: enrollment.thumbnail,
        //     isActive: enrollment.is_active
        //   }
        // })));

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

          const enrollmentsRef = db.collection('enrollments');
        const query = enrollmentsRef.where('user_id', '==', userId)
          .where('course_id', '==', courseId).get();
       let  existing = []
         query.then(async (querySnapshot) => {
               querySnapshot.forEach((doc) => {
                  existing.push({id: doc.id, ...doc.data()});
                  console.log(doc.id, ' => ', doc.data());
                  });
               console.log(existing)
              if (existing.length > 0) {
           return res.status(400).json({ error: 'Already enrolled in this course' });
             }else{
            // Check if course exists

          const coursesShot = await db.collection('courses').doc(courseId).get();
             if(coursesShot.exists){
                const courses = coursesShot.data();
             // Create enrollment
                 const newData = {
                       user_id:userId,
                       course_id:courseId,
                        enrollment_date: admin.firestore.FieldValue.serverTimestamp()
                  }
                   db.collection('enrollments').add(newData)
                    // Update user stats
                  db.collection('user_stats').doc(userId).update( {courses_enrolled: admin.firestore.FieldValue.increment(1)})
                    res.status(201).json({ message: 'Successfully enrolled in course' });
              }else{
                return res.status(404).json({ error: 'Course not found' });
              }
           }
                console.log(querySnapshot);
              });
       // if (existing.length > 0) {
       //   return res.status(400).json({ error: 'Already enrolled in this course' });
       // }
         //     const [courses] = await pool.execute(
         //   'SELECT * FROM courses WHERE id = ? AND is_active = true',
         //   [courseId]
         // );
         //   if (courses.length === 0) {
         //   return res.status(404).json({ error: 'Course not found' });
         // }
         //      const newData = {
         //       user_id:userId,
         //       course_id:courseId,
         //        enrollment_date: admin.firestore.FieldValue.serverTimestamp()
         //  }
         //    db.collection('enrollments').add(newData)
         //   // Update user stats
         //  db.collection('user_stats').doc(userId).update( {courses_enrolled: admin.firestore.FieldValue.increment(1)})
         //    res.status(201).json({ message: 'Successfully enrolled in course' });
        //

    } catch (error) {
        console.error('Course enrollment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== ASSIGNMENTS ROUTES ====================

// GET /auth/me - Get current user info
app.get('/auth/me', authenticateToken, (req, res) => {
      const userId = req.user.id;
          res.json({
            id: req.user.id,
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            email: req.user.email,
            phone: req.user.phone,
            accountType: req.user.account_type,
            profileImage: req.user.profileImage,
            company: req.user.company,
            website: req.user.website,
            bio: req.user.bio,
            isActive: req.user.is_active,
            emailVerified: req.user.emailVerified,
            createdAt: req.user.createdAt,
           });
    // const query = `
    //  SELECT id, first_name, last_name, email, phone, account_type,
    //  profile_image, company, website, bio, is_active, email_verified
    // FROM users
    // WHERE id = ?
    // `;
    //  db.query(query, [req.user.id], (err, results) => {
    //  if (err) {
    //  console.error('Database error:', err);
    //  return res.status(500).json({ error: 'Database error' });
    //  }
    //  if (results.length === 0) {
    //  return res.status(404).json({ error: 'User not found' });
    //  }
    //  res.json(results[0]);
    // });
});

// GET /assignments/my-assignments - Get user's assignments
app.get('/assignments/my-assignments', authenticateToken, async(req, res) => {
   try{
      const userId = req.user.id;
        const course  = [];
         const assignmentSnapshot = await db.collection('assignments').get()
        //  .where('user_id', '==', userId)
        // .where('courses_id', '==',  req.user.courses_id).get();
          res.json(assignmentSnapshot.docs);
   }catch(e){
    console.log('assigmnet error');
   }
  // const query = `
  //  SELECT
  //  a.id,
  //  a.course_id,
  //  a.title,
  //  a.description,
  //  a.due_date,
  //  a.max_points,
  //  a.created_at,
  //  c.title as course_title,
  //  c.category as course_category,
  //  s.id as submission_id,
  //  s.content as submission_content,
  //  s.file_path as submission_file_path,
  //  s.submitted_at,
  //  s.grade,
  //  s.feedback,
  //  s.status as submission_status
  // FROM assignments a
  // INNER JOIN courses c ON a.course_id = c.id
  // INNER JOIN enrollments e ON c.id = e.course_id
  // LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.user_id = ?
  // WHERE e.user_id = ? AND c.is_active = TRUE
  // ORDER BY a.due_date ASC
  // `;
  // db.query(query, [req.user.id, req.user.id], (err, results) => {
  //  if (err) {
  //  console.error('Database error:', err);
  //  return res.status(500).json({ error: 'Database error' });
  //  }
  //  // Format results
  //  const assignments = results.map(row => ({
  //  id: row.id,
  //  course_id: row.course_id,
  //  title: row.title,
  //  description: row.description,
  //  due_date: row.due_date,
  //  max_points: row.max_points,
  //  created_at: row.created_at,
  //  course: {
  //  id: row.course_id,
  //  title: row.course_title,
  //  category: row.course_category
  //  },
  //  submission: row.submission_id ? {
  //  id: row.submission_id,
  //  content: row.submission_content,
  //  file_path: row.submission_file_path,
  //  submitted_at: row.submitted_at,
  //  grade: row.grade,
  //  feedback: row.feedback,
  //  status: row.submission_status
  //  } : null
  //  }));
  //  res.json(assignments);
  // });
});

// GET /assignments/all - Get all assignments (admin only)
app.get('/assignments/all', authenticateToken, (req, res) => {

 res.json({ message: 'Admin Auth successfull' });
  // // Check if user is admin
  // const userQuery = 'SELECT account_type FROM users WHERE id = ?';
  // db.query(userQuery, [req.user.id], (err, userResults) => {
  //  if (err || userResults.length === 0) {
  //  return res.status(500).json({ error: 'Database error' });
  //  }
  //  if (userResults[0].account_type !== 'admin') {
  //  return res.status(403).json({ error: 'Access denied. Admin only.' });
  //  }
  //  const query = `
  //  SELECT
  //  a.id,
  //  a.course_id,
  //  a.title,
  //  a.description,
  //  a.due_date,
  //  a.max_points,
  //  a.created_at,
  //  c.title as course_title,
  //  c.category as course_category,
  //  COUNT(s.id) as submission_count,
  //  COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_count
  // FROM assignments a
  // INNER JOIN courses c ON a.course_id = c.id
  // LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
  // WHERE c.is_active = TRUE
  // GROUP BY a.id, a.course_id, a.title, a.description, a.due_date, a.max_points, a.created_at, c.title, c.category
  // ORDER BY a.due_date ASC
  // `;
  //  db.query(query, (err, results) => {
  //  if (err) {
  //  console.error('Database error:', err);
  //  return res.status(500).json({ error: 'Database error' });
  //  }
  //  const assignments = results.map(row => ({
  //  id: row.id,
  //  course_id: row.course_id,
  //  title: row.title,
  //  description: row.description,
  //  due_date: row.due_date,
  //  max_points: row.max_points,
  //  created_at: row.created_at,
  //  course: {
  //  id: row.course_id,
  //  title: row.course_title,
  //  category: row.course_category
  //  },
  //  submission_count: row.submission_count,
  //  graded_count: row.graded_count
  //  }));
  //  res.json(assignments);
  //  });
  // });
});

// POST /assignments/submit - Submit assignment
app.post('/assignments/submit', authenticateToken, assignmentUpload.single('file'), async(req, res) => {
    try{
        const { assignment_id, content } = req.body;
        const userId = req.user.id;
        const file_path = req.file ? req.file.filename : null;

       const createNewData = {
            assignment_id:assignment_id,
             user_id:userId,
               content: content,
              file_path:file_path,
            submitted_at:  admin.firestore.FieldValue.serverTimestamp(),
              status: "submit"
       }
       const addDoc = await db.collection('assignment_submissions').add(createNewData);
       console.log(addDoc)
          res.json({
          success: true,
          message: 'Assignment submitted successfully',
          submission_id: addDoc.id
        });
    }catch(e){
       console.log('insert error');
    }

  // const { assignment_id, content } = req.body;
  // const file_path = req.file ? req.file.filename : null;
  // if (!assignment_id) {
  //  return res.status(400).json({ error: 'Assignment ID is required' });
  // }
  // if (!content && !file_path) {
  //  return res.status(400).json({ error: 'Either content or file is required' });
  // }
  // // Check if assignment exists and user is enrolled
  // const checkQuery = `
  //  SELECT a.id, a.course_id, a.title
  //  FROM assignments a
  //  INNER JOIN courses c ON a.course_id = c.id
  //  INNER JOIN enrollments e ON c.id = e.course_id
  //  WHERE a.id = ? AND e.user_id = ?
  // `;
  // db.query(checkQuery, [assignment_id, req.user.id], (err, checkResults) => {
  //  if (err) {
  //  console.error('Database error:', err);
  //  return res.status(500).json({ error: 'Database error' });
  //  }
  //  if (checkResults.length === 0) {
  //  return res.status(404).json({ error: 'Assignment not found or not enrolled' });
  //  }
  //  // Check if already submitted
  //  const existingQuery = 'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND user_id = ?';
  //  db.query(existingQuery, [assignment_id, req.user.id], (err, existingResults) => {
  //  if (err) {
  //  console.error('Database error:', err);
  //  return res.status(500).json({ error: 'Database error' });
  //  }
  //  if (existingResults.length > 0) {
  //  return res.status(400).json({ error: 'Assignment already submitted' });
  //  }
  //  // Insert submission
  //  const insertQuery = `
  //  INSERT INTO assignment_submissions (assignment_id, user_id, content, file_path, submitted_at, status)
  //  VALUES (?, ?, ?, ?, NOW(), 'submitted')
  //  `;
  //  db.query(insertQuery, [assignment_id, req.user.id, content || '', file_path], (err, insertResult) => {
  //  if (err) {
  //  console.error('Database error:', err);
  //  return res.status(500).json({ error: 'Database error' });
  //  }
  //  res.json({
  //  success: true,
  //  message: 'Assignment submitted successfully',
  //  submission_id: insertResult.insertId
  //  });
  //  });
  //  });
  // });
});

// GET /assignments/download-submission/:id - Download submission file
app.get('/assignments/download-submission/:id', authenticateToken, (req, res) => {
 res.json({ message: 'Under Construction' });
  // const submissionId = req.params.id;
  // // Get submission details
  // const query = `
  //  SELECT s.file_path, s.user_id, a.title, u.account_type
  //  FROM assignment_submissions s
  //  INNER JOIN assignments a ON s.assignment_id = a.id
  //  INNER JOIN users u ON u.id = ?
  //  WHERE s.id = ?
  // `;
  // db.query(query, [req.user.id, submissionId], (err, results) => {
  //  if (err) {
  //  console.error('Database error:', err);
  //  return res.status(500).json({ error: 'Database error' });
  //  }
  //  if (results.length === 0) {
  //  return res.status(404).json({ error: 'Submission not found' });
  //  }
  //  const submission = results[0];
  //  // Check permissions - user can download their own submission or admin can download any
  //  if (submission.user_id !== req.user.id && submission.account_type !== 'admin') {
  //  return res.status(403).json({ error: 'Access denied' });
  //  }
  //  if (!submission.file_path) {
  //  return res.status(404).json({ error: 'No file attached to this submission' });
  //  }
  //  const filePath = path.join(__dirname, 'uploads', 'assignments', submission.file_path);
  //  // Check if file exists
  //  if (!fs.existsSync(filePath)) {
  //  return res.status(404).json({ error: 'File not found' });
  //  }
  //  // Set headers and send file
  //  res.setHeader('Content-Disposition', `attachment; filename="${submission.file_path}"`);
  //  res.setHeader('Content-Type', 'application/octet-stream');
  //  const fileStream = fs.createReadStream(filePath);
  //  fileStream.pipe(res);
  // });
});

// GET /assignments/course/:courseId - Get assignments for a specific course
app.get('/assignments/course/:courseId', authenticateToken, (req, res) => {
    try{
          res.json({ message: 'Under Construction' });
    }catch(e){
         console.log("Erroor course id");
    }
  // const courseId = req.params.courseId;
  // // Check if user is enrolled or admin
  // const checkQuery = `
  //  SELECT e.user_id, u.account_type
  //  FROM enrollments e
  //  INNER JOIN users u ON u.id = ?
  //  WHERE e.course_id = ? AND e.user_id = ?
  //  UNION
  //  SELECT ? as user_id, account_type
  //  FROM users
  //  WHERE id = ? AND account_type = 'admin'
  // `;
  // db.query(checkQuery, [req.user.id, courseId, req.user.id, req.user.id, req.user.id], (err, checkResults) => {
  //  if (err) {
  //  console.error('Database error:', err);
  //  return res.status(500).json({ error: 'Database error' });
  //  }
  //  if (checkResults.length === 0) {
  //  return res.status(403).json({ error: 'Access denied' });
  //  }
  //  const query = `
  //  SELECT
  //  a.id,
  //  a.course_id,
  //  a.title,
  //  a.description,
  //  a.due_date,
  //  a.max_points,
  //  a.created_at,
  //  c.title as course_title,
  //  c.category as course_category,
  //  s.id as submission_id,
  //  s.content as submission_content,
  //  s.file_path as submission_file_path,
  //  s.submitted_at,
  //  s.grade,
  //  s.feedback,
  //  s.status as submission_status
  // FROM assignments a
  // INNER JOIN courses c ON a.course_id = c.id
  // LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.user_id = ?
  // WHERE a.course_id = ?
  // ORDER BY a.due_date ASC
  //  `;
  //  db.query(query, [req.user.id, courseId], (err, results) => {
  //  if (err) {
  //  console.error('Database error:', err);
  //  return res.status(500).json({ error: 'Database error' });
  //  }
  //  const assignments = results.map(row => ({
  //  id: row.id,
  //  course_id: row.course_id,
  //  title: row.title,
  //  description: row.description,
  //  due_date: row.due_date,
  //  max_points: row.max_points,
  //  created_at: row.created_at,
  //  course: {
  //  id: row.course_id,
  //  title: row.course_title,
  //  category: row.course_category
  //  },
  //  submission: row.submission_id ? {
  //  id: row.submission_id,
  //  content: row.submission_content,
  //  file_path: row.submission_file_path,
  //  submitted_at: row.submitted_at,
  //  grade: row.grade,
  //  feedback: row.feedback,
  //  status: row.submission_status
  //  } : null
  //  }));
  //  res.json(assignments);
  //  });
  // });
});

// PUT /assignments/grade/:submissionId - Grade assignment (admin/instructor only)
app.put('/assignments/grade/:submissionId', authenticateToken, (req, res) => {
  const submissionId = req.params.submissionId;
  const { grade, feedback } = req.body;
  // Check if user is admin

       res.json({message:"Under Construction"});
  // const userQuery = 'SELECT account_type FROM users WHERE id = ?';
  // db.query(userQuery, [req.user.id], (err, userResults) => {
  //  if (err || userResults.length === 0) {
  //  return res.status(500).json({ error: 'Database error' });
  //  }
  //  if (userResults[0].account_type !== 'admin') {
  //  return res.status(403).json({ error: 'Access denied. Admin only.' });
  //  }
  //  // Validate grade
  //  if (grade < 0 || grade > 100) {
  //  return res.status(400).json({ error: 'Grade must be between 0 and 100' });
  //  }
  //  // Update submission
  //  const updateQuery = `
  //  UPDATE assignment_submissions
  //  SET grade = ?, feedback = ?, status = 'graded'
  //  WHERE id = ?
  //  `;
  //  db.query(updateQuery, [grade, feedback || '', submissionId], (err, result) => {
  //  if (err) {
  //  console.error('Database error:', err);
  //  return res.status(500).json({ error: 'Database error' });
  //  }
  //  if (result.affectedRows === 0) {
  //  return res.status(404).json({ error: 'Submission not found' });
  //  }
  //  res.json({
  //  success: true,
  //  message: 'Assignment graded successfully'
  //  });
  //  });
  // });
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

// ==================== RESOURCES ROUTES ======================
// GET resources for current user
app.get('/api/resources', authenticateToken, async (req, res) => {
    try {
         const resources = [];
        const coursesSnapshot = await db.collection('resources').get();
         res.json(coursesSnapshot.docs);
        const userId = req.user.id;
        // First get user's account type

   // GET all courses (admin only)
   // res.json({message: "Admin  access resources"});
        // const [users] = await pool.execute(
        //  'SELECT account_type FROM users WHERE id = ?',
        //  [userId]
        // );
        // if (users.length === 0) {
        //  return res.status(404).json({ error: 'User not found' });
        // }
        // const accountType = users[0].account_type;
        // // Get all resources that are allowed for this account type
        // const [resources] = await pool.execute(`
        //  SELECT
        //  id,
        //  title,
        //  description,
        //  type,
        //  size,
        //  url,
        //  category,
        //  icon_name,
        //  button_color,
        //  allowed_account_types,
        //  is_premium,
        //  created_at,
        //  updated_at
        // FROM resources
        // WHERE JSON_CONTAINS(allowed_account_types, JSON_QUOTE(?))
        // ORDER BY created_at DESC
        // `, [accountType]);
        // res.json(resources);
    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({ error: 'Failed to fetch resources' });
    }
});

// GET resource download
app.get('/api/resources/:id/download', authenticateToken, async (req, res) => {
    try {
            res.json({ message: 'Under construction' });
        // const { id } = req.params;
        // const userId = req.user.id;
        // // First check if user has access to this resource
        // const [resources] = await pool.execute(`
        //  SELECT r.*, u.account_type
        //  FROM resources r, users u
        //  WHERE r.id = ? AND u.id = ? AND JSON_CONTAINS(r.allowed_account_types, JSON_QUOTE(u.account_type))
        // `, [id, userId]);
        // if (resources.length === 0) {
        //  return res.status(404).json({ error: 'Resource not found or access denied' });
        // }
        // const resource = resources[0];
        // // Check if resource is premium and user doesn't have access
        // if (resource.is_premium && !['professional', 'business', 'agency', 'admin'].includes(resource.account_type)) {
        //  return res.status(403).json({ error: 'Premium resource requires upgraded account' });
        // }
        // // For demo purposes, we'll return a simple text file
        // // In a real application, you would serve the actual file
        // res.setHeader('Content-Disposition', `attachment; filename="${resource.title}.txt"`);
        // res.setHeader('Content-Type', 'text/plain');
        // // Create a simple text file with resource details
        // const fileContent = `
        //  Resource: ${resource.title}
        //  Description: ${resource.description}
        //  Type: ${resource.type}
        //  Category: ${resource.category}
        //  Access Level: ${resource.is_premium ? 'Premium' : 'Free'}
        //  This is a demo download. In a real application, this would be the actual resource file.
        // `;
        // res.send(fileContent);
    } catch (error) {
        console.error('Error downloading resource:', error);
        res.status(500).json({ error: 'Failed to download resource' });
    }
});

// ==================== CERTIFICATES ROUTES ====================

// Certificate Routes
app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
    try {
          res.json({ message: 'Certificates under construction' });
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ error: 'Failed to fetch certificates' });
    }
});

// Download certificate endpoint
app.get('/api/certificates/:certificateId/download', authenticateToken, async (req, res) => {
    try {
       res.json({ message: 'Certificate DownLoad  under construction' });
    } catch (error) {
        console.error('Error downloading certificate:', error);
        res.status(500).json({ error: 'Failed to download certificate' });
    }
});

// Get all certificates (admin only)
app.get('/api/certificates', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
     res.json({ message: 'Admin only certificates under construction' });
    } catch (error) {
        console.error('Error fetching all certificates:', error);
        res.status(500).json({ error: 'Failed to fetch certificates' });
    }
});

// Issue new certificate (admin only)
app.post('/api/certificates', authenticateToken, async (req, res) => {
    try {
   res.json({ message: 'Admin only certificates Issue under construction' });
        // Check if user is admin
    } catch (error) {
        console.error('Error issuing certificate:', error);
        res.status(500).json({ error: 'Failed to issue certificate' });
    }
});

// Update certificate
app.put('/api/certificates/:certificateId', authenticateToken, async (req, res) => {
    try {
   res.json({ message: 'Certificate Update under construction' });
        // Check if user is admin
    } catch (error) {
        console.error('Error updating certificate:', error);
        res.status(500).json({ error: 'Failed to update certificate' });
    }
});

// Delete certificate (admin only)
app.delete('/api/certificates/:certificateId', authenticateToken, async (req, res) => {
    try {
     res.json({ message: 'Certificates Delete under construction' });
        // Check if user is admin
    } catch (error) {
        console.error('Error deleting certificate:', error);
        res.status(500).json({ error: 'Failed to delete certificate' });
    }
});

// ==================== INTERNSHIPS SECTION ROUTES ====================

// GET /api/internships - Fetch all internships
app.get('/api/internships', async (req, res) => {
    try {
        const internships  = [];
        const coursesSnapshot = await db.collection('internships').get();
         res.json(coursesSnapshot.docs);
      } catch (error) {
        console.error('Error fetching internships:', error);
        res.status(500).json({ message: 'Internal server error while fetching internships.' });
    }
});

// GET /api/user/internship-applications - Fetch applications for the authenticated user
app.get('/api/user/internship-applications', authenticateToken, async (req, res) => {    try {
        const internships  = [];
        const coursesSnapshot = await db.collection('internship_submissions').get();
         res.json(coursesSnapshot.docs);
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

     const createNewData = {
          full_name:full_name,
          email:email,
          phone:phone,
          resume_url:resume_url,
          cover_letter:cover_letter,
          userId:userId,
          internshipId:internshipId,
          
    }
    const updateDoc = await db.collection('internship_submissions').add(createNewData);

         res.status(201).json({ message: 'Success' });
  // const { id: internshipId } = req.params;
  // const { full_name, email, phone, resume_url, cover_letter } = req.body;
  // const userId = req.user.id;
  // if (!full_name || !email || !resume_url) {
  //  return res.status(400).json({ message: 'Full name, email, and resume link are required.' });
  // }
  // let connection;
  // try {
  //  connection = await pool.getConnection();
  //  await connection.beginTransaction();
  //  const [internshipRows] = await connection.query(
  //  'SELECT spots_available FROM internships WHERE id = ? FOR UPDATE',
  //  [internshipId]
  //  );
  //  if (internshipRows.length === 0) {
  //  await connection.rollback();
  //  return res.status(404).json({ message: 'Internship not found.' });
  //  }
  //  if (internshipRows[0].spots_available <= 0) {
  //  await connection.rollback();
  //  return res.status(400).json({ message: 'No available spots left for this internship.' });
  //  }
  //  const [existingApplication] = await connection.query(
  //  'SELECT id FROM internship_submissions WHERE internship_id = ? AND user_id = ?',
  //  [internshipId, userId]
  //  );
  //  if (existingApplication.length > 0) {
  //  await connection.rollback();
  //  return res.status(409).json({ message: 'You have already applied for this internship.' });
  //  }
  //  await connection.query(
  //  'INSERT INTO internship_submissions (internship_id, user_id, full_name, email, phone, resume_url, cover_letter) VALUES (?, ?, ?, ?, ?, ?, ?)',
  //  [internshipId, userId, full_name, email, phone || null, resume_url, cover_letter || null]
  //  );
  //  await connection.query(
  //  'UPDATE internships SET spots_available = spots_available - 1, applications_count = applications_count + 1 WHERE id = ?',
  //  [internshipId]
  //  );
  //  await connection.commit();
  //  res.status(201).json({ message: 'Internship application submitted successfully!' });
  // } catch (error) {
  //  if (connection) await connection.rollback();
  //  console.error('Error submitting internship application:', error);
  //  res.status(500).json({ message: 'Internal server error during application submission.' });
  // } finally {
  //  if (connection) connection.release();
  // }
});

// ==================== SERVICES ROUTES ====================

// Get service categories
app.get('/api/services/categories', async (req, res) => {
      try {
        const servicesShot = await db.collection('service_categories').get();
         res.json(servicesShot.docs);
      } catch (error) {
        console.error('Error services:', error);
        res.status(500).json({ message: 'Internal server error while fetching your services.' });
    }
  // const [categories] = await pool.execute(
  //  'SELECT * FROM service_categories WHERE is_active = true ORDER BY name'
  // );
  // const categoriesWithSubs = await Promise.all(categories.map(async (category) => {
  //  const [subcategories] = await pool.execute(
  //  'SELECT * FROM service_subcategories WHERE category_id = ? AND is_active = true ORDER BY name',
  //  [category.id]
  //  );
  //  return {
  //  id: category.id,
  //  name: category.name,
  //  description: category.description,
  //  icon: category.icon,
  //  subcategories: subcategories.map(sub => ({
  //  id: sub.id,
  //  categoryId: sub.category_id,
  //  name: sub.name,
  //  description: sub.description,
  //  basePrice: sub.base_price
  //  }))
  //  };
  // }));
  // res.json(categoriesWithSubs);
  // } catch (error) {
  // console.error('Get service categories error:', error);
  // res.status(500).json({ error: 'Server error' });
  // }
});

// Submit service request
app.post('/api/services/requests', authenticateToken, async (req, res) => {
        try{
                   const {
      subcategoryId, fullName, email, phone, company, website,
      projectDetails, budgetRange, timeline, contactMethod, additionalRequirements
    } = req.body;
    const userId = req.user.id;
     const createNewService  = {
          subcategoryId:subcategoryId,
          fullName:fullName,
          email:email,
          phone:phone,
          company:company,
          website:website,
          projectDetails:projectDetails,
          budgetRange:budgetRange,
          timeline:timeline,
          contactMethod:contactMethod,
          additionalRequirements:additionalRequirements,
          userId:userId,
         }
         db.collection('service_requests').add(createNewService);
          res.status(201).json({
                    message: 'Success'
                 });
         }catch(e){
         res.status(500).json({ message: 'Error' });
         }

  // try {
  //  const {
  //  subcategoryId, fullName, email, phone, company, website,
  //  projectDetails, budgetRange, timeline, contactMethod, additionalRequirements
  //  } = req.body;
  //  const userId = req.user.id;
  //  // Validate required fields
  //  if (!subcategoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
  //  return res.status(400).json({ error: 'All required fields must be provided' });
  //  }
  //  // Check if subcategory exists
  //  const [subcategories] = await pool.execute(
  //  'SELECT * FROM service_subcategories WHERE id = ? AND is_active = true',
  //  [subcategoryId]
  //  );
  //  if (subcategories.length === 0) {
  //  return res.status(404).json({ error: 'Service subcategory not found' });
  //  }
  //  // Create service request
  //  const [result] = await pool.execute(
  //  `INSERT INTO service_requests
  //  (user_id, subcategory_id, full_name, email, phone, company, website,
  //  project_details, budget_range, timeline, contact_method, additional_requirements, created_at)
  //  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
  //  [userId, subcategoryId, fullName, email, phone, company, website,
  //  projectDetails, budgetRange, timeline, contactMethod, additionalRequirements]
  //  );
  //  res.status(201).json({
  //  message: 'Service request submitted successfully',
  //  requestId: result.insertId
  //  });
  // } catch (error) {
  // console.error('Service request error:', error);
  // res.status(500).json({ error: 'Server error' });
  // }
});

// Get user's service requests
app.get('/api/services/my-requests', authenticateToken, async (req, res) => {
      try {
        const servicesShot = await db.collection('service_requests').get();
         res.json(servicesShot.docs);
      } catch (error) {
        console.error('Error services request:', error);
        res.status(500).json({ message: 'Internal server error while fetching your service requesr.' });
    }
  // try {
  //  const userId = req.user.id;
  //  const [requests] = await pool.execute(
  //  `SELECT sr.*, sc.name as category_name, ss.name as subcategory_name
  //  FROM service_requests sr
  //  JOIN service_subcategories ss ON sr.subcategory_id = ss.id
  //  JOIN service_categories sc ON ss.category_id = sc.id
  //  WHERE sr.user_id = ?
  //  ORDER BY sr.created_at DESC`,
  //  [userId]
  //  );
  //  res.json(requests.map(request => ({
  //  id: request.id,
  //  userId: request.user_id,
  //  subcategoryId: request.subcategory_id,
  //  fullName: request.full_name,
  //  email: request.email,
  //  phone: request.phone,
  //  company: request.company,
  //  website: request.website,
  //  projectDetails: request.project_details,
  //  budgetRange: request.budget_range,
  //  timeline: request.timeline,
  //  contactMethod: request.contact_method,
  //  additionalRequirements: request.additional_requirements,
  //  status: request.status,
  //  createdAt: request.created_at,
  //  updatedAt: request.updated_at,
  //  categoryName: request.category_name,
  //  subcategoryName: request.subcategory_name
  //  })));
  // } catch (error) {
  // console.error('Get service requests error:', error);
  // res.status(500).json({ error: 'Server error' });
  // }
});

// ==================== ADMIN DASHBOARD ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, async (req, res) => {
      try {
        // const servicesShot = await db.collection('service_categories').get();
         res.json({message:'Admin Underconstruction'});
      } catch (error) {
        console.error('ErrorAdmin Dashboard Stats:', error);
        res.status(500).json({ message: 'Internal server error Admin Dashboard Stats.' });
    }
  // try {
  //  const [
  //  totalUsersResult,
  //  totalCoursesResult,
  //  totalEnrollmentsResult,
  //  totalRevenueResult,
  //  pendingContactsResult,
  //  pendingServiceRequestsResult
  //  ] = await Promise.all([
  //  pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = 1'),
  //  pool.execute('SELECT COUNT(*) as count FROM courses WHERE is_active = 1'),
  //  pool.execute('SELECT COUNT(*) as count FROM enrollments'),
  //  pool.execute('SELECT COALESCE(SUM(c.price), 0) as total FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.status = "completed"'),
  //  pool.execute('SELECT COUNT(*) as count FROM contact_messages WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'),
  //  pool.execute('SELECT COUNT(*) as count FROM service_requests WHERE status = "pending"')
  //  ]);
  //  res.json({
  //  totalUsers: totalUsersResult[0][0].count || 0,
  //  totalCourses: totalCoursesResult[0][0].count || 0,
  //  totalEnrollments: totalEnrollmentsResult[0][0].count || 0,
  //  totalRevenue: parseFloat(totalRevenueResult[0][0].total) || 0,
  //  pendingContacts: pendingContactsResult[0][0].count || 0,
  //  pendingServiceRequests: pendingServiceRequestsResult[0][0].count || 0
  //  });
  // } catch (error) {
  // console.error('Error fetching admin stats:', error);
  // res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  // }
});

// Recent Users
app.get('/api/admin/recent-users', authenticateToken, async (req, res) => {
    try {
      const users = [];
       const assignmentSnapshot = await db.collection('users').get()
          res.json(assignmentSnapshot.docs);
    } catch (error) {
        console.error('Error Admin recent users:', error);
        res.status(500).json({ message: 'Internal server error Admin recent users.' });
    }

  // try {
  //  const [users] = await pool.execute(`
  //  SELECT id, first_name, last_name, email, account_type,
  //  DATE_FORMAT(created_at, '%d %b %Y') as join_date
  // FROM users
  // WHERE is_active = 1
  // ORDER BY created_at DESC
  // LIMIT 5
  //  `);
  //  res.json(users);
  // } catch (error) {
  // console.error('Error fetching recent users:', error);
  // res.status(500).json({ error: 'Failed to fetch recent users', details: error.message });
  // }
});

// Recent Enrollments
app.get('/api/admin/recent-enrollments', authenticateToken, async (req, res) => {
       try {
         const servicesShot = await db.collection('enrollments').get();
          res.json(servicesShot.docs);
       } catch (error) {
         console.error('Error Admin recent enrollments:', error);
         res.status(500).json({ message: 'Internal server error Admin recent enrollments.' });
     }
  // try {
  //  const [enrollments] = await pool.execute(`
  //  SELECT e.id,
  //  CONCAT(u.first_name, ' ', u.last_name) as user_name,
  //  c.title as course_name,
  //  DATE_FORMAT(e.enrollment_date, '%d %b %Y') as date,
  //  e.status
  // FROM enrollments e
  //  JOIN users u ON e.user_id = u.id
  //  JOIN courses c ON e.course_id = c.id
  //  ORDER BY e.enrollment_date DESC
  //  LIMIT 5
  //  `);
  //  res.json(enrollments);
  // } catch (error) {
  // console.error('Error fetching recent enrollments:', error);
  // res.status(500).json({ error: 'Failed to fetch recent enrollments', details: error.message });
  // }
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
   //  const createContactMessage = {
   //      firstName:firstName,
   //      lastName:lastName,
   //      email:email,
   //      phone:phone,
   //      company:company,
   //      message:message
   //  }
       const createContactMessage = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone || null,
        company: company || null,
        message: message.trim(),
        created_at: admin.firestore.FieldValue.serverTimestamp() // Use Firestore timestamp
    };
         const addDoc = await db.collection('contact_messages').add(createContactMessage);
       res.status(201).json({
       success: true,
       message: 'Contact message sent successfully',
       contactId: addDoc.id
        });
    // if (existingResults.length > 0) {
    // return res.status(400).json({ error: 'Assignment already submitted' });
    // }
    //  return res.status(201).json({
    //  success: true,
    //  message: 'Contact message  sent successfully',
    //  contant message ID: updateDoc
    //  });
        // Insert contact form data into database
        // const [result] = await pool.execute(
        //  `INSERT INTO contact_messages
        //  (first_name, last_name, email, phone, company, message, created_at)
        //  VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        //  [firstName.trim(), lastName.trim(), email.trim(), phone || null, company || null, message.trim()]
        // );
        // console.log('Contact message saved successfully:', {
        //  id: result.insertId,
        //  firstName: firstName.trim(),
        //  lastName: lastName.trim(),
        //  email: email.trim()
        // });
        // res.status(201).json({
        //  message: 'Contact message sent successfully',
        //  contactId: result.insertId
        // });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== ANALYTICS ROUTES ====================

// Get analytics data (admin only)
app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
    try {
             res.json({message:"Under Construction Analytics only"});
    } catch (error) {
        console.error('Error fetching analytics data', error);
        res.status(500).json({ message: 'Internal server error Admin Analytics.' });
    }
    // try {
    //  // User growth data (last 6 months)
    //  const [userGrowth] = await pool.execute(
    //  `SELECT
    //  DATE_FORMAT(created_at, '%Y-%m') as month,
    //  COUNT(*) as count
    // FROM users
    // WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    // GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    // ORDER BY month`
    //  );
    //  // Course enrollment data
    //  const [courseEnrollments] = await pool.execute(
    //  `SELECT
    //  c.title,
    //  COUNT(e.id) as enrollments
    // FROM courses c
    //  LEFT JOIN enrollments e ON c.id = e.course_id
    // WHERE c.is_active = true
    // GROUP BY c.id, c.title
    // ORDER BY enrollments DESC
    //  LIMIT 10`
    //  );
    //  // Revenue by month (mock calculation)
    //  const [revenueData] = await pool.execute(
    //  `SELECT
    //  DATE_FORMAT(e.enrollment_date, '%Y-%m') as month,
    //  SUM(c.price) as revenue
    // FROM enrollments e
    //  JOIN courses c ON e.course_id = c.id
    // WHERE e.enrollment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    // GROUP BY DATE_FORMAT(e.enrollment_date, '%Y-%m')
    // ORDER BY month`
    //  );
    //  res.json({
    //  userGrowth: userGrowth,
    //  courseEnrollments: courseEnrollments,
    //  revenueData: revenueData
    //  });
    // } catch (error) {
    // console.error('Get analytics error:', error);
    // res.status(500).json({ error: 'Server error' });
    // }
});

// ==================== ADMIN USER MANAGEMENT ENDPOINTS ====================

// GET /api/admin/users - Get all users with pagination and filtering
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
         const servicesShot = await db.collection('users').get();
          res.json(servicesShot.docs);
          console.log(" successfull");
    } catch (error) {
        console.error('ErrorAdmin get users:', error);
        res.status(500).json({ message: 'Internal server error Admin get users.' });
    }
  // try {
  //  const page = parseInt(req.query.page) || 1;
  //  const limit = parseInt(req.query.limit) || 10;
  //  const offset = (page - 1) * limit;
  //  const accountType = req.query.accountType;
  //  const status = req.query.status;
  //  const search = req.query.search;
  //  let whereClauses = [];
  //  let queryParams = [];
  //  // Add filters if provided
  //  if (accountType && accountType !== 'all') {
  //  whereClauses.push('account_type = ?');
  //  queryParams.push(accountType);
  //  }
  //  if (status && status !== 'all') {
  //  const isActive = status === 'active' ? 1 : 0;
  //  whereClauses.push('is_active = ?');
  //  queryParams.push(isActive);
  //  }
  //  if (search) {
  //  whereClauses.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
  //  queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  //  }
  //  // Build WHERE clause
  //  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  //  // Get users with pagination
  //  const [users] = await pool.execute(
  //  `SELECT id, first_name, last_name, email, phone, account_type,
  //  profile_image, company, website, bio, is_active, email_verified,
  //  created_at, updated_at
  // FROM users
  // ${whereClause}
  // ORDER BY created_at DESC
  //  LIMIT ? OFFSET ?`,
  //  [...queryParams, limit, offset]
  //  );
  //  // Get total count
  //  const [totalCountResult] = await pool.execute(
  //  `SELECT COUNT(*) as total FROM users ${whereClause}`,
  //  queryParams
  //  );
  //  res.json({
  //  users: users,
  //  pagination: {
  //  currentPage: page,
  //  totalPages: Math.ceil(totalCountResult[0].total / limit),
  //  totalUsers: totalCountResult[0].total,
  //  hasNextPage: page < Math.ceil(totalCountResult[0].total / limit),
  //  hasPreviousPage: page > 1
  //  }
  //  });
  // } catch (error) {
  // console.error('Get users error:', error);
  // res.status(500).json({ error: 'Server error' });
  // }
});

// GET /api/admin/users/:id - Get a specific user
app.get('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try{
       const {id}= req.params
        const usersShot = await db.collection('users').doc(id).get()
         res.json(usersShot);
          console.log(" successfull get ID");
    } catch (error) {
        console.error('Error Admin get ID users:', error);
        res.status(500).json({ message: 'Internal server error Admin get ID users.' });
    }

  // try {
  //  const userId = req.params.id;
  //  const [users] = await pool.execute(
  //  `SELECT id, first_name, last_name, email, phone, account_type,
  //  profile_image, company, website, bio, is_active, email_verified,
  //  created_at, updated_at
  // FROM users
  //  WHERE id = ?`,
  //  [userId]
  //  );
  //  if (users.length === 0) {
  //  return res.status(404).json({ error: 'User not found' });
  //  }
  //  res.json(users[0]);
  // } catch (error) {
  // console.error('Get user error:', error);
  // res.status(500).json({ error: 'Server error' });
  // }
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

    const newData = {
       first_name:firstName,
       lastName:lastName,
       email:email,
       phone:phone,
       accountType:accountType,
        isActive:isActive,
        company:company,
        bio:bio,
         password:password

    }
         const addDoc = await db.collection('users').add(newData);
       res.status(201).json({
       success: true,
       message: 'Contact message sent successfully',
       id: addDoc.id
        });

        // Check if email exists

        // Hash password

        // Insert new user

        // Create user stats entry

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
  // try {
  //  const { firstName, lastName, email, phone, password, accountType, isActive, company, website, bio } = req.body;
  //  // Validate required fields
  //  if (!firstName || !lastName || !email || !password) {
  //  return res.status(400).json({
  //  error: 'First name, last name, email, and password are required'
  //  });
  //  }
  //  // Validate email format
  //  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //  if (!emailRegex.test(email)) {
  //  return res.status(400).json({ error: 'Please provide a valid email address' });
  //  }
  //  // Validate password strength
  //  if (password.length < 6) {
  //  return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  //  }
  //  // Check if email exists
  //  const [existingUsers] = await pool.execute(
  //  'SELECT * FROM users WHERE email = ?',
  //  [email]
  //  );
  //  if (existingUsers.length > 0) {
  //  return res.status(400).json({ error: 'Email already exists' });
  //  }
  //  // Hash password
  //  const saltRounds = 10;
  //  const hashedPassword = await bcrypt.hash(password, saltRounds);
  //  // Insert new user
  //  const [result] = await pool.execute(
  //  `INSERT INTO users
  //  (first_name, last_name, email, phone, password_hash, account_type, is_active, company, website, bio, created_at)
  //  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
  //  [firstName.trim(), lastName.trim(), email.trim(), phone || null, hashedPassword,
  //  accountType || 'student', isActive !== undefined ? isActive : true,
  //  company || null, website || null, bio || null]
  //  );
  //  // Create user stats entry
  //  await pool.execute(
  //  'INSERT INTO user_stats (user_id) VALUES (?)',
  //  [result.insertId]
  //  );
  //  console.log('User created successfully by admin:', { userId: result.insertId, email });
  //  // Get the newly created user to return
  //  const [newUser] = await pool.execute(
  //  `SELECT id, first_name, last_name, email, phone, account_type,
  //  profile_image, company, website, bio, is_active, email_verified,
  //  created_at, updated_at
  // FROM users
  //  WHERE id = ?`,
  //  [result.insertId]
  //  );
  //  res.status(201).json({
  //  message: 'User created successfully',
  //  user: newUser[0]
  //  });
  // } catch (error) {
  // console.error('Create user error:', error);
  // res.status(500).json({ error: 'Server error' });
  // }
});

// PUT /api/admin/users/:id - Update a user
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {

      const { id } = req.params;
         const { firstName, lastName, email, phone, accountType, isActive, company, website, bio } = req.body;

         const newData = {
              firstName:firstName,
               lastName:lastName,
               email:email,
               phone:phone,
                accountType:accountType,
               isActive:isActive,
               company:company,
               bio:bio
          }
      const usersShot = await db.collection('users').doc(id).update(newData);
         res.json({
                    message: 'Sucess'
                 });
  // try {
  //  const userId = req.params.id;
  //  const { firstName, lastName, email, phone, accountType, isActive, company, website, bio } = req.body;
  //  // Check if user exists
  //  const [users] = await pool.execute(
  //  'SELECT * FROM users WHERE id = ?',
  //  [userId]
  //  );
  //  if (users.length === 0) {
  //  return res.status(404).json({ error: 'User not found' });
  //  }
  //  // Validate email if changed
  //  if (email && email !== users[0].email) {
  //  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //  if (!emailRegex.test(email)) {
  //  return res.status(400).json({ error: 'Please provide a valid email address' });
  //  }
  //  // Check if new email already exists
  ////  const [existingUsers] = await pool.execute(
//  'SELECT * FROM users WHERE email = ? AND id != ?',
//  [email, userId]
//  );
//  if (existingUsers.length > 0) {
//  return res.status(400).json({ error: 'Email already exists' });
//  }
//  }
//  // Update user
//  await pool.execute(
//  `UPDATE users SET
//  first_name = ?, last_name = ?, email = ?, phone = ?, account_type = ?,
//  is_active = ?, company = ?, website = ?, bio = ?, updated_at = NOW()
//  WHERE id = ?`,
//  [firstName || users[0].first_name,
//  lastName || users[0].last_name,
//  email || users[0].email,
//  phone || users[0].phone,
//  accountType || users[0].account_type,
//  isActive !== undefined ? isActive : users[0].is_active,
//  company || users[0].company,
//  website || users[0].website,
//  bio || users[0].bio,
//  userId]
//  );
//  // Get the updated user to return
//  const [updatedUser] = await pool.execute(
//  `SELECT id, first_name, last_name, email, phone, account_type,
//  profile_image, company, website, bio, is_active, email_verified,
//  created_at, updated_at
// FROM users
//  WHERE id = ?`,
//  [userId]
//  );
//  res.json({
//  message: 'User updated successfully',
//  user: updatedUser[0]
//  });
// } catch (error) {
// console.error('Update user error:', error);
// res.status(500).json({ error: 'Server error' });
// }
});

// DELETE /api/admin/users/:id - Delete a user
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
        const { id } = req.params;
             const deleteDoc = await db.collection('users').doc(id).delete();

                res.json({
                    message: 'Sucess'
                 });

  // try {
  //  const userId = req.params.id;
  //  const adminId = req.user.id;
  //  // Prevent admin from deleting themselves
  //  if (parseInt(userId) === parseInt(adminId)) {
  //  return res.status(400).json({ error: 'You cannot delete your own account' });
  //  }
  //  // Check if user exists
  //  const [users] = await pool.execute(
  //  'SELECT * FROM users WHERE id = ?',
  //  [userId]
  //  );
  //  if (users.length === 0) {
  //  return res.status(404).json({ error: 'User not found' });
  //  }
  //  // For safety, we'll do a soft delete by setting is_active to false
  //  await pool.execute(
  //  'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = ?',
  //  [userId]
  //  );
  //  res.json({ message: 'User deleted successfully' });
  // } catch (error) {
  // console.error('Delete user error:', error);
  // res.status(500).json({ error: 'Server error while deleting user' });
  // }
});

// PUT /api/admin/users/:id/password - Reset user password (admin only)
app.put('/api/admin/users/:id/password', authenticateToken, requireAdmin, async (req, res) => {
        const { id } = req.params;
              const { password } = req.body;
                   const newData = {
                                 password:password,
                            }
                const usersShot = await db.collection('users').doc(id).update(newData);
                 res.json({
                    message: 'Sucess'
                 });

  // try {
  //  const userId = req.params.id;
  //  const { password } = req.body;
  //  if (!password) {
  //  return res.status(400).json({ error: 'Password is required' });
  //  }
  //  if (password.length < 6) {
  //  return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  //  }
  //  // Check if user exists
  //  const [users] = await pool.execute(
  //  'SELECT * FROM users WHERE id = ?',
  //  [userId]
  //  );
  //  if (users.length === 0) {
  //  return res.status(404).json({ error: 'User not found' });
  //  }
  //  // Hash new password
  //  const saltRounds = 10;
  //  const hashedPassword = await bcrypt.hash(password, saltRounds);
  //  // Update password
  //  await pool.execute(
  //  'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
  //  [hashedPassword, userId]
  //  );
  //  res.json({ message: 'Password reset successfully' });
  // } catch (error) {
  // console.error('Reset password error:', error);
  // res.status(500).json({ error: 'Server error' });
  // }
});

// ===================== ADMIN PAYMENTS MANAGEMENT ENDPOINT ======================

//app.post('/api/payments/upload-proof', authenticateToken, upload.single('proof'), async (req, res) => {

app.post('/api/payments/upload-proof', authenticateToken, paymentProofUpload.single('file'), async (req, res) => {

          res.json({
            message: 'Under Construction'
         });
  // try {
  //  const { transaction_id, payment_method, resource_id, plan, amount, user_id } = req.body;
  //  if (!req.file) {
  //  return res.status(400).json({ error: 'Payment proof file is required' });
  //  }
  //  if (!transaction_id) {
  //  return res.status(400).json({ error: 'Transaction ID is required' });
  //  }
  //  // Save payment record to database
  //  const [result] = await pool.execute(
  //  `INSERT INTO payments
  //  (user_id, resource_id, plan, amount, payment_method, transaction_id, proof_file, status)
  //  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  //  [user_id, resource_id || null, plan, amount, payment_method, transaction_id, req.file.filename, 'pending']
  //  );
  //  res.json({
  //  message: 'Payment proof uploaded successfully',
  //  paymentId: result.insertId
  //  });
  // } catch (error) {
  // console.error('Error uploading payment proof:', error);
  // res.status(500).json({ error: 'Failed to upload payment proof' });
  // }
});

// Admin payment management endpoint
app.get('/api/admin/payments', authenticateToken, requireAdmin, async (req, res) => {
     try {
           const servicesShot = await db.collection('payments').get();
            res.json(servicesShot.docs);
         } catch (error) {
           console.error('Error Admin payments management:', error);
           res.status(500).json({ message: 'Internal server error Admin payments management.' });
       }

  // try {
  //  const [payments] = await pool.execute(`
  //  SELECT
  //  p.*,
  //  u.first_name,
  //  u.last_name,
  //  u.email,
  //  r.title as resource_title
  // FROM payments p
  //  LEFT JOIN users u ON p.user_id = u.id
  //  LEFT JOIN resources r ON p.resource_id = r.id
  //  ORDER BY p.created_at DESC
  //  `);
  //  res.json(payments);
  // } catch (error) {
  // console.error('Error fetching payments:', error);
  // res.status(500).json({ error: 'Failed to fetch payments' });
  // }
});

// Admin payment verification endpoint
app.put('/api/admin/payments/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
         res.json({ message: "Payment Verified  Success " });
  // try {
  //  const { id } = req.params;
  //  const { status } = req.body;
  //  await pool.execute(
  //  'UPDATE payments SET status = ?, verified_at = NOW() WHERE id = ?',
  //  [status, id]
  //  );
  //  // If payment is approved, grant access to the resource
  //  if (status === 'approved') {
  //  const [payment] = await pool.execute(
  //  'SELECT user_id, resource_id, plan FROM payments WHERE id = ?',
  //  [id]
  //  );
  //  if (payment.length > 0) {
  //  const { user_id, resource_id, plan } = payment[0];
  //  if (plan === 'individual' && resource_id) {
  //  // Grant access to specific resource
  //  await pool.execute(
  //  'INSERT INTO user_resources (user_id, resource_id) VALUES (?, ?)',
  //  [user_id, resource_id]
  //  );
  //  } else if (plan === 'premium') {
  //  // Upgrade user to premium
  //  await pool.execute(
  //  'UPDATE users SET subscription_plan = "premium" WHERE id = ?',
  //  [user_id]
  //  );
  //  }
  //  }
  //  }
  //  res.json({ message: 'Payment status updated successfully' });
  // } catch (error) {
  // console.error('Error verifying payment:', error);
  // res.status(500).json({ error: 'Failed to verify payment' });
  // }
});

// ==================== ADMIN ENROLLMENT MANAGEMENT ENDPOINTS ====================

// GET all enrollments (admin only)
app.get('/api/admin/enrollments', authenticateToken, requireAdmin, async (req, res) => {
         try {
           const servicesShot = await db.collection('enrollments').get();
            res.json(servicesShot.docs);
         } catch (error) {
           console.error('Error fetching all enrollments:', error);
           res.status(500).json({ message: 'Internal server error all enrollments.' });
       }
  // try {
  //  const [enrollments] = await pool.execute(`
  //  SELECT
  //  e.id,
  //  e.user_id,
  //  CONCAT(u.first_name, ' ', u.last_name) as user_name,
  //  e.course_id,
  //  c.title as course_name,
  //  e.progress,
  //  e.status,
  //  e.enrollment_date,
  //  e.completion_date
  // FROM enrollments e
  //  JOIN users u ON e.user_id = u.id
  //  JOIN courses c ON e.course_id = c.id
  //  ORDER BY e.enrollment_date DESC
  //  `);
  //  res.json(enrollments);
  // } catch (error) {
  // console.error('Error fetching enrollments:', error);
  // res.status(500).json({ error: 'Failed to fetch enrollments' });
  // }
});

// UPDATE enrollment (admin only)
app.put('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
       try {

                 res.json({ message: "Successfull Update" });
         } catch (error) {
           console.error('Error Update enrollments:', error);
           res.status(500).json({ message: 'Internal server Update enrollments.' });
       }
  // try {
  //  const { id } = req.params;
  //  const { status, progress, completion_date } = req.body;
  //  await pool.execute(
  //  'UPDATE enrollments SET status = ?, progress = ?, completion_date = ? WHERE id = ?',
  //  [status, progress, status === 'completed' ? (completion_date || new Date()) : null, id]
  //  );
  //  res.json({ message: 'Enrollment updated successfully' });
  // } catch (error) {
  // console.error('Error updating enrollment:', error);
  // res.status(500).json({ error: 'Failed to update enrollment' });
  // }
});

// DELETE enrollment (admin only)
app.delete('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
      const { id } = req.params;
            const deleteDoc = await db.collection('enrollments').doc(id).delete();
               res.json({ message: "Delete Succesfully" });

  // try {
  //  const { id } = req.params;
  //  await pool.execute('DELETE FROM enrollments WHERE id = ?', [id]);
  //  res.json({ message: 'Enrollment deleted successfully' });
  // } catch (error) {
  // console.error('Error deleting enrollment:', error);
  // res.status(500).json({ error: 'Failed to delete enrollment' });
  // }
});

// ==================== ADMIN COURSE MANAGEMENT ENDPOINTS ====================

// GET all courses (admin only)
app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
      try {
             const assignmentSnapshot = await db.collection('courses').get()
          res.json(assignmentSnapshot.docs);
       } catch (error) {
         console.error('Error get all courses:', error);
         res.status(500).json({ message: 'Internal server get all courses.' });
     }

  // try {
  //  const [courses] = await pool.execute(`
  //  SELECT
  //  id,
  //  title,
  //  description,
  //  instructor_name,
  //  duration_weeks,
  //  difficulty_level,
  //  category,
  //  price,
  //  thumbnail,
  //  is_active,
  //  created_at,
  //  updated_at
  // FROM courses
  //  ORDER BY created_at DESC
  //  `);
  //  res.json(courses);
  // } catch (error) {
  // console.error('Error fetching courses:', error);
  // res.status(500).json({ error: 'Failed to fetch courses' });
  // }
});

// CREATE new course (admin only)
app.post('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
        try{
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

              const newCoursesDoc  = {
                   title:title,
                    description:description,
                    instructor_name:instructor_name,
                    duration_weeks:duration_weeks,
                     difficulty_level:difficulty_level,
                    category:category,
                    price:price
              }
                db.collection('courses').add(newCoursesDoc);
               res.json({ message: "Success Post" });
        }catch(e){
             res.status(500).json({ message: "Error in create new courses " });
        }

  // try {
  //  const {
  //  title,
  //  description,
  //  instructor_name,
  //  duration_weeks,
  //  difficulty_level,
  //  category,
  //  price,
  //  is_active
  //  } = req.body;
  //  // Validate required fields
  //  if (!title || !instructor_name || !duration_weeks || !difficulty_level || !category || !price) {
  //  return res.status(400).json({ error: 'Missing required fields' });
  //  }
  //  const [result] = await pool.execute(
  //  `INSERT INTO courses
  //  (title, description, instructor_name, duration_weeks, difficulty_level, category, price, is_active)
  //  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  //  [title, description, instructor_name, duration_weeks, difficulty_level, category, price, is_active || 1]
  //  );
  //  res.status(201).json({
  //  message: 'Course created successfully',
  //  courseId: result.insertId
  //  });
  // } catch (error) {
  // console.error('Error creating course:', error);
  // res.status(500).json({ error: 'Failed to create course' });
  // }
});

// UPDATE course (admin only)
app.put('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
      const { id } = req.params;
        const { title, description, instructor_name, duration_weeks, difficulty_level, category, price, is_active } = req.body;

           const updateDoc = await db.collection('courses').doc(id).update({
               title,
               description,
               instructor_name,
               duration_weeks,
               difficulty_level,
               category,
               price,
               is_active
             });

              res.json({
                    message: 'Sucess update '
                 });

  // try {
  //  const { id } = req.params;
  //  const {
  //  title,
  //  description,
  //  instructor_name,
  //  duration_weeks,
  //  difficulty_level,
  //  category,
  //  price,
  //  is_active
  //  } = req.body;
  //  // Validate required fields
  //  if (!title || !instructor_name || !duration_weeks || !difficulty_level || !category || !price) {
  //  return res.status(400).json({ error: 'Missing required fields' });
  //  }
  //  await pool.execute(
  //  `UPDATE courses SET
  //  title = ?, description = ?, instructor_name = ?, duration_weeks = ?,
  //  difficulty_level = ?, category = ?, price = ?, is_active = ?, updated_at = NOW()
  //  WHERE id = ?`,
  //  [title, description, instructor_name, duration_weeks, difficulty_level, category, price, is_active, id]
  //  );
  //  res.json({ message: 'Course updated successfully' });
  // } catch (error) {
  // console.error('Error updating course:', error);
  // res.status(500).json({ error: 'Failed to update course' });
  // }
});

// DELETE course (admin only)
app.delete('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
         const { id } = req.params;
                const deleteDoc = await db.collection('courses').doc(id).delete();
                   res.json({ message: "Course Delete Sucessfully" });

  // try {
  //  const { id } = req.params;
  //  // Check if course has enrollments
  //  const [enrollments] = await pool.execute(
  //  'SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?',
  //  [id]
  //  );
  //  if (enrollments[0].count > 0) {
  //  return res.status(400).json({ error: 'Cannot delete course with active enrollments' });
  //  }
  //  await pool.execute('DELETE FROM courses WHERE id = ?', [id]);
  //  res.json({ message: 'Course deleted successfully' });
  // } catch (error) {
  // console.error('Error deleting course:', error);
  // res.status(500).json({ error: 'Failed to delete course' });
  // }
});

// Upload course thumbnail
app.post('/api/admin/courses/:id/thumbnail', authenticateToken, requireAdmin, async (req, res) => {
     try{

              res.json({ message: "Upload thumbline SuccessFull" });
    } catch (error) {
        console.error('Error Upload Thumbnails Data', error);
        res.status(500).json({ message: 'Internal server  Thumbnails Data.' });
    }
  // try {
  //  const { id } = req.params;
  //  if (!req.file) {
  //  return res.status(400).json({ error: 'No file uploaded' });
  //  }
  //  const thumbnailPath = `/uploads/courses/${req.file.filename}`;
  //  await pool.execute(
  //  'UPDATE courses SET thumbnail = ?, updated_at = NOW() WHERE id = ?',
  //  [thumbnailPath, id]
  //  );
  //  res.json({ message: 'Thumbnail uploaded successfully', thumbnail: thumbnailPath });
  // } catch (error) {
  // console.error('Error uploading thumbnail:', error);
  // res.status(500).json({ error: 'Failed to upload thumbnail' });
  // }
});

// ==================== ADMIN RESOURCE MANAGEMENT ENDPOINTS ====================

// GET all resources (admin only)
app.get('/api/admin/resources', authenticateToken, requireAdmin, async (req, res) => {
     try{
              const snapshot = await db.collection('resources').get()
             const data1  = snapshot.docs;
                res.json(data1);
    } catch (error) {
        console.error('Error Admin resources:', error);
        res.status(500).json({ message: 'Internal server resources.' });
    }
  // try {
  //  const [resources] = await pool.execute(`
  //  SELECT
  //  id,
  //  title,
  //  description,
  //  type,
  //  size,
  //  url,
  //  category,
  //  icon_name,
  //  button_color,
  //  allowed_account_types,
  //  is_premium,
  //  created_at,
  //  updated_at
  // FROM resources
  //  ORDER BY created_at DESC
  //  `);
  //  // Parse allowed_account_types from JSON string to array
  //  const resourcesWithParsedTypes = resources.map(resource => ({
  //  ...resource,
  //  allowed_account_types: JSON.parse(resource.allowed_account_types)
  //  }));
  //  res.json(resourcesWithParsedTypes);
  // } catch (error) {
  // console.error('Error fetching resources:', error);
  // res.status(500).json({ error: 'Failed to fetch resources' });
  // }
});

// CREATE new resource (admin only)
app.post('/api/admin/resources', authenticateToken, requireAdmin, async (req, res) => {
  try {
            const snapshot = await db.collection('resources').get()

                  res.json({ message: "Post method construction" });
    } catch (error) {
        console.error('Error Admin resources:', error);
        res.status(500).json({ message: 'Internal server Post resources.' });
    }
  // try {
  //  const {
  //  title,
  //  description,
  //  type,
  //  size,
  //  url,
  //  category,
  //  icon_name,
  //  button_color,
  //  allowed_account_types,
  //  is_premium
  //  } = req.body;
  //  // Validate required fields
  //  if (!title || !description || !type || !category || !icon_name || !button_color || !allowed_account_types) {
  //  return res.status(400).json({ error: 'Missing required fields' });
  //  }
  //  // Ensure allowed_account_types is an array and convert to JSON string
  //  const accountTypesArray = Array.isArray(allowed_account_types)
  //  ? allowed_account_types
  //  : [allowed_account_types];
  //  const accountTypesJSON = JSON.stringify(accountTypesArray);
  //  const [result] = await pool.execute(
  //  `INSERT INTO resources
  //  (title, description, type, size, url, category, icon_name, button_color, allowed_account_types, is_premium)
  //  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  //  [title, description, type, size || null, url || null, category, icon_name, button_color, accountTypesJSON, is_premium || false]
  //  );
  //  res.status(201).json({
  //  message: 'Resource created successfully',
  //  resourceId: result.insertId
  //  });
  // } catch (error) {
  // console.error('Error creating resource:', error);
  // res.status(500).json({ error: 'Failed to create resource' });
  // }
});

// UPDATE resource (admin only)
app.put('/api/admin/resources/:id', authenticateToken, requireAdmin, async (req, res) => {

      try{

                   res.json({ message: "Update  Success" });
          } catch (error) {
               console.error('Error Admin Update resources:', error);
               res.status(500).json({ message: 'Internal server Update resources.' });
          }
  // try {
  //  const { id } = req.params;
  //  const {
  //  title,
  //  description,
  //  type,
  //  size,
  //  url,
  //  category,
  //  icon_name,
  //  button_color,
  //  allowed_account_types,
  //  is_premium
  //  } = req.body;
  //  // Validate required fields
  //  if (!title || !description || !type || !category || !icon_name || !button_color || !allowed_account_types) {
  //  return res.status(400).json({ error: 'Missing required fields' });
  //  }
  //  // Ensure allowed_account_types is an array and convert to JSON string
  //  const accountTypesArray = Array.isArray(allowed_account_types)
  //  ? allowed_account_types
  //  : [allowed_account_types];
  //  const accountTypesJSON = JSON.stringify(accountTypesArray);
  //  await pool.execute(
  //  `UPDATE resources SET
  //  title = ?, description = ?, type = ?, size = ?, url = ?, category = ?,
  //  icon_name = ?, button_color = ?, allowed_account_types = ?, is_premium = ?, updated_at = NOW()
  //  WHERE id = ?`,
  //  [title, description, type, size || null, url || null, category, icon_name, button_color, accountTypesJSON, is_premium, id]
  //  );
  //  res.json({ message: 'Resource updated successfully' });
  // } catch (error) {
  // console.error('Error updating resource:', error);
  // res.status(500).json({ error: 'Failed to update resource' });
  // }
});

// DELETE resource (admin only)
app.delete('/api/admin/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
      const { id } = req.params;
                const deleteDoc = await db.collection('resources').doc(id).delete();
                 res.json({ message: "Recourse Deleted Sucessfully" });
  // try {
  //  const { id } = req.params;
  //  await pool.execute('DELETE FROM resources WHERE id = ?', [id]);
  //  res.json({ message: 'Resource deleted successfully' });
  // } catch (error) {
  // console.error('Error deleting resource:', error);
  // res.status(500).json({ error: 'Failed to delete resource' });
  // }
});

// ==================== ADMIN ASSIGNMENT MANAGEMENT ENDPOINTS ====================

// GET all assignments (admin only)
app.get('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
          try{
              const snapshot = await db.collection('assignments').get()
             const data1  = snapshot.docs;
                res.json(data1);
    } catch (error) {
        console.error('Error Admin GET all assignments:', error);
        res.status(500).json({ message: 'Internal server Admin GET all assignments.' });
    }
  // try {
  //  const [assignments] = await pool.execute(`
  //  SELECT
  //  a.id,
  //  a.course_id,
  //  a.title,
  //  a.description,
  //  a.due_date,
  //  a.max_points,
  //  a.created_at,
  //  c.title as course_title
  // FROM assignments a
  //  LEFT JOIN courses c ON a.course_id = c.id
  //  ORDER BY a.created_at DESC
  //  `);
  //  res.json(assignments);
  // } catch (error) {
  // console.error('Error fetching assignments:', error);
  // res.status(500).json({ error: 'Failed to fetch assignments' });
  // }
});

// CREATE new assignment (admin only)
app.post('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
             try{
              const snapshot = await db.collection('assignments').get()

                    res.json({ message: "Post Assigned successFull " });
              } catch (error) {
                console.error('Error Admin Post assignments:', error);
                res.status(500).json({ message: 'Internal server Post assignments.' });
            }
  // try {
  //  const {
  //  title,
  //  course_id,
  //  description,
  //  due_date,
  //  max_points
  //  } = req.body;
  //  // Validate required fields
  //  if (!title || !course_id || !due_date || !max_points) {
  //  return res.status(400).json({ error: 'Missing required fields' });
  //  }
  //  const [result] = await pool.execute(
  //  `INSERT INTO assignments
  //  (title, course_id, description, due_date, max_points)
  //  VALUES (?, ?, ?, ?, ?)`,
  //  [title, course_id, description, due_date, max_points]
  //  );
  //  res.status(201).json({
  //  message: 'Assignment created successfully',
  //  assignmentId: result.insertId
  //  });
  // } catch (error) {
  // console.error('Error creating assignment:', error);
  // res.status(500).json({ error: 'Failed to create assignment' });
  // }
});

// UPDATE assignment (admin only)
app.put('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
      const {
      title,
      course_id,
      description,
      due_date,
      max_points
    } = req.body;

 const updateDoc = await db.collection('assignments').doc(id).update({
               title:title,
               course_id:course_id,
              description:description,
              due_date:due_date,
              max_points:max_points

             });

              res.json({
                    message: 'Success Assigned update '
                 });
  // try {
  //  const { id } = req.params;
  //  const {
  //  title,
  //  course_id,
  //  description,
  //  due_date,
  //  max_points
  //  } = req.body;
  //  // Validate required fields
  //  if (!title || !course_id || !due_date || !max_points) {
  //  return res.status(400).json({ error: 'Missing required fields' });
  ////  }
//  await pool.execute(
//  `UPDATE assignments SET
//  title = ?, course_id = ?, description = ?, due_date = ?, max_points = ?
//  WHERE id = ?`,
//  [title, course_id, description, due_date, max_points, id]
//  );
//  res.json({ message: 'Assignment updated successfully' });
// } catch (error) {
// console.error('Error updating assignment:', error);
// res.status(500).json({ error: 'Failed to update assignment' });
// }
});

// DELETE assignment (admin only)
app.delete('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
        const { id } = req.params;
                const deleteDoc = await db.collection('assignments').doc(id).delete();
                 res.json({ message: "Assignment Deleted Sucessfully" });
  // try {
  //  const { id } = req.params;
  //  // Check if assignment has submissions
  //  const [submissions] = await pool.execute(
  //  'SELECT COUNT(*) as count FROM assignment_submissions WHERE assignment_id = ?',
  //  [id]
  //  );
  //  if (submissions[0].count > 0) {
  //  return res.status(400).json({ error: 'Cannot delete assignment with existing submissions' });
  //  }
  //  await pool.execute('DELETE FROM assignments WHERE id = ?', [id]);
  //  res.json({ message: 'Assignment deleted successfully' });
  // } catch (error) {
  // console.error('Error deleting assignment:', error);
  // res.status(500).json({ error: 'Failed to delete assignment' });
  // }
});

// ==================== ADMIN CONTACT MESSAGES ENDPOINTS ====================

// Get contact messages (admin only) - CORRECTED VERSION
app.get('/api/admin/contact-messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
        const servicesShot = await db.collection('contact_messages').get();
         res.json(servicesShot.docs);
  } catch (error) {
        console.error('Error GET contact_messages:', error);
        res.status(500).json({ message: 'Internal server GET contact_messages' });
    }
  // try {
  //  const page = parseInt(req.query.page) || 1;
  //  const limit = parseInt(req.query.limit) || 10;
  //  const offset = (page - 1) * limit;
  //  // Check if status column exists in the table
  //  let statusColumnExists = true;
  //  try {
  //  await pool.execute('SELECT status FROM contact_messages LIMIT 1');
  //  } catch (error) {
  //  statusColumnExists = false;
  //  }
  //  const selectFields = statusColumnExists
  //  ? `id, first_name, last_name, email, phone, company, message, status, created_at`
  //  : `id, first_name, last_name, email, phone, company, message, created_at`;
  //  const [messages] = await pool.execute(
  //  `SELECT ${selectFields}
  // FROM contact_messages
  //  ORDER BY created_at DESC
  //  LIMIT ? OFFSET ?`,
  //  [limit, offset]
  //  );
  //  const [totalCount] = await pool.execute(
  //  'SELECT COUNT(*) as total FROM contact_messages'
  //  );
  //  // If status column doesn't exist, add default status to each message
  //  if (!statusColumnExists) {
  //  messages.forEach(message => {
  //  message.status = 'pending';
  //  });
  //  }
  //  res.json({
  //  messages: messages,
  //  pagination: {
  //  currentPage: page,
  //  totalPages: Math.ceil(totalCount[0].total / limit),
  //  totalMessages: totalCount[0].total,
  //  hasNextPage: page < Math.ceil(totalCount[0].total / limit),
  //  hasPreviousPage: page > 1
  //  }
  //  });
  // } catch (error) {
  // console.error('Error fetching contact messages:', error);
  // res.status(500).json({ error: 'Failed to fetch contact messages' });
  // }
});

// UPDATE contact message status (admin only)
app.put('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
     try {
           const { id } = req.params;
              const { status } = req.body;
                    const newData = {
                                 status:status,
                            }
                const usersShot = await db.collection('contact_messages').doc(id).update(newData);
                       res.json({
                        message: 'Sucessfully'
                     });
    } catch (error) {
        console.error('Error PUT contact_messages/:id :', error);
        res.status(500).json({ message: 'Internal server  PUT contact_messages/:id.' });
    }

  // try {
  //  const { id } = req.params;
  //  const { status } = req.body;
  //  // First check if status column exists
  //  let statusColumnExists = true;
  //  try {
  //  await pool.execute('SELECT status FROM contact_messages LIMIT 1');
  //  } catch (error) {
  //  statusColumnExists = false;
  //  // If status column doesn't exist, add it to the table
  //  if (!statusColumnExists) {
  //  await pool.execute(`
  //  ALTER TABLE contact_messages
  //  ADD COLUMN status ENUM('pending', 'contacted', 'resolved', 'closed') DEFAULT 'pending'
  //  `);
  //  statusColumnExists = true;
  //  }
  //  }
  //  if (!status || !['pending', 'contacted', 'resolved', 'closed'].includes(status)) {
  //  return res.status(400).json({ error: 'Invalid status value' });
  //  }
  //  await pool.execute(
  //  'UPDATE contact_messages SET status = ? WHERE id = ?',
  //  [status, id]
  //  );
  //  res.json({ message: 'Contact message updated successfully' });
  // } catch (error) {
  // console.error('Error updating contact message:', error);
  // res.status(500).json({ error: 'Failed to update contact message' });
  // }
});

// DELETE contact message (admin only)
app.delete('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {

  // try {
  //  const { id } = req.params;
  //  await pool.execute('DELETE FROM contact_messages WHERE id = ?', [id]);
  //  res.json({ message: 'Contact message deleted successfully' });
  // } catch (error) {
  // console.error('Error deleting contact message:', error);
  // res.status(500).json({ error: 'Failed to delete contact message' });
  // }

   try {
        const { id } = req.params;
                const deleteDoc = await db.collection('contact_messages').doc(id).delete();
                 res.json({ message: "contact_messages Deleted Sucessfully" });
    } catch (error) {
        console.error('Error DELETE contact_messages/:id :', error);
        res.status(500).json({ message: 'Internal server DELETE contact_messages/:id' });
    }
});

// ==================== ADMIN SERVICE MANAGEMENT ENDPOINTS ====================

// Get all services (admin only)
app.get('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
       try {
               const snapshot = await db.collection('services').get();
              const data1 = snapshot.docs;
                 res.json(data1);
     } catch (error) {
         console.error('Error GET all services:', error);
         res.status(500).json({ message: 'Internal server  GET all services' });
     }

  // try {
  //  const [services] = await pool.execute(`
  //  SELECT
  //  s.*,
  //  sc.name as category_name,
  //  sc.id as category_id
  // FROM services s
  //  LEFT JOIN service_categories sc ON s.category_id = sc.id
  //  ORDER BY s.created_at DESC
  //  `);
  //  // Parse JSON fields
  //  const parsedServices = services.map(service => ({
  //  ...service,
  //  features: service.features ? JSON.parse(service.features) : [],
  //  is_active: service.is_active === 1,
  //  popular: service.popular === 1
  //  }));
  //  res.json(parsedServices);
  // } catch (error) {
  // console.error('Error fetching services:', error);
  // res.status(500).json({ error: 'Failed to fetch services' });
  // }
});

// Get service by ID (admin only)
app.get('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
      try {
                     const { id } = req.params;
                     const snapshot = await db.collection('services').doc(id).get();

                           res.json(snapshot.data());
            } catch (error) {
                console.error('Error Get service by ID:', error);
                res.status(500).json({ message: 'Internal server Get service by ID' });
            }

  // try {
  //  const { id } = req.params;
  //  const [services] = await pool.execute(`
  //  SELECT
  //  s.*,
  //  sc.name as category_name,
  //  sc.id as category_id
  // FROM services s
  //  LEFT JOIN service_categories sc ON s.category_id = sc.id
  //  WHERE s.id = ?
  //  `, [id]);
  //  if (services.length === 0) {
  //  return res.status(404).json({ error: 'Service not found' });
  //  }
  //  const service = services[0];
  //  // Parse JSON fields
  //  service.features = service.features ? JSON.parse(service.features) : [];
  //  service.is_active = service.is_active === 1;
  //  service.popular = service.popular === 1;
  //  res.json(service);
  // } catch (error) {
  // console.error('Error fetching service:', error);
  // res.status(500).json({ error: 'Failed to fetch service' });
  // }
});

// Create new service (admin only)
app.post('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
        const {
      name,
      category_id,
      description,
      price,
      duration,
      features,
      popular,
      is_active
    } = req.body;

           const newData  = {
               name:name,
             category_id:category_id,
              description:description,
                 price:price,
                   duration:duration,
                   features:features,
                    popular:popular,
                   is_active:is_active,
              }

              const Snapshot = await db.collection('services').add(newData)
                 res.json({ message: " Post success" ,id:Snapshot.id});
  // try {
  //  const {
  //  name,
  //  category_id,
  //  description,
  //  price,
  //  duration,
  //  features,
  //  popular,
  //  is_active
  //  } = req.body;
  //  // Validate required fields
  //  if (!name || !category_id || !price) {
  //  return res.status(400).json({ error: 'Name, category, and price are required' });
  //  }
  //  const [result] = await pool.execute(`
  //  INSERT INTO services
  //  (name, category_id, description, price, duration, features, popular, is_active, created_at, updated_at)
  //  VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  //  `, [
  //  name,
  //  category_id,
  //  description || null,
  //  price,
  //  duration || null,
  //  features ? JSON.stringify(features) : null,
  //  popular ? 1 : 0,
  //  is_active ? 1 : 0
  //  ]);
  //  res.status(201).json({
  //  message: 'Service created successfully',
  //  serviceId: result.insertId
  //  });
  // } catch (error) {
  // console.error('Error creating service:', error);
  // res.status(500).json({ error: 'Failed to create service' });
  // }
});

// Update service (admin only)
app.put('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
            const { id } = req.params;
        const {
      name,
      category_id,
      description,
      price,
      duration,
      features,
      popular,
      is_active
    } = req.body;

 const updateDoc = await db.collection('services').doc(id).update({
               name:name,
              category_id:category_id,
              description:description,
                 price:price,
                   duration:duration,
                   features:features,
                    popular:popular,
                   is_active:is_active,

             });

              res.json({
                    message: 'Sucess PUT '
                 });
  // try {
  //  const { id } = req.params;
  //  const {
  //  name,
  //  category_id,
  //  description,
  //  price,
  //  duration,
  //  features,
  //  popular,
  //  is_active
  //  } = req.body;
  //  // Check if service exists
  //  const [services] = await pool.execute('SELECT id FROM services WHERE id = ?', [id]);
  //  if (services.length === 0) {
  //  return res.status(404).json({ error: 'Service not found' });
  //  }
  //  await pool.execute(`
  //  UPDATE services
  //  SET name = ?, category_id = ?, description = ?, price = ?, duration = ?,
  //  features = ?, popular = ?, is_active = ?, updated_at = NOW()
  //  WHERE id = ?
  //  `, [
  //  name,
  //  category_id,
  //  description || null,
  //  price,
  //  duration || null,
  //  features ? JSON.stringify(features) : null,
  //  popular ? 1 : 0,
  //  is_active ? 1 : 0,
  //  id
  //  ]);
  //  res.json({ message: 'Service updated successfully' });
  // } catch (error) {
  // console.error('Error updating service:', error);
  // res.status(500).json({ error: 'Failed to update service' });
  // }
});

// Delete service (admin only)
app.delete('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {

     const { id } = req.params;
                const deleteDoc = await db.collection('services').doc(id).delete();
                 res.json({ message: "Services Deleted Sucessfully" });
  // try {
  //  const { id } = req.params;
  //  // Check if service exists
  //  const [services] = await pool.execute('SELECT id FROM services WHERE id = ?', [id]);
  //  if (services.length === 0) {
  //  return res.status(404).json({ error: 'Service not found' });
  //  }
  //  await pool.execute('DELETE FROM services WHERE id = ?', [id]);
  //  res.json({ message: 'Service deleted successfully' });
  // } catch (error) {
  // console.error('Error deleting service:', error);
  // res.status(500).json({ error: 'Failed to delete service' });
  // }
});

// Get service categories (admin only)
app.get('/api/admin/service-categories', authenticateToken, requireAdmin, async (req, res) => {
     try{
         const snapshot = await db.collection('service_categories').get()
                 res.json(snapshot.docs);
    } catch (error) {
        console.error('Error GET service_categories:', error);
        res.status(500).json({ message: 'Internal server Get service_categories' });
    }
  // try {
  //  const [categories] = await pool.execute(`
  //  SELECT * FROM service_categories
  //  WHERE is_active = 1
  //  ORDER BY name
  //  `);
  //  res.json(categories);
  // } catch (error) {
  // console.error('Error fetching service categories:', error);
  // res.status(500).json({ error: 'Failed to fetch service categories' });
  // }
});

// ==================== ADMIN CALENDAR MANAGEMENT ENDPOINTS ====================

// Get all calendar events (admin only)
app.get('/api/admin/calendar-events', authenticateToken, requireAdmin, async (req, res) => {
    try{

                 const snapshot = await db.collection('custom_calendar_events').get();
                res.json(snapshot.docs)
       } catch (error) {
           console.error('Error Admin GET  custom_calendar_events:', error);
           res.status(500).json({ message: 'Internal server Admin GET  custom_calendar_events' });
       }
  // try {
  //  const [events] = await pool.execute(`
  //  SELECT
  //  cce.*,
  //  u.first_name,
  //  u.last_name,
  //  u.email
  // FROM custom_calendar_events cce
  //  LEFT JOIN users u ON cce.user_id = u.id
  //  ORDER BY cce.event_date DESC, cce.event_time DESC
  //  `);
  //  res.json(events);
  // } catch (error) {
  // console.error('Error fetching calendar events:', error);
  // res.status(500).json({ error: 'Failed to fetch calendar events' });
  // }
});

// Get calendar event by ID (admin only)
app.get('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {

                   const { id } = req.params;
                     const snapshot = await db.collection('custom_calendar_events').doc(id).get();
                    res.json(snapshot)
       } catch (error) {
           console.error('Error Admin GET Id custom_calendar_events:', error);
           res.status(500).json({ message: 'Internal server GET Id custom_calendar_events' });
       }
  // try {
  //  const { id } = req.params;
  //  const [events] = await pool.execute(`
  //  SELECT
  //  cce.*,
  //  u.first_name,
  //  u.last_name,
  //  u.email
  // FROM custom_calendar_events cce
  //  LEFT JOIN users u ON cce.user_id = u.id
  //  WHERE cce.id = ?
  //  `, [id]);
  //  if (events.length === 0) {
  //  return res.status(404).json({ error: 'Calendar event not found' });
  //  }
  //  res.json(events[0]);
  // } catch (error) {
  // console.error('Error fetching calendar event:', error);
  // res.status(500).json({ error: 'Failed to fetch calendar event' });
  // }
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

              const newdata = {
                       user_id:user_id,
                                   title:title,
                                   description:description,
                                   event_date:event_date,
                                   event_time:event_time,
                                   event_type:event_type

                      }
                   const snapshot = await db.collection('custom_calendar_events').add(newdata);

                   res.json({ message: " New success create Data" , id:snapshot.id});
         } catch (error) {
             console.error('Error Admin GET Id custom_calendar_events:', error);
             res.status(500).json({ message: 'Internal server GET Id custom_calendar_events' });
         }

  // try {
  //  const {
  //  user_id,
  //  title,
  //  description,
  //  event_date,
  //  event_time,
  //  event_type
  //  } = req.body;
  //  // Validate required fields
  //  if (!title || !event_date) {
  //  return res.status(400).json({ error: 'Title and date are required' });
  //  }
  //  // Validate date format
  //  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  //  if (!dateRegex.test(event_date)) {
  //  return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  //  }
  //  const [result] = await pool.execute(`
  //  INSERT INTO custom_calendar_events
  //  (user_id, title, description, event_date, event_time, event_type, created_at, updated_at)
  //  VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
  //  `, [
  //  user_id || null,
  //  title,
  //  description || null,
  //  event_date,
  //  event_time || null,
  //  event_type || 'custom'
  //  ]);
  //  res.status(201).json({
  //  message: 'Calendar event created successfully',
  //  eventId: result.insertId
  //  });
  // } catch (error) {
  // console.error('Error creating calendar event:', error);
  // res.status(500).json({ error: 'Failed to create calendar event' });
  // }
});

// Update calendar event (admin only)
app.put('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {

   try{
      const { id } = req.params;
    const {
      user_id,
      title,
      description,
      event_date,
      event_time,
      event_type
    } = req.body;
         const updateDoc = await db.collection('custom_calendar_events').doc(id).update({
            user_id,
           title,
           description,
           event_date,
           event_time,
           event_type
         });
          res.json({
                        message: 'Successfully'
                     });
   } catch (error) {
       console.error('Error PUT  custom_calendar_events/:id:', error);
       res.status(500).json({ message: 'Internal server PUT custom_calendar_events/:id' });
   }

  // try {
  //  const { id } = req.params;
  //  const {
  //  user_id,
  //  title,
  //  description,
  //  event_date,
  //  event_time,
  //  event_type
  //  } = req.body;
  //  // Check if event exists
  //  const [events] = await pool.execute('SELECT id FROM custom_calendar_events WHERE id = ?', [id]);
  //  if (events.length === 0) {
  //  return res.status(404).json({ error: 'Calendar event not found' });
  //  }
  //  // Validate date format if provided
  //  if (event_date) {
  //  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  //  if (!dateRegex.test(event_date)) {
  //  return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  //  }
  //  }
  //  await pool.execute(`
  //  UPDATE custom_calendar_events
  //  SET user_id = ?, title = ?, description = ?, event_date = ?,
  //  event_time = ?, event_type = ?, updated_at = NOW()
  //  WHERE id = ?
  //  `, [
  //  user_id || null,
  //  title,
  //  description || null,
  //  event_date,
  //  event_time || null,
  //  event_type || 'custom',
  //  id
  //  ]);
  //  res.json({ message: 'Calendar event updated successfully' });
  // } catch (error) {
  // console.error('Error updating calendar event:', error);
  // res.status(500).json({ error: 'Failed to update calendar event' });
  // }
});

// Delete calendar event (admin only)
app.delete('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {

      try{
         const { id } = req.params;
      const snapshot = await db.collection('custom_calendar_events').doc(id).delete();

             res.json({
                          message: ' Delete'
                       });
        } catch (error) {
            console.error('Error  Admin   delte custom_calendar_events:', error);
            res.status(500).json({ message: 'Internal server Admin delte custom_calendar_events' });
        }
  // try {
  //  const { id } = req.params;
  //  // Check if event exists
  //  const [events] = await pool.execute('SELECT id FROM custom_calendar_events WHERE id = ?', [id]);
  //  if (events.length === 0) {
  //  return res.status(404).json({ error: 'Calendar event not found' });
  //  }
  //  await pool.execute('DELETE FROM custom_calendar_events WHERE id = ?', [id]);
  //  res.json({ message: 'Calendar event deleted successfully' });
  // } catch (error) {
  // console.error('Error deleting calendar event:', error);
  // res.status(500).json({ error: 'Failed to delete calendar event' });
  // }
});

// Get all users for dropdown (admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
            try {
                  const snapshots = await db.collection('users').get();
                         const data2 = snapshots.docs;
                   res.json(data2);

             } catch (error) {
                 console.error('Error Admin GET all /admin/users', error);
                 res.status(500).json({ message: 'Internal server  all /admin/users' });
             }
  // try {
  //  const [users] = await pool.execute(`
  //  SELECT id, first_name, last_name, email
  // FROM users
  //  WHERE is_active = 1
  //  ORDER BY first_name, last_name
  //  `);
  //  res.json(users);
  // } catch (error) {
  // console.error('Error fetching users:', error);
  // res.status(500).json({ error: 'Failed to fetch users' });
  // }
});

// ==================== ADMIN SERVICE REQUEST MANAGEMENT PAGE ====================

// Updated GET endpoint for service requests
app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
       try{
         const snapshot = await db.collection('service_requests').get()
          res.json(snapshot.docs);
       }catch(e){
           console.log("error" , "Admin get service_requests");
       }
  // try {
  //  const [requests] = await pool.execute(`
  //  SELECT
  //  sr.id,
  //  sr.full_name as name,
  //  sc.name as service,
  //  DATE_FORMAT(sr.created_at, '%d %b %Y') as date,
  //  sr.status,
  //  sr.email,
  //  sr.phone,
  //  sr.company,
  //  sr.website,
  //  sr.project_details,
  //  sr.budget_range,
  //  sr.timeline,
  //  sr.contact_method,
  //  sr.additional_requirements,
  //  sr.user_id,
  //  u.first_name as user_first_name,
  //  u.last_name as user_last_name,
  //  u.account_type as user_account_type
  // FROM service_requests sr
  //  LEFT JOIN service_subcategories sc ON sr.subcategory_id = sc.id
  //  LEFT JOIN users u ON sr.user_id = u.id
  //  ORDER BY sr.created_at DESC
  //  `);
  //  res.json(requests);
  // } catch (error) {
  // console.error('Error fetching service requests:', error);
  // res.status(500).json({ error: 'Failed to fetch service requests', details: error.message });
  // }
});

// Updated PUT endpoint for service requests
app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
             const { id } = req.params;
                 const { status, project_details, budget_range, timeline, additional_requirements } = req.body;

                  const updateData = {
                                   status:status,
                                    project_details:project_details,
                                        budget_range:budget_range,
                                         timeline:timeline,
                                             additional_requirements:additional_requirements

                  }
                      const usersShot = await db.collection('service_requests').doc(id).update(updateData);
                           res.json({
                                      message: 'Success Update Data'
                                   });
  // try {
  //  const { id } = req.params;
  //  const { status, project_details, budget_range, timeline, additional_requirements } = req.body;
  //  const [result] = await pool.execute(
  //  `UPDATE service_requests SET
  //  status = ?,
  //  project_details = ?,
  //  budget_range = ?,
  //  timeline = ?,
  //  additional_requirements = ?,
  //  updated_at = NOW()
  //  WHERE id = ?`,
  //  [status, project_details, budget_range, timeline, additional_requirements, id]
  //  );
  //  if (result.affectedRows === 0) {
  //  return res.status(404).json({ error: 'Service request not found' });
  //  }
  //  res.json({ message: 'Service request updated successfully' });
  // } catch (error) {
  // console.error('Error updating service request:', error);
  // res.status(500).json({ error: 'Failed to update service request', details: error.message });
  // }
});

// PUT /api/admin/service-requests/:id - Update service request status
app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {

            const { id } = req.params;
               const { status} = req.body;
         const updateData = {
                         status:status,

                      }
                        const usersShot = await db.collection('service_requests').doc(id).update(updateData);
                             res.json({
                                        message: 'Success Update  state'
                                     });

  // try {
  //  const { id } = req.params;
  //  const { status } = req.body;
  //  const [result] = await pool.execute(
  //  'UPDATE service_requests SET status = ?, updated_at = NOW() WHERE id = ?',
  //  [status, id]
  //  );
  //  if (result.affectedRows === 0) {
  //  return res.status(404).json({ error: 'Service request not found' });
  //  }
  //  res.json({ message: 'Service request updated successfully' });
  // } catch (error) {
  // console.error('Error updating service request:', error);
  // res.status(500).json({ error: 'Failed to update service request', details: error.message });
  // }
});

// DELETE /api/admin/service-requests/:id - Delete service request
app.delete('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {

      const { id } = req.params;
         const deleteDoc = await db.collection('service_requests').doc(id).delete();
            res.json({ message: "Sucess Delete the  Data" });
  // try {
  //  const { id } = req.params;
  //  const [result] = await pool.execute(
  //  'DELETE FROM service_requests WHERE id = ?',
  //  [id]
  //  );
  //  if (result.affectedRows === 0) {
  //  return res.status(404).json({ error: 'Service request not found' });
  //  }
  //  res.json({ message: 'Service request deleted successfully' });
  // } catch (error) {
  // console.error('Error deleting service request:', error);
  // res.status(500).json({ error: 'Failed to delete service request', details: error.message });
  // }
});

// ==================== UTILITY ROUTES ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
        const data  = {
               status:"ok",
               time :   new Date().toISOString()
        }
         res.json(data);

  // res.json({
  //  status: 'OK',
  //  timestamp: new Date().toISOString(),
  //  uptime: process.uptime()
  // });
});

// Get server info
app.get('/api/info', (req, res) => {

          const datas = {
                   name:"Padak Dashboard API",
                   version:"1.0",
                   environment:"Testing now",
                  date: new Date().toISOString()

          }
           res.json(datas);
  // res.json({
  //  name: 'Padak Dashboard API',
  //  version: '1.0.0',
  //  environment: process.env.NODE_ENV || 'development',
  //  timestamp: new Date().toISOString()
  // });
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
    // await pool.end();
    process.exit(0);
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;