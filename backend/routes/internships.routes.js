// routes/internships.routes.js
const express = require('express');
const firebase = require('firebase-admin');
const { authenticateToken } = require('../middleware/auth.middleware');
const app = express();
const db = firebase.firestore();


// ==================== INTERNSHIPS SECTION ROUTES ====================

// GET /api/internships - Fetch all internships
app.get('/api/internships', async (req, res) => {
  try {
    const internshipsSnap = await db.collection('internships').orderBy('posted_at', 'desc').get();

    const internships = internshipsSnap.docs.map(doc => {
      const i = doc.data();
      return {
        id: doc.id,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: JSON.parse(i.requirements || '[]'),
        benefits: JSON.parse(i.benefits || '[]'),
        posted_at: i.posted_at,
        applications_count: i.applications_count,
        spots_available: i.spots_available
      };
    });

    res.json(internships);
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ message: 'Internal server error while fetching internships.' });
  }
});

// GET /api/user/internship-applications - Fetch applications for the authenticated user
app.get('/api/user/internship-applications', authenticateToken, async (req, res) => {
  const userId = req.user.id; 

  if (!userId) {
    return res.status(400).json({ message: 'User ID not found in token.' });
  }

  try {
    const applicationsSnap = await db.collection('internship_submissions').where('user_id', '==', userId).orderBy('submitted_at', 'desc').get();

    const parsedApplications = [];
    for (const doc of applicationsSnap.docs) {
      const app = doc.data();
      const internshipDoc = await db.collection('internships').doc(app.internship_id).get();
      const i = internshipDoc.data();
      parsedApplications.push({
        id: doc.id,
        internship_id: app.internship_id,
        status: app.status,
        submitted_at: app.submitted_at,
        resume_url: app.resume_url,
        cover_letter: app.cover_letter,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: JSON.parse(i.requirements || '[]'),
        benefits: JSON.parse(i.benefits || '[]'),
        applications_count: i.applications_count,
        spots_available: i.spots_available,
        internship_posted_at: i.posted_at
      });
    }

    res.json(parsedApplications);
  } catch (error) {
    console.error('Error fetching user internship applications:', error);
    res.status(500).json({ message: 'Internal server error while fetching your applications.' });
  }
});

// POST /api/internships/:id/apply - Apply for an internship
app.post('/api/internships/:id/apply', authenticateToken, async (req, res) => {
  const { id: internshipId } = req.params;
  const { full_name, email, phone, resume_url, cover_letter } = req.body;
  const userId = req.user.id;

  if (!full_name || !email || !resume_url) {
    return res.status(400).json({ message: 'Full name, email, and resume link are required.' });
  }

  try {
    const internshipDoc = await db.collection('internships').doc(internshipId).get();

    if (!internshipDoc.exists) {
      return res.status(404).json({ message: 'Internship not found.' });
    }

    const internship = internshipDoc.data();

    if (internship.spots_available <= 0) {
      return res.status(400).json({ message: 'No available spots left for this internship.' });
    }

    const existingApplication = await db.collection('internship_submissions').where('internship_id', '==', internshipId).where('user_id', '==', userId).get();
    if (!existingApplication.empty) {
      return res.status(409).json({ message: 'You have already applied for this internship.' });
    }

    const submissionRef = db.collection('internship_submissions').doc();
    await submissionRef.set({
      internship_id: internshipId,
      user_id: userId,
      full_name,
      email,
      phone: phone || null,
      resume_url,
      cover_letter: cover_letter || null,
      submitted_at: firebase.firestore.Timestamp.now(),
      status: 'pending'
    });

    await db.collection('internships').doc(internshipId).update({
      spots_available: firebase.firestore.FieldValue.increment(-1),
      applications_count: firebase.firestore.FieldValue.increment(1)
    });

    res.status(201).json({ message: 'Internship application submitted successfully!' });
  } catch (error) {
    console.error('Error submitting internship application:', error);
    res.status(500).json({ message: 'Internal server error during application submission.' });
  }
});