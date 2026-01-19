// routes/admin/courses.routes.js
const express = require('express');
const firebase = require('firebase-admin');
const { authenticateToken, requireAdmin } = require('../../middleware/auth.middleware');
const app = express();
const db = firebase.firestore();


// ==================== ADMIN COURSE MANAGEMENT ENDPOINTS ====================

// GET all courses (admin only)
app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const coursesSnap = await db.collection('courses').orderBy('created_at', 'desc').get();

    const courses = coursesSnap.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      description: doc.data().description,
      instructor_name: doc.data().instructor_name,
      duration_weeks: doc.data().duration_weeks,
      difficulty_level: doc.data().difficulty_level,
      category: doc.data().category,
      price: doc.data().price,
      thumbnail: doc.data().thumbnail,
      is_active: doc.data().is_active,
      created_at: doc.data().created_at,
      updated_at: doc.data().updated_at
    }));

    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// CREATE new course (admin only)
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

    // Validate required fields
    if (!title || !instructor_name || !duration_weeks || !difficulty_level || !category || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const courseRef = db.collection('courses').doc();
    await courseRef.set({
      title,
      description,
      instructor_name,
      duration_weeks,
      difficulty_level,
      category,
      price,
      is_active: is_active || 1,
      created_at: firebase.firestore.Timestamp.now(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.status(201).json({ 
      message: 'Course created successfully',
      courseId: courseRef.id
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// UPDATE course (admin only)
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

    // Validate required fields
    if (!title || !instructor_name || !duration_weeks || !difficulty_level || !category || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await db.collection('courses').doc(id).update({
      title,
      description,
      instructor_name,
      duration_weeks,
      difficulty_level,
      category,
      price,
      is_active,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE course (admin only)
app.delete('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const enrollmentsSnap = await db.collection('enrollments').where('course_id', '==', id).get();

    if (!enrollmentsSnap.empty) {
      return res.status(400).json({ error: 'Cannot delete course with active enrollments' });
    }

    await db.collection('courses').doc(id).delete();

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Upload course thumbnail
app.post('/api/admin/courses/:id/thumbnail', authenticateToken, requireAdmin, (req, res, next) => {
  // Assuming multer for thumbnail upload, similar to others. Add if needed.
  // For now, assume it's handled similarly.
  // Code omitted for brevity, add if required.
});
