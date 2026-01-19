// backend/routes/courses.routes.js
const express = require('express');
const firebase = require('firebase-admin');
const { authenticateToken } = require('../middleware/auth.middleware');
const db = firebase.firestore();
const app = express();


// ==================== COURSES ROUTES ====================

// Replace the existing /api/courses endpoint
app.get('/api/courses', async (req, res) => {
  try {
    const coursesSnap = await db.collection('courses').where('is_active', '==', true).orderBy('created_at', 'desc').get();

    const formattedCourses = coursesSnap.docs.map(doc => {
      const course = doc.data();
      return {
        id: doc.id,
        title: course.title,
        description: course.description,
        instructorName: course.instructor_name,
        durationWeeks: course.duration_weeks,
        difficultyLevel: course.difficulty_level,
        category: course.category,
        price: course.price !== null ? `₹${parseFloat(course.price).toFixed(2)}` : '₹0.00',
        thumbnail: course.thumbnail,
        isActive: course.is_active
      };
    });

    res.json(formattedCourses);

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
});

// Link guest enrollments to logged-in user - PUT THIS AFTER THE LOGIN ENDPOINT
app.post('/api/link-guest-enrollments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    console.log(`\n🔗 Manual linking for user ${userId} (${userEmail})`);

    // Find approved enrollment requests with this email
    const requestsSnap = await db.collection('course_enroll_requests')
      .where('email', '==', userEmail.toLowerCase())
      .where('status', '==', 'approved')
      .get();

    console.log(`📋 Found ${requestsSnap.size} approved requests`);

    let linked = 0;
    let existing = 0;

    for (const doc of requestsSnap.docs) {
      const request = doc.data();
      console.log(`\n📦 Processing request ${doc.id} for course ${request.course_id}`);

      // Check if already enrolled
      const enrollmentSnap = await db.collection('enrollments')
        .where('user_id', '==', userId)
        .where('course_id', '==', request.course_id)
        .get();

      if (enrollmentSnap.empty) {
        // Create enrollment
        const enrollmentRef = db.collection('enrollments').doc();
        await enrollmentRef.set({
          user_id: userId,
          course_id: request.course_id,
          enrollment_date: request.created_at || firebase.firestore.Timestamp.now(),
          progress: 0,
          status: 'active',
          completion_date: null
        });
        
        linked++;
        console.log(`✅ Created enrollment ${enrollmentRef.id}`);
      } else {
        existing++;
        console.log(`⏭️  Already enrolled in ${request.course_id}`);
      }

      // Update request to link user_id
      await db.collection('course_enroll_requests').doc(doc.id).update({
        user_id: userId
      });
      console.log(`🔗 Linked request to user`);
    }

    console.log(`\n📊 Summary: ${linked} new, ${existing} existing`);

    res.json({
      success: true,
      message: `Linked ${linked} new enrollments`,
      linked,
      existing,
      total: requestsSnap.size
    });

  } catch (error) {
    console.error('❌ Link error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to link enrollments' 
    });
  }
});

// Get user's enrollments with course details
app.get('/api/enrollments/my-courses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📚 Fetching enrollments for user ${userId}`);

    // Get user's enrollments
    const enrollmentsSnap = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .get();

    console.log(`✅ Found ${enrollmentsSnap.size} enrollments`);

    const enrollments = [];

    for (const doc of enrollmentsSnap.docs) {
      const enrollment = doc.data();
      
      // Get course details
      const courseDoc = await db.collection('courses').doc(enrollment.course_id).get();
      
      if (courseDoc.exists) {
        const courseData = courseDoc.data();
        
        // Get instructor name
        let instructorName = 'Unknown Instructor';
        if (courseData.instructor_id) {
          const instructorDoc = await db.collection('users').doc(courseData.instructor_id).get();
          if (instructorDoc.exists) {
            const instructor = instructorDoc.data();
            instructorName = `${instructor.first_name} ${instructor.last_name}`;
          }
        }

        enrollments.push({
          id: doc.id,
          progress: enrollment.progress || 0,
          status: enrollment.status,
          enrollment_date: enrollment.enrollment_date,
          completion_date: enrollment.completion_date,
          course: {
            id: courseDoc.id,
            title: courseData.title,
            description: courseData.description,
            thumbnail: courseData.thumbnail,
            durationWeeks: courseData.duration_weeks,
            instructorName: instructorName
          }
        });
      }
    }

    console.log(`✅ Returning ${enrollments.length} enrollments with course details`);
    res.json(enrollments);

  } catch (error) {
    console.error('❌ Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Enroll in a course
app.post('/api/courses/enroll', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Check if already enrolled
    const existingSnap = await db.collection('enrollments').where('user_id', '==', userId).where('course_id', '==', courseId).get();

    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();

    if (!courseDoc.exists || !courseDoc.data().is_active) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    const enrollmentRef = db.collection('enrollments').doc();
    await enrollmentRef.set({
      user_id: userId,
      course_id: courseId,
      enrollment_date: firebase.firestore.Timestamp.now()
    });

    // Update user stats
    await db.collection('user_stats').doc(userId).update({
      courses_enrolled: firebase.firestore.FieldValue.increment(1)
    });

    res.status(201).json({ message: 'Successfully enrolled in course' });

  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});