// routes/admin/calendar.routes.js
const express = require('express');
const firebase = require('firebase-admin');
const { authenticateToken, requireAdmin } = require('../../middleware/auth.middleware');

// ==================== ADMIN CALENDAR MANAGEMENT ENDPOINTS ====================

// Get all calendar events (admin only) - FIXED VERSION
app.get('/api/admin/calendar-events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Simple query - sort by event_date only to avoid composite index requirement
    const eventsSnap = await db.collection('custom_calendar_events')
      .orderBy('event_date', 'desc')
      .get();

    if (eventsSnap.empty) {
      return res.json([]);
    }

    const events = [];
    
    for (const doc of eventsSnap.docs) {
      const e = doc.data();
      
      // Initialize user data
      let userData = {
        first_name: null,
        last_name: null,
        email: null
      };

      // Only fetch user data if user_id exists
      if (e.user_id) {
        try {
          const userDoc = await db.collection('users').doc(String(e.user_id)).get();
          if (userDoc.exists) {
            const u = userDoc.data();
            userData = {
              first_name: u.first_name || null,
              last_name: u.last_name || null,
              email: u.email || null
            };
          }
        } catch (userError) {
          console.error(`Error fetching user ${e.user_id}:`, userError);
          // Continue with null user data
        }
      }

      events.push({
        id: doc.id,
        user_id: e.user_id || null,
        title: e.title || '',
        description: e.description || null,
        event_date: e.event_date ? e.event_date.toDate?.() || e.event_date : null,
        event_time: e.event_time || null,
        event_type: e.event_type || 'custom',
        created_at: e.created_at ? e.created_at.toDate?.() || e.created_at : new Date().toISOString(),
        updated_at: e.updated_at ? e.updated_at.toDate?.() || e.updated_at : new Date().toISOString(),
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email
      });
    }

    // Sort by date and time in memory
    events.sort((a, b) => {
      const dateA = new Date(a.event_date);
      const dateB = new Date(b.event_date);
      if (dateB.getTime() !== dateA.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      // If dates are equal, sort by time
      if (a.event_time && b.event_time) {
        return b.event_time.localeCompare(a.event_time);
      }
      return 0;
    });

    res.json(events);

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch calendar events',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get calendar event by ID (admin only) - FIXED VERSION
app.get('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    const event = eventDoc.data();
    
    // Initialize user data
    let userData = {
      first_name: null,
      last_name: null,
      email: null
    };

    // Only fetch user data if user_id exists
    if (event.user_id) {
      try {
        const userDoc = await db.collection('users').doc(String(event.user_id)).get();
        if (userDoc.exists) {
          const user = userDoc.data();
          userData = {
            first_name: user.first_name || null,
            last_name: user.last_name || null,
            email: user.email || null
          };
        }
      } catch (userError) {
        console.error(`Error fetching user ${event.user_id}:`, userError);
      }
    }

    res.json({
      id,
      user_id: event.user_id || null,
      title: event.title || '',
      description: event.description || null,
      event_date: event.event_date ? event.event_date.toDate?.() || event.event_date : null,
      event_time: event.event_time || null,
      event_type: event.event_type || 'custom',
      created_at: event.created_at ? event.created_at.toDate?.() || event.created_at : new Date().toISOString(),
      updated_at: event.updated_at ? event.updated_at.toDate?.() || event.updated_at : new Date().toISOString(),
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email
    });

  } catch (error) {
    console.error('Error fetching calendar event:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendar event',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new calendar event (admin only) - FIXED VERSION
app.post('/api/admin/calendar-events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      user_id,
      title,
      description,
      event_date,
      event_time,
      event_type
    } = req.body;

    // Validate required fields
    if (!title || !event_date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(event_date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate event type
    const validTypes = ['custom', 'webinar', 'workshop', 'meeting', 'deadline'];
    if (event_type && !validTypes.includes(event_type)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    // Validate user_id if provided
    if (user_id) {
      const userDoc = await db.collection('users').doc(String(user_id)).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    const eventRef = db.collection('custom_calendar_events').doc();
    await eventRef.set({
      user_id: user_id ? String(user_id) : null,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      event_date: firebase.firestore.Timestamp.fromDate(new Date(event_date)),
      event_time: event_time || null,
      event_type: event_type || 'custom',
      created_at: firebase.firestore.Timestamp.now(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.status(201).json({
      message: 'Calendar event created successfully',
      eventId: eventRef.id
    });

  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ 
      error: 'Failed to create calendar event',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update calendar event (admin only) - FIXED VERSION
app.put('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user_id,
      title,
      description,
      event_date,
      event_time,
      event_type
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    // Validate required fields
    if (!title || !event_date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(event_date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate event type
    const validTypes = ['custom', 'webinar', 'workshop', 'meeting', 'deadline'];
    if (event_type && !validTypes.includes(event_type)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    // Validate user_id if provided
    if (user_id) {
      const userDoc = await db.collection('users').doc(String(user_id)).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    await db.collection('custom_calendar_events').doc(id).update({
      user_id: user_id ? String(user_id) : null,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      event_date: firebase.firestore.Timestamp.fromDate(new Date(event_date)),
      event_time: event_time || null,
      event_type: event_type || 'custom',
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Calendar event updated successfully' });

  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ 
      error: 'Failed to update calendar event',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete calendar event (admin only) - FIXED VERSION
app.delete('/api/admin/calendar-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    await db.collection('custom_calendar_events').doc(id).delete();

    res.json({ message: 'Calendar event deleted successfully' });

  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ 
      error: 'Failed to delete calendar event',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
