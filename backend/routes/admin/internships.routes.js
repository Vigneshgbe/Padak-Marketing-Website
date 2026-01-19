// backend/routes/admin/internships.routes.js

const express = require('express');
const firebase = require('firebase-admin');
const { authenticateToken } = require('../../middleware/auth.middleware');
const router = express.Router();

const db = firebase.firestore();
const app = express();


// ==================== ADMIN INTERNSHIP MANAGEMENT ROUTES ====================

// GET /api/admin/internships - Fetch all internships for admin management
app.get('/api/admin/internships', authenticateToken, async (req, res) => {
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
        applications_count: i.applications_count || 0,
        spots_available: i.spots_available || 0
      };
    });

    res.json(internships);
  } catch (error) {
    console.error('Error fetching internships for admin:', error);
    res.status(500).json({ error: 'Internal server error while fetching internships.' });
  }
});

// ==================== ADMIN INTERNSHIP APPLICATION ROUTES ====================

app.get('/api/admin/internships/applications', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching all internship applications...');
    
    const applicationsSnap = await db.collection('internship_submissions')
      .orderBy('submitted_at', 'desc')
      .get();

    console.log(`Found ${applicationsSnap.docs.length} applications`);

    const applications = [];
    
    for (const doc of applicationsSnap.docs) {
      const app = doc.data();
      
      // Fetch internship details - handle case where internship may have been deleted
      let internshipTitle = 'Deleted Internship';
      let internshipCompany = 'N/A';
      
      try {
        const internshipDoc = await db.collection('internships').doc(app.internship_id).get();
        
        if (internshipDoc.exists) {
          const internship = internshipDoc.data();
          internshipTitle = internship?.title || 'Unknown';
          internshipCompany = internship?.company || 'Unknown';
        } else {
          console.warn(`Internship ${app.internship_id} not found for application ${doc.id}`);
        }
      } catch (internshipError) {
        console.error(`Error fetching internship ${app.internship_id}:`, internshipError);
        // Continue with default values
      }

      applications.push({
        id: doc.id,
        internship_id: app.internship_id,
        internship_title: internshipTitle,
        internship_company: internshipCompany,
        user_id: app.user_id,
        full_name: app.full_name,
        email: app.email,
        phone: app.phone || null,
        resume_url: app.resume_url,
        cover_letter: app.cover_letter || null,
        status: app.status || 'pending',
        submitted_at: app.submitted_at
      });
    }

    console.log(`Returning ${applications.length} applications`);
    res.json(applications);
  } catch (error) {
    console.error('Error fetching all internship applications:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching applications.',
      details: error.message 
    });
  }
});

app.patch('/api/admin/internships/applications/:applicationId/status', authenticateToken, async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
  
  if (!status || !validStatuses.includes(status.toLowerCase())) {
    return res.status(400).json({ error: 'Valid status is required (pending, reviewed, accepted, rejected).' });
  }

  try {
    const applicationRef = db.collection('internship_submissions').doc(applicationId);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    await applicationRef.update({
      status: status.toLowerCase()
    });

    res.json({ 
      message: 'Application status updated successfully',
      status: status.toLowerCase()
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Internal server error while updating application status.' });
  }
});


//===================== ADMIN INTERNSHIP MANAGEMENT ROUTES ====================

app.get('/api/admin/internships/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const internshipDoc = await db.collection('internships').doc(id).get();

    if (!internshipDoc.exists) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    const i = internshipDoc.data();
    const internship = {
      id: internshipDoc.id,
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
      applications_count: i.applications_count || 0,
      spots_available: i.spots_available || 0
    };

    res.json(internship);
  } catch (error) {
    console.error('Error fetching internship:', error);
    res.status(500).json({ error: 'Internal server error while fetching internship.' });
  }
});

// POST /api/admin/internships - Create new internship
app.post('/api/admin/internships', authenticateToken, async (req, res) => {
  const {
    title,
    company,
    location,
    duration,
    type,
    level,
    description,
    requirements,
    benefits,
    spots_available
  } = req.body;

  // Validation
  if (!title || !company || !location || !duration || !type || !level || !description) {
    return res.status(400).json({ error: 'All required fields must be provided.' });
  }

  if (!requirements || !benefits) {
    return res.status(400).json({ error: 'Requirements and benefits are required.' });
  }

  if (spots_available === undefined || spots_available < 0) {
    return res.status(400).json({ error: 'Valid spots_available is required.' });
  }

  try {
    const internshipRef = db.collection('internships').doc();
    
    await internshipRef.set({
      title,
      company,
      location,
      duration,
      type,
      level,
      description,
      requirements: typeof requirements === 'string' ? requirements : JSON.stringify(requirements),
      benefits: typeof benefits === 'string' ? benefits : JSON.stringify(benefits),
      spots_available: parseInt(spots_available),
      applications_count: 0,
      posted_at: firebase.firestore.Timestamp.now()
    });

    const newInternship = await internshipRef.get();
    const i = newInternship.data();
    
    res.status(201).json({
      message: 'Internship created successfully',
      internship: {
        id: newInternship.id,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: JSON.parse(i.requirements),
        benefits: JSON.parse(i.benefits),
        posted_at: i.posted_at,
        applications_count: i.applications_count,
        spots_available: i.spots_available
      }
    });
  } catch (error) {
    console.error('Error creating internship:', error);
    res.status(500).json({ error: 'Internal server error while creating internship.' });
  }
});


app.put('/api/admin/internships/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    company,
    location,
    duration,
    type,
    level,
    description,
    requirements,
    benefits,
    spots_available,
    applications_count
  } = req.body;

  try {
    const internshipRef = db.collection('internships').doc(id);
    const internshipDoc = await internshipRef.get();

    if (!internshipDoc.exists) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (company !== undefined) updateData.company = company;
    if (location !== undefined) updateData.location = location;
    if (duration !== undefined) updateData.duration = duration;
    if (type !== undefined) updateData.type = type;
    if (level !== undefined) updateData.level = level;
    if (description !== undefined) updateData.description = description;
    if (requirements !== undefined) {
      updateData.requirements = typeof requirements === 'string' ? requirements : JSON.stringify(requirements);
    }
    if (benefits !== undefined) {
      updateData.benefits = typeof benefits === 'string' ? benefits : JSON.stringify(benefits);
    }
    if (spots_available !== undefined) updateData.spots_available = parseInt(spots_available);
    if (applications_count !== undefined) updateData.applications_count = parseInt(applications_count);

    await internshipRef.update(updateData);

    const updatedDoc = await internshipRef.get();
    const i = updatedDoc.data();

    res.json({
      message: 'Internship updated successfully',
      internship: {
        id: updatedDoc.id,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: JSON.parse(i.requirements),
        benefits: JSON.parse(i.benefits),
        posted_at: i.posted_at,
        applications_count: i.applications_count,
        spots_available: i.spots_available
      }
    });
  } catch (error) {
    console.error('Error updating internship:', error);
    res.status(500).json({ error: 'Internal server error while updating internship.' });
  }
});


app.delete('/api/admin/internships/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const internshipRef = db.collection('internships').doc(id);
    const internshipDoc = await internshipRef.get();

    if (!internshipDoc.exists) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    // Optional: Check if there are any applications before deletion
    const applicationsSnap = await db.collection('internship_submissions')
      .where('internship_id', '==', id)
      .limit(1)
      .get();

    if (!applicationsSnap.empty) {
      // You can choose to prevent deletion or cascade delete
      // For now, we'll allow deletion but you might want to handle this differently
      console.warn(`Deleting internship ${id} which has ${applicationsSnap.size} applications`);
    }

    await internshipRef.delete();

    res.json({ message: 'Internship deleted successfully' });
  } catch (error) {
    console.error('Error deleting internship:', error);
    res.status(500).json({ error: 'Internal server error while deleting internship.' });
  }
});

// ==================== ADMIN INTERNSHIP CRUD ROUTES ====================

// GET /api/admin/internships - Fetch all internships for admin management
app.get('/api/admin/internships', authenticateToken, async (req, res) => {
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
        applications_count: i.applications_count || 0,
        spots_available: i.spots_available || 0
      };
    });

    res.json(internships);
  } catch (error) {
    console.error('Error fetching internships for admin:', error);
    res.status(500).json({ error: 'Internal server error while fetching internships.' });
  }
});

app.get('/api/admin/internships/:id/applications', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Fetching applications for internship: ${id}`);
    
    const internshipRef = db.collection('internships').doc(id);
    const internshipDoc = await internshipRef.get();

    if (!internshipDoc.exists) {
      console.log(`Internship ${id} not found`);
      return res.status(404).json({ error: 'Internship not found.' });
    }

    const applicationsSnap = await db.collection('internship_submissions')
      .where('internship_id', '==', id)
      .orderBy('submitted_at', 'desc')
      .get();

    const applications = applicationsSnap.docs.map(doc => {
      const app = doc.data();
      return {
        id: doc.id,
        user_id: app.user_id,
        full_name: app.full_name,
        email: app.email,
        phone: app.phone || null,
        resume_url: app.resume_url,
        cover_letter: app.cover_letter || null,
        status: app.status || 'pending',
        submitted_at: app.submitted_at
      };
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching internship applications:', error);
    res.status(500).json({ error: 'Internal server error while fetching applications.' });
  }
});

app.get('/api/admin/internships/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const internshipDoc = await db.collection('internships').doc(id).get();

    if (!internshipDoc.exists) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    const i = internshipDoc.data();
    const internship = {
      id: internshipDoc.id,
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
      applications_count: i.applications_count || 0,
      spots_available: i.spots_available || 0
    };

    res.json(internship);
  } catch (error) {
    console.error('Error fetching internship:', error);
    res.status(500).json({ error: 'Internal server error while fetching internship.' });
  }
});

// POST /api/admin/internships - Create new internship
app.post('/api/admin/internships', authenticateToken, async (req, res) => {
  const {
    title,
    company,
    location,
    duration,
    type,
    level,
    description,
    requirements,
    benefits,
    spots_available
  } = req.body;

  // Validation
  if (!title || !company || !location || !duration || !type || !level || !description) {
    return res.status(400).json({ error: 'All required fields must be provided.' });
  }

  if (!requirements || !benefits) {
    return res.status(400).json({ error: 'Requirements and benefits are required.' });
  }

  if (spots_available === undefined || spots_available < 0) {
    return res.status(400).json({ error: 'Valid spots_available is required.' });
  }

  try {
    const internshipRef = db.collection('internships').doc();
    
    await internshipRef.set({
      title,
      company,
      location,
      duration,
      type,
      level,
      description,
      requirements: typeof requirements === 'string' ? requirements : JSON.stringify(requirements),
      benefits: typeof benefits === 'string' ? benefits : JSON.stringify(benefits),
      spots_available: parseInt(spots_available),
      applications_count: 0,
      posted_at: firebase.firestore.Timestamp.now()
    });

    const newInternship = await internshipRef.get();
    const i = newInternship.data();
    
    res.status(201).json({
      message: 'Internship created successfully',
      internship: {
        id: newInternship.id,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: JSON.parse(i.requirements),
        benefits: JSON.parse(i.benefits),
        posted_at: i.posted_at,
        applications_count: i.applications_count,
        spots_available: i.spots_available
      }
    });
  } catch (error) {
    console.error('Error creating internship:', error);
    res.status(500).json({ error: 'Internal server error while creating internship.' });
  }
});

app.put('/api/admin/internships/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    company,
    location,
    duration,
    type,
    level,
    description,
    requirements,
    benefits,
    spots_available,
    applications_count
  } = req.body;

  try {
    const internshipRef = db.collection('internships').doc(id);
    const internshipDoc = await internshipRef.get();

    if (!internshipDoc.exists) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (company !== undefined) updateData.company = company;
    if (location !== undefined) updateData.location = location;
    if (duration !== undefined) updateData.duration = duration;
    if (type !== undefined) updateData.type = type;
    if (level !== undefined) updateData.level = level;
    if (description !== undefined) updateData.description = description;
    if (requirements !== undefined) {
      updateData.requirements = typeof requirements === 'string' ? requirements : JSON.stringify(requirements);
    }
    if (benefits !== undefined) {
      updateData.benefits = typeof benefits === 'string' ? benefits : JSON.stringify(benefits);
    }
    if (spots_available !== undefined) updateData.spots_available = parseInt(spots_available);
    if (applications_count !== undefined) updateData.applications_count = parseInt(applications_count);

    await internshipRef.update(updateData);

    const updatedDoc = await internshipRef.get();
    const i = updatedDoc.data();

    res.json({
      message: 'Internship updated successfully',
      internship: {
        id: updatedDoc.id,
        title: i.title,
        company: i.company,
        location: i.location,
        duration: i.duration,
        type: i.type,
        level: i.level,
        description: i.description,
        requirements: JSON.parse(i.requirements),
        benefits: JSON.parse(i.benefits),
        posted_at: i.posted_at,
        applications_count: i.applications_count,
        spots_available: i.spots_available
      }
    });
  } catch (error) {
    console.error('Error updating internship:', error);
    res.status(500).json({ error: 'Internal server error while updating internship.' });
  }
});

app.delete('/api/admin/internships/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const internshipRef = db.collection('internships').doc(id);
    const internshipDoc = await internshipRef.get();

    if (!internshipDoc.exists) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    // Optional: Check if there are any applications before deletion
    const applicationsSnap = await db.collection('internship_submissions')
      .where('internship_id', '==', id)
      .limit(1)
      .get();

    if (!applicationsSnap.empty) {
      // You can choose to prevent deletion or cascade delete
      // For now, we'll allow deletion but you might want to handle this differently
      console.warn(`Deleting internship ${id} which has applications`);
    }

    await internshipRef.delete();

    res.json({ message: 'Internship deleted successfully' });
  } catch (error) {
    console.error('Error deleting internship:', error);
    res.status(500).json({ error: 'Internal server error while deleting internship.' });
  }
});