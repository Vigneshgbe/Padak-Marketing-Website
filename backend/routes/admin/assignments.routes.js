// backend/routes/admin/assignments.routes.js

const express = require('express');
const firebase = require('firebase-admin');
const { authenticateToken, requireAdmin } = require('../../middleware/auth.middleware');
const { assignmentUpload } = require('../../middleware/upload.middleware');
const db = firebase.firestore();

const app = express();

// ==================== ADMIN ASSIGNMENT MANAGEMENT ENDPOINTS ====================

// GET /api/assignments/my-assignments - Get assignments for current user's enrolled courses
app.get('/api/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userAccountType = req.user.account_type;

    let assignments = [];

    if (userAccountType === 'admin') {
      // Admin can see all assignments
      const assignmentsSnapshot = await db.collection('assignments').get();
      assignments = await Promise.all(
        assignmentsSnapshot.docs.map(async (doc) => {
          const assignment = doc.data();
          const courseDoc = await db.collection('courses').doc(assignment.course_id).get();
          const course = courseDoc.exists ? courseDoc.data() : { title: 'Unknown Course', category: 'Unknown' };
          
          // Get submission if exists
          const submissionSnapshot = await db.collection('submissions')
            .where('assignment_id', '==', doc.id)
            .where('user_id', '==', userId)
            .get();
          
          const submission = submissionSnapshot.empty ? null : {
            id: submissionSnapshot.docs[0].id,
            ...submissionSnapshot.docs[0].data()
          };

          return {
            id: doc.id,
            ...assignment,
            course: {
              id: assignment.course_id,
              title: course.title,
              category: course.category
            },
            submission: submission
          };
        })
      );
    } else {
      // For students/professionals, get assignments from enrolled courses
      const enrollmentsSnapshot = await db.collection('enrollments')
        .where('user_id', '==', userId)
        .get();

      const enrolledCourseIds = enrollmentsSnapshot.docs.map(doc => doc.data().course_id);

      if (enrolledCourseIds.length === 0) {
        return res.json([]);
      }

      // Get assignments for enrolled courses
      const assignmentsSnapshot = await db.collection('assignments')
        .where('course_id', 'in', enrolledCourseIds)
        .get();

      assignments = await Promise.all(
        assignmentsSnapshot.docs.map(async (doc) => {
          const assignment = doc.data();
          const courseDoc = await db.collection('courses').doc(assignment.course_id).get();
          const course = courseDoc.exists ? courseDoc.data() : { title: 'Unknown Course', category: 'Unknown' };
          
          // Get submission if exists
          const submissionSnapshot = await db.collection('submissions')
            .where('assignment_id', '==', doc.id)
            .where('user_id', '==', userId)
            .get();
          
          const submission = submissionSnapshot.empty ? null : {
            id: submissionSnapshot.docs[0].id,
            ...submissionSnapshot.docs[0].data()
          };

          return {
            id: doc.id,
            ...assignment,
            course: {
              id: assignment.course_id,
              title: course.title,
              category: course.category
            },
            submission: submission
          };
        })
      );
    }

    res.json(assignments);

  } catch (error) {
    console.error('Get my assignments error:', error);
    res.status(500).json({ error: 'Server error while fetching assignments' });
  }
});

// POST /api/assignments/submit - Submit assignment
app.post('/api/assignments/submit', authenticateToken, assignmentUpload.single('file'), async (req, res) => {
  try {
    console.log('📝 Assignment submission received:');
    console.log('- User:', req.user.email, '(ID:', req.user.id, ')');
    console.log('- Body:', req.body);
    console.log('- File:', req.file ? req.file.filename : 'No file uploaded');

    const { assignment_id, content } = req.body;
    const file_path = req.file ? req.file.filename : null;

    // VALIDATION 1: Check assignment_id
    if (!assignment_id) {
      console.error('❌ Validation failed: Missing assignment_id');
      return res.status(400).json({ 
        error: 'Assignment ID is required',
        received: req.body 
      });
    }

    // VALIDATION 2: Check content or file
    if (!content && !file_path) {
      console.error('❌ Validation failed: Missing content and file');
      return res.status(400).json({ 
        error: 'Either content or file is required',
        has_content: !!content,
        has_file: !!file_path
      });
    }

    // CHECK 1: Assignment exists
    console.log('🔍 Checking if assignment exists:', assignment_id);
    const assignmentDoc = await db.collection('assignments').doc(assignment_id).get();
    
    if (!assignmentDoc.exists) {
      console.error('❌ Assignment not found:', assignment_id);
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentDoc.data();
    console.log('✅ Assignment found:', {
      title: assignment.title,
      course_id: assignment.course_id
    });

    // CHECK 2: User is enrolled
    console.log('🔍 Checking enrollment for course:', assignment.course_id);
    const enrollmentSnap = await db.collection('enrollments')
      .where('course_id', '==', assignment.course_id)
      .where('user_id', '==', req.user.id)
      .get();

    if (enrollmentSnap.empty) {
      console.error('❌ User not enrolled in course');
      return res.status(403).json({ 
        error: 'You are not enrolled in this course',
        course_id: assignment.course_id,
        user_id: req.user.id
      });
    }
    console.log('✅ User is enrolled');

    // CHECK 3: No existing submission
    console.log('🔍 Checking for existing submission');
    const existingSnap = await db.collection('assignment_submissions')
      .where('assignment_id', '==', assignment_id)
      .where('user_id', '==', req.user.id)
      .get();

    if (!existingSnap.empty) {
      console.error('❌ Assignment already submitted');
      return res.status(400).json({ error: 'Assignment already submitted' });
    }
    console.log('✅ No existing submission found');

    // CREATE SUBMISSION
    console.log('📝 Creating submission...');
    const submissionRef = db.collection('assignment_submissions').doc();
    const submissionData = {
      assignment_id,
      user_id: req.user.id,
      content: content || '',
      file_path: file_path || null,
      submitted_at: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'submitted',
      grade: null,
      feedback: null
    };

    await submissionRef.set(submissionData);
    console.log('✅ Submission created:', submissionRef.id);

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission_id: submissionRef.id
    });

  } catch (err) {
    console.error('❌ Assignment submission error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: 'Failed to submit assignment',
      details: err.message 
    });
  }
});

// GET /api/assignments/download-submission/:submissionId - Download submission file
app.get('/api/assignments/download-submission/:submissionId', authenticateToken, async (req, res) => {
  try {
    const submissionId = req.params.submissionId;
    const userId = req.user.id;

    const submissionDoc = await db.collection('submissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = submissionDoc.data();

    // Check if user owns the submission or is admin
    if (submission.user_id !== userId && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!submission.file_path) {
      return res.status(404).json({ error: 'No file attached to this submission' });
    }

    // For now, return file path. In production, you'd serve the actual file
    res.json({
      file_path: submission.file_path,
      file_name: `submission_${submissionId}.pdf` // You'd get this from metadata
    });

  } catch (error) {
    console.error('Download submission error:', error);
    res.status(500).json({ error: 'Server error while downloading submission' });
  }
});

// ==================== ADMIN ASSIGNMENT SUBMISSION MANAGEMENT ====================

// GET /api/admin/assignment-submissions - Get ALL assignment submissions (admin only)
app.get('/api/admin/assignment-submissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📋 Fetching all assignment submissions for admin');
    
    // Get all submissions ordered by submission date
    const submissionsSnap = await db.collection('assignment_submissions')
      .orderBy('submitted_at', 'desc')
      .get();

    console.log(`Found ${submissionsSnap.size} submissions`);

    const submissions = [];
    
    for (const doc of submissionsSnap.docs) {
      const sub = doc.data();
      
      // Initialize default values
      let assignmentTitle = 'Unknown Assignment';
      let assignmentMaxPoints = 100;
      let courseTitle = 'Unknown Course';
      let courseCategory = 'General';
      let studentName = 'Unknown Student';
      let studentEmail = '';
      
      try {
        // Get assignment details
        const assignmentDoc = await db.collection('assignments').doc(sub.assignment_id).get();
        if (assignmentDoc.exists) {
          const assignment = assignmentDoc.data();
          assignmentTitle = assignment.title || 'Unknown Assignment';
          assignmentMaxPoints = assignment.max_points || 100;
          
          // Get course details
          if (assignment.course_id) {
            const courseDoc = await db.collection('courses').doc(assignment.course_id).get();
            if (courseDoc.exists) {
              const course = courseDoc.data();
              courseTitle = course.title || 'Unknown Course';
              courseCategory = course.category || 'General';
            }
          }
        }
      } catch (assignmentError) {
        console.error(`Error fetching assignment ${sub.assignment_id}:`, assignmentError);
      }
      
      try {
        // Get student details
        const userDoc = await db.collection('users').doc(sub.user_id).get();
        if (userDoc.exists) {
          const user = userDoc.data();
          studentName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Student';
          studentEmail = user.email || '';
        }
      } catch (userError) {
        console.error(`Error fetching user ${sub.user_id}:`, userError);
      }
      
      // Format the submission data
      submissions.push({
        id: doc.id,
        assignment_id: sub.assignment_id,
        user_id: sub.user_id,
        content: sub.content || '',
        file_path: sub.file_path || null,
        submitted_at: sub.submitted_at?.toDate ? sub.submitted_at.toDate().toISOString() : new Date().toISOString(),
        status: sub.status || 'submitted',
        grade: sub.grade ?? null,
        feedback: sub.feedback || null,
        assignment_title: assignmentTitle,
        assignment_max_points: assignmentMaxPoints,
        course_title: courseTitle,
        course_category: courseCategory,
        student_name: studentName,
        student_email: studentEmail
      });
    }

    console.log(`✅ Returning ${submissions.length} enriched submissions`);
    res.json(submissions);
    
  } catch (error) {
    console.error('❌ Error fetching assignment submissions:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch assignment submissions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/admin/assignments - Get all assignments (admin only)
app.get('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentsSnapshot = await db.collection('assignments').get();
    
    const assignments = await Promise.all(
      assignmentsSnapshot.docs.map(async (doc) => {
        const assignment = doc.data();
        const courseDoc = await db.collection('courses').doc(assignment.course_id).get();
        const course = courseDoc.exists ? courseDoc.data() : { title: 'Unknown Course' };
        
        return {
          id: doc.id,
          ...assignment,
          course_title: course.title
        };
      })
    );

    res.json(assignments);

  } catch (error) {
    console.error('Get admin assignments error:', error);
    res.status(500).json({ error: 'Server error while fetching assignments' });
  }
});

// GET /api/admin/courses - Get all courses for assignment form (admin only)
app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const coursesSnapshot = await db.collection('courses').get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(courses);

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error while fetching courses' });
  }
});

// POST /api/admin/assignments - Create new assignment (admin only)
app.post('/api/admin/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, due_date, max_points, course_id } = req.body;

    // Validate required fields
    if (!title || !due_date || !max_points || !course_id) {
      return res.status(400).json({
        error: 'Title, due date, max points, and course are required'
      });
    }

    // Check if course exists
    const courseDoc = await db.collection('courses').doc(course_id).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create assignment
    const assignmentRef = db.collection('assignments').doc();
    const assignmentData = {
      title: title.trim(),
      description: description || '',
      due_date: due_date,
      max_points: parseInt(max_points),
      course_id: course_id,
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };

    await assignmentRef.set(assignmentData);

    console.log('Assignment created by admin:', { assignmentId: assignmentRef.id, title, admin: req.user.email });

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: {
        id: assignmentRef.id,
        ...assignmentData
      }
    });

  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Server error while creating assignment' });
  }
});

// PUT /api/admin/assignments/:id - Update assignment (admin only)
app.put('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { title, description, due_date, max_points, course_id } = req.body;

    // Check if assignment exists
    const assignmentDoc = await db.collection('assignments').doc(assignmentId).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if course exists if course_id is being updated
    if (course_id) {
      const courseDoc = await db.collection('courses').doc(course_id).get();
      if (!courseDoc.exists) {
        return res.status(404).json({ error: 'Course not found' });
      }
    }

    const currentAssignment = assignmentDoc.data();

    // Update assignment
    const updateData = {
      title: title || currentAssignment.title,
      description: description || currentAssignment.description,
      due_date: due_date || currentAssignment.due_date,
      max_points: max_points ? parseInt(max_points) : currentAssignment.max_points,
      course_id: course_id || currentAssignment.course_id,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('assignments').doc(assignmentId).update(updateData);

    // Get updated assignment with course title
    const updatedAssignmentDoc = await db.collection('assignments').doc(assignmentId).get();
    const updatedAssignment = updatedAssignmentDoc.data();
    const courseDoc = await db.collection('courses').doc(updatedAssignment.course_id).get();
    const course = courseDoc.exists ? courseDoc.data() : { title: 'Unknown Course' };

    res.json({
      message: 'Assignment updated successfully',
      assignment: {
        id: assignmentId,
        ...updatedAssignment,
        course_title: course.title
      }
    });

  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Server error while updating assignment' });
  }
});

// DELETE /api/admin/assignments/:id - Delete assignment (admin only)
app.delete('/api/admin/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentId = req.params.id;

    // Check if assignment exists
    const assignmentDoc = await db.collection('assignments').doc(assignmentId).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if there are submissions for this assignment
    const submissionsSnapshot = await db.collection('submissions')
      .where('assignment_id', '==', assignmentId)
      .get();

    if (!submissionsSnapshot.empty) {
      return res.status(400).json({ 
        error: 'Cannot delete assignment with existing submissions. Delete submissions first.' 
      });
    }

    // Delete assignment
    await db.collection('assignments').doc(assignmentId).delete();

    console.log('Assignment deleted by admin:', { assignmentId, admin: req.user.email });

    res.json({ message: 'Assignment deleted successfully' });

  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Server error while deleting assignment' });
  }
});

// GET /api/admin/assignment-submissions/:assignmentId - Get submissions for an assignment (admin only)
app.get('/api/admin/assignment-submissions/:assignmentId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignmentId = req.params.id;

    const submissionsSnapshot = await db.collection('submissions')
      .where('assignment_id', '==', assignmentId)
      .get();

    const submissions = await Promise.all(
      submissionsSnapshot.docs.map(async (doc) => {
        const submission = doc.data();
        const userDoc = await db.collection('users').doc(submission.user_id).get();
        const user = userDoc.exists ? userDoc.data() : { first_name: 'Unknown', last_name: 'User' };
        
        return {
          id: doc.id,
          ...submission,
          user: {
            id: submission.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email
          }
        };
      })
    );

    res.json(submissions);

  } catch (error) {
    console.error('Get assignment submissions error:', error);
    res.status(500).json({ error: 'Server error while fetching submissions' });
  }
});

// PUT /api/admin/grade-submission/:submissionId - Grade a submission (admin only)
app.put('/api/admin/grade-submission/:submissionId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    console.log('📝 Grading submission:', { 
      submissionId, 
      grade, 
      feedbackLength: feedback ? feedback.length : 0 
    });

    // Validate grade
    if (grade === undefined || grade === null) {
      console.error('❌ Grade is missing');
      return res.status(400).json({ 
        success: false,
        error: 'Grade is required' 
      });
    }

    const gradeValue = parseInt(grade);
    
    if (isNaN(gradeValue)) {
      console.error('❌ Grade is not a number');
      return res.status(400).json({ 
        success: false,
        error: 'Grade must be a valid number' 
      });
    }

    if (gradeValue < 0) {
      console.error('❌ Grade is negative');
      return res.status(400).json({ 
        success: false,
        error: 'Grade cannot be negative' 
      });
    }

    // Check if submission exists
    console.log('🔍 Looking for submission:', submissionId);
    const submissionDoc = await db.collection('assignment_submissions').doc(submissionId).get();
    
    if (!submissionDoc.exists) {
      console.error('❌ Submission not found');
      return res.status(404).json({ 
        success: false,
        error: 'Submission not found' 
      });
    }

    console.log('✅ Submission found');

    // Get assignment to validate max points
    const submission = submissionDoc.data();
    const assignmentDoc = await db.collection('assignments').doc(submission.assignment_id).get();
    
    if (assignmentDoc.exists) {
      const assignment = assignmentDoc.data();
      console.log('📊 Max points:', assignment.max_points);
      
      if (gradeValue > assignment.max_points) {
        console.error('❌ Grade exceeds max points');
        return res.status(400).json({ 
          success: false,
          error: `Grade cannot exceed maximum points (${assignment.max_points})` 
        });
      }
    }

    // Update submission with grade and feedback
    console.log('💾 Updating submission...');
    await db.collection('assignment_submissions').doc(submissionId).update({
      grade: gradeValue,
      feedback: feedback ? feedback.trim() : '',
      status: 'graded',
      graded_at: firebase.firestore.Timestamp.now(),
      graded_by: req.user.id
    });

    console.log('✅ Submission graded successfully');

    res.json({ 
      success: true,
      message: 'Submission graded successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error grading submission:', error);
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to grade submission',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});