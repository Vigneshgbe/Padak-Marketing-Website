// routes/services.routes.js
const express = require('express');
const router = express.Router();
const { db, firebase } = require('../firebase');
const { authenticateToken } = require('../middleware/auth.middleware');
const app = express();


// ==================== SERVICES ROUTES ====================

// Get service categories
app.get('/api/services/categories', async (req, res) => {
  try {
    console.log('📋 Fetching service categories...');
    
    // ✅ FIXED: Remove orderBy to avoid composite index requirement
    const categoriesSnap = await db.collection('service_categories').get();
    
    console.log(`Found ${categoriesSnap.size} total categories`);

    const categoriesWithSubs = [];
    
    for (const doc of categoriesSnap.docs) {
      const category = doc.data();
      
      // ✅ FIXED: Handle both boolean and number for is_active
      const isCategoryActive = category.is_active === true || category.is_active === 1;
      
      if (!isCategoryActive) {
        console.log(`Skipping inactive category ${doc.id}`);
        continue;
      }
      
      // ✅ FIXED: Remove orderBy from subcategories query too
      const subcategoriesSnap = await db.collection('service_subcategories')
        .where('category_id', '==', doc.id)
        .get();
      
      const activeSubcategories = [];
      
      subcategoriesSnap.docs.forEach(subDoc => {
        const sub = subDoc.data();
        const isSubActive = sub.is_active === true || sub.is_active === 1;
        
        if (isSubActive) {
          activeSubcategories.push({
            id: subDoc.id,
            categoryId: sub.category_id,
            name: sub.name || 'Unnamed Service',
            description: sub.description || '',
            basePrice: parseFloat(sub.base_price || 0)
          });
        }
      });
      
      // Sort subcategories by name in memory
      activeSubcategories.sort((a, b) => a.name.localeCompare(b.name));
      
      categoriesWithSubs.push({
        id: doc.id,
        name: category.name || 'Unnamed Category',
        description: category.description || '',
        icon: category.icon || 'Package',
        subcategories: activeSubcategories
      });
    }
    
    // Sort categories by name in memory
    categoriesWithSubs.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`✅ Returning ${categoriesWithSubs.length} active categories`);
    res.json(categoriesWithSubs);

  } catch (error) {
    console.error('❌ Get service categories error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Submit service request
app.post('/api/services/requests', authenticateToken, async (req, res) => {
  try {
    const {
      subcategoryId, fullName, email, phone, company, website,
      projectDetails, budgetRange, timeline, contactMethod, additionalRequirements
    } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!subcategoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check if subcategory exists
    const subcategoryDoc = await db.collection('service_subcategories').doc(subcategoryId).get();

    if (!subcategoryDoc.exists || !subcategoryDoc.data().is_active) {
      return res.status(404).json({ error: 'Service subcategory not found' });
    }

    // Create service request
    const requestRef = db.collection('service_requests').doc();
    await requestRef.set({
      user_id: userId,
      subcategory_id: subcategoryId,
      full_name: fullName,
      email,
      phone,
      company,
      website,
      project_details: projectDetails,
      budget_range: budgetRange,
      timeline,
      contact_method: contactMethod,
      additional_requirements: additionalRequirements,
      created_at: firebase.firestore.Timestamp.now()
    });

    res.status(201).json({
      message: 'Service request submitted successfully',
      requestId: requestRef.id
    });

  } catch (error) {
    console.error('Service request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's service requests
app.get('/api/services/my-requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const requestsSnap = await db.collection('service_requests').where('user_id', '==', userId).orderBy('created_at', 'desc').get();

    const requests = [];
    for (const doc of requestsSnap.docs) {
      const sr = doc.data();
      const ssDoc = await db.collection('service_subcategories').doc(sr.subcategory_id).get();
      const ss = ssDoc.data();
      const scDoc = await db.collection('service_categories').doc(ss.category_id).get();
      const sc = scDoc.data();
      requests.push({
        id: doc.id,
        userId: sr.user_id,
        subcategoryId: sr.subcategory_id,
        fullName: sr.full_name,
        email: sr.email,
        phone: sr.phone,
        company: sr.company,
        website: sr.website,
        projectDetails: sr.project_details,
        budgetRange: sr.budget_range,
        timeline: sr.timeline,
        contactMethod: sr.contact_method,
        additionalRequirements: sr.additional_requirements,
        status: sr.status,
        createdAt: sr.created_at,
        updatedAt: sr.updated_at,
        categoryName: sc.name,
        subcategoryName: ss.name
      });
    }

    res.json(requests);
  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
