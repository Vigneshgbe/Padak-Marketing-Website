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
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
const port = process.env.PORT || 5000;

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

const assignmentsDir = path.join(__dirname, 'uploads', 'assignments');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });

const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const paymentsDir = path.join(__dirname, 'uploads', 'payments');
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

app.use(cors({
  origin: [process.env.FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads', 'avatars')));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = userDoc.data();
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatars'));
    }
  }
});

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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, phone, password, accountType } = req.body;

  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'First name, last name, email, and password are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const userRef = db.collection('users');
    const userDoc = await userRef.where('email', '==', email).get();
    if (!userDoc.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      password_hash: hashedPassword,
      account_type: accountType || 'student',
      is_active: true,
      created_at: admin.firestore.Timestamp.now()
    };

    const user = await userRef.add(userData);
    await db.collection('user_stats').doc(user.id).set({ user_id: user.id, courses_enrolled: 0, courses_completed: 0, certificates_earned: 0, learning_streak: 0 });

    console.log('User registered successfully:', { userId: user.id, email });
    res.status(201).json({
      message: 'User registered successfully',
      userId: user.id
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userRef = db.collection('users');
    const userDoc = await userRef.where('email', '==', email).where('is_active', '==', true).get();
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
        userId: userDoc.docs[0].id,
        email: user.email,
        accountType: user.account_type
      },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    await userRef.doc(userDoc.docs[0].id).update({ updated_at: admin.firestore.Timestamp.now() });

    console.log('User logged in successfully:', { userId: userDoc.docs[0].id, email: user.email });

    res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
        id: userDoc.docs[0].id,
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

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, company, website, bio } = req.body;
    const userId = req.user.id;

    await db.collection('users').doc(userId).update({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      company: company,
      website: website,
      bio: bio,
      updated_at: admin.firestore.Timestamp.now()
    });

    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();
    res.json({
      id: userId,
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

app.post('/api/auth/avatar', authenticateToken, (req, res, next) => {
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

    if (req.user.profile_image) {
      const oldFilename = path.basename(req.user.profile_image);
      const oldPath = path.join(avatarsDir, oldFilename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await db.collection('users').doc(userId).update({
      profile_image: profileImage,
      updated_at: admin.firestore.Timestamp.now()
    });

    res.status(200).send(profileImage);

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const statsDoc = await db.collection('user_stats').doc(userId).get();
    if (!statsDoc.exists) {
      await db.collection('user_stats').doc(userId).set({
        user_id: userId,
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0
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
  limits: { fileSize: 5 * 1024 * 1024 },
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

app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  try {
    const totalPostsQuery = db.collection('social_activities').where('activity_type', '==', 'post');
    const totalPostsSnapshot = await totalPostsQuery.get();
    const totalPosts = totalPostsSnapshot.size;

    const totalPages = Math.ceil(totalPosts / limit);

    const postsQuery = db.collection('social_activities').where('activity_type', '==', 'post')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const postsSnapshot = await postsQuery.get();
    const posts = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (posts.length === 0) {
      return res.json({ posts: [], pagination: { page, totalPages, totalPosts } });
    }

    const postIds = posts.map(p => p.id);
    const commentsQuery = db.collection('social_activities').where('activity_type', '==', 'comment').where('target_id', 'in', postIds).orderBy('created_at', 'asc');
    const commentsSnapshot = await commentsQuery.get();
    const comments = commentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

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

      const postData = {
        user_id: userId,
        activity_type: 'post',
        content: content || '',
        image_url: imageUrl,
        achievement: isAchievement,
        visibility: visibility,
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now(),
        likes: 0,
        comment_count: 0,
        share_count: 0
      };

      const postRef = db.collection('social_activities');
      const postDoc = await postRef.add(postData);

      const newPost = await postRef.doc(postDoc.id).get();
      const newPostData = newPost.data();

      res.status(201).json({
        ...newPostData,
        has_liked: false,
        has_bookmarked: false,
        likes: 0,
        comment_count: 0,
        image_url: getFullImageUrl(req, newPostData.image_url),
        user: {
          id: newPostData.user_id,
          first_name: newPostData.first_name,
          last_name: newPostData.last_name,
          profile_image: getFullImageUrl(req, newPostData.profile_image),
          account_type: newPostData.account_type,
        },
        comments: [],
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post.' });
    }
  });
});

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

    if (postDoc.data().user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    await db.collection('social_activities').doc(id).update({
      content: content,
      updated_at: admin.firestore.Timestamp.now()
    });

    res.json({ message: 'Post updated successfully.' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post.' });
  }
});

app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const postDoc = await db.collection('social_activities').doc(id).get();
    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (postDoc.data().user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    await db.collection('social_activities').doc(id).delete();

    if (postDoc.data().image_url) {
      fs.unlink(path.join(__dirname, postDoc.data().image_url), (err) => {
        if (err) console.error("Error deleting post image:", err);
      });
    }

    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

app.post('/api/posts/:id/comment', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Comment cannot be empty.' });
  }

  try {
    const commentData = {
      user_id: userId,
      activity_type: 'comment',
      content: content,
      target_id: targetId,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    const commentRef = db.collection('social_activities');
    const commentDoc = await commentRef.add(commentData);

    const newComment = await commentRef.doc(commentDoc.id).get();
    const newCommentData = newComment.data();

    res.status(201).json({
      ...newCommentData,
      user: {
        id: newCommentData.user_id,
        first_name: newCommentData.first_name,
        last_name: newCommentData.last_name,
        profile_image: getFullImageUrl(req, newCommentData.profile_image)
      }
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    const likeData = {
      user_id: userId,
      activity_type: 'like',
      target_id: targetId,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    await db.collection('social_activities').add(likeData);
    res.status(201).json({ message: 'Post liked.' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post.' });
  }
});

app.delete('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    const likeQuery = db.collection('social_activities').where('user_id', '==', userId).where('activity_type', '==', 'like').where('target_id', '==', targetId);
    const likeDocs = await likeQuery.get();
    likeDocs.forEach(doc => doc.ref.delete());
    res.json({ message: 'Post unliked.' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ error: 'Failed to unlike post.' });
  }
});

app.post('/api/posts/:id/bookmark', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    const bookmarkData = {
      user_id: userId,
      activity_type: 'bookmark',
      target_id: targetId,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    await db.collection('social_activities').add(bookmarkData);
    res.status(201).json({ message: 'Post bookmarked.' });
  } catch (error) {
    console.error('Error bookmarking post:', error);
    res.status(500).json({ error: 'Failed to bookmark post.' });
  }
});

app.delete('/api/posts/:id/bookmark', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    const bookmarkQuery = db.collection('social_activities').where('user_id', '==', userId).where('activity_type', '==', 'bookmark').where('target_id', '==', targetId);
    const bookmarkDocs = await bookmarkQuery.get();
    bookmarkDocs.forEach(doc => doc.ref.delete());
    res.json({ message: 'Post unbookmarked.' });
  } catch (error) {
    console.error('Error unbookmarking post:', error);
    res.status(500).json({ error: 'Failed to unbookmark post.' });
  }
});

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

app.get('/api/users/:userId/enrollments', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (parseInt(req.params.userId, 10) !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own enrollment data.' });
  }

  try {
    const enrollmentsQuery = db.collection('enrollments').where('user_id', '==', userId).orderBy('enrollment_date', 'desc');
    const enrollmentsSnapshot = await enrollmentsQuery.get();
    const enrollments = enrollmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const courseIds = enrollments.map(enrollment => enrollment.course_id);
    const coursesQuery = db.collection('courses').where('id', 'in', courseIds);
    const coursesSnapshot = await coursesQuery.get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = enrollments.map(enrollment => {
      const course = courses.find(course => course.id === enrollment.course_id);
      return {
        ...enrollment,
        course: course
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching user enrollments for dashboard:', error);
    res.status(500).json({ error: 'Internal server error while fetching enrolled courses.' });
  }
});

app.get('/api/users/:userId/internship-submissions', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (parseInt(req.params.userId, 10) !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own internship submissions.' });
  }

  try {
    const applicationsQuery = db.collection('internship_submissions').where('user_id', '==', userId).orderBy('submitted_at', 'desc');
    const applicationsSnapshot = await applicationsQuery.get();
    const applications = applicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const internshipIds = applications.map(app => app.internship_id);
    const internshipsQuery = db.collection('internships').where('id', 'in', internshipIds);
    const internshipsSnapshot = await internshipsQuery.get();
    const internships = internshipsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = applications.map(app => {
      const internship = internships.find(int => int.id === app.internship_id);
      return {
        ...app,
        internship: internship
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching user internship applications for dashboard:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const servicesQuery = db.collection('services').where('is_active', '==', true).orderBy('popular', 'desc').orderBy('name', 'asc');
    const servicesSnapshot = await servicesQuery.get();
    const services = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(services);
  } catch (error) {
    console.error('Error fetching available services:', error);
    res.status(500).json({ message: 'Failed to fetch available services.', error: error.message });
  }
});

app.get('/api/users/:userId/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (parseInt(req.params.userId, 10) !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
  }

  try {
    const requestsQuery = db.collection('service_requests').where('user_id', '==', userId).orderBy('created_at', 'desc');
    const requestsSnapshot = await requestsQuery.get();
    const requests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const subcategoryIds = requests.map(request => request.subcategory_id);
    const subcategoriesQuery = db.collection('service_subcategories').where('id', 'in', subcategoryIds);
    const subcategoriesSnapshot = await subcategoriesQuery.get();
    const subcategories = subcategoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = requests.map(request => {
      const subcategory = subcategories.find(sub => sub.id === request.subcategory_id);
      return {
        ...request,
        subcategory: subcategory
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching user service requests:', error);
    res.status(500).json({ message: 'Failed to fetch your service requests.', error: error.message });
  }
});

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

  if (!userId || !categoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
    return res.status(400).json({ message: 'Missing required fields for service request. Please fill in all necessary details.' });
  }

  try {
    const requestData = {
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
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    const requestRef = db.collection('service_requests');
    const requestDoc = await requestRef.add(requestData);

    res.status(201).json({ message: 'Service request submitted successfully!', id: requestDoc.id });
  } catch (error) {
    console.error('Error submitting service request:', error);
    res.status(500).json({ message: 'Failed to submit service request. An internal server error occurred.', error: error.message });
  }
});

app.get('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const courseEventsQuery = db.collection('courses').where('is_active', '==', true);
    const courseEventsSnapshot = await courseEventsQuery.get();
    const courseEvents = courseEventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const assignmentEventsQuery = db.collection('assignments').where('is_active', '==', true);
    const assignmentEventsSnapshot = await assignmentEventsSnapshot.get();
    const assignmentEvents = assignmentEventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const customEventsQuery = db.collection('custom_calendar_events').where('user_id', '==', userId);
    const customEventsSnapshot = await customEventsQuery.get();
    const customEvents = customEventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const allEvents = [...courseEvents, ...assignmentEvents, ...customEvents];

    res.json(allEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

app.get('/api/calendar/events/date/:date', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const eventsQuery = db.collection('assignments').where('due_date', '==', date).where('is_active', '==', true);
    const eventsSnapshot = await eventsQuery.get();
    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const customEventsQuery = db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '==', date);
    const customEventsSnapshot = await customEventsQuery.get();
    const customEvents = customEventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const allEvents = [...events, ...customEvents];

    res.json(allEvents);
  } catch (error) {
    console.error('Error fetching events for date:', error);
    res.status(500).json({ error: 'Failed to fetch events for specified date' });
  }
});

app.get('/api/calendar/upcoming', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const upcomingEventsQuery = db.collection('assignments').where('due_date', '>=', new Date()).where('due_date', '<=', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).where('is_active', '==', true);
    const upcomingEventsSnapshot = await upcomingEventsQuery.get();
    const upcomingEvents = upcomingEventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const customUpcomingQuery = db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '>=', new Date()).where('event_date', '<=', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const customUpcomingSnapshot = await customUpcomingQuery.get();
    const customUpcoming = customUpcomingSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const allUpcoming = [...upcomingEvents, ...customUpcoming];

    res.json(allUpcoming);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

app.get('/api/calendar/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const statsQuery = db.collection('assignments').where('is_active', '==', true);
    const statsSnapshot = await statsQuery.get();
    const stats = statsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const pendingAssignments = stats.filter(stat => stat.due_date > new Date()).length;
    const completedAssignments = stats.filter(stat => stat.due_date <= new Date()).length;
    const overdueAssignments = stats.filter(stat => stat.due_date < new Date()).length;

    res.json({
      pending_assignments: pendingAssignments,
      completed_assignments: completedAssignments,
      overdue_assignments: overdueAssignments,
      total_assignments: stats.length
    });
  } catch (error) {
    console.error('Error fetching calendar stats:', error);
    res.status(500).json({ error: 'Failed to fetch calendar statistics' });
  }
});

app.get('/api/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const assignmentsQuery = db.collection('assignments').where('is_active', '==', true);
    const assignmentsSnapshot = await assignmentsQuery.get();
    const assignments = assignmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

app.post('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, date, time, type = 'custom' } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const eventData = {
      user_id: userId,
      title: title,
      description: description || null,
      event_date: date,
      event_time: time || null,
      event_type: type,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    const eventRef = db.collection('custom_calendar_events');
    const eventDoc = await eventRef.add(eventData);

    res.status(201).json({
      id: eventDoc.id,
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

app.put('/api/calendar/events/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, date, time, type } = req.body;

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();
    if (!eventDoc.exists || eventDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    await db.collection('custom_calendar_events').doc(id).update({
      title: title,
      description: description || null,
      event_date: date,
      event_time: time || null,
      event_type: type,
      updated_at: admin.firestore.Timestamp.now()
    });

    res.json({ message: 'Calendar event updated successfully' });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

app.delete('/api/calendar/events/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();
    if (!eventDoc.exists || eventDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    await db.collection('custom_calendar_events').doc(id).delete();

    res.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDoc.data();
    res.json({
      id: userId,
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

app.post('/api/enroll-request', authenticateToken, paymentScreenshotUpload.single('paymentScreenshot'), async (req, res) => {
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

    const requiredFields = ['courseId', 'fullName', 'email', 'phone', 'address', 'city', 'state', 'pincode', 'paymentMethod', 'transactionId'];
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

    const requestData = {
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
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    const requestRef = db.collection('course_enroll_requests');
    const requestDoc = await requestRef.add(requestData);

    res.status(201).json({
      message: 'Enrollment request submitted successfully',
      requestId: requestDoc.id
    });

  } catch (error) {
    console.error('Enrollment request error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const coursesQuery = db.collection('courses').where('is_active', '==', true).orderBy('created_at', 'desc');
    const coursesSnapshot = await coursesQuery.get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

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

app.get('/api/enrollments/my-courses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsQuery = db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').orderBy('enrollment_date', 'desc');
    const enrollmentsSnapshot = await enrollmentsQuery.get();
    const enrollments = enrollmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const courseIds = enrollments.map(enrollment => enrollment.course_id);
    const coursesQuery = db.collection('courses').where('id', 'in', courseIds);
    const coursesSnapshot = await coursesQuery.get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = enrollments.map(enrollment => {
      const course = courses.find(course => course.id === enrollment.course_id);
      return {
        ...enrollment,
        course: course
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/courses/enroll', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    const existingQuery = db.collection('enrollments').where('user_id', '==', userId).where('course_id', '==', courseId);
    const existingSnapshot = await existingQuery.get();
    if (!existingSnapshot.empty) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    const courseQuery = db.collection('courses').where('id', '==', courseId).where('is_active', '==', true);
    const courseSnapshot = await courseQuery.get();
    if (courseSnapshot.empty) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const enrollmentData = {
      user_id: userId,
      course_id: courseId,
      enrollment_date: admin.firestore.Timestamp.now(),
      status: 'active'
    };

    const enrollmentRef = db.collection('enrollments');
    const enrollmentDoc = await enrollmentRef.add(enrollmentData);

    await db.collection('user_stats').doc(userId).update({
      courses_enrolled: admin.firestore.FieldValue.increment(1)
    });

    res.status(201).json({ message: 'Successfully enrolled in course' });

  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

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

app.get('/assignments/all', authenticateToken, (req, res) => {
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

app.post('/assignments/submit', authenticateToken, assignmentUpload.single('file'), (req, res) => {
  const { assignment_id, content } = req.body;
  const file_path = req.file ? req.file.filename : null;

  if (!assignment_id) {
    return res.status(400).json({ error: 'Assignment ID is required' });
  }

  if (!content && !file_path) {
    return res.status(400).json({ error: 'Either content or file is required' });
  }

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

    const existingQuery = 'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND user_id = ?';
    db.query(existingQuery, [assignment_id, req.user.id], (err, existingResults) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingResults.length > 0) {
        return res.status(400).json({ error: 'Assignment already submitted' });
      }

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

app.get('/assignments/download-submission/:id', authenticateToken, (req, res) => {
  const submissionId = req.params.id;

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

    if (submission.user_id !== req.user.id && submission.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!submission.file_path) {
      return res.status(404).json({ error: 'No file attached to this submission' });
    }

    const filePath = path.join(__dirname, 'uploads', 'assignments', submission.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${submission.file_path}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  });
});

app.get('/assignments/course/:courseId', authenticateToken, (req, res) => {
  const courseId = req.params.courseId;

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

app.put('/assignments/grade/:submissionId', authenticateToken, (req, res) => {
  const submissionId = req.params.submissionId;
  const { grade, feedback } = req.body;

  const userQuery = 'SELECT account_type FROM users WHERE id = ?';
  db.query(userQuery, [req.user.id], (err, userResults) => {
    if (err || userResults.length === 0) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (userResults[0].account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    if (grade < 0 || grade > 100) {
      return res.status(400).json({ error: 'Grade must be between 0 and 100' });
    }

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

app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accountType = userDoc.data().account_type;

    const resourcesQuery = db.collection('resources').where('allowed_account_types', 'array-contains', accountType).orderBy('created_at', 'desc');
    const resourcesSnapshot = await resourcesQuery.get();
    const resources = resourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

app.get('/api/resources/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const resourceDoc = await db.collection('resources').doc(id).get();
    if (!resourceDoc.exists) {
      return res.status(404).json({ error: 'Resource not found or access denied' });
    }

    const resource = resourceDoc.data();
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();

    if (resource.is_premium && !['professional', 'business', 'agency', 'admin'].includes(user.account_type)) {
      return res.status(403).json({ error: 'Premium resource requires upgraded account' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${resource.title}.txt"`);
    res.setHeader('Content-Type', 'text/plain');

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

app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const certificatesQuery = db.collection('certificates').where('user_id', '==', userId).orderBy('issued_date', 'desc');
    const certificatesSnapshot = await certificatesQuery.get();
    const certificates = certificatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const courseIds = certificates.map(cert => cert.course_id);
    const coursesQuery = db.collection('courses').where('id', 'in', courseIds);
    const coursesSnapshot = await coursesQuery.get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = certificates.map(cert => {
      const course = courses.find(course => course.id === cert.course_id);
      return {
        ...cert,
        course: course
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

app.get('/api/certificates/:certificateId/download', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;

    const certificateDoc = await db.collection('certificates').doc(certificateId).get();
    if (!certificateDoc.exists || certificateDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = certificateDoc.data();

    if (certificate.certificate_url) {
      return res.redirect(certificate.certificate_url);
    }

    const certificateData = {
      recipientName: `${certificate.first_name} ${certificate.last_name}`,
      courseName: certificate.course_title,
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

app.get('/api/certificates', authenticateToken, async (req, res) => {
  try {
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const certificatesQuery = db.collection('certificates').orderBy('issued_date', 'desc');
    const certificatesSnapshot = await certificatesQuery.get();
    const certificates = certificatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const courseIds = certificates.map(cert => cert.course_id);
    const coursesQuery = db.collection('courses').where('id', 'in', courseIds);
    const coursesSnapshot = await coursesQuery.get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = certificates.map(cert => {
      const course = courses.find(course => course.id === cert.course_id);
      return {
        ...cert,
        course: course
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching all certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

app.post('/api/certificates', authenticateToken, async (req, res) => {
  try {
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId, courseId, certificateUrl } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'User ID and Course ID are required' });
    }

    const enrollmentQuery = db.collection('enrollments').where('user_id', '==', userId).where('course_id', '==', courseId).where('status', '==', 'completed');
    const enrollmentSnapshot = await enrollmentQuery.get();
    if (enrollmentSnapshot.empty) {
      return res.status(400).json({ error: 'User has not completed this course' });
    }

    const existingQuery = db.collection('certificates').where('user_id', '==', userId).where('course_id', '==', courseId);
    const existingSnapshot = await existingQuery.get();
    if (!existingSnapshot.empty) {
      return res.status(400).json({ error: 'Certificate already exists for this user and course' });
    }

    const certificateData = {
      user_id: userId,
      course_id: courseId,
      certificate_url: certificateUrl || null,
      issued_date: admin.firestore.Timestamp.now()
    };

    const certificateRef = db.collection('certificates');
    const certificateDoc = await certificateRef.add(certificateData);

    await db.collection('user_stats').doc(userId).update({
      certificates_earned: admin.firestore.FieldValue.increment(1)
    });

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificateId: certificateDoc.id
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ error: 'Failed to issue certificate' });
  }
});

app.put('/api/certificates/:certificateId', authenticateToken, async (req, res) => {
  try {
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { certificateId } = req.params;
    const { certificateUrl } = req.body;

    const certificateDoc = await db.collection('certificates').doc(certificateId).get();
    if (!certificateDoc.exists) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    await db.collection('certificates').doc(certificateId).update({
      certificate_url: certificateUrl,
      issued_date: admin.firestore.Timestamp.now()
    });

    res.json({ message: 'Certificate updated successfully' });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ error: 'Failed to update certificate' });
  }
});

app.delete('/api/certificates/:certificateId', authenticateToken, async (req, res) => {
  try {
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { certificateId } = req.params;

    const certificateDoc = await db.collection('certificates').doc(certificateId).get();
    if (!certificateDoc.exists) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = certificateDoc.data();
    await db.collection('certificates').doc(certificateId).delete();

    await db.collection('user_stats').doc(certificate.user_id).update({
      certificates_earned: admin.firestore.FieldValue.increment(-1)
    });

    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

const getDefaultResources = (accountType) => {
  const allResources = [
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

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user/stats', authenticateToken, async (req, res) => {
  try {
    const statsDoc = await db.collection('user_stats').doc(req.user.id).get();
    if (!statsDoc.exists) {
      await db.collection('user_stats').doc(req.user.id).set({
        user_id: req.user.id,
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0
      });

      res.json({
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0
      });
    } else {
      const stats = statsDoc.data();
      res.json(stats);
    }
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const resources = getDefaultResources(req.user.account_type);
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

    await db.collection('download_logs').add({
      user_id: req.user.id,
      resource_id: resourceId,
      resource_name: resource.title,
      created_at: admin.firestore.Timestamp.now()
    });

    const fileExtension = resource.type === 'excel' ? 'xlsx' : 'pdf';
    const filename = `${resource.title}.${fileExtension}`;

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

app.get('/api/courses/enrolled', authenticateToken, async (req, res) => {
  try {
    const enrollmentsQuery = db.collection('enrollments').where('user_id', '==', req.user.id).where('status', '==', 'active').orderBy('enrollment_date', 'desc');
    const enrollmentsSnapshot = await enrollmentsQuery.get();
    const enrollments = enrollmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const courseIds = enrollments.map(enrollment => enrollment.course_id);
    const coursesQuery = db.collection('courses').where('id', 'in', courseIds);
    const coursesSnapshot = await coursesQuery.get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = enrollments.map(enrollment => {
      const course = courses.find(course => course.id === enrollment.course_id);
      return {
        ...enrollment,
        course: course
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/internships', async (req, res) => {
  try {
    const internshipsQuery = db.collection('internships').orderBy('posted_at', 'desc');
    const internshipsSnapshot = await internshipsQuery.get();
    const internships = internshipsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(internships);
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ message: 'Internal server error while fetching internships.' });
  }
});

app.get('/api/user/internship-applications', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (!userId) {
    return res.status(400).json({ message: 'User ID not found in token.' });
  }

  try {
    const applicationsQuery = db.collection('internship_submissions').where('user_id', '==', userId).orderBy('submitted_at', 'desc');
    const applicationsSnapshot = await applicationsQuery.get();
    const applications = applicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const internshipIds = applications.map(app => app.internship_id);
    const internshipsQuery = db.collection('internships').where('id', 'in', internshipIds);
    const internshipsSnapshot = await internshipsQuery.get();
    const internships = internshipsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = applications.map(app => {
      const internship = internships.find(int => int.id === app.internship_id);
      return {
        ...app,
        internship: internship
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching user internship applications:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

app.post('/api/internships/:id/apply', authenticateToken, async (req, res) => {
  const { id: internshipId } = req.params;
  const { full_name, email, phone, resume_url, cover_letter } = req.body;
  const userId = req.user.id;

  if (!full_name || !email || !resume_url) {
    return res.status(400).json({ message: 'Full name, email, and resume link are required.' });
  }

  try {
    const internshipDoc = await db.collection('internships').doc(internshipId).get();
    if (!internshipDoc.exists) {
      return res.status(404).json({ message: 'Internship not found.' });
    }

    const internship = internshipDoc.data();
    if (internship.spots_available <= 0) {
      return res.status(400).json({ message: 'No available spots left for this internship.' });
    }

    const existingQuery = db.collection('internship_submissions').where('internship_id', '==', internshipId).where('user_id', '==', userId);
    const existingSnapshot = await existingQuery.get();
    if (!existingSnapshot.empty) {
      return res.status(409).json({ message: 'You have already applied for this internship.' });
    }

    const applicationData = {
      internship_id: internshipId,
      user_id: userId,
      full_name: full_name,
      email: email,
      phone: phone || null,
      resume_url: resume_url,
      cover_letter: cover_letter || null,
      submitted_at: admin.firestore.Timestamp.now(),
      status: 'pending'
    };

    const applicationRef = db.collection('internship_submissions');
    const applicationDoc = await applicationRef.add(applicationData);

    await db.collection('internships').doc(internshipId).update({
      spots_available: admin.firestore.FieldValue.increment(-1),
      applications_count: admin.firestore.FieldValue.increment(1)
    });

    res.status(201).json({ message: 'Internship application submitted successfully!' });

  } catch (error) {
    console.error('Error submitting internship application:', error);
    res.status(500).json({ message: 'Internal server error during application submission.' });
  }
});

app.get('/api/services/categories', async (req, res) => {
  try {
    const categoriesQuery = db.collection('service_categories').where('is_active', '==', true).orderBy('name');
    const categoriesSnapshot = await categoriesQuery.get();
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const categoriesWithSubs = await Promise.all(categories.map(async (category) => {
      const subcategoriesQuery = db.collection('service_subcategories').where('category_id', '==', category.id).where('is_active', '==', true).orderBy('name');
      const subcategoriesSnapshot = await subcategoriesQuery.get();
      const subcategories = subcategoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        subcategories: subcategories
      };
    }));

    res.json(categoriesWithSubs);

  } catch (error) {
    console.error('Get service categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/services/requests', authenticateToken, async (req, res) => {
  try {
    const {
      subcategoryId, fullName, email, phone, company, website,
      projectDetails, budgetRange, timeline, contactMethod, additionalRequirements
    } = req.body;
    const userId = req.user.id;

    if (!subcategoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const subcategoryDoc = await db.collection('service_subcategories').doc(subcategoryId).get();
    if (!subcategoryDoc.exists || !subcategoryDoc.data().is_active) {
      return res.status(404).json({ error: 'Service subcategory not found' });
    }

    const requestData = {
      user_id: userId,
      subcategory_id: subcategoryId,
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
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    const requestRef = db.collection('service_requests');
    const requestDoc = await requestRef.add(requestData);

    res.status(201).json({
      message: 'Service request submitted successfully',
      requestId: requestDoc.id
    });

  } catch (error) {
    console.error('Service request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/services/my-requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const requestsQuery = db.collection('service_requests').where('user_id', '==', userId).orderBy('created_at', 'desc');
    const requestsSnapshot = await requestsQuery.get();
    const requests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const subcategoryIds = requests.map(request => request.subcategory_id);
    const subcategoriesQuery = db.collection('service_subcategories').where('id', 'in', subcategoryIds);
    const subcategoriesSnapshot = await subcategoriesQuery.get();
    const subcategories = subcategoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = requests.map(request => {
      const subcategory = subcategories.find(sub => sub.id === request.subcategory_id);
      return {
        ...request,
        subcategory: subcategory
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const [
      totalUsersResult,
      totalCoursesResult,
      totalEnrollmentsResult,
      totalRevenueResult,
      pendingContactsResult,
      pendingServiceRequestsResult
    ] = await Promise.all([
      db.collection('users').where('is_active', '==', true).get(),
      db.collection('courses').where('is_active', '==', true).get(),
      db.collection('enrollments').get(),
      db.collection('enrollments').get(),
      db.collection('contact_messages').where('created_at', '>=', admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))).get(),
      db.collection('service_requests').where('status', '==', 'pending').get()
    ]);

    const totalUsers = totalUsersResult.size;
    const totalCourses = totalCoursesResult.size;
    const totalEnrollments = totalEnrollmentsResult.size;
    const totalRevenue = totalRevenueResult.docs.reduce((sum, doc) => sum + (doc.data().price || 0), 0);
    const pendingContacts = pendingContactsResult.size;
    const pendingServiceRequests = pendingServiceRequestsResult.size;

    res.json({
      totalUsers: totalUsers,
      totalCourses: totalCourses,
      totalEnrollments: totalEnrollments,
      totalRevenue: totalRevenue,
      pendingContacts: pendingContacts,
      pendingServiceRequests: pendingServiceRequests
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

app.get('/api/admin/recent-users', authenticateToken, async (req, res) => {
  try {
    const usersQuery = db.collection('users').where('is_active', '==', true).orderBy('created_at', 'desc').limit(5);
    const usersSnapshot = await usersQuery.get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(users);
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({ error: 'Failed to fetch recent users', details: error.message });
  }
});

app.get('/api/admin/recent-enrollments', authenticateToken, async (req, res) => {
  try {
    const enrollmentsQuery = db.collection('enrollments').orderBy('enrollment_date', 'desc').limit(5);
    const enrollmentsSnapshot = await enrollmentsQuery.get();
    const enrollments = enrollmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const userIds = enrollments.map(enrollment => enrollment.user_id);
    const usersQuery = db.collection('users').where('id', 'in', userIds);
    const usersSnapshot = await usersQuery.get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const courseIds = enrollments.map(enrollment => enrollment.course_id);
    const coursesQuery = db.collection('courses').where('id', 'in', courseIds);
    const coursesSnapshot = await coursesQuery.get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = enrollments.map(enrollment => {
      const user = users.find(user => user.id === enrollment.user_id);
      const course = courses.find(course => course.id === enrollment.course_id);
      return {
        ...enrollment,
        user_name: `${user.first_name} ${user.last_name}`,
        course_name: course.title
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching recent enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch recent enrollments', details: error.message });
  }
});

app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, phone, company, message } = req.body;

  try {
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        error: 'First name, last name, email, and message are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    const contactData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone || null,
      company: company || null,
      message: message.trim(),
      created_at: admin.firestore.Timestamp.now()
    };

    const contactRef = db.collection('contact_messages');
    const contactDoc = await contactRef.add(contactData);

    console.log('Contact message saved successfully:', {
      id: contactDoc.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim()
    });

    res.status(201).json({
      message: 'Contact message sent successfully',
      contactId: contactDoc.id
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userGrowthQuery = db.collection('users').where('created_at', '>=', admin.firestore.Timestamp.fromDate(new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000))).orderBy('created_at');
    const userGrowthSnapshot = await userGrowthQuery.get();
    const userGrowth = userGrowthSnapshot.docs.map(doc => ({
      month: doc.data().created_at.toDate().toISOString().substring(0, 7),
      count: 1
    }));

    const courseEnrollmentsQuery = db.collection('courses').where('is_active', '==', true);
    const courseEnrollmentsSnapshot = await courseEnrollmentsQuery.get();
    const courseEnrollments = courseEnrollmentsSnapshot.docs.map(doc => ({
      title: doc.data().title,
      enrollments: 0
    }));

    const revenueDataQuery = db.collection('enrollments').where('enrollment_date', '>=', admin.firestore.Timestamp.fromDate(new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000))).orderBy('enrollment_date');
    const revenueDataSnapshot = await revenueDataQuery.get();
    const revenueData = revenueDataSnapshot.docs.map(doc => ({
      month: doc.data().enrollment_date.toDate().toISOString().substring(0, 7),
      revenue: 0
    }));

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

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const accountType = req.query.accountType;
    const status = req.query.status;
    const search = req.query.search;

    let query = db.collection('users');
    if (accountType && accountType !== 'all') {
      query = query.where('account_type', '==', accountType);
    }
    if (status && status !== 'all') {
      const isActive = status === 'active' ? true : false;
      query = query.where('is_active', '==', isActive);
    }
    if (search) {
      query = query.where('first_name', '>=', search).where('first_name', '<=', search + '\uf8ff');
    }
    query = query.orderBy('created_at', 'desc').limit(limit).offset(offset);

    const usersSnapshot = await query.get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const totalCountQuery = db.collection('users');
    if (accountType && accountType !== 'all') {
      totalCountQuery = totalCountQuery.where('account_type', '==', accountType);
    }
    if (status && status !== 'all') {
      const isActive = status === 'active' ? true : false;
      totalCountQuery = totalCountQuery.where('is_active', '==', isActive);
    }
    if (search) {
      totalCountQuery = totalCountQuery.where('first_name', '>=', search).where('first_name', '<=', search + '\uf8ff');
    }
    const totalCountSnapshot = await totalCountQuery.get();
    const totalCount = totalCountSnapshot.size;

    res.json({
      users: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalUsers: totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDoc.data();
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, accountType, isActive, company, website, bio } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'First name, last name, email, and password are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const userQuery = db.collection('users').where('email', '==', email);
    const userSnapshot = await userQuery.get();
    if (!userSnapshot.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userData = {
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
      created_at: admin.firestore.Timestamp.now()
    };

    const userRef = db.collection('users');
    const userDoc = await userRef.add(userData);

    await db.collection('user_stats').doc(userDoc.id).set({
      user_id: userDoc.id,
      courses_enrolled: 0,
      courses_completed: 0,
      certificates_earned: 0,
      learning_streak: 0
    });

    console.log('User created successfully by admin:', { userId: userDoc.id, email });

    const newUserDoc = await userRef.doc(userDoc.id).get();
    const newUser = newUserDoc.data();

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, email, phone, accountType, isActive, company, website, bio } = req.body;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDoc.data();
    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }

      const existingQuery = db.collection('users').where('email', '==', email).where('id', '!=', userId);
      const existingSnapshot = await existingQuery.get();
      if (!existingSnapshot.empty) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const updateData = {
      first_name: firstName || user.first_name,
      last_name: lastName || user.last_name,
      email: email || user.email,
      phone: phone || user.phone,
      account_type: accountType || user.account_type,
      is_active: isActive !== undefined ? isActive : user.is_active,
      company: company || user.company,
      website: website || user.website,
      bio: bio || user.bio,
      updated_at: admin.firestore.Timestamp.now()
    };

    await db.collection('users').doc(userId).update(updateData);

    const updatedUserDoc = await db.collection('users').doc(userId).get();
    const updatedUser = updatedUserDoc.data();

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id;

    if (parseInt(userId) === parseInt(adminId)) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.collection('users').doc(userId).update({
      is_active: false,
      updated_at: admin.firestore.Timestamp.now()
    });

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error while deleting user' });
  }
});

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

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await db.collection('users').doc(userId).update({
      password_hash: hashedPassword,
      updated_at: admin.firestore.Timestamp.now()
    });

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/payments/upload-proof', authenticateToken, paymentProofUpload.single('file'), async (req, res) => {
  try {
    const { transaction_id, payment_method, resource_id, plan, amount, user_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Payment proof file is required' });
    }

    if (!transaction_id) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const paymentData = {
      user_id: user_id,
      resource_id: resource_id || null,
      plan: plan,
      amount: amount,
      payment_method: payment_method,
      transaction_id: transaction_id,
      proof_file: req.file.filename,
      status: 'pending',
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    const paymentRef = db.collection('payments');
    const paymentDoc = await paymentRef.add(paymentData);

    res.json({
      message: 'Payment proof uploaded successfully',
      paymentId: paymentDoc.id
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ error: 'Failed to upload payment proof' });
  }
});

app.get('/api/admin/payments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const paymentsQuery = db.collection('payments').orderBy('created_at', 'desc');
    const paymentsSnapshot = await paymentsQuery.get();
    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const userIds = payments.map(payment => payment.user_id);
    const usersQuery = db.collection('users').where('id', 'in', userIds);
    const usersSnapshot = await usersQuery.get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const resourceIds = payments.map(payment => payment.resource_id);
    const resourcesQuery = db.collection('resources').where('id', 'in', resourceIds);
    const resourcesSnapshot = await resourcesQuery.get();
    const resources = resourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = payments.map(payment => {
      const user = users.find(user => user.id === payment.user_id);
      const resource = resources.find(resource => resource.id === payment.resource_id);
      return {
        ...payment,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        resource_title: resource.title
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

app.put('/api/admin/payments/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const paymentDoc = await db.collection('payments').doc(id).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    await db.collection('payments').doc(id).update({
      status: status,
      verified_at: admin.firestore.Timestamp.now()
    });

    if (status === 'approved') {
      const payment = paymentDoc.data();
      if (payment.plan === 'individual' && payment.resource_id) {
        await db.collection('user_resources').add({
          user_id: payment.user_id,
          resource_id: payment.resource_id,
          created_at: admin.firestore.Timestamp.now()
        });
      } else if (payment.plan === 'premium') {
        await db.collection('users').doc(payment.user_id).update({
          subscription_plan: 'premium'
        });
      }
    }

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

app.get('/api/admin/enrollments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const enrollmentsQuery = db.collection('enrollments').orderBy('enrollment_date', 'desc');
    const enrollmentsSnapshot = await enrollmentsQuery.get();
    const enrollments = enrollmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const userIds = enrollments.map(enrollment => enrollment.user_id);
    const usersQuery = db.collection('users').where('id', 'in', userIds);
    const usersSnapshot = await usersQuery.get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const courseIds = enrollments.map(enrollment => enrollment.course_id);
    const coursesQuery = db.collection('courses').where('id', 'in', courseIds);
    const coursesSnapshot = await coursesQuery.get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = enrollments.map(enrollment => {
      const user = users.find(user => user.id === enrollment.user_id);
      const course = courses.find(course => course.id === enrollment.course_id);
      return {
        ...enrollment,
        user_name: `${user.first_name} ${user.last_name}`,
        course_name: course.title
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

app.put('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, completion_date } = req.body;

    const enrollmentDoc = await db.collection('enrollments').doc(id).get();
    if (!enrollmentDoc.exists) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    await db.collection('enrollments').doc(id).update({
      status: status,
      progress: progress,
      completion_date: status === 'completed' ? (completion_date || admin.firestore.Timestamp.now()) : null
    });

    res.json({ message: 'Enrollment updated successfully' });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({ error: 'Failed to update enrollment' });
  }
});

app.delete('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const enrollmentDoc = await db.collection('enrollments').doc(id).get();
    if (!enrollmentDoc.exists) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    await db.collection('enrollments').doc(id).delete();

    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ error: 'Failed to delete enrollment' });
  }
});

app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const coursesQuery = db.collection('courses').orderBy('created_at', 'desc');
    const coursesSnapshot = await coursesQuery.get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

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

    if (!title || !instructor_name || !duration_weeks || !difficulty_level || !category || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const courseData = {
      title: title,
      description: description,
      instructor_name: instructor_name,
      duration_weeks: duration_weeks,
      difficulty_level: difficulty_level,
      category: category,
      price: price,
      is_active: is_active || true,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    const courseRef = db.collection('courses');
    const courseDoc = await courseRef.add(courseData);

    res.status(201).json({
      message: 'Course created successfully',
      courseId: courseDoc.id
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

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

    if (!title || !instructor_name || !duration_weeks || !difficulty_level || !category || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const courseDoc = await db.collection('courses').doc(id).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const updateData = {
      title: title,
      description: description,
      instructor_name: instructor_name,
      duration_weeks: duration_weeks,
      difficulty_level: difficulty_level,
      category: category,
      price: price,
      is_active: is_active,
      updated_at: admin.firestore.Timestamp.now()
    };

    await db.collection('courses').doc(id).update(updateData);

    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

app.delete('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const enrollmentQuery = db.collection('enrollments').where('course_id', '==', id);
    const enrollmentSnapshot = await enrollmentQuery.get();
    if (!enrollmentSnapshot.empty) {
      return res.status(400).json({ error: 'Cannot delete course with active enrollments' });
    }

    const courseDoc = await db.collection('courses').doc(id).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await db.collection('courses').doc(id).delete();

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

app.post('/api/admin/courses/:id/thumbnail', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const thumbnailPath = `/uploads/courses/${req.file.filename}`;

    const courseDoc = await db.collection('courses').doc(id).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await db.collection('courses').doc(id).update({
      thumbnail: thumbnailPath,
      updated_at: admin.firestore.Timestamp.now()
    });

    res.json({ message: 'Thumbnail uploaded successfully', thumbnail: thumbnailPath });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    res.status(500).json({ error: 'Failed to upload thumbnail' });
  }
});

app.get('/api/admin/resources', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const resourcesQuery = db.collection('resources').orderBy('created_at', 'desc');
    const resourcesSnapshot = await resourcesQuery.get();
    const resources = resourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

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

    if (!title || !description || !type || !category || !icon_name || !button_color || !allowed_account_types) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const accountTypesArray = Array.isArray(allowed_account_types) ? allowed_account_types : [allowed_account_types];
    const accountTypesJSON = JSON.stringify(accountTypesArray);

    const resourceData = {
      title: title,
      description: description,
      type: type,
      size: size || null,
      url: url || null,
      category: category,
      icon_name: icon_name,
      button_color: button_color,
      allowed_account_types: accountTypesJSON,
      is_premium: is_premium || false,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    const resourceRef = db.collection('resources');
    const resourceDoc = await resourceRef.add(resourceData);

    res.status(201).json({
      message: 'Resource created successfully',
      resourceId: resourceDoc.id
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

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

    if (!title || !description || !type || !category || !icon_name || !button_color || !allowed_account_types) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const accountTypesArray = Array.isArray(allowed_account_types) ? allowed_account_types : [allowed_account_types];
    const accountTypesJSON = JSON.stringify(accountTypesArray);

    const resourceDoc = await db.collection('resources').doc(id).get();
    if (!resourceDoc.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const updateData = {
      title: title,
      description: description,
      type: type,
      size: size || null,
      url: url || null,
      category: category,
      icon_name: icon_name,
      button_color: button_color,
      allowed_account_types: accountTypesJSON,
      is_premium: is_premium,
      updated_at: admin.firestore.Timestamp.now()
    };

    await db.collection('resources').doc(id).update(updateData);

    res.json({ message: 'Resource updated successfully' });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

app.delete('/api/admin/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const resourceDoc = await db.collection('resources').doc(id).get();
    if (!resourceDoc.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await db.collection('resources').doc(id).delete();

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

app.get('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentsQuery = db.collection('assignments').orderBy('created_at', 'desc');
    const assignmentsSnapshot = await assignmentsQuery.get();
    const assignments = assignmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const courseIds = assignments.map(assignment => assignment.course_id);
    const coursesQuery = db.collection('courses').where('id', 'in', courseIds);
    const coursesSnapshot = await coursesQuery.get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = assignments.map(assignment => {
      const course = courses.find(course => course.id === assignment.course_id);
      return {
        ...assignment,
        course_title: course.title
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

app.post('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      course_id,
      description,
      due_date,
      max_points
    } = req.body;

    if (!title || !course_id || !due_date || !max_points) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const assignmentData = {
      title: title,
      course_id: course_id,
      description: description,
      due_date: due_date,
      max_points: max_points,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    const assignmentRef = db.collection('assignments');
    const assignmentDoc = await assignmentRef.add(assignmentData);

    res.status(201).json({
      message: 'Assignment created successfully',
      assignmentId: assignmentDoc.id
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

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

    if (!title || !course_id || !due_date || !max_points) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const assignmentDoc = await db.collection('assignments').doc(id).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const updateData = {
      title: title,
      course_id: course_id,
      description: description,
      due_date: due_date,
      max_points: max_points,
      updated_at: admin.firestore.Timestamp.now()
    };

    await db.collection('assignments').doc(id).update(updateData);

    res.json({ message: 'Assignment updated successfully' });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

app.delete('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const submissionQuery = db.collection('assignment_submissions').where('assignment_id', '==', id);
    const submissionSnapshot = await submissionQuery.get();
    if (!submissionSnapshot.empty) {
      return res.status(400).json({ error: 'Cannot delete assignment with existing submissions' });
    }

    const assignmentDoc = await db.collection('assignments').doc(id).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await db.collection('assignments').doc(id).delete();

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

app.get('/api/admin/contact-messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const messagesQuery = db.collection('contact_messages').orderBy('created_at', 'desc').limit(limit).offset(offset);
    const messagesSnapshot = await messagesQuery.get();
    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const totalCountQuery = db.collection('contact_messages');
    const totalCountSnapshot = await totalCountQuery.get();
    const totalCount = totalCountSnapshot.size;

    res.json({
      messages: messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalMessages: totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Failed to fetch contact messages' });
  }
});

app.put('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'contacted', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const messageDoc = await db.collection('contact_messages').doc(id).get();
    if (!messageDoc.exists) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    await db.collection('contact_messages').doc(id).update({
      status: status
    });

    res.json({ message: 'Contact message updated successfully' });
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500).json({ error: 'Failed to update contact message' });
  }
});

app.delete('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const messageDoc = await db.collection('contact_messages').doc(id).get();
    if (!messageDoc.exists) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    await db.collection('contact_messages').doc(id).delete();

    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ error: 'Failed to delete contact message' });
  }
});

app.get('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const servicesQuery = db.collection('services').orderBy('created_at', 'desc');
    const servicesSnapshot = await servicesQuery.get();
    const services = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const categoryIds = services.map(service => service.category_id);
    const categoriesQuery = db.collection('service_categories').where('id', 'in', categoryIds);
    const categoriesSnapshot = await categoriesQuery.get();
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = services.map(service => {
      const category = categories.find(cat => cat.id === service.category_id);
      return {
        ...service,
        category_name: category.name,
        category_id: category.id,
        features: service.features ? JSON.parse(service.features) : [],
        is_active: service.is_active === 1,
        popular: service.popular === 1
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.get('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const serviceDoc = await db.collection('services').doc(id).get();
    if (!serviceDoc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = serviceDoc.data();
    const categoryDoc = await db.collection('service_categories').doc(service.category_id).get();
    if (!categoryDoc.exists) {
      return res.status(404).json({ error: 'Service category not found' });
    }

    const category = categoryDoc.data();
    const result = {
      ...service,
      category_name: category.name,
      category_id: category.id,
      features: service.features ? JSON.parse(service.features) : [],
      is_active: service.is_active === 1,
      popular: service.popular === 1
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

app.post('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
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

    if (!name || !category_id || !price) {
      return res.status(400).json({ error: 'Name, category, and price are required' });
    }

    const serviceData = {
      name: name,
      category_id: category_id,
      description: description || null,
      price: price,
      duration: duration || null,
      features: features ? JSON.stringify(features) : null,
      popular: popular ? 1 : 0,
      is_active: is_active ? 1 : 0,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    const serviceRef = db.collection('services');
    const serviceDoc = await serviceRef.add(serviceData);

    res.status(201).json({
      message: 'Service created successfully',
      serviceId: serviceDoc.id
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

app.put('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
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

    const serviceDoc = await db.collection('services').doc(id).get();
    if (!serviceDoc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const updateData = {
      name: name,
      category_id: category_id,
      description: description || null,
      price: price,
      duration: duration || null,
      features: features ? JSON.stringify(features) : null,
      popular: popular ? 1 : 0,
      is_active: is_active ? 1 : 0,
      updated_at: admin.firestore.Timestamp.now()
    };

    await db.collection('services').doc(id).update(updateData);

    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const serviceDoc = await db.collection('services').doc(id).get();
    if (!serviceDoc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await db.collection('services').doc(id).delete();

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

app.get('/api/admin/service-categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const categoriesQuery = db.collection('service_categories').where('is_active', '==', true).orderBy('name');
    const categoriesSnapshot = await categoriesQuery.get();
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(categories);
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({ error: 'Failed to fetch service categories' });
  }
});

app.get('/api/admin/calendar-events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const eventsQuery = db.collection('custom_calendar_events').orderBy('event_date', 'desc').orderBy('event_time', 'desc');
    const eventsSnapshot = await eventsQuery.get();
    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const userIds = events.map(event => event.user_id);
    const usersQuery = db.collection('users').where('id', 'in', userIds);
    const usersSnapshot = await usersQuery.get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = events.map(event => {
      const user = users.find(user => user.id === event.user_id);
      return {
        ...event,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

app.get('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    const event = eventDoc.data();
    const userDoc = await db.collection('users').doc(event.user_id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDoc.data();
    const result = {
      ...event,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    res.status(500).json({ error: 'Failed to fetch calendar event' });
  }
});

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

    if (!title || !event_date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(event_date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const eventData = {
      user_id: user_id || null,
      title: title,
      description: description || null,
      event_date: event_date,
      event_time: event_time || null,
      event_type: event_type || 'custom',
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    };

    const eventRef = db.collection('custom_calendar_events');
    const eventDoc = await eventRef.add(eventData);

    res.status(201).json({
      message: 'Calendar event created successfully',
      eventId: eventDoc.id
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

app.put('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user_id,
      title,
      description,
      event_date,
      event_time,
      event_type
    } = req.body;

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    if (event_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(event_date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
    }

    const updateData = {
      user_id: user_id || null,
      title: title,
      description: description || null,
      event_date: event_date,
      event_time: event_time || null,
      event_type: event_type || 'custom',
      updated_at: admin.firestore.Timestamp.now()
    };

    await db.collection('custom_calendar_events').doc(id).update(updateData);

    res.json({ message: 'Calendar event updated successfully' });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

app.delete('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    await db.collection('custom_calendar_events').doc(id).delete();

    res.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersQuery = db.collection('users').where('is_active', '==', true).orderBy('first_name').orderBy('last_name');
    const usersSnapshot = await usersQuery.get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requestsQuery = db.collection('service_requests').orderBy('created_at', 'desc');
    const requestsSnapshot = await requestsQuery.get();
    const requests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const subcategoryIds = requests.map(request => request.subcategory_id);
    const subcategoriesQuery = db.collection('service_subcategories').where('id', 'in', subcategoryIds);
    const subcategoriesSnapshot = await subcategoriesQuery.get();
    const subcategories = subcategoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const userIds = requests.map(request => request.user_id);
    const usersQuery = db.collection('users').where('id', 'in', userIds);
    const usersSnapshot = await usersQuery.get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = requests.map(request => {
      const subcategory = subcategories.find(sub => sub.id === request.subcategory_id);
      const user = users.find(user => user.id === request.user_id);
      return {
        ...request,
        service: subcategory.name,
        user_first_name: user.first_name,
        user_last_name: user.last_name,
        user_account_type: user.account_type
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests', details: error.message });
  }
});

app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, project_details, budget_range, timeline, additional_requirements } = req.body;

    const requestDoc = await db.collection('service_requests').doc(id).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    const updateData = {
      status: status,
      project_details: project_details,
      budget_range: budget_range,
      timeline: timeline,
      additional_requirements: additional_requirements,
      updated_at: admin.firestore.Timestamp.now()
    };

    await db.collection('service_requests').doc(id).update(updateData);

    res.json({ message: 'Service request updated successfully' });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ error: 'Failed to update service request', details: error.message });
  }
});

app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const requestDoc = await db.collection('service_requests').doc(id).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    await db.collection('service_requests').doc(id).update({
      status: status,
      updated_at: admin.firestore.Timestamp.now()
    });

    res.json({ message: 'Service request updated successfully' });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ error: 'Failed to update service request', details: error.message });
  }
});

app.delete('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const requestDoc = await db.collection('service_requests').doc(id).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    await db.collection('service_requests').doc(id).delete();

    res.json({ message: 'Service request deleted successfully' });
  } catch (error) {
    console.error('Error deleting service request:', error);
    res.status(500).json({ error: 'Failed to delete service request', details: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'Padak Dashboard API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

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

process.on('SIGINT', async () => {
  console.log('Received SIGINT. Graceful shutdown...');
  await admin.app().delete();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;