// routes/admin/services.routes.js
const express = require('express');
const app = express();
const { db, firebase } = require('../../config/firebase');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');

// ==================== ADMIN SERVICE MANAGEMENT ENDPOINTS ====================

// Get all services (admin only)
app.get('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const servicesSnap = await db.collection('services').orderBy('created_at', 'desc').get();

    const services = [];
    for (const doc of servicesSnap.docs) {
      const s = doc.data();
      const categoryDoc = await db.collection('service_categories').doc(s.category_id).get();
      services.push({
        id: doc.id,
        name: s.name,
        category_id: s.category_id,
        category_name: categoryDoc.data().name,
        description: s.description,
        price: s.price,
        duration: s.duration,
        rating: s.rating,
        reviews: s.reviews,
        features: s.features ? JSON.parse(s.features) : [],
        popular: s.popular === 1,
        is_active: s.is_active
      });
    }

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get service by ID (admin only)
app.get('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const serviceDoc = await db.collection('services').doc(id).get();

    if (!serviceDoc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = serviceDoc.data();
    const categoryDoc = await db.collection('service_categories').doc(service.category_id).get();

    res.json({
      id,
      name: service.name,
      category_id: service.category_id,
      category_name: categoryDoc.data().name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      rating: service.rating,
      reviews: service.reviews,
      features: service.features ? JSON.parse(service.features) : [],
      popular: service.popular === 1,
      is_active: service.is_active
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Create new service (admin only)
app.post('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      category_id,
      description,
      price,
      duration,
      features,
      popular,
      is_active
    } = req.body;

    // Validate required fields
    if (!name || !category_id || !price) {
      return res.status(400).json({ error: 'Name, category, and price are required' });
    }

    const serviceRef = db.collection('services').doc();
    await serviceRef.set({
      name,
      category_id,
      description: description || null,
      price,
      duration: duration || null,
      features: features ? JSON.stringify(features) : null,
      popular: popular ? 1 : 0,
      is_active: is_active ? 1 : 0,
      created_at: firebase.firestore.Timestamp.now(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.status(201).json({
      message: 'Service created successfully',
      serviceId: serviceRef.id
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update service (admin only)
app.put('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category_id,
      description,
      price,
      duration,
      features,
      popular,
      is_active
    } = req.body;

    const serviceDoc = await db.collection('services').doc(id).get();

    if (!serviceDoc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await db.collection('services').doc(id).update({
      name,
      category_id,
      description: description || null,
      price,
      duration: duration || null,
      features: features ? JSON.stringify(features) : null,
      popular: popular ? 1 : 0,
      is_active: is_active ? 1 : 0,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service (admin only)
app.delete('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const serviceDoc = await db.collection('services').doc(id).get();

    if (!serviceDoc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await db.collection('services').doc(id).delete();

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// ==================== ADMIN SERVICE CATEGORIES ENDPOINT ====================

// GET service categories (admin only)
app.get('/api/admin/service-categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Remove the where clause to get ALL categories, not just is_active=1
    const categoriesSnap = await db.collection('service_categories')
      .orderBy('name')
      .get();

    const categories = categoriesSnap.docs
      .filter(doc => {
        const data = doc.data();
        // Handle both boolean true and number 1 for is_active
        return data.is_active === true || data.is_active === 1;
      })
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id, // This is a string in Firestore
          name: data.name,
          description: data.description,
          icon: data.icon,
          is_active: data.is_active
        };
      });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch service categories',
      details: error.message 
    });
  }
});

// GET all active services (subcategories from active categories) - for regular users
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Fetching public services...');
    
    // FIXED: Remove orderBy to avoid composite index requirement
    // We'll sort in memory instead
    const subcategoriesSnap = await db.collection('service_subcategories').get();

    console.log(`Found ${subcategoriesSnap.size} total subcategories`);

    const services = [];
    
    for (const doc of subcategoriesSnap.docs) {
      const sub = doc.data();
      
      // FIXED: Handle both boolean and number for is_active (true/1 = active)
      const isSubcategoryActive = sub.is_active === true || sub.is_active === 1;
      
      if (!isSubcategoryActive) {
        console.log(`Skipping inactive subcategory ${doc.id}`);
        continue;
      }

      // Get category details
      if (!sub.category_id) {
        console.warn(`Subcategory ${doc.id} has no category_id`);
        continue;
      }

      try {
        const categoryDoc = await db.collection('service_categories').doc(sub.category_id).get();
        
        // Skip if category doesn't exist
        if (!categoryDoc.exists) {
          console.warn(`Category ${sub.category_id} not found for subcategory ${doc.id}`);
          continue;
        }

        const categoryData = categoryDoc.data();
        
        // FIXED: Handle both boolean and number for is_active
        const isCategoryActive = categoryData.is_active === true || categoryData.is_active === 1;
        
        if (!isCategoryActive) {
          console.log(`Skipping subcategory ${sub.name} - category is inactive`);
          continue;
        }

        // FIXED: Ensure features is always an array
        let features = [];
        if (sub.features) {
          if (typeof sub.features === 'string') {
            try {
              features = JSON.parse(sub.features);
            } catch (e) {
              console.warn(`Failed to parse features for ${doc.id}:`, e);
              features = [];
            }
          } else if (Array.isArray(sub.features)) {
            features = sub.features;
          }
        }

        // Format service data - INCLUDE created_at for sorting
        const service = {
          id: doc.id,
          name: sub.name || 'Unnamed Service',
          category_id: sub.category_id,
          categoryName: categoryData.name || 'Uncategorized',
          description: sub.description || '',
          price: parseFloat(sub.base_price || 0),
          duration: sub.duration || 'Variable',
          rating: parseFloat(sub.rating || 0),
          reviews: parseInt(sub.reviews || 0),
          features: features,
          popular: sub.popular === true || sub.popular === 1,
          is_active: true,
          created_at: sub.created_at || null // Store for sorting
        };
        
        services.push(service);
        
      } catch (err) {
        console.error(`Error fetching category for subcategory ${doc.id}:`, err);
        continue;
      }
    }

    // ✅ FIXED: Sort by created_at in memory (newest first) - CORRECT VERSION
    services.sort((a, b) => {
      const aTime = a.created_at?.toDate?.() || new Date(0);
      const bTime = b.created_at?.toDate?.() || new Date(0);
      return bTime - aTime;
    });

    // Remove created_at before sending response
    const cleanServices = services.map(({ created_at, ...rest }) => rest);

    console.log(`✅ Returning ${cleanServices.length} active services`);
    res.json(cleanServices);
    
  } catch (error) {
    console.error('❌ Error fetching services:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch services',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ADJUSTED: GET /api/users/:userId/service-requests - Fetch a user's submitted service requests
app.get('/api/users/:userId/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  if (req.params.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own service requests.' });
  }

  try {
    const requestsSnap = await db.collection('service_requests')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const requests = [];
    
    for (const doc of requestsSnap.docs) {
      const sr = doc.data();
      
      // ✅ FIXED: Add safety checks for missing documents
      let categoryName = 'Unknown Category';
      
      try {
        // Check if subcategory exists
        const subcategoryDoc = await db.collection('service_subcategories').doc(sr.subcategory_id).get();
        
        if (!subcategoryDoc.exists) {
          console.warn(`Subcategory ${sr.subcategory_id} not found for request ${doc.id}`);
        } else {
          const sc = subcategoryDoc.data();
          
          // Check if category exists
          if (sc && sc.category_id) {
            const categoryDoc = await db.collection('service_categories').doc(sc.category_id).get();
            
            if (categoryDoc.exists) {
              const category = categoryDoc.data();
              categoryName = category.name || 'Unknown Category';
            } else {
              console.warn(`Category ${sc.category_id} not found for subcategory ${sr.subcategory_id}`);
            }
          } else {
            console.warn(`Subcategory ${sr.subcategory_id} has no category_id`);
          }
        }
      } catch (fetchError) {
        console.error(`Error fetching category for request ${doc.id}:`, fetchError);
        // Continue with default categoryName
      }
      
      requests.push({
        id: doc.id,
        userId: sr.user_id,
        categoryId: sr.subcategory_id,
        categoryName: categoryName,
        fullName: sr.full_name,
        email: sr.email,
        phone: sr.phone,
        company: sr.company || '',
        website: sr.website || '',
        projectDetails: sr.project_details,
        budgetRange: sr.budget_range,
        timeline: sr.timeline,
        contactMethod: sr.contact_method,
        additionalRequirements: sr.additional_requirements || '',
        status: sr.status,
        requestDate: sr.created_at?.toDate ? sr.created_at.toDate().toISOString() : new Date().toISOString(),
        updatedAt: sr.updated_at?.toDate ? sr.updated_at.toDate().toISOString() : new Date().toISOString()
      });
    }

    console.log(`✅ Returning ${requests.length} service requests for user ${userId}`);
    res.json(requests);
    
  } catch (error) {
    console.error('Error fetching user service requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch your service requests.', 
      error: error.message 
    });
  }
});

// ADJUSTED: POST /api/service-requests - Submit a new service request
app.post('/api/service-requests', authenticateToken, async (req, res) => {
  const userId = req.user.id; // User ID from authenticated token
  const {
    categoryId, // Comes from selectedService.category_id
    fullName,
    email,
    phone,
    company,
    website,
    projectDetails, // Changed from description
    budgetRange,    // Changed from budget
    timeline,       // Changed from deadline
    contactMethod,
    additionalRequirements
  } = req.body;

  // Validate required fields based on your 'service_requests' table schema
  if (!categoryId || !fullName || !email || !phone || !projectDetails || !budgetRange || !timeline || !contactMethod) {
    return res.status(400).json({ message: 'Missing required fields for service request. Please fill in all necessary details.' });
  }

  try {
    const requestRef = db.collection('service_requests').doc();
    await requestRef.set({
      user_id: userId,
      subcategory_id: categoryId,
      full_name: fullName,
      email,
      phone,
      company: company || null, // Allow null for optional fields if not provided
      website: website || null,
      project_details: projectDetails,
      budget_range: budgetRange,
      timeline,
      contact_method: contactMethod,
      additional_requirements: additionalRequirements || null,
      status: 'pending',
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Return the ID of the newly created request
    res.status(201).json({ message: 'Service request submitted successfully!', id: requestRef.id });
  } catch (error) {
    console.error('Error submitting service request:', error);
    res.status(500).json({ message: 'Failed to submit service request. An internal server error occurred.', error: error.message });
  }
});



// ==================== ADMIN SERVICE SUBCATEGORIES AS SERVICES ====================

// GET all service subcategories formatted as services (admin only)
app.get('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const subcategoriesSnap = await db.collection('service_subcategories')
      .orderBy('created_at', 'desc')
      .get();

    const services = [];
    
    for (const doc of subcategoriesSnap.docs) {
      const sub = doc.data();
      
      // Get category name
      let categoryName = 'Unknown Category';
      if (sub.category_id) {
        try {
          const categoryDoc = await db.collection('service_categories').doc(sub.category_id).get();
          if (categoryDoc.exists) {
            categoryName = categoryDoc.data().name;
          }
        } catch (err) {
          console.error('Error fetching category:', err);
        }
      }
      
      services.push({
        id: doc.id,
        name: sub.name,
        category_id: sub.category_id,
        category_name: categoryName,
        description: sub.description || '',
        price: sub.base_price || 0,
        duration: sub.duration || 'Variable',
        rating: sub.rating || 0,           // ✅ Read from Firestore
        reviews: sub.reviews || 0,         // ✅ Read from Firestore
        features: sub.features || [],      // ✅ Read from Firestore
        popular: sub.popular || false,     // ✅ Read from Firestore
        is_active: sub.is_active || true,
        created_at: sub.created_at,
        updated_at: sub.updated_at
      });
    }

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ 
      error: 'Failed to fetch services',
      details: error.message 
    });
  }
});

// POST create new service subcategory (admin only)
app.post('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      category_id,
      description,
      price,
      duration,
      features,
      rating,      // NEW
      reviews,     // NEW
      popular,
      is_active
    } = req.body;

    // Validate required fields
    if (!name || !category_id || !price) {
      return res.status(400).json({ 
        error: 'Name, category, and price are required' 
      });
    }

    // Check if category exists
    const categoryDoc = await db.collection('service_categories').doc(category_id).get();
    if (!categoryDoc.exists) {
      return res.status(400).json({ error: 'Category not found' });
    }

    // Create subcategory
    const subcategoryRef = db.collection('service_subcategories').doc();
    await subcategoryRef.set({
      name: name.trim(),
      category_id,
      description: description || '',
      base_price: parseFloat(price),
      duration: duration || 'Variable',
      features: Array.isArray(features) ? features : [],
      rating: parseFloat(rating) || 0,      // NEW
      reviews: parseInt(reviews) || 0,       // NEW
      popular: popular === true || popular === '1',
      is_active: is_active === true || is_active === '1',
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      message: 'Service created successfully',
      serviceId: subcategoryRef.id
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ 
      error: 'Failed to create service',
      details: error.message 
    });
  }
});

// PUT update service subcategory (admin only)
app.put('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category_id,
      description,
      price,
      duration,
      features,
      rating,      // NEW
      reviews,     // NEW
      popular,
      is_active
    } = req.body;

    // Check if exists
    const subcategoryDoc = await db.collection('service_subcategories').doc(id).get();
    if (!subcategoryDoc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Update subcategory
    await db.collection('service_subcategories').doc(id).update({
      name: name.trim(),
      category_id,
      description: description || '',
      base_price: parseFloat(price),
      duration: duration || 'Variable',
      features: Array.isArray(features) ? features : [],
      rating: parseFloat(rating) || 0,      // NEW
      reviews: parseInt(reviews) || 0,       // NEW
      popular: popular === true || popular === '1',
      is_active: is_active === true || is_active === '1',
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ 
      error: 'Failed to update service',
      details: error.message 
    });
  }
});

// DELETE service subcategory (admin only)
app.delete('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if exists
    const subcategoryDoc = await db.collection('service_subcategories').doc(id).get();
    if (!subcategoryDoc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Delete subcategory
    await db.collection('service_subcategories').doc(id).delete();

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ 
      error: 'Failed to delete service',
      details: error.message 
    });
  }
});

// ==================== ADMIN SERVICE REQUEST MANAGEMENT PAGE ====================

// Updated GET endpoint for service requests
app.get('/api/admin/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requestsSnap = await db.collection('service_requests').orderBy('created_at', 'desc').get();

    const requests = [];
    for (const doc of requestsSnap.docs) {
      const sr = doc.data();
      const scDoc = await db.collection('service_subcategories').doc(sr.subcategory_id).get();
      const uDoc = await db.collection('users').doc(sr.user_id).get();
      const u = uDoc.data();
      requests.push({
        id: doc.id,
        name: sr.name,
        service: scDoc.data().name,
        date: sr.created_at.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: sr.status,
        email: sr.email,
        phone: sr.phone,
        company: sr.company,
        website: sr.website,
        project_details: sr.project_details,
        budget_range: sr.budget_range,
        timeline: sr.timeline,
        contact_method: sr.contact_method,
        additional_requirements: sr.additional_requirements,
        user_id: sr.user_id,
        user_first_name: u.first_name,
        user_last_name: u.last_name,
        user_account_type: u.account_type
      });
    }

    res.json(requests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests', details: error.message });
  }
});

// Updated PUT endpoint for service requests
app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, project_details, budget_range, timeline, additional_requirements } = req.body;

    await db.collection('service_requests').doc(id).update({
      status,
      project_details,
      budget_range,
      timeline,
      additional_requirements,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Service request updated successfully' });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ error: 'Failed to update service request', details: error.message });
  }
});

// PUT /api/admin/service-requests/:id - Update service request status
app.put('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.collection('service_requests').doc(id).update({
      status,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Service request updated successfully' });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ error: 'Failed to update service request', details: error.message });
  }
});

// DELETE /api/admin/service-requests/:id - Delete service request
app.delete('/api/admin/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection('service_requests').doc(id).delete();

    res.json({ message: 'Service request deleted successfully' });
  } catch (error) {
    console.error('Error deleting service request:', error);
    res.status(500).json({ error: 'Failed to delete service request', details: error.message });
  }
});
