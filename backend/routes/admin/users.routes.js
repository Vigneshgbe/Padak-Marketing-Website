// routes/admin/users.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { db } = require('../../config/firebase');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');


// GET /api/admin/users - Get all users
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching users for admin');
    
    const { search, accountType, status } = req.query;
    
    let query = db.collection('users');

    // Apply filters
    if (accountType && accountType !== 'all') {
      query = query.where('account_type', '==', accountType);
    }

    if (status && status !== 'all') {
      const isActive = status === 'active';
      query = query.where('is_active', '==', isActive);
    }

    const snapshot = await query.get();
    
    let users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        account_type: userData.account_type || 'student',
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        company: userData.company || '',
        website: userData.website || '',
        bio: userData.bio || '',
        created_at: userData.created_at ? userData.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: userData.updated_at ? userData.updated_at.toDate().toISOString() : new Date().toISOString()
      });
    });

    // Apply search filter
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase().trim();
      users = users.filter(user => 
        (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower))
      );
    }

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching users' 
    });
  }
});

// POST /api/admin/users - Create new user
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Creating new user:', req.body);
    
    let { firstName, lastName, email, phone, password, accountType, isActive, company, website, bio } = req.body;

    // Trim inputs
    firstName = firstName ? firstName.trim() : '';
    lastName = lastName ? lastName.trim() : '';
    email = email ? email.trim().toLowerCase() : '';
    phone = phone ? phone.trim() : '';
    company = company ? company.trim() : '';
    website = website ? website.trim() : '';
    bio = bio ? bio.trim() : '';

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, email, and password are required'
      });
    }

    // Check if email exists
    const emailSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (!emailSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      password_hash: hashedPassword,
      account_type: accountType || 'student',
      is_active: isActive !== undefined ? isActive : true,
      company: company,
      website: website,
      bio: bio,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    const userRef = await db.collection('users').add(userData);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: userRef.id,
        ...userData,
        created_at: userData.created_at.toISOString(),
        updated_at: userData.updated_at.toISOString()
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating user'
    });
  }
});

// PUT /api/admin/users/:id - Update user
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Updating user with ID:', userId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const { firstName, lastName, email, phone, accountType, isActive, company, website, bio } = req.body;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const currentUser = userDoc.data();

    // Check email uniqueness if changed
    if (email && email !== currentUser.email) {
      const emailSnapshot = await db.collection('users')
        .where('email', '==', email.trim().toLowerCase())
        .get();
      
      if (!emailSnapshot.empty) {
        const matchingUser = emailSnapshot.docs[0];
        if (matchingUser.id !== userId) {
          return res.status(400).json({
            success: false,
            error: 'Email already exists'
          });
        }
      }
    }

    const updateData = {
      first_name: firstName !== undefined ? firstName.trim() : currentUser.first_name,
      last_name: lastName !== undefined ? lastName.trim() : currentUser.last_name,
      email: email !== undefined ? email.trim().toLowerCase() : currentUser.email,
      phone: phone !== undefined ? phone : currentUser.phone,
      account_type: accountType || currentUser.account_type,
      is_active: isActive !== undefined ? isActive : currentUser.is_active,
      company: company !== undefined ? company : currentUser.company,
      website: website !== undefined ? website : currentUser.website,
      bio: bio !== undefined ? bio : currentUser.bio,
      updated_at: new Date()
    };

    await db.collection('users').doc(userId).update(updateData);

    const updatedUserDoc = await db.collection('users').doc(userId).get();
    const updatedUser = updatedUserDoc.data();

    return res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: userId,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        account_type: updatedUser.account_type,
        is_active: updatedUser.is_active,
        company: updatedUser.company || '',
        website: updatedUser.website || '',
        bio: updatedUser.bio || '',
        created_at: updatedUser.created_at.toDate().toISOString(),
        updated_at: updatedUser.updated_at.toISOString()
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while updating user: ' + error.message
    });
  }
});

// DELETE /api/admin/users/:id - Delete user (soft delete)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id || req.user.userId;

    // Prevent self-deletion
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account'
      });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Soft delete
    await db.collection('users').doc(userId).update({
      is_active: false,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting user'
    });
  }
});

// PUT /api/admin/users/:id/password - Reset password
router.put('/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection('users').doc(userId).update({
      password_hash: hashedPassword,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while resetting password'
    });
  }
});

module.exports = router;


// ==================== ADMIN USER MANAGEMENT ROUTES ====================

// GET /api/admin/users - Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching users for admin');
    
    const { search, accountType, status } = req.query;
    
    let query = db.collection('users');

    // Apply filters
    if (accountType && accountType !== 'all') {
      query = query.where('account_type', '==', accountType);
    }

    if (status && status !== 'all') {
      const isActive = status === 'active';
      query = query.where('is_active', '==', isActive);
    }

    const snapshot = await query.get();
    
    let users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        account_type: userData.account_type || 'student',
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        company: userData.company || '',
        website: userData.website || '',
        bio: userData.bio || '',
        created_at: userData.created_at ? userData.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: userData.updated_at ? userData.updated_at.toDate().toISOString() : new Date().toISOString()
      });
    });

    // Apply search filter
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase().trim();
      users = users.filter(user => 
        (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower))
      );
    }

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching users' 
    });
  }
});

// POST /api/admin/users - Create new user
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Creating new user:', req.body);
    
    let { firstName, lastName, email, phone, password, accountType, isActive, company, website, bio } = req.body;

    // Trim inputs
    firstName = firstName ? firstName.trim() : '';
    lastName = lastName ? lastName.trim() : '';
    email = email ? email.trim().toLowerCase() : '';
    phone = phone ? phone.trim() : '';
    company = company ? company.trim() : '';
    website = website ? website.trim() : '';
    bio = bio ? bio.trim() : '';

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, email, and password are required'
      });
    }

    // Check if email exists
    const emailSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (!emailSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      password_hash: hashedPassword,
      account_type: accountType || 'student',
      is_active: isActive !== undefined ? isActive : true,
      company: company,
      website: website,
      bio: bio,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    const userRef = await db.collection('users').add(userData);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: userRef.id,
        ...userData,
        created_at: userData.created_at.toISOString(),
        updated_at: userData.updated_at.toISOString()
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating user'
    });
  }
});

// PUT /api/admin/users/:id - Update user - FIXED AND ENHANCED
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Updating user with ID:', userId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const { firstName, lastName, email, phone, accountType, isActive, company, website, bio } = req.body;
    console.log('Update payload:', req.body);

    // Check if user exists
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        console.log('User not found with ID:', userId);
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const currentUser = userDoc.data();
      console.log('Found current user:', currentUser);

      // Check email uniqueness if changed
      if (email && email !== currentUser.email) {
        const emailSnapshot = await db.collection('users')
          .where('email', '==', email.trim().toLowerCase())
          .get();
        
        if (!emailSnapshot.empty) {
          // Make sure we're not matching the same user
          const matchingUser = emailSnapshot.docs[0];
          if (matchingUser.id !== userId) {
            console.log('Email already exists for another user');
            return res.status(400).json({
              success: false,
              error: 'Email already exists'
            });
          }
        }
      }

      // Prepare update data
      const updateData = {
        first_name: firstName !== undefined ? firstName.trim() : currentUser.first_name,
        last_name: lastName !== undefined ? lastName.trim() : currentUser.last_name,
        email: email !== undefined ? email.trim().toLowerCase() : currentUser.email,
        phone: phone !== undefined ? phone : currentUser.phone,
        account_type: accountType || currentUser.account_type,
        is_active: isActive !== undefined ? isActive : currentUser.is_active,
        company: company !== undefined ? company : currentUser.company,
        website: website !== undefined ? website : currentUser.website,
        bio: bio !== undefined ? bio : currentUser.bio,
        updated_at: firebase.firestore.Timestamp.now()
      };
      console.log('Prepared update data:', updateData);

      // Update the user
      await db.collection('users').doc(userId).update(updateData);
      console.log('User updated successfully');

      // Get updated user data for response
      const updatedUserDoc = await db.collection('users').doc(userId).get();
      const updatedUser = updatedUserDoc.data();

      return res.json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: userId,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          account_type: updatedUser.account_type,
          is_active: updatedUser.is_active,
          company: updatedUser.company || '',
          website: updatedUser.website || '',
          bio: updatedUser.bio || '',
          created_at: updatedUser.created_at.toDate().toISOString(),
          updated_at: updatedUser.updated_at.toDate().toISOString()
        }
      });
    } catch (firebaseError) {
      console.error('Firebase error:', firebaseError);
      return res.status(500).json({
        success: false,
        error: 'Database error: ' + firebaseError.message
      });
    }
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while updating user: ' + error.message
    });
  }
});

// DELETE /api/admin/users/:id - Delete user (soft delete)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id || req.user.userId;

    console.log('Deleting user:', userId);

    // Prevent self-deletion
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account'
      });
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Soft delete
    await db.collection('users').doc(userId).update({
      is_active: false,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting user'
    });
  }
});

// PUT /api/admin/users/:id/password - Reset password
app.put('/api/admin/users/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;

    console.log('Resetting password for user:', userId);

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection('users').doc(userId).update({
      password_hash: hashedPassword,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while resetting password'
    });
  }
});

// Debug route to see all registered routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes });
});
