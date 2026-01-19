// routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const { db, firebase } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

// Get user stats
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const statsDoc = await db.collection('user_stats').doc(userId).get();

    if (!statsDoc.exists) {
      // Create default stats if not exists
      await db.collection('user_stats').doc(userId).set({
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

// This fetches all enrolled courses for a specific user, including course details
router.get('/users/:userId/enrollments', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (req.params.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own enrollment data.' });
  }

  try {
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).orderBy('enrollment_date', 'desc').get();

    const enrollments = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const c = courseDoc.data();
      enrollments.push({
        id: doc.id,
        progress: e.progress,
        status: e.status,
        enrollment_date: e.enrollment_date,
        completion_date: e.completion_date,
        course_id: e.course_id,
        courseTitle: c.title,
        instructorName: c.instructor_name,
        durationWeeks: c.duration_weeks
      });
    }

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching user enrollments for dashboard:', error);
    res.status(500).json({ error: 'Internal server error while fetching enrolled courses.' });
  }
});

// GET /api/users/:userId/internship-submissions
router.get('/users/:userId/internship-submissions', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (req.params.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own internship submissions.' });
  }

  try {
    const applicationsSnap = await db.collection('internship_submissions').where('user_id', '==', userId).orderBy('submitted_at', 'desc').get();

    const applications = [];
    for (const doc of applicationsSnap.docs) {
      const sub = doc.data();
      const internshipDoc = await db.collection('internships').doc(sub.internship_id).get();
      const i = internshipDoc.data();
      applications.push({
        id: doc.id,
        internship_id: sub.internship_id,
        applicationStatus: sub.status,
        applicationDate: sub.submitted_at,
        internshipTitle: i.title,
        companyName: i.company
      });
    }

    res.json(applications);
  } catch (error) {
    console.error('Error fetching user internship applications for dashboard:', error); 
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// GET /api/users/:userId/service-requests - Fetch a user's submitted service requests
router.get('/users/:userId/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (req.params.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
  }

  try {
    const requestsSnap = await db.collection('service_requests')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const requests = [];
    
    for (const doc of requestsSnap.docs) {
      const sr = doc.data();
      
      let categoryName = 'Unknown Category';
      
      try {
        const subcategoryDoc = await db.collection('service_subcategories').doc(sr.subcategory_id).get();
        
        if (!subcategoryDoc.exists) {
          console.warn(`Subcategory ${sr.subcategory_id} not found for request ${doc.id}`);
        } else {
          const sc = subcategoryDoc.data();
          
          if (sc && sc.category_id) {
            const categoryDoc = await db.collection('service_categories').doc(sc.category_id).get();
            
            if (categoryDoc.exists) {
              const category = categoryDoc.data();
              categoryName = category.name || 'Unknown Category';
            } else {
              console.warn(`Category ${sc.category_id} not found for subcategory ${sr.subcategory_id}`);
            }
          } else {
            console.warn(`Subcategory ${sr.subcategory_id} has no category_id`);
          }
        }
      } catch (fetchError) {
        console.error(`Error fetching category for request ${doc.id}:`, fetchError);
      }
      
      requests.push({
        id: doc.id,
        userId: sr.user_id,
        categoryId: sr.subcategory_id,
        categoryName: categoryName,
        fullName: sr.full_name,
        email: sr.email,
        phone: sr.phone,
        company: sr.company || '',
        website: sr.website || '',
        projectDetails: sr.project_details,
        budgetRange: sr.budget_range,
        timeline: sr.timeline,
        contactMethod: sr.contact_method,
        additionalRequirements: sr.additional_requirements || '',
        status: sr.status,
        requestDate: sr.created_at?.toDate ? sr.created_at.toDate().toISOString() : new Date().toISOString(),
        updatedAt: sr.updated_at?.toDate ? sr.updated_at.toDate().toISOString() : new Date().toISOString()
      });
    }

    console.log(`✅ Returning ${requests.length} service requests for user ${userId}`);
    res.json(requests);
    
  } catch (error) {
    console.error('Error fetching user service requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch your service requests.', 
      error: error.message 
    });
  }
});

module.exports = router;

// ==================== AUTH ROUTES ====================

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, phone, password, confirmPassword, accountType } = req.body;

  try {
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword || !accountType) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide a valid email address' 
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Passwords do not match' 
      });
    }

    // Validate password strength
    const passwordErrors = [];
    if (password.length < 6) passwordErrors.push("Password must be at least 6 characters long");
    if (!/[A-Z]/.test(password)) passwordErrors.push("Password must contain at least one uppercase letter");
    if (!/[a-z]/.test(password)) passwordErrors.push("Password must contain at least one lowercase letter");
    if (!/[0-9]/.test(password)) passwordErrors.push("Password must contain at least one number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) passwordErrors.push("Password must contain at least one special character");

    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: passwordErrors[0] 
      });
    }

    // Check if email exists
    const existingUsers = await db.collection('users').where('email', '==', email.toLowerCase()).get();
    if (!existingUsers.empty) {
      return res.status(400).json({ 
        success: false,
        error: 'Email already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user in Firestore
    const userRef = db.collection('users').doc();
    const userData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '',
      password_hash: hashedPassword,
      account_type: accountType,
      is_active: true,
      email_verified: false,
      company: '',
      website: '',
      bio: '',
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(userData);

    console.log('User registered successfully:', { userId: userRef.id, email });
    
    // Generate JWT token for immediate login
    const token = jwt.sign(
      {
        userId: userRef.id,
        email: email,
        accountType: accountType
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: userRef.id,
      token: token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during registration' 
    });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Check if user exists in Firestore
    const users = await db.collection('users').where('email', '==', email.toLowerCase()).get();

    if (users.empty) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    const userDoc = users.docs[0];
    const user = userDoc.data();
    const userId = userDoc.id;

    // Check if user is active
    if (user.is_active === false) {
      return res.status(401).json({ 
        success: false,
        error: 'Account deactivated. Please contact administrator.' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const tokenExpiry = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      {
        userId: userId,
        email: user.email,
        accountType: user.account_type
      },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // ✅ AUTO-LINK GUEST ENROLLMENTS - ADD THIS
    try {
      const requestsSnap = await db.collection('course_enroll_requests')
        .where('email', '==', email.toLowerCase())
        .where('status', '==', 'approved')
        .where('user_id', '==', null)
        .get();

      for (const doc of requestsSnap.docs) {
        const request = doc.data();

        // Check if already enrolled
        const existingEnrollment = await db.collection('enrollments')
          .where('user_id', '==', userId)
          .where('course_id', '==', request.course_id)
          .get();

        if (existingEnrollment.empty) {
          // Create enrollment
          await db.collection('enrollments').add({
            user_id: userId,
            course_id: request.course_id,
            enrollment_date: request.created_at || firebase.firestore.Timestamp.now(),
            progress: 0,
            status: 'active',
            completion_date: null
          });
        }

        // Update request to link user_id
        await db.collection('course_enroll_requests').doc(doc.id).update({
          user_id: userId
        });
      }
    } catch (linkError) {
      console.error('Error auto-linking guest enrollments:', linkError);
    }

    // Update last login timestamp
    await db.collection('users').doc(userId).update({
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log('User logged in successfully:', { userId, email: user.email });

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: userId,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        accountType: user.account_type,
        profileImage: user.profile_image || '',
        company: user.company || '',
        website: user.website || '',
        bio: user.bio || '',
        isActive: user.is_active,
        emailVerified: user.email_verified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during login' 
    });
  }
});

// ==================== USER PROFILE ENDPOINTS ====================

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

    await db.collection('users').doc(userId).update({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      company: company,
      website: website,
      bio: bio,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Get updated user data
    const updatedUserDoc = await db.collection('users').doc(userId).get();
    const user = updatedUserDoc.data();

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

// Get user stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const statsDoc = await db.collection('user_stats').doc(userId).get();

    if (!statsDoc.exists) {
      // Create default stats if not exists
      const defaultStats = {
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0,
        last_activity: new Date().toISOString()
      };
      await db.collection('user_stats').doc(userId).set(defaultStats);

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