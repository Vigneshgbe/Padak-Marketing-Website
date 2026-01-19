// routes/admin/resource.routes.js

const express = require('express');
const firebase = require('firebase-admin');
const { authenticateToken, requireAdmin } = require('../../middleware/auth.middleware');
const app = express();
const db = firebase.firestore();

// ==================== ADMIN RESOURCE MANAGEMENT ENDPOINTS ====================

// GET all resources (admin only)
app.get('/api/admin/resources', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const resourcesSnap = await db.collection('resources').orderBy('created_at', 'desc').get();

    const resourcesWithParsedTypes = resourcesSnap.docs.map(doc => {
      const r = doc.data();
      return {
        id: doc.id,
        title: r.title,
        description: r.description,
        type: r.type,
        size: r.size,
        url: r.url,
        category: r.category,
        icon_name: r.icon_name,
        button_color: r.button_color,
        allowed_account_types: JSON.parse(r.allowed_account_types || '[]'),
        is_premium: r.is_premium,
        created_at: r.created_at,
        updated_at: r.updated_at
      };
    });

    res.json(resourcesWithParsedTypes);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// CREATE new resource (admin only)
app.post('/api/admin/resources', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      size,
      url,
      category,
      icon_name,
      button_color,
      allowed_account_types,
      is_premium
    } = req.body;

    // Validate required fields
    if (!title || !description || !type || !category || !icon_name || !button_color || !allowed_account_types) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure allowed_account_types is an array and convert to JSON string
    const accountTypesArray = Array.isArray(allowed_account_types) 
      ? allowed_account_types 
      : [allowed_account_types];
    
    const accountTypesJSON = JSON.stringify(accountTypesArray);

    const resourceRef = db.collection('resources').doc();
    await resourceRef.set({
      title,
      description,
      type,
      size: size || null,
      url: url || null,
      category,
      icon_name,
      button_color,
      allowed_account_types: accountTypesJSON,
      is_premium: is_premium || false,
      created_at: firebase.firestore.Timestamp.now(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.status(201).json({ 
      message: 'Resource created successfully',
      resourceId: resourceRef.id
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// UPDATE resource (admin only)
app.put('/api/admin/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      size,
      url,
      category,
      icon_name,
      button_color,
      allowed_account_types,
      is_premium
    } = req.body;

    // Validate required fields
    if (!title || !description || !type || !category || !icon_name || !button_color || !allowed_account_types) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure allowed_account_types is an array and convert to JSON string
    const accountTypesArray = Array.isArray(allowed_account_types) 
      ? allowed_account_types 
      : [allowed_account_types];
    
    const accountTypesJSON = JSON.stringify(accountTypesArray);

    await db.collection('resources').doc(id).update({
      title,
      description,
      type,
      size: size || null,
      url: url || null,
      category,
      icon_name,
      button_color,
      allowed_account_types: accountTypesJSON,
      is_premium,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Resource updated successfully' });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

// DELETE resource (admin only)
app.delete('/api/admin/resources/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection('resources').doc(id).delete();

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});
