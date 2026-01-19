// routes/assignments.routes.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const firebase = require('firebase-admin');
const { authenticateToken } = require('../middleware/auth.middleware');
const { db } = require('../config/firebase.config');
const app = express();  

// ==================== ASSIGNMENTS ROUTES ====================

// GET /auth/me - Get current user info
app.get('/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// GET /api/assignments/my-assignments - Get user's assignments
app.get('/api/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).get();

    const results = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const c = courseDoc.data();
      if (c.is_active) {
        const assignmentsSnap = await db.collection('assignments').where('course_id', '==', e.course_id).orderBy('due_date').get();
        for (const aDoc of assignmentsSnap.docs) {
          const a = aDoc.data();
          const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
          let sub = null;
          if (!submissionSnap.empty) {
            sub = submissionSnap.docs[0].data();
          }
          results.push({
            id: aDoc.id,
            course_id: e.course_id,
            title: a.title,
            description: a.description,
            due_date: a.due_date,
            max_points: a.max_points,
            created_at: a.created_at,
            course_title: c.title,
            course_category: c.category,
            submission_id: sub ? submissionSnap.docs[0].id : null,
            submission_content: sub ? sub.content : null,
            submission_file_path: sub ? sub.file_path : null,
            submitted_at: sub ? sub.submitted_at : null,
            grade: sub ? sub.grade : null,
            feedback: sub ? sub.feedback : null,
            submission_status: sub ? sub.status : null
          });
        }
      }
    }

    // Format results
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
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/assignments/all - Get all assignments (admin only)
app.get('/api/assignments/all', authenticateToken, async (req, res) => {
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }

  try {
    const assignmentsSnap = await db.collection('assignments').get();

    const results = [];
    for (const aDoc of assignmentsSnap.docs) {
      const a = aDoc.data();
      const courseDoc = await db.collection('courses').doc(a.course_id).get();
      const c = courseDoc.data();
      if (c.is_active) {
        const submissionsSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).get();
        let submission_count = submissionsSnap.size;
        let graded_count = 0;
        submissionsSnap.docs.forEach(sDoc => {
          if (sDoc.data().status === 'graded') graded_count++;
        });
        results.push({
          id: aDoc.id,
          course_id: a.course_id,
          title: a.title,
          description: a.description,
          due_date: a.due_date,
          max_points: a.max_points,
          created_at: a.created_at,
          course_title: c.title,
          course_category: c.category,
          submission_count,
          graded_count
        });
      }
    }

    res.json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/assignments/submit - Submit assignment
app.post('/api/assignments/submit', authenticateToken, assignmentUpload.single('file'), async (req, res) => {
  try {
    console.log('📝 Assignment submission request:', {
      body: req.body,
      file: req.file ? req.file.filename : 'no file',
      user: req.user.email
    });

    const { assignment_id, content } = req.body;
    const file_path = req.file ? req.file.filename : null;

    // Validation
    if (!assignment_id) {
      console.error('❌ Missing assignment_id');
      return res.status(400).json({ error: 'Assignment ID is required' });
    }

    if (!content && !file_path) {
      console.error('❌ Missing content and file');
      return res.status(400).json({ error: 'Either content or file is required' });
    }

    // Check if assignment exists
    const assignmentDoc = await db.collection('assignments').doc(assignment_id).get();
    if (!assignmentDoc.exists) {
      console.error('❌ Assignment not found:', assignment_id);
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentDoc.data();
    console.log('✅ Assignment found:', assignment.title);

    // Check if user is enrolled in the course
    const enrollmentSnap = await db.collection('enrollments')
      .where('course_id', '==', assignment.course_id)
      .where('user_id', '==', req.user.id)
      .get();

    if (enrollmentSnap.empty) {
      console.error('❌ User not enrolled in course:', assignment.course_id);
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Check for existing submission
    const existingSnap = await db.collection('assignment_submissions')
      .where('assignment_id', '==', assignment_id)
      .where('user_id', '==', req.user.id)
      .get();

    if (!existingSnap.empty) {
      console.error('❌ Assignment already submitted');
      return res.status(400).json({ error: 'Assignment already submitted' });
    }

    // Create submission
    const submissionRef = db.collection('assignment_submissions').doc();
    await submissionRef.set({
      assignment_id,
      user_id: req.user.id,
      content: content || '',
      file_path: file_path || null,
      submitted_at: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'submitted',
      grade: null,
      feedback: null
    });

    console.log('✅ Assignment submitted successfully:', submissionRef.id);

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission_id: submissionRef.id
    });

  } catch (err) {
    console.error('❌ Assignment submission error:', err);
    res.status(500).json({ 
      error: 'Failed to submit assignment',
      details: err.message 
    });
  }
});

// GET /assignments/download-submission/:id - Download submission file
app.get('/assignments/download-submission/:id', authenticateToken, async (req, res) => {
  const submissionId = req.params.id;

  try {
    const submissionDoc = await db.collection('assignment_submissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const s = submissionDoc.data();

    const assignmentDoc = await db.collection('assignments').doc(s.assignment_id).get();
    const a = assignmentDoc.data();

    if (s.user_id !== req.user.id && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!s.file_path) {
      return res.status(404).json({ error: 'No file attached to this submission' });
    }

    const filePath = path.join(__dirname, 'uploads', 'assignments', s.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${s.file_path}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/assignments/course/:courseId - Get assignments for a specific course
app.get('/api/assignments/course/:courseId', authenticateToken, async (req, res) => {
  const courseId = req.params.courseId;

  try {
    const enrollmentSnap = await db.collection('enrollments').where('course_id', '==', courseId).where('user_id', '==', req.user.id).get();
    if (enrollmentSnap.empty && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignmentsSnap = await db.collection('assignments').where('course_id', '==', courseId).orderBy('due_date').get();

    const results = [];
    for (const aDoc of assignmentsSnap.docs) {
      const a = aDoc.data();
      const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', req.user.id).get();
      let sub = null;
      if (!submissionSnap.empty) {
        sub = submissionSnap.docs[0].data();
      }
      const courseDoc = await db.collection('courses').doc(courseId).get();
      const c = courseDoc.data();
      results.push({
        id: aDoc.id,
        course_id: courseId,
        title: a.title,
        description: a.description,
        due_date: a.due_date,
        max_points: a.max_points,
        created_at: a.created_at,
        course_title: c.title,
        course_category: c.category,
        submission_id: sub ? submissionSnap.docs[0].id : null,
        submission_content: sub ? sub.content : null,
        submission_file_path: sub ? sub.file_path : null,
        submitted_at: sub ? sub.submitted_at : null,
        grade: sub ? sub.grade : null,
        feedback: sub ? sub.feedback : null,
        submission_status: sub ? sub.status : null
      });
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
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT /api/assignments/grade/:submissionId - Grade assignment (admin/instructor only)
app.put('/api/assignments/grade/:submissionId', authenticateToken, (req, res) => {
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }

  const submissionId = req.params.submissionId;
  const { grade, feedback } = req.body;

  // Validate grade
  if (grade < 0 || grade > 100) {
    return res.status(400).json({ error: 'Grade must be between 0 and 100' });
  }

  db.collection('assignment_submissions').doc(submissionId).update({
    grade,
    feedback: feedback || '',
    status: 'graded'
  }).then(() => {
    res.json({
      success: true,
      message: 'Assignment graded successfully'
    });
  }).catch(err => {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  });
});

// Error handling middleware for multer
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