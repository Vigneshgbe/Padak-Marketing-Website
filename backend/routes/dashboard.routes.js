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