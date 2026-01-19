// routes/resources.routes.js
const express = require('express');
const app = express();
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/authMiddleware');


// ==================== RESOURCES ROUTES ======================
// GET resources for current user
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First get user's account type
    const userDoc = await db.collection('users').doc(userId).get();
    const accountType = userDoc.data().account_type;
    
    // Get all resources that are allowed for this account type
    const resourcesSnap = await db.collection('resources').get();
    const resources = resourcesSnap.docs.map(doc => doc.data()).filter(r => JSON.parse(r.allowed_account_types || '[]').includes(accountType));
    
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// GET resource download
app.get('/api/resources/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // First check if user has access to this resource
    const resourceDoc = await db.collection('resources').doc(id).get();
    if (!resourceDoc.exists) {
      return res.status(404).json({ error: 'Resource not found or access denied' });
    }

    const resource = resourceDoc.data();
    const userDoc = await db.collection('users').doc(userId).get();
    const accountType = userDoc.data().account_type;

    if (!JSON.parse(resource.allowed_account_types || '[]').includes(accountType)) {
      return res.status(404).json({ error: 'Resource not found or access denied' });
    }
    
    // Check if resource is premium and user doesn't have access
    if (resource.is_premium && !['professional', 'business', 'agency', 'admin'].includes(accountType)) {
      return res.status(403).json({ error: 'Premium resource requires upgraded account' });
    }
    
    // For demo purposes, we'll return a simple text file
    // In a real application, you would serve the actual file
    res.setHeader('Content-Disposition', `attachment; filename="${resource.title}.txt"`);
    res.setHeader('Content-Type', 'text/plain');
    
    // Create a simple text file with resource details
    const fileContent = `
      Resource: ${resource.title}
      Description: ${resource.description}
      Type: ${resource.type}
      Category: ${resource.category}
      Access Level: ${resource.is_premium ? 'Premium' : 'Free'}
      
      This is a demo download. In a real application, this would be the actual resource file.
    `;
    
    res.send(fileContent);
  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ error: 'Failed to download resource' });
  }
});

// ==================== RESOURCES SECTION ROUTES ====================

const getDefaultResources = (accountType) => {
  const allResources = [
    // ... (keep the hardcoded array as is)
  ];

  return allResources.filter(resource =>
    resource.allowedAccountTypes.includes(accountType)
  );
};

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user stats
app.get('/api/user/stats', authenticateToken, async (req, res) => {
  try {
    const statsDoc = await db.collection('user_stats').doc(req.user.id).get();

    let stats;
    if (!statsDoc.exists) {
      // Create default stats if none exist
      await db.collection('user_stats').doc(req.user.id).set({
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0
      });

      stats = {
        courses_enrolled: 0,
        courses_completed: 0,
        certificates_earned: 0,
        learning_streak: 0
      };
    } else {
      stats = statsDoc.data();
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get resources
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const resources = getDefaultResources(req.user.account_type);
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download resource
app.get('/api/resources/:id/download', authenticateToken, async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const resources = getDefaultResources(req.user.account_type);
    const resource = resources.find(r => r.id === resourceId);

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (resource.type === 'tool') {
      return res.status(400).json({ error: 'Cannot download external tools' });
    }

    // Log the download
    await db.collection('download_logs').add({
      user_id: req.user.id,
      resource_id: resourceId,
      resource_name: resource.title
    });

    // Create a mock file buffer for download
    const fileExtension = resource.type === 'excel' ? 'xlsx' : 'pdf';
    const filename = `${resource.title}.${fileExtension}`;

    // Mock file content
    const mockContent = `Mock ${resource.type.toUpperCase()} content for: ${resource.title}`;
    const buffer = Buffer.from(mockContent);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get enrolled courses
app.get('/api/courses/enrolled', authenticateToken, async (req, res) => {
  try {
    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', req.user.id).where('status', '==', 'active').orderBy('enrollment_date', 'desc').get();

    const courses = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const c = courseDoc.data();
      courses.push({
        id: doc.id,
        title: c.title,
        category: c.category,
        difficulty_level: c.difficulty_level,
        progress: e.progress,
        isEnrolled: true
      });
    }

    res.json(courses);
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
