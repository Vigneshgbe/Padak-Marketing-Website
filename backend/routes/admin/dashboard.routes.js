// backend/routes/admin/dashboard.routes.js

const express = require('express');
const app = express();
const { db } = require('../../config/firebase');
const { authenticateToken } = require('../../middleware/auth.middleware');


// ==================== ADMIN DASHBOARD ROUTES ====================

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    // Fixed query - using true instead of 1 for boolean comparison
    const usersSnap = await db.collection('users').where('is_active', '==', true).get();
    const totalUsers = usersSnap.size;

    // Fixed query - using true instead of 1
    const coursesSnap = await db.collection('courses').where('is_active', '==', true).get();
    const totalCourses = coursesSnap.size;

    const enrollmentsSnap = await db.collection('enrollments').get();
    const totalEnrollments = enrollmentsSnap.size;

    // Calculate revenue with proper error handling
    let totalRevenue = 0;
    for (const doc of enrollmentsSnap.docs) {
      try {
        const e = doc.data();
        if (e.status === 'completed' && e.course_id) {
          const courseDoc = await db.collection('courses').doc(e.course_id).get();
          if (courseDoc.exists) {
            const courseData = courseDoc.data();
            totalRevenue += parseFloat(courseData.price || '0');
          }
        }
      } catch (revenueError) {
        console.error('Error calculating revenue for enrollment:', doc.id, revenueError);
        // Continue with other enrollments
      }
    }

    const sevenDaysAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
    const contactsSnap = await db.collection('contact_messages').where('created_at', '>=', sevenDaysAgo).get();
    const pendingContacts = contactsSnap.size;

    const serviceRequestsSnap = await db.collection('service_requests').where('status', '==', 'pending').get();
    const pendingServiceRequests = serviceRequestsSnap.size;

    // Return with success flag and consistent formatting
    res.json({
      success: true,
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue: totalRevenue.toString(),
      pendingContacts,
      pendingServiceRequests
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard stats', 
      details: error.message 
    });
  }
});

// Recent Users
app.get('/api/admin/recent-users', authenticateToken, async (req, res) => {
  try {
    // Fixed query - using true instead of 1
    const usersSnap = await db.collection('users')
      .where('is_active', '==', true)
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();

    const users = [];
    
    usersSnap.forEach(doc => {
      try {
        const u = doc.data();
        let joinDate = 'N/A';
        
        // Handle different timestamp formats safely
        if (u.created_at) {
          if (u.created_at.toDate) {
            // Firestore timestamp
            joinDate = u.created_at.toDate().toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          } else if (u.created_at instanceof Date) {
            // JavaScript Date
            joinDate = u.created_at.toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          } else if (typeof u.created_at === 'string') {
            // ISO string
            joinDate = new Date(u.created_at).toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          }
        }
        
        users.push({
          id: doc.id,
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          email: u.email || '',
          account_type: u.account_type || 'student',
          join_date: joinDate
        });
      } catch (userError) {
        console.error('Error processing user:', doc.id, userError);
        // Continue with other users
      }
    });

    // Wrap in object with success flag as frontend expects
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch recent users', 
      details: error.message 
    });
  }
});

// Recent Enrollments
app.get('/api/admin/recent-enrollments', authenticateToken, async (req, res) => {
  try {
    // Use created_at as fallback if enrollment_date doesn't exist
    const enrollmentsSnap = await db.collection('enrollments')
      .orderBy('enrollment_date', 'desc')
      .limit(5)
      .get();

    const enrollments = [];
    
    for (const doc of enrollmentsSnap.docs) {
      try {
        const e = doc.data();
        
        // Get user data with error handling
        let userName = 'Unknown User';
        if (e.user_id) {
          try {
            const userDoc = await db.collection('users').doc(e.user_id).get();
            if (userDoc.exists) {
              const u = userDoc.data();
              userName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown User';
            }
          } catch (userError) {
            console.error('Error fetching user for enrollment:', e.user_id, userError);
          }
        }
        
        // Get course data with error handling
        let courseName = 'Unknown Course';
        if (e.course_id) {
          try {
            const courseDoc = await db.collection('courses').doc(e.course_id).get();
            if (courseDoc.exists) {
              const c = courseDoc.data();
              courseName = c.title || 'Unknown Course';
            }
          } catch (courseError) {
            console.error('Error fetching course for enrollment:', e.course_id, courseError);
          }
        }
        
        // Format date safely
        let enrollmentDate = 'N/A';
        const dateField = e.enrollment_date || e.created_at;
        if (dateField) {
          if (dateField.toDate) {
            // Firestore timestamp
            enrollmentDate = dateField.toDate().toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          } else if (dateField instanceof Date) {
            // JavaScript Date
            enrollmentDate = dateField.toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          } else if (typeof dateField === 'string') {
            // ISO string
            enrollmentDate = new Date(dateField).toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          }
        }
        
        enrollments.push({
          id: doc.id,
          user_name: userName,
          course_name: courseName,
          date: enrollmentDate,
          status: e.status || 'active'
        });
      } catch (enrollmentError) {
        console.error('Error processing enrollment:', doc.id, enrollmentError);
        // Continue with other enrollments
      }
    }

    // Wrap in object with success flag as frontend expects
    res.json({
      success: true,
      enrollments: enrollments
    });
  } catch (error) {
    console.error('Error fetching recent enrollments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch recent enrollments', 
      details: error.message 
    });
  }
});

// Service Requests - MISSING ENDPOINT IMPLEMENTATION
app.get('/api/admin/service-requests', authenticateToken, async (req, res) => {
  try {
    const requestsSnap = await db.collection('service_requests')
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();

    const requests = [];
    
    requestsSnap.forEach(doc => {
      try {
        const reqData = doc.data();
        
        // Format date safely
        let requestDate = 'N/A';
        const dateField = reqData.created_at || reqData.date;
        if (dateField) {
          if (dateField.toDate) {
            // Firestore timestamp
            requestDate = dateField.toDate().toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          } else if (dateField instanceof Date) {
            // JavaScript Date
            requestDate = dateField.toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          } else if (typeof dateField === 'string') {
            // ISO string
            requestDate = new Date(dateField).toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          }
        }
        
        // Get name from various possible fields
        const name = reqData.name || 
                    `${reqData.user_first_name || ''} ${reqData.user_last_name || ''}`.trim() || 
                    reqData.user_name ||
                    'Unknown';
        
        requests.push({
          id: doc.id,
          name: name,
          service: reqData.service || reqData.service_type || 'General Inquiry',
          date: requestDate,
          status: reqData.status || 'pending',
          email: reqData.email || '',
          phone: reqData.phone || '',
          company: reqData.company || '',
          website: reqData.website || '',
          project_details: reqData.project_details || reqData.details || reqData.message || '',
          budget_range: reqData.budget_range || reqData.budget || '',
          timeline: reqData.timeline || '',
          contact_method: reqData.contact_method || 'email',
          additional_requirements: reqData.additional_requirements || reqData.requirements || ''
        });
      } catch (requestError) {
        console.error('Error processing service request:', doc.id, requestError);
        // Continue with other requests
      }
    });

    // Wrap in object with success flag as frontend expects
    res.json({
      success: true,
      requests: requests
    });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch service requests', 
      details: error.message 
    });
  }
});

// ==================== ANALYTICS ROUTES ====================

// Get analytics data (admin only)
app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sixMonthsAgo = new Date(new Date().getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

    // User growth data (last 6 months)
    const usersSnap = await db.collection('users').where('created_at', '>=', sixMonthsAgo).get();
    const userGrowth = {};
    usersSnap.docs.forEach(doc => {
      const created = doc.data().created_at.toDate();
      const month = created.toISOString().slice(0, 7);
      userGrowth[month] = (userGrowth[month] || 0) + 1;
    });

    // Course enrollment data
    const coursesSnap = await db.collection('courses').where('is_active', '==', true).get();
    const courseEnrollments = [];
    for (const doc of coursesSnap.docs) {
      const enrollmentsSnap = await db.collection('enrollments').where('course_id', '==', doc.id).get();
      courseEnrollments.push({
        title: doc.data().title,
        enrollments: enrollmentsSnap.size
      });
    }
    courseEnrollments.sort((a, b) => b.enrollments - a.enrollments);
    const top10 = courseEnrollments.slice(0, 10);

    // Revenue by month (mock calculation)
    const enrollmentsSnap = await db.collection('enrollments').where('enrollment_date', '>=', sixMonthsAgo).get();
    const revenueData = {};
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const month = e.enrollment_date.toDate().toISOString().slice(0, 7);
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const revenue = courseDoc.data().price;
      revenueData[month] = (revenueData[month] || 0) + revenue;
    }

    res.json({
      userGrowth: Object.keys(userGrowth).map(month => ({ month, count: userGrowth[month] })),
      courseEnrollments: top10,
      revenueData: Object.keys(revenueData).map(month => ({ month, revenue: revenueData[month] }))
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ADMIN DASHBOARD STATS ====================

app.get('/api/admin/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching dashboard data for admin:', req.user.email);

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    
    let activeUsers = 0;
    let studentCount = 0;
    let professionalCount = 0;
    let businessCount = 0;
    
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      if (user.is_active !== false) activeUsers++;
      
      switch(user.account_type) {
        case 'student': studentCount++; break;
        case 'professional': professionalCount++; break;
        case 'business': businessCount++; break;
      }
    });

    // Get courses (if collection exists)
    let totalCourses = 0;
    try {
      const coursesSnapshot = await db.collection('courses').get();
      totalCourses = coursesSnapshot.size;
    } catch (e) {
      console.log('Courses collection not found');
    }

    // Get enrollments (if collection exists)
    let totalEnrollments = 0;
    try {
      const enrollmentsSnapshot = await db.collection('enrollments').get();
      totalEnrollments = enrollmentsSnapshot.size;
    } catch (e) {
      console.log('Enrollments collection not found');
    }

    const stats = {
      totalUsers,
      activeUsers,
      totalCourses,
      totalEnrollments,
      usersByType: {
        student: studentCount,
        professional: professionalCount,
        business: businessCount
      }
    };

    console.log('Dashboard stats:', stats);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching dashboard data',
      details: error.message
    });
  }
});
