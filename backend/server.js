require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const app = express();
const port = process.env.PORT || 5000;

// Load service account from environment variable or file
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

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Create necessary directories
const assignmentsDir = path.join(__dirname, 'uploads', 'assignments');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });

const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const paymentsDir = path.join(__dirname, 'uploads', 'payments');
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

const db = admin.firestore();

// CORS configuration
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
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads', 'avatars')));

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
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
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

// Helper function to add timestamps
const addTimestamps = (data) => {
  data.created_at = admin.firestore.FieldValue.serverTimestamp();
  data.updated_at = admin.firestore.FieldValue.serverTimestamp();
  return data;
};

// Helper function to get user document
const getUserDocument = async (userId) => {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new Error('User not found');
  }
  return userDoc.data();
};

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, phone, password, accountType } = req.body;

  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const userDoc = await db.collection('users').where('email', '==', email.trim()).get();
    if (!userDoc.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = db.collection('users').doc().id;
    const user = {
      id: userId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      password_hash: hashedPassword,
      account_type: accountType || 'student',
      ...addTimestamps({})
    };

    await db.collection('users').doc(userId).set(user);
    await db.collection('user_stats').doc(userId).set({
      user_id: userId,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      ...addTimestamps({})
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
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userDoc = await db.collection('users').where('email', '==', email.trim()).get();
    if (userDoc.empty) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const user = userDoc.docs[0].data();
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

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

    await db.collection('users').doc(user.id).update({ updated_at: admin.firestore.FieldValue.serverTimestamp() });

    console.log('User logged in successfully:', { userId: user.id, email: user.email });
    res.status(200).json({
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await getUserDocument(req.user.uid);
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { firstName, lastName, phone, company, website, bio } = req.body;

  try {
    const userId = req.user.uid;
    await db.collection('users').doc(userId).update({
            first_name: firstName,
      last_name: lastName,
      phone,
      company,
      website,
      bio,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedUser = await getUserDocument(userId);
    res.json(updatedUser);

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload avatar
app.post('/api/auth/avatar', authenticateToken, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const userId = req.user.uid;
  const profileImage = `/uploads/avatars/${req.file.filename}`;

  try {
    await db.collection('users').doc(userId).update({
      profile_image: profileImage,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).send(profileImage);

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  const userId = req.user.uid;

  try {
    const statsDoc = await db.collection('user_stats').doc(userId).get();
    if (!statsDoc.exists) {
      await db.collection('user_stats').doc(userId).set({
        user_id: userId,
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        ...addTimestamps({})
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
      res.json(userStats);
    }

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all posts
app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.uid;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  try {
    const postsSnapshot = await db.collection('social_activities')
      .where('activity_type', '==', 'post')
      .where('visibility', 'in', ['public', 'connections'])
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const posts = postsSnapshot.docs.map(doc => {
      const postData = doc.data();
      return {
        id: doc.id,
        user_id: postData.user_id,
        content: postData.content,
        image_url: postData.image_url,
        created_at: postData.created_at.toDate(),
        updated_at: postData.updated_at.toDate(),
        visibility: postData.visibility,
        achievement: postData.achievement,
        share_count: postData.share_count,
        user: {
          id: postData.user_id,
          first_name: postData.first_name,
          last_name: postData.last_name,
          profile_image: postData.profile_image,
          account_type: postData.account_type
        },
        comments: postData.comments || []
      };
    });

    const totalPostsSnapshot = await db.collection('social_activities')
      .where('activity_type', '==', 'post')
      .where('visibility', 'in', ['public', 'connections'])
      .get();
    const totalPosts = totalPostsSnapshot.size;
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts,
      pagination: { page, totalPages, totalPosts }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

// Create a new post
app.post('/api/posts', authenticateToken, async (req, res) => {
  const { content, achievement, visibility } = req.body;
  const userId = req.user.uid;

  if (!content && !req.file) {
    return res.status(400).json({ error: 'Post must have content or an image.' });
  }

  const imageUrl = req.file ? `/uploads/social/${req.file.filename}` : null;
  const postData = {
    user_id: userId,
    activity_type: 'post',
    content: content || '',
    image_url: imageUrl,
    achievement: achievement === 'true',
    visibility,
    ...addTimestamps({})
  };

  try {
    const postRef = await db.collection('social_activities').add(postData);
    const postId = postRef.id;

    const newPostSnapshot = await postRef.get();
    const newPost = newPostSnapshot.data();

    res.status(201).json({
      ...newPost,
      has_liked: false,
      has_bookmarked: false,
      likes: 0,
      comment_count: 0,
      image_url: imageUrl,
      user: {
        id: newPost.user_id,
        first_name: newPost.first_name,
        last_name: newPost.last_name,
        profile_image: newPost.profile_image,
        account_type: newPost.account_type
      },
      comments: []
    });

  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

// Edit a post
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.uid;

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
      content,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Post updated successfully.' });

  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post.' });
  }
});

// Delete a post
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;

  try {
    const postDoc = await db.collection('social_activities').doc(id).get();
    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const postData = postDoc.data();
    if (postData.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    await db.collection('social_activities').doc(id).delete();

    if (postData.image_url) {
      const filePath = path.join(__dirname, postData.image_url);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting post image:", err);
        });
      }
    }    res.json({ message: 'Post deleted successfully.' });

  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// Post a comment on a post
app.post('/api/posts/:id/comment', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const { content } = req.body;
  const userId = req.user.uid;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Comment cannot be empty.' });
  }

  try {
    const commentId = db.collection('social_activities').doc().id;
    const commentData = {
      user_id: userId,
      activity_type: 'comment',
      content,
      target_id: targetId,
      ...addTimestamps({})
    };

    await db.collection('social_activities').doc(commentId).set(commentData);

    const newCommentSnapshot = await db.collection('social_activities').doc(commentId).get();
    const newComment = newCommentSnapshot.data();

    res.status(201).json({
      ...newComment,
      user: {
        id: newComment.user_id,
        first_name: newComment.first_name,
        last_name: newComment.last_name,
        profile_image: newComment.profile_image
      }
    });

  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

// Like a post
app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.uid;

  try {
    await db.collection('social_activities').add({
      user_id: userId,
      activity_type: 'like',
      target_id: targetId,
      ...addTimestamps({})
    });

    res.status(201).json({ message: 'Post liked.' });

  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post.' });
  }
});

// Unlike a post
app.delete('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.uid;

  try {
    await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'like')
      .where('target_id', '==', targetId)
      .get()
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          doc.ref.delete();
        });
      });

    res.json({ message: 'Post unliked.' });

  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ error: 'Failed to unlike post.' });
  }
});

// Bookmark a post
app.post('/api/posts/:id/bookmark', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.uid;

  try {
    await db.collection('social_activities').add({
      user_id: userId,
      activity_type: 'bookmark',
      target_id: targetId,
      ...addTimestamps({})
    });

    res.status(201).json({ message: 'Post bookmarked.' });

  } catch (error) {
    console.error('Error bookmarking post:', error);
    res.status(500).json({ error: 'Failed to bookmark post.' });
  }
});

// Unbookmark a post
app.delete('/api/posts/:id/bookmark', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.uid;

  try {
    await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'bookmark')
      .where('target_id', '==', targetId)
      .get()
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          doc.ref.delete();
        });
      });

    res.json({ message: 'Post unbookmarked.' });

  } catch (error) {
    console.error('Error unbookmarking post:', error);
    res.status(500).json({ error: 'Failed to unbookmark post.' });
  }
});

// Track a share
app.post('/api/posts/:id/share', authenticateToken, async (req, res) => {
  const postId = req.params.id;

  try {
    await db.collection('social_activities').doc(postId).update({
      share_count: admin.firestore.FieldValue.increment(1)
    });

    res.json({ message: 'Share tracked.' });

  } catch (error) {
    console.error('Error tracking share:', error);
    res.status(500).json({ error: 'Failed to track share.' });
  }
});

// Get enrolled courses
app.get('/api/users/:userId/enrollments', authenticateToken, async (req, res) => {
  const userId = req.user.uid;

  if (parseInt(req.params.userId, 10) !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own enrollment data.' });
  }

  try {
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .get();

    const enrollments = enrollmentsSnapshot.docs.map(doc => {
      const enrollmentData = doc.data();
      return {
        id: doc.id,
        progress: enrollmentData.progress,
        status: enrollmentData.status,
        enrollment_date: enrollmentData.enrollment_date.toDate(),
        completion_date: enrollmentData.completion_date ? enrollmentData.completion_date.toDate() : null,
        course_id: enrollmentData.course_id,
        courseTitle: enrollmentData.courseTitle,
        instructorName: enrollmentData.instructorName,
        durationWeeks: enrollmentData.durationWeeks
      };
    });

    res.json(enrollments);

  } catch (error) {
    console.error('Error fetching user enrollments for dashboard:', error);
    res.status(500).json({ error: 'Internal server error while fetching enrolled courses.' });
  }
});

// Get internship submissions
app.get('/api/users/:userId/internship-submissions', authenticateToken, async (req, res) => {
  const userId = req.user.uid;

  if (parseInt(req.params.userId, 10) !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own internship submissions.' });
  }

  try {
    const applicationsSnapshot = await db.collection('internship_submissions')
      .where('user_id', '==', userId)
      .get();

    const applications = applicationsSnapshot.docs.map(doc => {
      const appData = doc.data();
      return {
        id: doc.id,
        internship_id: appData.internship_id,
        applicationStatus: appData.status,
        applicationDate: appData.submitted_at.toDate(),
        internshipTitle: appData.title,
        companyName: appData.company
      };
    });

    res.json(applications);

  } catch (error) {
    console.error('Error fetching user internship applications for dashboard:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// Submit a new service request
app.post('/api/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.uid;
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

  if (!userId || !categoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
      return res.status(400).json({ error: 'Missing required fields for service request.' });
    }

    try {
      const requestId = db.collection('service_requests').doc().id;
      const requestData = {
        user_id: userId,
        subcategory_id: categoryId,
        full_name: fullName,
        email,
        phone,
        company,
        website,
        project_details: projectDetails,
        budget_range: budgetRange,
        timeline,
        contact_method: contactMethod,
        additional_requirements: additionalRequirements || '',
        status: 'pending',
        ...addTimestamps({})
      };

      await db.collection('service_requests').doc(requestId).set(requestData);

      res.status(201).json({
        message: 'Service request submitted successfully!',
        id: requestId
      });

    } catch (error) {
      console.error('Error submitting service request:', error);
      res.status(500).json({ error: 'Failed to submit service request.' });
    }
});

// Fetch all services
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const servicesSnapshot = await db.collection('services').where('is_active', '==', true).get();
    const services = servicesSnapshot.docs.map(doc => {
      const serviceData = doc.data();
      return {
        id: doc.id,
        name: serviceData.name,
        category_id: serviceData.category_id,
        description: serviceData.description,
        price: serviceData.price,
        duration: serviceData.duration,
        rating: serviceData.rating,
        reviews: serviceData.reviews,
        popular: serviceData.popular,
        created_at: serviceData.created_at.toDate(),
        updated_at: serviceData.updated_at.toDate()
      };
    });

    res.json(services);

  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services.' });
  }
});

// Fetch user's service requests
app.get('/api/users/:userId/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.uid;

  if (parseInt(req.params.userId, 10) !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
  }

  try {
    const requestsSnapshot = await db.collection('service_requests')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const requests = requestsSnapshot.docs.map(doc => {
      const requestData = doc.data();
      return {
        id: doc.id,
        user_id: requestData.user_id,
        subcategory_id: requestData.subcategory_id,
        full_name: requestData.full_name,
        email: requestData.email,
        phone: requestData.phone,
        company: requestData.company,
        website: requestData.website,
        project_details: requestData.project_details,
        budget_range: requestData.budget_range,
        timeline: requestData.timeline,
        contact_method: requestData.contact_method,
        additional_requirements: requestData.additional_requirements,
        status: requestData.status,
        created_at: requestData.created_at.toDate(),
        updated_at: requestData.updated_at.toDate()
      };
    });

    res.json(requests);

  } catch (error) {
    console.error('Error fetching user service requests:', error);
    res.status(500).json({ error: 'Failed to fetch user service requests.' });
  }
});

// Get calendar events
app.get('/api/calendar/events', authenticateToken, async (req, res) => {
  const userId = req.user.uid;

  try {
    const courseEventsSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .get();

    const courseEvents = courseEventsSnapshot.docs.map(doc => {
      const enrollmentData = doc.data();
      const course = {
        id: enrollmentData.course_id,
        title: enrollmentData.courseTitle,
        category: enrollmentData.courseCategory
      };
      return {
        id: `course-${enrollmentData.course_id}`,
        title: `Course: ${enrollmentData.courseTitle}`,
        description: enrollmentData.courseDescription,
        start: enrollmentData.enrollment_date.toDate(),
        end: enrollmentData.completion_date ? enrollmentData.completion_date.toDate() : null,
        type: 'course',
        course
      };
    });

    const assignmentEventsSnapshot = await db.collection('assignments').where('due_date', '>', new Date()).get();
    const assignmentEvents = assignmentEventsSnapshot.docs.map(doc => {
      const assignmentData = doc.data();
      const course = {
        id: assignmentData.course_id,
        title: assignmentData.courseTitle,
        category: assignmentData.courseCategory
      };
      return {
        id: `assignment-${doc.id}`,
        title: assignmentData.title,
        description: assignmentData.description,
        start: assignmentData.due_date.toDate(),
        end: assignmentData.due_date.toDate(),
        type: 'assignment',
        course
      };
    });

    const customEventsSnapshot = await db.collection('custom_calendar_events').where('user_id', '==', userId).get();
    const customEvents = customEventsSnapshot.docs.map(doc => {
      const eventData = doc.data();
      return {
        id: `custom-${doc.id}`,
        title: eventData.title,
        description: eventData.description,
        start: eventData.event_date.toDate(),
        end: eventData.event_date.toDate(),
        type: 'custom',
        course: null
      };
    });

    const allEvents = [...courseEvents, ...assignmentEvents, ...customEvents];
    res.json(allEvents);

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events.' });
  }
});

// Create a custom calendar event
app.post('/api/calendar/events', authenticateToken, async (req, res) => {
  const { title, description, event_date, event_time, event_type } = req.body;
  const userId = req.user.uid;

  try {
    const eventId = db.collection('custom_calendar_events').doc().id;
    const eventData = {
      user_id: userId,
      title,
      description,
      event_date: new Date(event_date),
      event_time,
      event_type,
      ...addTimestamps({})
    };

    await db.collection('custom_calendar_events').doc(eventId).set(eventData);

    res.status(201).json({
      id: eventId,
      title,
      description,
      start: event_date,
      end: event_date,
      type: event_type
    });

  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Failed to create calendar event.' });
  }
});

// Update a custom calendar event
app.put('/api/calendar/events/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, event_date, event_time, event_type } = req.body;
  const userId = req.user.uid;

  try {
    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const eventData = eventDoc.data();
    if (eventData.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to update this event.' });
    }

    await db.collection('custom_calendar_events').doc(id).update({
      title,
      description,
      event_date: new Date(event_date),
      event_time,
      event_type,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Calendar event updated successfully.' });

  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event.' });
  }
});

// Delete a custom calendar event
app.delete('/api/calendar/events/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;

  try {
    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const eventData = eventDoc.data();
    if (eventData.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this event.' });
    }

    await db.collection('custom_calendar_events').doc(id).delete();

    res.json({ message: 'Calendar event deleted successfully.' });

  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event.' });
  }
});

// Get events for a specific date
app.get('/api/calendar/events/date/:date', authenticateToken, async (req, res) => {
  const userId = req.user.uid;
  const { date } = req.params;

  try {
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(dateObj.setUTCHours(23, 59, 59, 999));

    const eventsSnapshot = await db.collection('custom_calendar_events')
      .where('user_id', '==', userId)
      .where('event_date', '>=', startOfDay)
      .where('event_date', '<=', endOfDay)
      .get();

    const events = eventsSnapshot.docs.map(doc => {
      const eventData = doc.data();
      return {
        id: doc.id,
        title: eventData.title,
        description: eventData.description,
        start: eventData.event_date.toDate(),
        end: eventData.event_date.toDate(),
        type: eventData.event_type,
        color: eventData.event_type === 'course_start' ? 'blue' : eventData.event_type === 'assignment' ? 'orange' : 'purple'
      };
    });

    res.json(events);

  } catch (error) {
    console.error('Error fetching events for date:', error);
    res.status(500).json({ error: 'Failed to fetch events for specified date.' });
  }
});

// Get upcoming events (next 7 days)
app.get('/api/calendar/upcoming', authenticateToken, async (req, res) => {
  const userId = req.user.uid;
  const currentDate = new Date();
  const endDate = new Date(currentDate.setDate(currentDate.getDate() + 7));

  try {
    const eventsSnapshot = await db.collection('custom_calendar_events')
      .where('user_id', '==', userId)
      .where('event_date', '>=', currentDate)
      .where('event_date', '<=', endDate)
      .orderBy('event_date', 'asc')
      .limit(10)
      .get();

    const events = eventsSnapshot.docs.map(doc => {
      const eventData = doc.data();
      return {
        id: doc.id,
        title: eventData.title,
        description: eventData.description,
        start: eventData.event_date.toDate(),
        end: eventData.event_date.toDate(),
        type: eventData.event_type,
        color: eventData.event_type === 'course_start' ? 'blue' : eventData.event_type === 'assignment' ? 'orange' : 'purple'
      };
    });

    res.json(events);

  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events.' });
  }
});

// Get user's assignments
app.get('/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    const assignmentsSnapshot = await db.collection('assignments')
      .where('user_id', '==', userId)
      .orderBy('due_date', 'asc')
      .get();

    const assignments = assignmentsSnapshot.docs.map(doc => {
      const assignmentData = doc.data();
      return {
        id: doc.id,
        title: assignmentData.title,
        description: assignmentData.description,
        due_date: assignmentData.due_date.toDate(),
        max_points: assignmentData.max_points,
        course_id: assignmentData.course_id,
        course_title: assignmentData.course_title,
        course_category: assignmentData.course_category,
        status: assignmentData.status,
        grade: assignmentData.grade || null,
        feedback: assignmentData.feedback || null
      };
    });

    res.json(assignments);

  } catch (error) {
    console.error('Error fetching user assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments.' });
  }
});

// Submit assignment
app.post('/assignments/submit', authenticateToken, async (req, res) => {
  const { assignment_id, content } = req.body;
  const userId = req.user.uid;

  if (!assignment_id || !content) {
    return res.status(400).json({ error: 'Assignment ID and content are required.' });
  }

  try {
    const submissionId = db.collection('assignment_submissions').doc().id;
    const submissionData = {
      assignment_id,
      user_id: userId,
      content,
      status: 'submitted',
      ...addTimestamps({})
    };

    await db.collection('assignment_submissions').doc(submissionId).set(submissionData);

    res.status(201).json({
      message: 'Assignment submitted successfully',
      id: submissionId
    });

  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Failed to submit assignment.' });
  }
});

// Grade assignment
app.put('/assignments/grade/:submissionId', authenticateToken, requireAdmin, async (req, res) => {
  const { submissionId } = req.params;
  const { grade, feedback } = req.body;

  try {
    const submissionDoc = await db.collection('assignment_submissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    await db.collection('assignment_submissions').doc(submissionId).update({
      grade,
      feedback,
      status: 'graded',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Assignment graded successfully.' });

  } catch (error) {
    console.error('Error grading assignment:', error);
    res.status(500).json({ error: 'Failed to grade assignment.' });
  }
});

// Get courses
app.get('/api/courses', async (req, res) => {
  try {
    const coursesSnapshot = await db.collection('courses').where('is_active', '==', true).get();
    const courses = coursesSnapshot.docs.map(doc => {
      const courseData = doc.data();
      return {
        id: doc.id,
        title: courseData.title,
        description: courseData.description,
        instructor_name: courseData.instructor_name,
        duration_weeks: courseData.duration_weeks,
        difficulty_level: courseData.difficulty_level,
        price: courseData.price,
        category: courseData.category,
        thumbnail: courseData.thumbnail,
        created_at: courseData.created_at.toDate(),
        updated_at: courseData.updated_at.toDate()
      };
    });

    res    .json(courses);

  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
});

// Enroll in a course
app.post('/api/courses/enroll', authenticateToken, async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.uid;

  try {
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const courseData = courseDoc.data();
    const enrollmentId = db.collection('enrollments').doc().id;
    const enrollmentData = {
      user_id: userId,
      course_id: courseId,
      progress: 0,
      status: 'active',
      enrollment_date: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('enrollments').doc(enrollmentId).set(enrollmentData);
    await db.collection('user_stats').doc(userId).update({
      courses_enrolled: admin.firestore.FieldValue.increment(1)
    });

    res.status(201).json({ message: 'Enrolled in course successfully.', enrollmentId });

  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ error: 'Failed to enroll in course.' });
  }
});

// Get user's enrolled courses
app.get('/api/enrollments/my-courses', authenticateToken, async (req, res) => {
  const userId = req.user.uid;

  try {
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .get();

    const enrollments = enrollmentsSnapshot.docs.map(doc => {
      const enrollmentData = doc.data();
      return {
        id: doc.id,
        course_id: enrollmentData.course_id,
        title: enrollmentData.courseTitle,
        description: enrollmentData.courseDescription,
        instructor_name: enrollmentData.instructorName,
        duration_weeks: enrollmentData.durationWeeks,
        difficulty_level: enrollmentData.difficultyLevel,
        category: enrollmentData.category,
        price: enrollmentData.price,
        thumbnail: enrollmentData.thumbnail,
        is_active: enrollmentData.is_active,
        enrollment_date: enrollmentData.enrollment_date.toDate()
      };
    });

    res.json(enrollments);

  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrolled courses.' });
  }
});

// Get all assignments
app.get('/assignments/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentsSnapshot = await db.collection('assignments').get();
    const assignments = assignmentsSnapshot.docs.map(doc => {
      const assignmentData = doc.data();
      return {
        id: doc.id,
        course_id: assignmentData.course_id,
        title: assignmentData.title,
        description: assignmentData.description,
        due_date: assignmentData.due_date.toDate(),
        max_points: assignmentData.max_points,
        created_at: assignmentData.created_at.toDate(),
        updated_at: assignmentData.updated_at.toDate()
      };
    });

    res.json(assignments);

  } catch (error) {
    console.error('Error fetching all assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments.' });
  }
});

// Get resources
app.get('/api/resources', authenticateToken, async (req, res) => {
  const accountType = req.user.account_type;

  try {
    const resourcesSnapshot = await db.collection('resources').get();
    const resources = resourcesSnapshot.docs.filter(doc => {
      const resourceData = doc.data();
      return resourceData.allowed_account_types.includes(accountType);
    }).map(doc => {
      const resourceData = doc.data();
      return {
        id: doc.id,
        title: resourceData.title,
        description: resourceData.description,
        type: resourceData.type,
        size: resourceData.size,
        url: resourceData.url,
        category: resourceData.category,
        icon_name: resourceData.icon_name,
        button_color: resourceData.button_color,
        allowed_account_types: resourceData.allowed_account_types,
        is_premium: resourceData.is_premium,
        created_at: resourceData.created_at.toDate(),
        updated_at: resourceData.updated_at.toDate()
      };
    });

    res.json(resources);

  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources.' });
  }
});

// Download resource
app.get('/api/resources/:id/download', authenticateToken, async (req, res) => {
  const resourceId = req.params.id;
  const accountType = req.user.account_type;

  try {
    const resourceDoc = await db.collection('resources').doc(resourceId).get();
    if (!resourceDoc.exists) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    const resourceData = resourceDoc.data();
    if (!resourceData.allowed_account_types.includes(accountType)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (resourceData.type === 'tool') {
      return res.status(400).json({ error: 'Cannot download external tools.' });
    }

    const downloadLogId = db.collection('download_logs').doc().id;
    const downloadLogData = {
      user_id: req.user.uid,
      resource_id: resourceId,
      resource_name: resourceData.title,
      downloaded_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('download_logs').doc(downloadLogId).set(downloadLogData);

    if (resourceData.url) {
      return res.redirect(resourceData.url);
    } else {
      // Mock file download (for demonstration purposes)
      const mockFileContent = `Mock file content for resource ${resourceId}`;
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${resourceData.title}.txt"`);
      res.send(mockFileContent);
    }

  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ error: 'Failed to download resource.' });
  }
});

// Get certificates
app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
  const userId = req.user.uid;

  try {
    const certificatesSnapshot = await db.collection('certificates')
      .where('user_id', '==', userId)
      .get();

    const certificates = certificatesSnapshot.docs.map(doc => {
      const certificateData = doc.data();
      return {
        id: doc.id,
        course_id: certificateData.course_id,
        certificate_url: certificateData.certificate_url,
        issued_date: certificateData.issued_date.toDate(),
        course: {
          id: certificateData.course_id,
          title: certificateData.course_title,
          instructor_name: certificateData.instructor_name,
          category: certificateData.category,
          difficulty_level: certificateData.difficulty_level
        }
      };
    });

    res.json(certificates);

  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates.' });
  }
});

// Issue a new certificate
app.post('/api/certificates', authenticateToken, requireAdmin, async (req, res) => {
  const { userId, courseId, certificateUrl } = req.body;

  if (!userId || !courseId || !certificateUrl) {
    return res.status(400).json({ error: 'User ID, course ID, and certificate URL are required.' });
  }

  try {
     const certificateData = {
      user_id: userId,
      course_id: courseId,
      certificate_url: certificateUrl,
      issued_date: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('certificates').doc(certificateId).set(certificateData);
    await db.collection('user_stats').doc(userId).update({
      certificates_earned: admin.firestore.FieldValue.increment(1)
    });

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificateId
    });

  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ error: 'Failed to issue certificate.' });
  }
});

// Get internships
app.get('/api/internships', async (req, res) => {
  try {
    const internshipsSnapshot = await db.collection('internships')
      .orderBy('posted_at', 'desc')
      .get();

    const internships = internshipsSnapshot.docs.map(doc => {
      const internshipData = doc.data();
      return {
        id: doc.id,
        title: internshipData.title,
        company: internshipData.company,
        location: internshipData.location,
        duration: internshipData.duration,
        type: internshipData.type,
        description: internshipData.description,
        requirements: JSON.parse(internshipData.requirements),
        benefits: JSON.parse(internshipData.benefits),
        applications_count: internshipData.applications_count,
        spots_available: internshipData.spots_available,
        posted_at: internshipData.posted_at.toDate()
      };
    });

    res.json(internships);

  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ error: 'Failed to fetch internships.' });
  }
});

// Apply for an internship
app.post('/api/internships/:id/apply', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, resume_url, cover_letter } = req.body;
  const userId = req.user.uid;

  if (!full_name || !email || !resume_url) {
    return res.status(400).json({ error: 'Full name, email, and resume URL are required.' });
  }

  try {
    const internshipDoc = await db.collection('internships').doc(id).get();
    if (!internshipDoc.exists) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    const internshipData = internshipDoc.data();
    if (internshipData.spots_available <= 0) {
      return res.status(400).json({ error: 'No available spots for this internship.' });
    }

    const applicationId = db.collection('internship_submissions').doc().id;
    const applicationData = {
      internship_id: id,
      user_id: userId,
      full_name,
      email,
      phone,
      resume_url,
      cover_letter,
      status: 'pending',
      ...addTimestamps({})
    };

    await db.collection('internship_submissions').doc(applicationId).set(applicationData);
    await db.collection('internships').doc(id).update({
      applications_count: admin.firestore.FieldValue.increment(1),
      spots_available: admin.firestore.FieldValue.increment(-1)
    });

    res.status(201).json({
      message: 'Internship application submitted successfully',
      applicationId
    });

  } catch (error) {
    console.error('Error applying for internship:', error);
    res.status(500).json({ error: 'Failed to apply for internship.' });
  }
});

// Get user's internship applications
app.get('/api/user/internship-applications', authenticateToken, async (req, res) => {
  const userId = req.user.uid;

  try {
    const applicationsSnapshot = await db.collection('internship_submissions')
      .where('user_id', '==', userId)
      .orderBy('submitted_at', 'desc')
      .get();

    const applications = applicationsSnapshot.docs.map(doc => {
      const applicationData = doc.data();
      const internship = {
        id: applicationData.internship_id,
        title: applicationData.title,
        company: applicationData.company,
        location: applicationData.location,
        duration: applicationData.duration,
        type: applicationData.type,
        description: applicationData.description,
        requirements: JSON.parse(applicationData.requirements),
        benefits: JSON.parse(applicationData.benefits),
        posted_at: applicationData.posted_at.toDate()
      };

      return {
        id: doc.id,
        full_name: applicationData.full_name,
        email: applicationData.email,
        phone: applicationData.phone,
        resume_url: applicationData.resume_url,
        cover_letter: applicationData.cover_letter,
        status: applicationData.status,
        submitted_at: applicationData.submitted_at.toDate(),
        internship
      };
    });

    res.json(applications);

  } catch (error) {
    console.error('Error fetching user internship applications:', error);
    res.status(500).json({ error: 'Failed to fetch user internship applications.' });
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  const { first_name, last_name, email, phone, message } = req.body;

  if (!first_name || !last_name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const contactId = db.collection('contact_messages').doc().id;
    const contactData = {
      first_name,
      last_name,
      email,
      phone,
      message,
      status: 'pending',
      ...addTimestamps({})
    };

    await db.collection('contact_messages').doc(contactId).set(contactData);

    res.status(201).json({
      message: 'Contact message sent successfully',
      contactId
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ error: 'Failed to submit contact form.' });
  }
});

// Admin dashboard stats
app.get('/api/admin/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsersSnapshot = await db.collection('users').get();
    const totalUsers = totalUsersSnapshot.size;

    const totalCoursesSnapshot = await db.collection('courses').where('is_active', '==', true).get();
    const totalCourses = totalCoursesSnapshot.size;

    const totalEnrollmentsSnapshot = await db.collection('enrollments').get();
    const totalEnrollments = totalEnrollmentsSnapshot.size;

    const totalRevenueSnapshot = await db.collection('payments').where('status', '==', 'approved').get();
    const totalRevenue = totalRevenueSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

    const pendingContactsSnapshot = await db.collection('contact_messages').where('status', '==', 'pending').get();
    const pendingContacts = pendingContactsSnapshot.size;

    res.json({
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      pendingContacts
    });

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        id: doc.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone,
        account_type: userData.account_type,
        company: userData.company,
        website: userData.website,
        bio: userData.bio,
                is_active: userData.is_active,
        email_verified: userData.email_verified,
        created_at: userData.created_at.toDate(),
        last_login: userData.last_login ? userData.last_login.toDate() : null,
        updated_at: userData.updated_at.toDate()
      };
    });

    res.json(users);

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Create a new user (admin only)
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  const { first_name, last_name, email, phone, password, account_type, company, website, bio } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'First name, last name, email, and password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = db.collection('users').doc().id;
    const userData = {
      id: userId,
      first_name,
      last_name,
      email,
      phone,
      password_hash: hashedPassword,
      account_type,
      company,
      website,
      bio,
      is_active: true,
      email_verified: false,
      ...addTimestamps({})
    };

    await db.collection('users').doc(userId).set(userData);
    await db.collection('user_stats').doc(userId).set({
      user_id: userId,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0,
      ...addTimestamps({})
    });

    res.status(201).json({
      message: 'User created successfully',
      user: userData
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// Update user (admin only)
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone, account_type, company, website, bio } = req.body;

  try {
    const userDoc = await db.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await db.collection('users').doc(id).update({
      first_name,
      last_name,
      email,
      phone,
      account_type,
      company,
      website,
      bio,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'User updated successfully.' });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const userDoc = await db.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userData = userDoc.data();
    await db.collection('users').doc(id).delete();
    await db.collection('user_stats').doc(id).delete();

    res.json({ message: 'User deleted successfully.' });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Get all courses (admin only)
app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const coursesSnapshot = await db.collection('courses').orderBy('created_at', 'desc').get();
    const courses = coursesSnapshot.docs.map(doc => {
      const courseData = doc.data();
      return {
        id: doc.id,
        title: courseData.title,
        description: courseData.description,
        instructor_name: courseData.instructor_name,
        duration_weeks: courseData.duration_weeks,
        difficulty_level: courseData.difficulty_level,
        category: courseData.category,
        price: courseData.price,
        thumbnail: courseData.thumbnail,
        is_active: courseData.is_active,
        created_at: courseData.created_at.toDate(),
        updated_at: courseData.updated_at.toDate()
      };
    });

    res.json(courses);

  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
});

// Create a new course (admin only)
app.post('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  const { title, description, instructor_name, duration_weeks, difficulty_level, category, price, thumbnail, is_active } = req.body;

  if (!title || !description || !instructor_name || !duration_weeks || !difficulty_level || !category || !price) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const courseId = db.collection('courses').doc().id;
    const courseData = {
      id: courseId,
      title,
      description,
      instructor_name,
      duration_weeks,
      difficulty_level,
      category,
      price,
      thumbnail,
      is_active,
      ...addTimestamps({})
    };

    await db.collection('courses').doc(courseId).set(courseData);

    res.status(201).json({
      message: 'Course created successfully',
      course: courseData
    });

  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course.' });
  }
});

// Update course (admin only)
app.put('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description, instructor_name, duration_weeks, difficulty_level, category, price, thumbnail, is_active } = req.body;

  try {
    const courseDoc = await db.collection('courses').doc(id).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    await db.collection('courses').doc(id).update({
      title,
      description,
      instructor_name,
      duration_weeks,
      difficulty_level,
      category,
      price,
      thumbnail,
      is_active,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Course updated successfully.' });

  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course.' });
  }
});

// Delete course (admin only)
app.delete('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const courseDoc = await db.collection('courses').doc(id).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const enrollmentsSnapshot = await db.collection('enrollments').where('course_id', '==', id).get();
    if (!enrollmentsSnapshot.empty) {
      return res.status(400).json({ error: 'Cannot delete course with active enrollments.' });
    }

    await db.collection('courses').doc(id).delete();

    res.json({ message: 'Course deleted successfully.' });

  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course.' });
  }
});

// Get all resources (admin only)
app.get('/api/admin/resources', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const resourcesSnapshot = await db.collection('resources').orderBy('created_at', 'desc').get();
    const resources = resourcesSnapshot.docs.map(doc => {
      const resourceData = doc.data();
      return {
        id: doc.id,
        title: resourceData.title,
        description: resourceData.description,
        type: resourceData.type,
        size: resourceData.size,
        url: resourceData.url,
        category: resourceData.category,
        icon_name: resourceData.icon_name,
        button_color: resourceData.button_color,
        allowed_account_types: resourceData.allowed_account_types,
        is_premium: resourceData.is_premium,
        created_at: resourceData.created_at.toDate(),
        updated_at: resourceData.updated_at.toDate()
      };
    });

    res.json(resources);

  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources.' });
  }
});

// Create a new resource (admin only)
app.post('/api/admin/resources', authenticateToken, requireAdmin, async (req, res) => {
  const { title, description, type, size, url, category, icon_name, button_color, allowed_account_types, is_premium } = req.body;

  if (!title || !description || !type || !category || !icon_name || !button_color || !allowed_account_types) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const resourceId = db.collection('resources').doc().id;
    const resourceData = {
      id: resourceId,
      title,
      description,
      type,
      size,
      url,
      category,
      icon_name,
      button_color,
      allowed_account_types,
      is_premium,
      ...addTimestamps({})
    };

    await db.collection('resources').doc(resourceId).set(resourceData);

    res.status(201).json({
      message: 'Resource created successfully',
      resource: resourceData
    });

  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to create resource.' });
  }
});

// Update resource (admin only)
app.put('/api/admin/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description, type, size, url, category, icon_name, button_color, allowed_account_types, is_premium } = req.body;

  try {
    const resourceDoc = await db.collection('resources').doc(id).get();
    if (!resourceDoc.exists) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    await db.collection('resources').doc(id).update({
      title,
      description,
      type,
      size,
      url,
      category,
      icon_name,
      button_color,
      allowed_account_types,
      is_premium,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Resource updated successfully.' });

  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Failed to update resource.' });
  }
});

// Delete resource (admin only)
app.delete('/api/admin/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const resourceDoc = await db.collection('resources').doc(id).get();
    if (!resourceDoc.exists) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    await db.collection('resources').doc(id).delete();

    res.json({ message: 'Resource deleted successfully.' });

  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Failed to delete resource.' });
  }
});

// Get all assignments (admin only)
app.get('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentsSnapshot = await db.collection('assignments').orderBy('created_at', 'desc').get();
    const assignments = assignmentsSnapshot.docs.map(doc => {
      const assignmentData = doc.data();
      return {
        id: doc.id,
        course_id: assignmentData.course_id,
        title: assignmentData.title,
        description: assignmentData.description,
        due_date: assignmentData.due_date.toDate(),
        max_points: assignmentData.max_points,
        created_at: assignmentData.created_at.toDate(),
        updated_at: assignmentData.updated_at.toDate()
      };
    });

    res.json(assignments);

  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments.' });
  }
});

// Create a new assignment (admin only)
app.post('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  const { course_id, title, description, due_date, max_points } = req.body;

  if (!course_id || !title || !description || !due_date || !max_points) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const assignmentId = db.collection('assignments').doc().id;
    const assignmentData = {
      id: assignmentId,
      course_id,
      title,
      description,
      due_date: new Date(due_date),
      max_points,
      ...addTimestamps({})
    };

    await db.collection('assignments').doc(assignmentId).set(assignmentData);

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: assignmentData
    });

  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment.' });
  }
});

// Update assignment (admin only)
app.put('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { course_id, title, description, due_date, max_points } = req.body;

  try {
    const assignmentDoc = await db.collection('assignments').doc(id).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    await db.collection('assignments').doc(id).update({
      course_id,
      title,
      description,
      due_date: new Date(due_date),
      max_points,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Assignment updated successfully.' });

  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment.' });
  }
});

// Delete assignment (admin only)
app.delete('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const assignmentDoc = await db.collection('assignments').doc(id).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    const submissionsSnapshot = await db.collection('assignment_submissions').where('assignment_id', '==', id).get();
    if (!submissionsSnapshot.empty) {
      return res.status(400).json({ error: 'Cannot delete assignment with existing submissions.' });
    }

    await db.collection('assignments').doc(id).delete();

    res.json({ message: 'Assignment deleted successfully.' });

  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment.' });
  }
});

// Get all contact messages (admin only)
app.get('/api/admin/contact-messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const messagesSnapshot = await db.collection('contact_messages').orderBy('created_at', 'desc').get();
    const messages = messagesSnapshot.docs.map(doc => {
      const messageData = doc.data();
      return {
        id: doc.id,
        first_name: messageData.first_name,
        last_name: messageData.last_name,
        email: messageData.email,
        phone: messageData.phone,
        message: messageData.message,
        status: messageData.status,
        created_at: messageData.created_at.toDate(),
        updated_at: messageData.updated_at.toDate()
      };
    });

    res.json(messages);

  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Failed to fetch contact messages.' });
  }
});

// Update contact message status (admin only)
app.put('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'contacted', 'resolved', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  try {
    const messageDoc = await db.collection('contact_messages').doc(id).get();
    if (!messageDoc.exists) {
      return res.status(404).json({ error: 'Contact message not found.' });
    }

    await db.collection('contact_messages').doc(id).update({
      status,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Contact message status updated successfully.' });

  } catch (error) {
    console.error('Error updating contact message status:', error);
    res.status(500).json({ error: 'Failed to update contact message status.' });
  }
});

// Delete contact message (admin only)
app.delete('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const messageDoc = await db.collection('contact_messages').doc(id).get();
    if (!messageDoc.exists) {
      return res.status(404).json({ error: 'Contact message not found.' });
    }

    await db.collection('contact_messages').doc(id).delete();

    res.json({ message: 'Contact message deleted successfully.' });

  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ error: 'Failed to delete contact message.' });
  }
});

// Get all service requests (admin only)
app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requestsSnapshot = await db.collection('service_requests').orderBy('created_at', 'desc').get();
    const requests = requestsSnapshot.docs.map(doc => {
      const requestData = doc.data();
      return {
        id: doc.id,
        user_id: requestData.user_id,
        subcategory_id: requestData.subcategory_id,
        full_name: requestData.full_name,
        email: requestData.email,
        phone: requestData.phone,
        company: requestData.company,
        website: requestData.website,
        project_details: requestData.project_details,
        budget_range: requestData.budget_range,
        timeline: requestData.timeline,
        contact_method: requestData.contact_method,
        additional_requirements: requestData.additional_requirements,
        status: requestData.status,
        created_at: requestData.created_at.toDate(),
        updated_at: requestData.updated_at.toDate()
      };
    });

    res.json(requests);

  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests.' });
  }
});

// Update service request status (admin only)
app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  try {
    const requestDoc = await db.collection('service_requests').doc(id).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Service request not found.' });
    }

    await db.collection('service_requests').doc(id).update({
      status,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Service request status updated successfully.' });

  } catch (error) {
    console.error('Error updating service request status:', error);
    res.status(500).json({ error: 'Failed to update service request status.' });
  }
});

// Delete service request (admin only)
app.delete('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const requestDoc = await db.collection('service_requests').doc(id).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Service request not found.' });
    }

    await db.collection('service_requests').doc(id).delete();

    res.json({ message: 'Service request deleted successfully.' });

  } catch (error) {
    console.error('Error deleting service request:', error);
    res.status(500).json({ error: 'Failed to delete service request.' });
  }
});

// Get all calendar events (admin only)
app.get('/api/admin/calendar-events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const eventsSnapshot = await db.collection('custom_calendar_events').orderBy('event_date', 'desc').get();
    const events = eventsSnapshot.docs.map(doc => {
      const eventData = doc.data();
      return {
        id: doc.id,
        user_id: eventData.user_id,
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.event_date.toDate(),
        event_time: eventData.event_time,
        event_type: eventData.event_type,
        created_at: eventData.created_at.toDate(),
        updated_at: eventData.updated_at.toDate()
      };
    });

    res.json(events);

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events.' });
  }
});

// Create a new calendar event (admin only)
app.post('/api/admin/calendar-events', authenticateToken, requireAdmin, async (req, res) => {
  const { user_id, title, description, event_date, event_time, event_type } = req.body;

  if (!user_id || !title || !event_date) {
    return res.status(400).json({ error: 'User ID, title, and event date are required.' });
  }

  try {
    const eventId = db.collection('custom_calendar_events').doc().id;
    const eventData = {
      user_id,
      title,
      description,
      event_date: new Date(event_date),
      event_time,
      event_type,
      ...addTimestamps({})
    };

    await db.collection('custom_calendar_events').doc(eventId).set(eventData);

    res.status(201).json({
      message: 'Calendar event created successfully',
      event: eventData
    });

  } catch (error) {
    console.error('Error creating calendar    event:', error);
    res.status(500).json({ error: 'Failed to create calendar event.' });
  }
});

// Update calendar event (admin only)
app.put('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { user_id, title, description, event_date, event_time, event_type } = req.body;

  if (!user_id || !title || !event_date) {
    return res.status(400).json({ error: 'User ID, title, and event date are required.' });
  }

  try {
    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Calendar event not found.' });
    }

    await db.collection('custom_calendar_events').doc(id).update({
      user_id,
      title,
      description,
      event_date: new Date(event_date),
      event_time,
      event_type,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Calendar event updated successfully.' });

  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event.' });
  }
});

// Delete calendar event (admin only)
app.delete('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Calendar event not found.' });
    }

    await db.collection('custom_calendar_events').doc(id).delete();

    res.json({ message: 'Calendar event deleted successfully.' });

  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event.' });
  }
});

// Get all service categories (admin only)
app.get('/api/admin/service-categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const categoriesSnapshot = await db.collection('service_categories').where('is_active', '==', true).get();
    const categories = categoriesSnapshot.docs.map(doc => {
      const categoryData = doc.data();
      return {
        id: doc.id,
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon,
        is_active: categoryData.is_active,
        created_at: categoryData.created_at.toDate(),
        updated_at: categoryData.updated_at.toDate()
      };
    });

    res.json(categories);

  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({ error: 'Failed to fetch service categories.' });
  }
});

// Create a new service category (admin only)
app.post('/api/admin/service-categories', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, icon, is_active } = req.body;

  if (!name || !description || !icon) {
    return res.status(400).json({ error: 'Name, description, and icon are required.' });
  }

  try {
    const categoryId = db.collection('service_categories').doc().id;
    const categoryData = {
      id: categoryId,
      name,
      description,
      icon,
      is_active,
      ...addTimestamps({})
    };

    await db.collection('service_categories').doc(categoryId).set(categoryData);

    res.status(201).json({
      message: 'Service category created successfully',
      category: categoryData
    });

  } catch (error) {
    console.error('Error creating service category:', error);
    res.status(500).json({ error: 'Failed to create service category.' });
  }
});

// Update service category (admin only)
app.put('/api/admin/service-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, icon, is_active } = req.body;

  if (!name || !description || !icon) {
    return res.status(400).json({ error: 'Name, description, and icon are required.' });
  }

  try {
    const categoryDoc = await db.collection('service_categories').doc(id).get();
    if (!categoryDoc.exists) {
      return res.status(404).json({ error: 'Service category not found.' });
    }

    await db.collection('service_categories').doc(id).update({
      name,
      description,
      icon,
      is_active,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Service category updated successfully.' });

  } catch (error) {
    console.error('Error updating service category:', error);
    res.status(500).json({ error: 'Failed to update service category.' });
  }
});

// Delete service category (admin only)
app.delete('/api/admin/service-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const categoryDoc = await db.collection('service_categories').doc(id).get();
    if (!categoryDoc.exists) {
      return res.status(404).json({ error: 'Service category not found.' });
    }

    const servicesSnapshot = await db.collection('services').where('category_id', '==', id).get();
    if (!servicesSnapshot.empty) {
      return res.status(400).json({ error: 'Cannot delete service category with associated services.' });
    }

    await db.collection('service_categories').doc(id).delete();

    res.json({ message: 'Service category deleted successfully.' });

  } catch (error) {
    console.error('Error deleting service category:', error);
    res.status(500).json({ error: 'Failed to delete service category.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Shutting down gracefully.');
  await db.terminate();
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;