// routes/admin/enrollments.routes.js

const express = require('express');
const firebase = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireAdmin } = require('../../middleware/auth.middleware');
const app = express();
const db = firebase.firestore();

// ==================== ADMIN ENROLLMENT MANAGEMENT ENDPOINTS ====================

// GET all enrollments (admin only)
app.get('/api/admin/enrollments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const enrollmentsSnap = await db.collection('enrollments').orderBy('enrollment_date', 'desc').get();

    const enrollments = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const userDoc = await db.collection('users').doc(e.user_id).get();
      const u = userDoc.data();
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const c = courseDoc.data();
      enrollments.push({
        id: doc.id,
        user_id: e.user_id,
        user_name: `${u.first_name} ${u.last_name}`,
        course_id: e.course_id,
        course_name: c.title,
        progress: e.progress,
        status: e.status,
        enrollment_date: e.enrollment_date,
        completion_date: e.completion_date
      });
    }

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// UPDATE enrollment (admin only)
app.put('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, completion_date } = req.body;

    await db.collection('enrollments').doc(id).update({
      status,
      progress,
      completion_date: status === 'completed' ? (completion_date || firebase.firestore.Timestamp.now()) : null
    });

    res.json({ message: 'Enrollment updated successfully' });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({ error: 'Failed to update enrollment' });
  }
});

// DELETE enrollment (admin only)
app.delete('/api/admin/enrollments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection('enrollments').doc(id).delete();

    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ error: 'Failed to delete enrollment' });
  }
});


// ==================== ADMIN ENROLLMENT REQUESTS MANAGEMENT ====================

// GET all enrollment requests (admin only)
app.get('/api/admin/enrollment-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requestsSnap = await db.collection('course_enroll_requests')
      .orderBy('created_at', 'desc')
      .get();

    const requests = [];
    for (const doc of requestsSnap.docs) {
      const req = doc.data();
      
      // Get course details
      let courseName = 'Unknown Course';
      try {
        const courseDoc = await db.collection('courses').doc(req.course_id).get();
        if (courseDoc.exists) {
          courseName = courseDoc.data().title;
        }
      } catch (err) {
        console.error('Error fetching course:', err);
      }

      requests.push({
        id: doc.id,
        user_id: req.user_id || null,
        course_id: req.course_id,
        course_name: courseName,
        full_name: req.full_name,
        email: req.email,
        phone: req.phone,
        address: req.address,
        city: req.city,
        state: req.state,
        pincode: req.pincode,
        payment_method: req.payment_method,
        transaction_id: req.transaction_id,
        payment_screenshot: req.payment_screenshot,
        status: req.status,
        is_guest: req.is_guest || false,
        created_at: req.created_at
      });
    }

    res.json(requests);
  } catch (error) {
    console.error('Error fetching enrollment requests:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment requests' });
  }
});

// APPROVE enrollment request (admin only)
app.put('/api/admin/enrollment-requests/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the enrollment request
    const requestDoc = await db.collection('course_enroll_requests').doc(id).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Enrollment request not found' });
    }

    const request = requestDoc.data();
    
    // Check if course exists
    const courseDoc = await db.collection('courses').doc(request.course_id).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Find user by email (for guest enrollments)
    let userId = request.user_id;
    if (!userId) {
      const usersSnap = await db.collection('users')
        .where('email', '==', request.email.toLowerCase())
        .limit(1)
        .get();
      
      if (!usersSnap.empty) {
        userId = usersSnap.docs[0].id;
      }
    }

    if (userId) {
      // Check if already enrolled
      const existingEnrollment = await db.collection('enrollments')
        .where('user_id', '==', userId)
        .where('course_id', '==', request.course_id)
        .get();

      if (existingEnrollment.empty) {
        // Create enrollment
        const enrollmentRef = db.collection('enrollments').doc();
        await enrollmentRef.set({
          user_id: userId,
          course_id: request.course_id,
          enrollment_date: firebase.firestore.Timestamp.now(),
          progress: 0,
          status: 'active',
          completion_date: null
        });

        // Update user stats
        const userStatsRef = db.collection('user_stats').doc(userId);
        const userStatsDoc = await userStatsRef.get();
        
        if (userStatsDoc.exists) {
          await userStatsRef.update({
            courses_enrolled: firebase.firestore.FieldValue.increment(1)
          });
        } else {
          await userStatsRef.set({
            courses_enrolled: 1,
            courses_completed: 0,
            certificates_earned: 0,
            learning_streak: 0
          });
        }
      }
    }

    // Update request status
    await db.collection('course_enroll_requests').doc(id).update({
      status: 'approved',
      approved_at: firebase.firestore.Timestamp.now(),
      approved_by: req.user.id,
      user_id: userId || null
    });

    res.json({ 
      message: 'Enrollment request approved successfully',
      userId: userId,
      userFound: !!userId
    });

  } catch (error) {
    console.error('Error approving enrollment request:', error);
    res.status(500).json({ error: 'Failed to approve enrollment request' });
  }
});

// REJECT enrollment request (admin only)
app.put('/api/admin/enrollment-requests/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const requestDoc = await db.collection('course_enroll_requests').doc(id).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Enrollment request not found' });
    }

    await db.collection('course_enroll_requests').doc(id).update({
      status: 'rejected',
      rejected_at: firebase.firestore.Timestamp.now(),
      rejected_by: req.user.id,
      rejection_reason: reason || 'No reason provided'
    });

    res.json({ message: 'Enrollment request rejected successfully' });

  } catch (error) {
    console.error('Error rejecting enrollment request:', error);
    res.status(500).json({ error: 'Failed to reject enrollment request' });
  }
});

// DELETE enrollment request (admin only)
app.delete('/api/admin/enrollment-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const requestDoc = await db.collection('course_enroll_requests').doc(id).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Enrollment request not found' });
    }

    // Delete payment screenshot file if exists
    const request = requestDoc.data();
    if (request.payment_screenshot) {
      const filePath = path.join(__dirname, request.payment_screenshot.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error('Error deleting payment screenshot:', fileError);
        }
      }
    }

    await db.collection('course_enroll_requests').doc(id).delete();

    res.json({ message: 'Enrollment request deleted successfully' });

  } catch (error) {
    console.error('Error deleting enrollment request:', error);
    res.status(500).json({ error: 'Failed to delete enrollment request' });
  }
});

// AUTO-LINK guest enrollments when user logs in
app.post('/api/link-guest-enrollments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Find approved enrollment requests with matching email
    const requestsSnap = await db.collection('course_enroll_requests')
      .where('email', '==', userEmail.toLowerCase())
      .where('status', '==', 'approved')
      .where('user_id', '==', null)
      .get();

    let linkedCount = 0;

    for (const doc of requestsSnap.docs) {
      const request = doc.data();

      // Check if already enrolled
      const existingEnrollment = await db.collection('enrollments')
        .where('user_id', '==', userId)
        .where('course_id', '==', request.course_id)
        .get();

      if (existingEnrollment.empty) {
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

        linkedCount++;
      }

      // Update request to link user_id
      await db.collection('course_enroll_requests').doc(doc.id).update({
        user_id: userId
      });
    }

    if (linkedCount > 0) {
      // Update user stats
      const userStatsRef = db.collection('user_stats').doc(userId);
      const userStatsDoc = await userStatsRef.get();
      
      if (userStatsDoc.exists) {
        await userStatsRef.update({
          courses_enrolled: firebase.firestore.FieldValue.increment(linkedCount)
        });
      } else {
        await userStatsRef.set({
          courses_enrolled: linkedCount,
          courses_completed: 0,
          certificates_earned: 0,
          learning_streak: 0
        });
      }
    }

    res.json({ 
      message: `Successfully linked ${linkedCount} guest enrollment(s)`,
      linkedCount 
    });

  } catch (error) {
    console.error('Error linking guest enrollments:', error);
    res.status(500).json({ error: 'Failed to link guest enrollments' });
  }
});