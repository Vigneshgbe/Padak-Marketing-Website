// routes/calendar.routes.js

const express = require('express');
const firebase = require('firebase-admin');
const { authenticateToken } = require('../middleware/auth.middleware');
const db = firebase.firestore();
const app = express();

// ==================== USER CALENDAR EVENTS ROUTES ====================

// GET /api/calendar/events - Get all calendar events for current user
app.get('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📅 Fetching calendar events for user ${userId}`);

    // Get course start/end dates for enrolled courses
    const enrollmentsSnap = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .get();

    const courseEvents = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      try {
        const courseDoc = await db.collection('courses').doc(e.course_id).get();
        if (courseDoc.exists) {
          const c = courseDoc.data();
          courseEvents.push({
            id: doc.id,
            title: c.title || 'Course',
            description: c.description || 'Course enrollment',
            date: c.created_at?.toDate ? c.created_at.toDate().toISOString() : new Date().toISOString(),
            type: 'course_start',
            course: {
              id: e.course_id,
              title: c.title || 'Course',
              category: c.category || 'General'
            },
            color: 'blue'
          });
        }
      } catch (err) {
        console.error(`Error fetching course ${e.course_id}:`, err);
      }
    }

    const assignmentEvents = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      try {
        const assignmentsSnap = await db.collection('assignments')
          .where('course_id', '==', e.course_id)
          .get();
          
        for (const aDoc of assignmentsSnap.docs) {
          const a = aDoc.data();
          
          try {
            const submissionSnap = await db.collection('assignment_submissions')
              .where('assignment_id', '==', aDoc.id)
              .where('user_id', '==', userId)
              .get();
              
            let status = 'pending';
            if (!submissionSnap.empty) {
              const submissionStatus = submissionSnap.docs[0].data().status;
              status = submissionStatus === 'graded' ? 'completed' : 'submitted';
            } else if (a.due_date && a.due_date.toDate && a.due_date.toDate() < new Date()) {
              status = 'overdue';
            }
            
            const courseDoc = await db.collection('courses').doc(e.course_id).get();
            const c = courseDoc.exists ? courseDoc.data() : { title: 'Course', category: 'General' };
            
            assignmentEvents.push({
              id: aDoc.id,
              title: a.title || 'Assignment',
              description: a.description || 'Assignment due',
              date: a.due_date?.toDate ? a.due_date.toDate().toISOString() : new Date().toISOString(),
              type: 'assignment',
              course: {
                id: e.course_id,
                title: c.title || 'Course',
                category: c.category || 'General'
              },
              status,
              color: status === 'completed' ? 'green' : status === 'overdue' ? 'red' : 'orange'
            });
          } catch (assignmentErr) {
            console.error(`Error processing assignment ${aDoc.id}:`, assignmentErr);
          }
        }
      } catch (err) {
        console.error(`Error fetching assignments for course ${e.course_id}:`, err);
      }
    }

    // ✅ FIXED: Get custom calendar events WITHOUT orderBy to avoid composite index
    const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const customEventsSnap = await db.collection('custom_calendar_events')
      .where('user_id', '==', userId)
      .get(); // ✅ Removed orderBy

    const customEvents = [];
    customEventsSnap.docs.forEach(doc => {
      const event = doc.data();
      
      // Filter by date in memory
      const eventDate = event.event_date?.toDate ? event.event_date.toDate() : new Date(event.event_date);
      
      if (eventDate >= thirtyDaysAgo) {
        customEvents.push({
          id: doc.id,
          title: event.title || 'Event',
          description: event.description || '',
          date: event.event_date?.toDate ? event.event_date.toDate().toISOString() : new Date().toISOString(),
          time: event.event_time || null,
          type: event.event_type || 'custom',
          color: 'purple'
        });
      }
    });

    // Sort custom events by date in memory
    customEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Combine all events
    const allEvents = [...courseEvents, ...assignmentEvents, ...customEvents];

    console.log(`✅ Returning ${allEvents.length} calendar events`);
    res.json(allEvents);
    
  } catch (error) {
    console.error('❌ Error fetching calendar events:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch calendar events',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/calendar/events/date/:date - Get events for specific date
app.get('/api/calendar/events/date/:date', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0); // Start of day
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();

    const eventsResult = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const c = courseDoc.data();
      if (c.created_at.toDate().toISOString().split('T')[0] === date) {
        eventsResult.push({
          event_type: 'course_start',
          id: c.id,
          title: `Course: ${c.title}`,
          description: c.description,
          date: c.created_at,
          time: null,
          course_id: e.course_id,
          course_title: c.title,
          course_category: c.category,
          status: 'active'
        });
      }

      const assignmentsSnap = await db.collection('assignments').where('course_id', '==', e.course_id).get();
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        if (a.due_date.toDate().toISOString().split('T')[0] === date) {
          const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
          let status = 'pending';
          if (!submissionSnap.empty) {
            if (submissionSnap.docs[0].data().status === 'graded') status = 'completed';
          } else if (a.due_date.toDate() < new Date()) {
            status = 'overdue';
          }
          eventsResult.push({
            event_type: 'assignment',
            id: aDoc.id,
            title: a.title,
            description: a.description,
            date: a.due_date,
            time: null,
            course_id: e.course_id,
            course_title: c.title,
            course_category: c.category,
            status
          });
        }
      }
    }

    // Try to get custom events for the date
    const customEventsSnap = await db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '>=', targetDate).where('event_date', '<', nextDay).get();

    const customEvents = customEventsSnap.docs.map(doc => {
      const event = doc.data();
      return {
        event_type: 'custom',
        id: doc.id,
        title: event.title,
        description: event.description,
        date: event.event_date,
        time: event.event_time,
        course_id: null,
        course_title: null,
        course_category: null,
        status: 'pending'
      };
    });

    const allEvents = [...eventsResult, ...customEvents];

    const events = allEvents.map(event => ({
      id: `${event.event_type}-${event.id}`,
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time,
      type: event.event_type,
      course: event.course_id ? {
        id: event.course_id,
        title: event.course_title,
        category: event.course_category
      } : null,
      status: event.status
    }));

    res.json(events);
  } catch (error) {
    console.error('Error fetching events for date:', error);
    res.status(500).json({ error: 'Failed to fetch events for specified date' });
  }
});

// GET /api/calendar/upcoming - Get upcoming events (next 7 days)
app.get('/api/calendar/upcoming', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();

    const upcomingResult = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const assignmentsSnap = await db.collection('assignments').where('course_id', '==', e.course_id).where('due_date', '>=', firebase.firestore.Timestamp.fromDate(now)).where('due_date', '<=', firebase.firestore.Timestamp.fromDate(sevenDaysLater)).orderBy('due_date').limit(10).get();
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
        let status = 'pending';
        if (!submissionSnap.empty) {
          if (submissionSnap.docs[0].data().status === 'graded') status = 'completed';
        } else if (a.due_date.toDate() < new Date()) {
          status = 'overdue';
        }
        const courseDoc = await db.collection('courses').doc(e.course_id).get();
        const c = courseDoc.data();
        upcomingResult.push({
          event_type: 'assignment',
          id: aDoc.id,
          title: a.title,
          description: a.description,
          date: a.due_date,
          time: null,
          course_id: e.course_id,
          course_title: c.title,
          course_category: c.category,
          status
        });
      }
    }

    // Try to get upcoming custom events
    const customResult = await db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '>=', firebase.firestore.Timestamp.fromDate(now)).where('event_date', '<=', firebase.firestore.Timestamp.fromDate(sevenDaysLater)).orderBy('event_date').limit(5).get();

    const customUpcoming = customResult.docs.map(doc => {
      const event = doc.data();
      return {
        event_type: 'custom',
        id: doc.id,
        title: event.title,
        description: event.description,
        date: event.event_date,
        time: event.event_time,
        course_id: null,
        course_title: null,
        course_category: null,
        status: 'pending'
      };
    });

    const allUpcoming = [...upcomingResult, ...customUpcoming];

    const upcomingEvents = allUpcoming.map(event => ({
      id: `${event.event_type}-${event.id}`,
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time,
      type: event.event_type,
      course: event.course_id ? {
        id: event.course_id,
        title: event.course_title,
        category: event.course_category
      } : null,
      status: event.status,
      color: event.status === 'completed' ? 'green' :
        event.status === 'overdue' ? 'red' :
          event.event_type === 'custom' ? 'purple' : 'orange'
    }));

    res.json(upcomingEvents);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// GET /api/calendar/stats - Get calendar statistics
app.get('/api/calendar/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).get();

    let pendingAssignments = 0;
    let completedAssignments = 0;
    let overdueAssignments = 0;
    let activeCourses = 0;
    let completedCourses = 0;

    enrollmentsSnap.docs.forEach(doc => {
      const e = doc.data();
      if (e.status === 'active') activeCourses++;
      if (e.status === 'completed') completedCourses++;
    });

    const assignmentsSnap = await db.collection('assignments').get(); // Inefficient, but since no join, fetch all and filter

    for (const aDoc of assignmentsSnap.docs) {
      const a = aDoc.data();
      // Check if user is enrolled in the course
      const enrollment = await db.collection('enrollments').where('user_id', '==', userId).where('course_id', '==', a.course_id).where('status', '==', 'active').get();
      if (!enrollment.empty) {
        const submission = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
        if (!submission.empty) {
          if (submission.docs[0].data().status === 'graded') completedAssignments++;
          else pendingAssignments++;
        } else {
          if (a.due_date.toDate() < new Date()) overdueAssignments++;
          else pendingAssignments++;
        }
      }
    }

    res.json({
      pending_assignments: pendingAssignments,
      completed_assignments: completedAssignments,
      overdue_assignments: overdueAssignments,
      active_courses: activeCourses,
      completed_courses: completedCourses,
      total_assignments: pendingAssignments + completedAssignments + overdueAssignments
    });
  } catch (error) {
    console.error('Error fetching calendar stats:', error);
    res.status(500).json({ error: 'Failed to fetch calendar statistics' });
  }
});

// GET /api/assignments/my-assignments - Get user's assignments (for calendar frontend)
app.get('/api/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();

    const assignments = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const assSnap = await db.collection('assignments').where('course_id', '==', e.course_id).orderBy('due_date').get();
      for (const aDoc of assSnap.docs) {
        const a = aDoc.data();
        const courseDoc = await db.collection('courses').doc(e.course_id).get();
        const c = courseDoc.data();
        const subSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
        let submission = null;
        if (!subSnap.empty) {
          submission = subSnap.docs[0].data();
          submission.id = subSnap.docs[0].id;
        }
        assignments.push({
          id: aDoc.id,
          course_id: e.course_id,
          title: a.title,
          description: a.description,
          due_date: a.due_date,
          max_points: a.max_points,
          created_at: a.created_at,
          course: {
            id: e.course_id,
            title: c.title,
            category: c.category
          },
          submission
        });
      }
    }

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// POST /api/calendar/events - Create a custom calendar event
app.post('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, date, time, type = 'custom' } = req.body;

    // Validate required fields
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const eventRef = db.collection('custom_calendar_events').doc();
    await eventRef.set({
      user_id: userId,
      title,
      description,
      event_date: new Date(date),
      event_time: time,
      event_type: type,
      created_at: firebase.firestore.Timestamp.now(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.status(201).json({
      id: eventRef.id,
      title,
      description,
      date,
      time,
      type,
      message: 'Calendar event created successfully'
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// PUT /api/calendar/events/:id - Update a custom calendar event
app.put('/api/calendar/events/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, date, time, type } = req.body;

    // Check if event exists and belongs to user
    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists || eventDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    await db.collection('custom_calendar_events').doc(id).update({
      title,
      description,
      event_date: new Date(date),
      event_time: time,
      event_type: type,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Calendar event updated successfully' });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

// DELETE /api/calendar/events/:id - Delete a custom calendar event
app.delete('/api/calendar/events/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists || eventDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    await db.collection('custom_calendar_events').doc(id).delete();

    res.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

// GET /api/auth/me - Get current user info (for calendar frontend)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: req.user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      account_type: user.account_type,
      profile_image: user.profile_image,
      company: user.company,
      website: user.website,
      bio: user.bio,
      is_active: user.is_active,
      email_verified: user.email_verified,
      created_at: user.created_at,
      last_login: user.last_login
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});

// ==================== USER CALENDAR EVENTS ROUTES ====================

// GET /api/calendar/events - Get all calendar events for current user
app.get('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📅 Fetching calendar events for user ${userId}`);

    // Get course start/end dates for enrolled courses
    const enrollmentsSnap = await db.collection('enrollments')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .get();

    const courseEvents = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      try {
        const courseDoc = await db.collection('courses').doc(e.course_id).get();
        if (courseDoc.exists) {
          const c = courseDoc.data();
          courseEvents.push({
            id: doc.id,
            title: c.title || 'Course',
            description: c.description || 'Course enrollment',
            date: c.created_at?.toDate ? c.created_at.toDate().toISOString() : new Date().toISOString(),
            type: 'course_start',
            course: {
              id: e.course_id,
              title: c.title || 'Course',
              category: c.category || 'General'
            },
            color: 'blue'
          });
        }
      } catch (err) {
        console.error(`Error fetching course ${e.course_id}:`, err);
      }
    }

    const assignmentEvents = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      try {
        const assignmentsSnap = await db.collection('assignments')
          .where('course_id', '==', e.course_id)
          .get();
          
        for (const aDoc of assignmentsSnap.docs) {
          const a = aDoc.data();
          
          try {
            const submissionSnap = await db.collection('assignment_submissions')
              .where('assignment_id', '==', aDoc.id)
              .where('user_id', '==', userId)
              .get();
              
            let status = 'pending';
            if (!submissionSnap.empty) {
              const submissionStatus = submissionSnap.docs[0].data().status;
              status = submissionStatus === 'graded' ? 'completed' : 'submitted';
            } else if (a.due_date && a.due_date.toDate && a.due_date.toDate() < new Date()) {
              status = 'overdue';
            }
            
            const courseDoc = await db.collection('courses').doc(e.course_id).get();
            const c = courseDoc.exists ? courseDoc.data() : { title: 'Course', category: 'General' };
            
            assignmentEvents.push({
              id: aDoc.id,
              title: a.title || 'Assignment',
              description: a.description || 'Assignment due',
              date: a.due_date?.toDate ? a.due_date.toDate().toISOString() : new Date().toISOString(),
              type: 'assignment',
              course: {
                id: e.course_id,
                title: c.title || 'Course',
                category: c.category || 'General'
              },
              status,
              color: status === 'completed' ? 'green' : status === 'overdue' ? 'red' : 'orange'
            });
          } catch (assignmentErr) {
            console.error(`Error processing assignment ${aDoc.id}:`, assignmentErr);
          }
        }
      } catch (err) {
        console.error(`Error fetching assignments for course ${e.course_id}:`, err);
      }
    }

    // ✅ FIXED: Get custom calendar events WITHOUT orderBy to avoid composite index
    const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const customEventsSnap = await db.collection('custom_calendar_events')
      .where('user_id', '==', userId)
      .get(); // ✅ Removed orderBy

    const customEvents = [];
    customEventsSnap.docs.forEach(doc => {
      const event = doc.data();
      
      // Filter by date in memory
      const eventDate = event.event_date?.toDate ? event.event_date.toDate() : new Date(event.event_date);
      
      if (eventDate >= thirtyDaysAgo) {
        customEvents.push({
          id: doc.id,
          title: event.title || 'Event',
          description: event.description || '',
          date: event.event_date?.toDate ? event.event_date.toDate().toISOString() : new Date().toISOString(),
          time: event.event_time || null,
          type: event.event_type || 'custom',
          color: 'purple'
        });
      }
    });

    // Sort custom events by date in memory
    customEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Combine all events
    const allEvents = [...courseEvents, ...assignmentEvents, ...customEvents];

    console.log(`✅ Returning ${allEvents.length} calendar events`);
    res.json(allEvents);
    
  } catch (error) {
    console.error('❌ Error fetching calendar events:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch calendar events',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/calendar/events/date/:date - Get events for specific date
app.get('/api/calendar/events/date/:date', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0); // Start of day
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();

    const eventsResult = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const courseDoc = await db.collection('courses').doc(e.course_id).get();
      const c = courseDoc.data();
      if (c.created_at.toDate().toISOString().split('T')[0] === date) {
        eventsResult.push({
          event_type: 'course_start',
          id: c.id,
          title: `Course: ${c.title}`,
          description: c.description,
          date: c.created_at,
          time: null,
          course_id: e.course_id,
          course_title: c.title,
          course_category: c.category,
          status: 'active'
        });
      }

      const assignmentsSnap = await db.collection('assignments').where('course_id', '==', e.course_id).get();
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        if (a.due_date.toDate().toISOString().split('T')[0] === date) {
          const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
          let status = 'pending';
          if (!submissionSnap.empty) {
            if (submissionSnap.docs[0].data().status === 'graded') status = 'completed';
          } else if (a.due_date.toDate() < new Date()) {
            status = 'overdue';
          }
          eventsResult.push({
            event_type: 'assignment',
            id: aDoc.id,
            title: a.title,
            description: a.description,
            date: a.due_date,
            time: null,
            course_id: e.course_id,
            course_title: c.title,
            course_category: c.category,
            status
          });
        }
      }
    }

    // Try to get custom events for the date
    const customEventsSnap = await db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '>=', targetDate).where('event_date', '<', nextDay).get();

    const customEvents = customEventsSnap.docs.map(doc => {
      const event = doc.data();
      return {
        event_type: 'custom',
        id: doc.id,
        title: event.title,
        description: event.description,
        date: event.event_date,
        time: event.event_time,
        course_id: null,
        course_title: null,
        course_category: null,
        status: 'pending'
      };
    });

    const allEvents = [...eventsResult, ...customEvents];

    const events = allEvents.map(event => ({
      id: `${event.event_type}-${event.id}`,
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time,
      type: event.event_type,
      course: event.course_id ? {
        id: event.course_id,
        title: event.course_title,
        category: event.course_category
      } : null,
      status: event.status
    }));

    res.json(events);
  } catch (error) {
    console.error('Error fetching events for date:', error);
    res.status(500).json({ error: 'Failed to fetch events for specified date' });
  }
});

// GET /api/calendar/upcoming - Get upcoming events (next 7 days)
app.get('/api/calendar/upcoming', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();

    const upcomingResult = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const assignmentsSnap = await db.collection('assignments').where('course_id', '==', e.course_id).where('due_date', '>=', firebase.firestore.Timestamp.fromDate(now)).where('due_date', '<=', firebase.firestore.Timestamp.fromDate(sevenDaysLater)).orderBy('due_date').limit(10).get();
      for (const aDoc of assignmentsSnap.docs) {
        const a = aDoc.data();
        const submissionSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
        let status = 'pending';
        if (!submissionSnap.empty) {
          if (submissionSnap.docs[0].data().status === 'graded') status = 'completed';
        } else if (a.due_date.toDate() < new Date()) {
          status = 'overdue';
        }
        const courseDoc = await db.collection('courses').doc(e.course_id).get();
        const c = courseDoc.data();
        upcomingResult.push({
          event_type: 'assignment',
          id: aDoc.id,
          title: a.title,
          description: a.description,
          date: a.due_date,
          time: null,
          course_id: e.course_id,
          course_title: c.title,
          course_category: c.category,
          status
        });
      }
    }

    // Try to get upcoming custom events
    const customResult = await db.collection('custom_calendar_events').where('user_id', '==', userId).where('event_date', '>=', firebase.firestore.Timestamp.fromDate(now)).where('event_date', '<=', firebase.firestore.Timestamp.fromDate(sevenDaysLater)).orderBy('event_date').limit(5).get();

    const customUpcoming = customResult.docs.map(doc => {
      const event = doc.data();
      return {
        event_type: 'custom',
        id: doc.id,
        title: event.title,
        description: event.description,
        date: event.event_date,
        time: event.event_time,
        course_id: null,
        course_title: null,
        course_category: null,
        status: 'pending'
      };
    });

    const allUpcoming = [...upcomingResult, ...customUpcoming];

    const upcomingEvents = allUpcoming.map(event => ({
      id: `${event.event_type}-${event.id}`,
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time,
      type: event.event_type,
      course: event.course_id ? {
        id: event.course_id,
        title: event.course_title,
        category: event.course_category
      } : null,
      status: event.status,
      color: event.status === 'completed' ? 'green' :
        event.status === 'overdue' ? 'red' :
          event.event_type === 'custom' ? 'purple' : 'orange'
    }));

    res.json(upcomingEvents);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// GET /api/calendar/stats - Get calendar statistics
app.get('/api/calendar/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).get();

    let pendingAssignments = 0;
    let completedAssignments = 0;
    let overdueAssignments = 0;
    let activeCourses = 0;
    let completedCourses = 0;

    enrollmentsSnap.docs.forEach(doc => {
      const e = doc.data();
      if (e.status === 'active') activeCourses++;
      if (e.status === 'completed') completedCourses++;
    });

    const assignmentsSnap = await db.collection('assignments').get(); // Inefficient, but since no join, fetch all and filter

    for (const aDoc of assignmentsSnap.docs) {
      const a = aDoc.data();
      // Check if user is enrolled in the course
      const enrollment = await db.collection('enrollments').where('user_id', '==', userId).where('course_id', '==', a.course_id).where('status', '==', 'active').get();
      if (!enrollment.empty) {
        const submission = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
        if (!submission.empty) {
          if (submission.docs[0].data().status === 'graded') completedAssignments++;
          else pendingAssignments++;
        } else {
          if (a.due_date.toDate() < new Date()) overdueAssignments++;
          else pendingAssignments++;
        }
      }
    }

    res.json({
      pending_assignments: pendingAssignments,
      completed_assignments: completedAssignments,
      overdue_assignments: overdueAssignments,
      active_courses: activeCourses,
      completed_courses: completedCourses,
      total_assignments: pendingAssignments + completedAssignments + overdueAssignments
    });
  } catch (error) {
    console.error('Error fetching calendar stats:', error);
    res.status(500).json({ error: 'Failed to fetch calendar statistics' });
  }
});

// GET /api/assignments/my-assignments - Get user's assignments (for calendar frontend)
app.get('/api/assignments/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollmentsSnap = await db.collection('enrollments').where('user_id', '==', userId).where('status', '==', 'active').get();

    const assignments = [];
    for (const doc of enrollmentsSnap.docs) {
      const e = doc.data();
      const assSnap = await db.collection('assignments').where('course_id', '==', e.course_id).orderBy('due_date').get();
      for (const aDoc of assSnap.docs) {
        const a = aDoc.data();
        const courseDoc = await db.collection('courses').doc(e.course_id).get();
        const c = courseDoc.data();
        const subSnap = await db.collection('assignment_submissions').where('assignment_id', '==', aDoc.id).where('user_id', '==', userId).get();
        let submission = null;
        if (!subSnap.empty) {
          submission = subSnap.docs[0].data();
          submission.id = subSnap.docs[0].id;
        }
        assignments.push({
          id: aDoc.id,
          course_id: e.course_id,
          title: a.title,
          description: a.description,
          due_date: a.due_date,
          max_points: a.max_points,
          created_at: a.created_at,
          course: {
            id: e.course_id,
            title: c.title,
            category: c.category
          },
          submission
        });
      }
    }

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// POST /api/calendar/events - Create a custom calendar event
app.post('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, date, time, type = 'custom' } = req.body;

    // Validate required fields
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const eventRef = db.collection('custom_calendar_events').doc();
    await eventRef.set({
      user_id: userId,
      title,
      description,
      event_date: new Date(date),
      event_time: time,
      event_type: type,
      created_at: firebase.firestore.Timestamp.now(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.status(201).json({
      id: eventRef.id,
      title,
      description,
      date,
      time,
      type,
      message: 'Calendar event created successfully'
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// PUT /api/calendar/events/:id - Update a custom calendar event
app.put('/api/calendar/events/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, date, time, type } = req.body;

    // Check if event exists and belongs to user
    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists || eventDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    await db.collection('custom_calendar_events').doc(id).update({
      title,
      description,
      event_date: new Date(date),
      event_time: time,
      event_type: type,
      updated_at: firebase.firestore.Timestamp.now()
    });

    res.json({ message: 'Calendar event updated successfully' });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

// DELETE /api/calendar/events/:id - Delete a custom calendar event
app.delete('/api/calendar/events/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const eventDoc = await db.collection('custom_calendar_events').doc(id).get();

    if (!eventDoc.exists || eventDoc.data().user_id !== userId) {
      return res.status(404).json({ error: 'Calendar event not found or unauthorized' });
    }

    await db.collection('custom_calendar_events').doc(id).delete();

    res.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

// GET /api/auth/me - Get current user info (for calendar frontend)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: req.user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      account_type: user.account_type,
      profile_image: user.profile_image,
      company: user.company,
      website: user.website,
      bio: user.bio,
      is_active: user.is_active,
      email_verified: user.email_verified,
      created_at: user.created_at,
      last_login: user.last_login
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});