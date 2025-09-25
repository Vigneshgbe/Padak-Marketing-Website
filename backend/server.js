// server.js - Firebase Firestore Version
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, limit, addDoc, serverTimestamp, increment, arrayUnion, arrayRemove } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');

const app = express();
const port = process.env.PORT || 5000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Firebase configuration
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
const storage = getStorage(firebaseApp);

// Collections mapping to original MySQL tables
const COLLECTIONS = {
  USERS: 'users',
  USER_STATS: 'user_stats',
  COURSES: 'courses',
  ENROLLMENTS: 'enrollments',
  ASSIGNMENTS: 'assignments',
  ASSIGNMENT_SUBMISSIONS: 'assignment_submissions',
  SOCIAL_ACTIVITIES: 'social_activities',
  USER_CONNECTIONS: 'user_connections',
  RESOURCES: 'resources',
  CERTIFICATES: 'certificates',
  INTERNSHIPS: 'internships',
  INTERNSHIP_SUBMISSIONS: 'internship_submissions',
  SERVICE_CATEGORIES: 'service_categories',
  SERVICE_SUBCATEGORIES: 'service_subcategories',
  SERVICES: 'services',
  SERVICE_REQUESTS: 'service_requests',
  CONTACT_MESSAGES: 'contact_messages',
  PAYMENTS: 'payments',
  DOWNLOAD_LOGS: 'download_logs',
  CUSTOM_CALENDAR_EVENTS: 'custom_calendar_events',
  COURSE_ENROLL_REQUESTS: 'course_enroll_requests',
  USER_RESOURCES: 'user_resources'
};

// Create necessary directories for local file handling (for compatibility)
const assignmentsDir = path.join(__dirname, 'uploads', 'assignments');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });

const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const paymentsDir = path.join(__dirname, 'uploads', 'payments');
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

// ===== MULTER CONFIGURATIONS (For file uploads to Firebase Storage) =====

// Avatar upload configuration
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatars'));
    }
  }
});

// Assignment upload configuration
const assignmentUpload = multer({
  storage: multer.memoryStorage(),
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

// Payment screenshot upload configuration
const paymentScreenshotUpload = multer({
  storage: multer.memoryStorage(),
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

// Payment proof upload configuration
const paymentProofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

// Social post image upload configuration
const socialUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
  }
}).single('image');

// ===== FIREBASE STORAGE HELPER FUNCTIONS =====

const uploadToFirebase = async (file, folder, fileName) => {
  try {
    const storageRef = ref(storage, `${folder}/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file.buffer);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading to Firebase Storage:', error);
    throw error;
  }
};

const deleteFromFirebase = async (fileUrl) => {
  try {
    if (!fileUrl) return;
    
    // Extract file path from URL
    const matches = fileUrl.match(/\/o\/(.+)\?/);
    if (matches && matches[1]) {
      const filePath = decodeURIComponent(matches[1]);
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
    }
  } catch (error) {
    console.error('Error deleting from Firebase Storage:', error);
  }
};

// ===== CORS configuration =====
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
    const usersQuery = query(
      collection(db, COLLECTIONS.USERS), 
      where('email', '==', email.trim())
    );
    const querySnapshot = await getDocs(usersQuery);
    
    if (!querySnapshot.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user document
    const userRef = doc(collection(db, COLLECTIONS.USERS));
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

    await setDoc(userRef, userData);

    // Create user stats entry
    const statsRef = doc(db, COLLECTIONS.USER_STATS, userRef.id);
    await setDoc(statsRef, {
      user_id: userRef.id,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      last_activity: serverTimestamp()
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
    const usersQuery = query(
      collection(db, COLLECTIONS.USERS), 
      where('email', '==', email),
      where('is_active', '==', true)
    );
    const querySnapshot = await getDocs(usersQuery);

    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const userDoc = querySnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

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
app.post('/api/auth/avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `avatar-${uniqueSuffix}${fileExtension}`;

    // Upload to Firebase Storage
    const downloadURL = await uploadToFirebase(req.file, 'avatars', fileName);

    // Delete old avatar if exists
    if (req.user.profile_image) {
      await deleteFromFirebase(req.user.profile_image);
    }

    // Update user profile image
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      profile_image: downloadURL,
      updated_at: serverTimestamp()
    });

    res.status(200).send(downloadURL);

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
        coursesEnrolled: userStats.courses_enrolled || 0,
        coursesCompleted: userStats.courses_completed || 0,
        certificatesEarned: userStats.certificates_earned || 0,
        learningStreak: userStats.learning_streak || 0,
        lastActivity: userStats.last_activity?.toDate().toISOString() || new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== SOCIAL FEED FUNCTIONALITY ====================

// Helper function to get full URL for images
const getFullImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return imagePath; // Firebase URLs are already full URLs
};

// GET All Posts (with Pagination, Likes, Comments, etc.)
app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    // Get user connections
    const connectionsQuery = query(
      collection(db, COLLECTIONS.USER_CONNECTIONS),
      where('status', '==', 'accepted'),
      where('user_id_1', '==', userId)
    );
    const connectionsSnapshot = await getDocs(connectionsQuery);
    const connectedUserIds = connectionsSnapshot.docs.map(doc => doc.data().user_id_2);
    connectedUserIds.push(userId); // Include current user

    // Build query for posts
    let postsQuery = query(
      collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
      where('activity_type', '==', 'post'),
      orderBy('created_at', 'desc'),
      limit(limit * page)
    );

    const postsSnapshot = await getDocs(postsQuery);
    let posts = [];

    for (const postDoc of postsSnapshot.docs) {
      const post = { id: postDoc.id, ...postDoc.data() };
      
      // Check visibility
      if (post.visibility === 'public' || 
          post.user_id === userId || 
          (post.visibility === 'connections' && connectedUserIds.includes(post.user_id))) {
        
        // Get user info
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, post.user_id));
        const user = userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;

        if (user) {
          // Get likes count
          const likesQuery = query(
            collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
            where('activity_type', '==', 'like'),
            where('target_id', '==', post.id)
          );
          const likesSnapshot = await getDocs(likesQuery);

          // Get comments
          const commentsQuery = query(
            collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
            where('activity_type', '==', 'comment'),
            where('target_id', '==', post.id),
            orderBy('created_at', 'asc')
          );
          const commentsSnapshot = await getDocs(commentsQuery);
          const comments = [];

          for (const commentDoc of commentsSnapshot.docs) {
            const comment = { id: commentDoc.id, ...commentDoc.data() };
            const commentUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, comment.user_id));
            const commentUser = commentUserDoc.exists() ? { id: commentUserDoc.id, ...commentUserDoc.data() } : null;
            
            if (commentUser) {
              comments.push({
                ...comment,
                user: {
                  id: commentUser.id,
                  first_name: commentUser.first_name,
                  last_name: commentUser.last_name,
                  profile_image: getFullImageUrl(req, commentUser.profile_image),
                  account_type: commentUser.account_type
                }
              });
            }
          }

          // Check if current user has liked or bookmarked
          const userLikeQuery = query(
            collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
            where('activity_type', '==', 'like'),
            where('target_id', '==', post.id),
            where('user_id', '==', userId)
          );
          const userLikeSnapshot = await getDocs(userLikeQuery);

          const userBookmarkQuery = query(
            collection(db, COLLECTIONS.SOCIAL_ACTIVITIES),
            where('activity_type', '==', 'bookmark'),
            where('target_id', '==', post.id),
            where('user_id', '==', userId)
          );
          const userBookmarkSnapshot = await getDocs(userBookmarkQuery);

          posts.push({
            ...post,
            has_liked: !userLikeSnapshot.empty,
            has_bookmarked: !userBookmarkSnapshot.empty,
            likes: likesSnapshot.size,
            comment_count: commentsSnapshot.size,
            image_url: getFullImageUrl(req, post.image_url),
            user: {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              profile_image: getFullImageUrl(req, user.profile_image),
              account_type: user.account_type
            },
            comments: comments
          });
        }
      }
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedPosts = posts.slice(startIndex, startIndex + limit);

    res.json({
      posts: paginatedPosts,
      pagination: {
        page,
        totalPages: Math.ceil(posts.length / limit),
        totalPosts: posts.length
      }
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

      let imageUrl = null;
      if (req.file) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `social-${uniqueSuffix}${fileExtension}`;
        imageUrl = await uploadToFirebase(req.file, 'social', fileName);
      }

      const isAchievement = achievement === 'true';

      // Create post document
      const postRef = doc(collection(db, COLLECTIONS.SOCIAL_ACTIVITIES));
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

      await setDoc(postRef, postData);

      // Get user info for response
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      const user = userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(201).json({
        id: postRef.id,
        ...postData,
        has_liked: false,
        has_bookmarked: false,
        likes: 0,
        comment_count: 0,
        image_url: getFullImageUrl(req, imageUrl),
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_image: getFullImageUrl(req, user.profile_image),
          account_type: user.account_type
        },
        comments: []
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post.' });
    }
  });
});

// [Additional social functionality routes would follow similar pattern...]

// ==================== COURSES ROUTES ====================

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const coursesQuery = query(
      collection(db, COLLECTIONS.COURSES),
      where('is_active', '==', true),
      orderBy('created_at', 'desc')
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
      const enrollment = { id: enrollmentDoc.id, ...enrollmentDoc.data() };
      
      // Get course details
      const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, enrollment.course_id));
      if (courseDoc.exists()) {
        const course = { id: courseDoc.id, ...courseDoc.data() };
        
        enrollments.push({
          id: enrollment.id,
          userId: enrollment.user_id,
          courseId: enrollment.course_id,
          progress: enrollment.progress,
          enrollmentDate: enrollment.enrollment_date,
          completionDate: enrollment.completion_date,
          status: enrollment.status,
          course: course
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

    // Check if course exists and is active
    const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, courseId));
    if (!courseDoc.exists() || !courseDoc.data().is_active) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    const enrollmentRef = doc(collection(db, COLLECTIONS.ENROLLMENTS));
    await setDoc(enrollmentRef, {
      user_id: userId,
      course_id: courseId,
      progress: 0,
      status: 'active',
      enrollment_date: serverTimestamp(),
      completion_date: null
    });

    // Update user stats
    const statsDoc = await getDoc(doc(db, COLLECTIONS.USER_STATS, userId));
    if (statsDoc.exists()) {
      await updateDoc(doc(db, COLLECTIONS.USER_STATS, userId), {
        courses_enrolled: increment(1),
        last_activity: serverTimestamp()
      });
    }

    res.status(201).json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// [Additional courses routes would follow similar pattern...]

// ==================== ASSIGNMENTS ROUTES ====================

// Get user's assignments
app.get('/api/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's enrolled courses
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
      const assignment = { id: assignmentDoc.id, ...assignmentDoc.data() };
      
      // Get course details
      const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, assignment.course_id));
      const course = courseDoc.exists() ? { id: courseDoc.id, ...courseDoc.data() } : null;

      // Get submission if exists
      const submissionQuery = query(
        collection(db, COLLECTIONS.ASSIGNMENT_SUBMISSIONS),
        where('assignment_id', '==', assignment.id),
        where('user_id', '==', userId)
      );
      
      const submissionSnapshot = await getDocs(submissionQuery);
      const submission = submissionSnapshot.empty ? null : {
        id: submissionSnapshot.docs[0].id,
        ...submissionSnapshot.docs[0].data()
      };

      if (course) {
        assignments.push({
          id: assignment.id,
          course_id: assignment.course_id,
          title: assignment.title,
          description: assignment.description,
          due_date: assignment.due_date,
          max_points: assignment.max_points,
          created_at: assignment.created_at,
          course: {
            id: course.id,
            title: course.title,
            category: course.category
          },
          submission: submission
        });
      }
    }

    // Sort by due date
    assignments.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Submit assignment
app.post('/api/assignments/submit', authenticateToken, assignmentUpload.single('file'), async (req, res) => {
  try {
    const { assignment_id, content } = req.body;
    const userId = req.user.id;

    if (!assignment_id) {
      return res.status(400).json({ error: 'Assignment ID is required' });
    }

    if (!content && !req.file) {
      return res.status(400).json({ error: 'Either content or file is required' });
    }

    // Check if assignment exists and user is enrolled
    const assignmentDoc = await getDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignment_id));
    if (!assignmentDoc.exists()) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const courseId = assignmentDoc.data().course_id;
    
    const enrollmentQuery = query(
      collection(db, COLLECTIONS.ENROLLMENTS),
      where('user_id', '==', userId),
      where('course_id', '==', courseId)
    );
    
    const enrollmentSnapshot = await getDocs(enrollmentQuery);
    if (enrollmentSnapshot.empty) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
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

    let fileUrl = null;
    if (req.file) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `assignment-${uniqueSuffix}${fileExtension}`;
      fileUrl = await uploadToFirebase(req.file, 'assignments', fileName);
    }

    // Create submission
    const submissionRef = doc(collection(db, COLLECTIONS.ASSIGNMENT_SUBMISSIONS));
    await setDoc(submissionRef, {
      assignment_id: assignment_id,
      user_id: userId,
      content: content || '',
      file_path: fileUrl,
      submitted_at: serverTimestamp(),
      grade: null,
      feedback: null,
      status: 'submitted'
    });

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission_id: submissionRef.id
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// [Additional assignment routes would follow similar pattern...]

// ==================== RESOURCES ROUTES ====================

// GET resources for current user
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const accountType = req.user.account_type;

    const resourcesQuery = query(collection(db, COLLECTIONS.RESOURCES));
    const resourcesSnapshot = await getDocs(resourcesQuery);
    
    const resources = resourcesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        allowed_account_types: doc.data().allowed_account_types || []
      }))
      .filter(resource => 
        resource.allowed_account_types.includes(accountType)
      );

    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// [Additional resources routes would follow similar pattern...]

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

    // Create contact message document
    const contactRef = doc(collection(db, COLLECTIONS.CONTACT_MESSAGES));
    await setDoc(contactRef, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      company: company || null,
      message: message.trim(),
      status: 'pending',
      created_at: serverTimestamp()
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

    // Calculate total revenue (simplified - sum of course prices for completed enrollments)
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

    // Get pending contacts from last 7 days
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

// [Additional admin routes would follow similar pattern...]

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

      // Upload payment screenshot
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `payment-${uniqueSuffix}${fileExtension}`;
      const paymentScreenshotUrl = await uploadToFirebase(req.file, 'payments', fileName);

      // Create enrollment request document
      const requestRef = doc(collection(db, COLLECTIONS.COURSE_ENROLL_REQUESTS));
      await setDoc(requestRef, {
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
        payment_screenshot: paymentScreenshotUrl,
        status: 'pending',
        created_at: serverTimestamp()
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

// ==================== UTILITY ROUTES ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'Firebase Firestore'
  });
});

// Get server info
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Padak Dashboard API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'Firebase Firestore',
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

  if (err.message.includes('Only image files are allowed')) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: Firebase Firestore`);
});

module.exports = app;