// routes/certificates.routes.js

const express = require('express');
const { db } = require('../firebase');
const { authenticateToken } = require('../middleware/auth.middleware');

const app = express();


// ==================== CERTIFICATES MANAGEMENT ROUTES ====================

// Certificate Routes - Student view
app.get('/api/certificates/my-certificates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`🏆 Fetching certificates for user: ${userId}`);

    const certificatesSnap = await db.collection('certificates')
      .where('user_id', '==', userId)
      .orderBy('issued_date', 'desc')
      .get();

    console.log(`📜 Found ${certificatesSnap.size} certificates in database`);

    const formattedCertificates = [];
    
    for (const doc of certificatesSnap.docs) {
      const c = doc.data();
      
      // Get course details
      const courseDoc = await db.collection('courses').doc(c.course_id).get();
      if (!courseDoc.exists) {
        console.log(`⚠️ Course ${c.course_id} not found, skipping certificate ${doc.id}`);
        continue;
      }
      
      const co = courseDoc.data();
      
      // Get enrollment details
      const enrollmentSnap = await db.collection('enrollments')
        .where('user_id', '==', userId)
        .where('course_id', '==', c.course_id)
        .get();
      
      if (enrollmentSnap.empty) {
        console.log(`⚠️ No enrollment found for course ${c.course_id}, skipping certificate ${doc.id}`);
        continue;
      }
      
      const e = enrollmentSnap.docs[0].data();
      
      // Calculate final grade from assignments
      const assignmentsSnap = await db.collection('assignments')
        .where('course_id', '==', c.course_id)
        .get();
      
      let finalGrade = 0;
      let count = 0;
      
      for (const aDoc of assignmentsSnap.docs) {
        const subSnap = await db.collection('assignment_submissions')
          .where('assignment_id', '==', aDoc.id)
          .where('user_id', '==', userId)
          .get();
        
        if (!subSnap.empty) {
          finalGrade += subSnap.docs[0].data().grade || 0;
          count++;
        }
      }
      
      // Get instructor name
      let instructorName = co.instructor_name || 'Unknown Instructor';
      if (co.instructor_id) {
        const instructorDoc = await db.collection('users').doc(co.instructor_id).get();
        if (instructorDoc.exists) {
          const instructor = instructorDoc.data();
          instructorName = `${instructor.first_name} ${instructor.last_name}`;
        }
      }
      
      // Format in the structure expected by frontend
      formattedCertificates.push({
        id: doc.id,
        userId: c.user_id,
        courseId: c.course_id,
        certificateUrl: c.certificate_url || `#certificate-${doc.id}`,
        issuedDate: c.issued_date.toDate().toISOString(),
        // NESTED course object (required by frontend)
        course: {
          id: c.course_id,
          title: co.title,
          description: co.description || '',
          instructorName: instructorName,
          category: co.category || 'General',
          difficultyLevel: co.difficulty_level || 'Beginner'
        },
        // NESTED enrollment object (required by frontend)
        enrollment: {
          completionDate: e.completion_date ? e.completion_date.toDate().toISOString() : c.issued_date.toDate().toISOString(),
          finalGrade: count > 0 ? Math.round(finalGrade / count) : null,
          status: e.status || 'completed'
        }
      });
    }

    console.log(`✅ Returning ${formattedCertificates.length} formatted certificates`);
    res.json(formattedCertificates);
    
  } catch (error) {
    console.error('❌ Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Download certificate endpoint
app.get('/api/certificates/:certificateId/download', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;

    // Verify the certificate belongs to the user
    const certificateDoc = await db.collection('certificates').doc(certificateId).get();
    if (!certificateDoc.exists || certificateDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = certificateDoc.data();

    const courseDoc = await db.collection('courses').doc(certificate.course_id).get();
    const course = courseDoc.data();

    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();

    // If certificate_url exists, redirect to it
    if (certificate.certificate_url) {
      return res.redirect(certificate.certificate_url);
    }

    // Otherwise, generate a simple PDF certificate
    const certificateData = {
      recipientName: `${user.first_name} ${user.last_name}`,
      courseName: course.title,
      completionDate: certificate.issued_date.toDate().toISOString(),
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