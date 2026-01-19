// backend/routes/admin/certificates.routes.js
const express = require('express');
const firebase = require('firebase-admin');
const { authenticateToken } = require('../../middleware/auth.middleware');
const db = firebase.firestore();
const app = express();


// ==================== ADMIN CERTIFICATES MANAGEMENT ROUTES ====================

// Get all certificates (admin only)
app.get('/api/certificates', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const certificatesSnap = await db.collection('certificates').orderBy('issued_date', 'desc').get();

    const formattedCertificates = [];
    for (const doc of certificatesSnap.docs) {
      const c = doc.data();
      
      const courseDoc = await db.collection('courses').doc(c.course_id).get();
      if (!courseDoc.exists) continue;
      
      const co = courseDoc.data();
      
      const userDoc = await db.collection('users').doc(c.user_id).get();
      if (!userDoc.exists) continue;
      
      const u = userDoc.data();
      
      const enrollmentSnap = await db.collection('enrollments')
        .where('user_id', '==', c.user_id)
        .where('course_id', '==', c.course_id)
        .get();
      
      const e = !enrollmentSnap.empty ? enrollmentSnap.docs[0].data() : null;
      
      formattedCertificates.push({
        id: doc.id,
        userId: c.user_id,
        courseId: c.course_id,
        certificateUrl: c.certificate_url,
        issuedDate: c.issued_date.toDate().toISOString(),
        course: {
          id: c.course_id,
          title: co.title,
          instructorName: co.instructor_name,
          category: co.category,
          difficultyLevel: co.difficulty_level
        },
        user: {
          firstName: u.first_name,
          lastName: u.last_name,
          email: u.email
        },
        enrollment: {
          completionDate: e && e.completion_date ? e.completion_date.toDate().toISOString() : null
        }
      });
    }

    res.json(formattedCertificates);
  } catch (error) {
    console.error('Error fetching all certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Issue new certificate (admin only)
app.post('/api/certificates', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId, courseId, certificateUrl } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'User ID and Course ID are required' });
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(400).json({ error: 'Course not found' });
    }

    // Check if user has completed the course
    const enrollments = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('course_id', '==', courseId)
      .where('status', '==', 'completed')
      .get();

    if (enrollments.empty) {
      return res.status(400).json({ error: 'User has not completed this course' });
    }

    // Check if certificate already exists
    const existingCertificates = await db.collection('certificates')
      .where('user_id', '==', userId)
      .where('course_id', '==', courseId)
      .get();

    if (!existingCertificates.empty) {
      return res.status(400).json({ error: 'Certificate already exists for this user and course' });
    }

    // Create new certificate
    const certRef = db.collection('certificates').doc();
    await certRef.set({
      user_id: userId,
      course_id: courseId,
      certificate_url: certificateUrl || null,
      issued_date: firebase.firestore.Timestamp.now()
    });

    // Update user stats (check if document exists first)
    const userStatsRef = db.collection('user_stats').doc(userId);
    const userStatsDoc = await userStatsRef.get();
    
    if (userStatsDoc.exists) {
      await userStatsRef.update({
        certificates_earned: firebase.firestore.FieldValue.increment(1)
      });
    } else {
      await userStatsRef.set({
        certificates_earned: 1,
        courses_completed: 0,
        total_learning_hours: 0
      });
    }

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificateId: certRef.id
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ error: 'Failed to issue certificate' });
  }
});

// Update certificate
app.put('/api/certificates/:certificateId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { certificateId } = req.params;
    const { certificateUrl } = req.body;

    // Check if certificate exists
    const certDoc = await db.collection('certificates').doc(certificateId).get();
    if (!certDoc.exists) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Update only the certificate URL, keep issued_date unchanged
    await db.collection('certificates').doc(certificateId).update({
      certificate_url: certificateUrl || null
    });

    res.json({ message: 'Certificate updated successfully' });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ error: 'Failed to update certificate' });
  }
});

// Delete certificate (admin only)
app.delete('/api/certificates/:certificateId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { certificateId } = req.params;

    // Get certificate details before deletion
    const certificateDoc = await db.collection('certificates').doc(certificateId).get();

    if (!certificateDoc.exists) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = certificateDoc.data();

    // Delete certificate
    await db.collection('certificates').doc(certificateId).delete();

    // Update user stats (check if document exists first)
    const userStatsRef = db.collection('user_stats').doc(certificate.user_id);
    const userStatsDoc = await userStatsRef.get();
    
    if (userStatsDoc.exists) {
      const currentCount = userStatsDoc.data().certificates_earned || 0;
      if (currentCount > 0) {
        await userStatsRef.update({
          certificates_earned: firebase.firestore.FieldValue.increment(-1)
        });
      }
    }

    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});
