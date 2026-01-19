// routes/admin/contacts.routes.js
const express = require('express');
const app = express();
const { db } = require('../../config/firebase');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');


// ==================== ADMIN CONTACT MESSAGES ENDPOINTS ====================

// Get contact messages (admin only) - FIXED VERSION
app.get('/api/admin/contact-messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Firestore doesn't support offset() - we'll fetch all and paginate in memory for simplicity
    // For production with large datasets, implement cursor-based pagination with startAfter()
    const messagesSnap = await db.collection('contact_messages')
      .orderBy('created_at', 'desc')
      .get();

    if (messagesSnap.empty) {
      return res.json({
        messages: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalMessages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      });
    }

    // Get all messages
    const allMessages = messagesSnap.docs.map(doc => {
      const m = doc.data();
      return {
        id: doc.id,
        first_name: m.first_name || '',
        last_name: m.last_name || '',
        email: m.email || '',
        phone: m.phone || '',
        company: m.company || '',
        message: m.message || '',
        status: m.status || 'pending',
        created_at: m.created_at ? m.created_at.toDate?.() || m.created_at : new Date().toISOString()
      };
    });

    const total = allMessages.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Paginate in memory
    const paginatedMessages = allMessages.slice(startIndex, endIndex);

    res.json({
      messages: paginatedMessages,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalMessages: total,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching contact messages:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch contact messages',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// UPDATE contact message status (admin only)
app.put('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    if (!status || !['pending', 'contacted', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value. Must be: pending, contacted, resolved, or closed' });
    }

    // Check if document exists
    const docRef = db.collection('contact_messages').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    // Update the status
    await docRef.update({
      status,
      updated_at: new Date().toISOString()
    });

    res.json({ 
      message: 'Contact message updated successfully',
      id,
      status
    });

  } catch (error) {
    console.error('Error updating contact message:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Failed to update contact message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE contact message (admin only)
app.delete('/api/admin/contact-messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    // Check if document exists
    const docRef = db.collection('contact_messages').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    // Delete the document
    await docRef.delete();

    res.json({ 
      message: 'Contact message deleted successfully',
      id
    });

  } catch (error) {
    console.error('Error deleting contact message:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Failed to delete contact message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
