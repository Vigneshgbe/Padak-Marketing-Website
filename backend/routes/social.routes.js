// routes/social.routes.js
const express = require('express');
const firebase = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const { db } = require('../config/firebase.js');
const { authenticateToken, getUserConnections } = require('../middleware/auth.js');
const { socialUpload } = require('../cofig/multer.js');
const { getFullImageUrl, timestampToISO } = require('../config/firebase.js');

const app = express();

// --- GET All Posts (with Pagination, Likes, Comments, etc.) ---
app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  try {
    console.log(`Fetching posts for user ${userId}, page ${page}`);

    // Get user's connections
    const connections = await getUserConnections(userId);
    console.log(`User has ${connections.length} connections`);

    // Fetch all posts from social_activities collection
    // Note: If you get index errors, create the index in Firebase Console
    let allPostsSnap;
    try {
      allPostsSnap = await db.collection('social_activities')
        .where('activity_type', '==', 'post')
        .orderBy('created_at', 'desc')
        .get();
    } catch (indexError) {
      console.log('Index not found, fetching without orderBy:', indexError.message);
      // Fallback: fetch without orderBy if index doesn't exist yet
      allPostsSnap = await db.collection('social_activities')
        .where('activity_type', '==', 'post')
        .get();
    }

    console.log(`Found ${allPostsSnap.size} total posts`);

    // Filter posts based on visibility
    const visiblePosts = [];
    
    allPostsSnap.forEach(doc => {
      const post = doc.data();
      const postId = doc.id;
      
      // Check visibility rules
      const isPublic = !post.visibility || post.visibility === 'public';
      const isOwnPost = post.user_id === userId;
      const isConnectionPost = post.visibility === 'connections' && 
                              (isOwnPost || connections.includes(post.user_id));
      const isPrivate = post.visibility === 'private' && isOwnPost;

      if (isPublic || isConnectionPost || isPrivate) {
        visiblePosts.push({ id: postId, ...post });
      }
    });

    // Sort posts manually by created_at if orderBy wasn't used
    visiblePosts.sort((a, b) => {
      const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at || 0);
      const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at || 0);
      return dateB - dateA; // Descending order (newest first)
    });

    console.log(`${visiblePosts.length} posts visible to user`);

    // Calculate pagination
    const totalPosts = visiblePosts.length;
    const totalPages = Math.ceil(totalPosts / limit);
    
    // Get paginated posts
    const paginatedPosts = visiblePosts.slice(offset, offset + limit);

    // Enrich posts with user data, likes, comments, etc.
    const enrichedPosts = await Promise.all(
      paginatedPosts.map(async (post) => {
        try {
          // Get user data
          let userData = null;
          if (post.user_id) {
            try {
              const userDoc = await db.collection('users').doc(post.user_id).get();
              if (userDoc.exists) {
                const u = userDoc.data();
                userData = {
                  id: post.user_id,
                  first_name: u.first_name || '',
                  last_name: u.last_name || '',
                  profile_image: getFullImageUrl(req, u.profile_image),
                  account_type: u.account_type || 'student'
                };
              }
            } catch (userError) {
              console.error(`Error fetching user ${post.user_id}:`, userError.message);
            }
          }

          // Fetch ALL activities related to this post in ONE query
          // This avoids complex composite indexes
          let allActivities = [];
          try {
            const activitiesSnap = await db.collection('social_activities')
              .where('target_id', '==', post.id)
              .get();
            
            allActivities = activitiesSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          } catch (activitiesError) {
            console.log(`Could not fetch activities for post ${post.id}:`, activitiesError.message);
          }

          // Filter activities by type in memory
          const likes = allActivities.filter(a => a.activity_type === 'like');
          const userLikes = likes.filter(a => a.user_id === userId);
          const bookmarks = allActivities.filter(a => a.activity_type === 'bookmark' && a.user_id === userId);
          const commentActivities = allActivities.filter(a => a.activity_type === 'comment');

          // Get comment user data
          const comments = await Promise.all(
            commentActivities.map(async (comment) => {
              let commentUser = null;
              
              if (comment.user_id) {
                try {
                  const commentUserDoc = await db.collection('users').doc(comment.user_id).get();
                  if (commentUserDoc.exists) {
                    const cu = commentUserDoc.data();
                    commentUser = {
                      id: comment.user_id,
                      first_name: cu.first_name || '',
                      last_name: cu.last_name || '',
                      profile_image: getFullImageUrl(req, cu.profile_image),
                      account_type: cu.account_type || 'student'
                    };
                  }
                } catch (userError) {
                  console.error(`Error fetching comment user:`, userError.message);
                }
              }

              return {
                id: comment.id,
                content: comment.content || '',
                created_at: timestampToISO(comment.created_at),
                user: commentUser
              };
            })
          );

          // Sort comments by date manually (oldest first)
          comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

          return {
            id: post.id,
            user_id: post.user_id,
            activity_type: post.activity_type,
            content: post.content || '',
            image_url: getFullImageUrl(req, post.image_url),
            target_id: post.target_id || null,
            created_at: timestampToISO(post.created_at),
            updated_at: timestampToISO(post.updated_at || post.created_at),
            visibility: post.visibility || 'public',
            achievement: post.achievement || false,
            share_count: post.share_count || 0,
            likes: likes.length,
            has_liked: userLikes.length > 0,
            has_bookmarked: bookmarks.length > 0,
            comment_count: comments.length,
            user: userData,
            comments: comments
          };
        } catch (error) {
          console.error(`Error enriching post ${post.id}:`, error);
          return null;
        }
      })
    );

    // Filter out null posts
    const validPosts = enrichedPosts.filter(post => post !== null);

    console.log(`Returning ${validPosts.length} enriched posts`);

    res.json({
      posts: validPosts,
      pagination: {
        page,
        totalPages,
        totalPosts
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    res.status(500).json({
      error: 'Failed to fetch posts.',
      message: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// --- POST a new post ---
app.post('/api/posts', authenticateToken, (req, res) => {
  socialUpload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const { content, achievement, visibility } = req.body;
      const userId = req.user.id;

      console.log('Creating post:', { userId, content: content?.substring(0, 50), hasImage: !!req.file });

      // Validation
      if (!content && !req.file) {
        return res.status(400).json({ error: 'Post must have content or an image.' });
      }

      const imageUrl = req.file ? `/uploads/social/${req.file.filename}` : null;
      const isAchievement = achievement === 'true' || achievement === true;
      const postVisibility = visibility || 'public';

      // Create new post document
      const postRef = db.collection('social_activities').doc();
      const postData = {
        user_id: userId,
        activity_type: 'post',
        content: content || '',
        image_url: imageUrl,
        achievement: isAchievement,
        visibility: postVisibility,
        created_at: firebase.firestore.Timestamp.now(),
        updated_at: firebase.firestore.Timestamp.now(),
        share_count: 0
      };

      await postRef.set(postData);

      console.log('Post created successfully:', postRef.id);

      // Get user data for response
      const userDoc = await db.collection('users').doc(userId).get();
      let userData = null;
      
      if (userDoc.exists) {
        const u = userDoc.data();
        userData = {
          id: userId,
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          profile_image: getFullImageUrl(req, u.profile_image),
          account_type: u.account_type || 'student'
        };
      }

      // Return the created post
      res.status(201).json({
        id: postRef.id,
        user_id: userId,
        activity_type: 'post',
        content: postData.content,
        image_url: getFullImageUrl(req, postData.image_url),
        achievement: postData.achievement,
        visibility: postData.visibility,
        created_at: timestampToISO(postData.created_at),
        updated_at: timestampToISO(postData.updated_at),
        share_count: 0,
        has_liked: false,
        has_bookmarked: false,
        likes: 0,
        comment_count: 0,
        user: userData,
        comments: []
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({
        error: 'Failed to create post.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
});

// --- PUT (edit) a post ---
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Content cannot be empty.' });
  }

  try {
    console.log(`Editing post ${id} by user ${userId}`);

    const postRef = db.collection('social_activities').doc(id);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = postDoc.data();

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    await postRef.update({
      content: content.trim(),
      updated_at: firebase.firestore.Timestamp.now()
    });

    console.log('Post updated successfully');

    res.json({ message: 'Post updated successfully.' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      error: 'Failed to update post.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- DELETE a post ---
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    console.log(`Deleting post ${id} by user ${userId}`);

    const postRef = db.collection('social_activities').doc(id);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = postDoc.data();

    if (post.user_id !== userId && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    // Delete the post
    await postRef.delete();

    // Delete associated image file if exists
    if (post.image_url && !post.image_url.startsWith('http')) {
      const imagePath = path.join(__dirname, post.image_url.replace(/^\//, ''));
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log('Post image deleted:', imagePath);
        } catch (fileError) {
          console.error("Error deleting post image:", fileError);
        }
      }
    }

    // Delete associated likes
    const likesSnap = await db.collection('social_activities')
      .where('activity_type', '==', 'like')
      .where('target_id', '==', id)
      .get();
    
    const likeDeletions = likesSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(likeDeletions);

    // Delete associated comments
    const commentsSnap = await db.collection('social_activities')
      .where('activity_type', '==', 'comment')
      .where('target_id', '==', id)
      .get();
    
    const commentDeletions = commentsSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(commentDeletions);

    // Delete associated bookmarks
    const bookmarksSnap = await db.collection('social_activities')
      .where('activity_type', '==', 'bookmark')
      .where('target_id', '==', id)
      .get();
    
    const bookmarkDeletions = bookmarksSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(bookmarkDeletions);

    console.log('Post and associated data deleted successfully');

    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      error: 'Failed to delete post.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- POST a comment on a post ---
app.post('/api/posts/:id/comment', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Comment cannot be empty.' });
  }

  try {
    console.log(`Adding comment to post ${targetId} by user ${userId}`);

    // Check if post exists
    const postDoc = await db.collection('social_activities').doc(targetId).get();
    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Create comment
    const commentRef = db.collection('social_activities').doc();
    const commentData = {
      user_id: userId,
      activity_type: 'comment',
      content: content.trim(),
      target_id: targetId,
      created_at: firebase.firestore.Timestamp.now()
    };

    await commentRef.set(commentData);

    console.log('Comment created successfully:', commentRef.id);

    // Get user data for response
    const userDoc = await db.collection('users').doc(userId).get();
    let userData = null;
    
    if (userDoc.exists) {
      const u = userDoc.data();
      userData = {
        id: userId,
        first_name: u.first_name || '',
        last_name: u.last_name || '',
        profile_image: getFullImageUrl(req, u.profile_image),
        account_type: u.account_type || 'student'
      };
    }

    // Return the created comment
    res.status(201).json({
      id: commentRef.id,
      content: commentData.content,
      created_at: timestampToISO(commentData.created_at),
      user: userData
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({
      error: 'Failed to post comment.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- POST (like) a post ---
app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    console.log(`User ${userId} liking post ${targetId}`);

    // Check if already liked
    const existingLikeSnap = await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'like')
      .where('target_id', '==', targetId)
      .get();

    if (!existingLikeSnap.empty) {
      return res.status(400).json({ error: 'Post already liked.' });
    }

    // Create like
    const likeRef = db.collection('social_activities').doc();
    await likeRef.set({
      user_id: userId,
      activity_type: 'like',
      target_id: targetId,
      created_at: firebase.firestore.Timestamp.now()
    });

    console.log('Post liked successfully');

    res.status(201).json({ message: 'Post liked.' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({
      error: 'Failed to like post.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- DELETE (unlike) a post ---
app.delete('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    console.log(`User ${userId} unliking post ${targetId}`);

    const likeSnap = await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'like')
      .where('target_id', '==', targetId)
      .get();

    if (likeSnap.empty) {
      return res.status(404).json({ error: 'Like not found' });
    }

    // Delete all matching likes (should be only one)
    const deletions = likeSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(deletions);

    console.log('Post unliked successfully');

    res.json({ message: 'Post unliked.' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({
      error: 'Failed to unlike post.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- POST (bookmark) a post ---
app.post('/api/posts/:id/bookmark', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    console.log(`User ${userId} bookmarking post ${targetId}`);

    // Check if already bookmarked
    const existingBookmarkSnap = await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'bookmark')
      .where('target_id', '==', targetId)
      .get();

    if (!existingBookmarkSnap.empty) {
      return res.status(400).json({ error: 'Post already bookmarked.' });
    }

    // Create bookmark
    const bookmarkRef = db.collection('social_activities').doc();
    await bookmarkRef.set({
      user_id: userId,
      activity_type: 'bookmark',
      target_id: targetId,
      created_at: firebase.firestore.Timestamp.now()
    });

    console.log('Post bookmarked successfully');

    res.status(201).json({ message: 'Post bookmarked.' });
  } catch (error) {
    console.error('Error bookmarking post:', error);
    res.status(500).json({
      error: 'Failed to bookmark post.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- DELETE (unbookmark) a post ---
app.delete('/api/posts/:id/bookmark', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  try {
    console.log(`User ${userId} unbookmarking post ${targetId}`);

    const bookmarkSnap = await db.collection('social_activities')
      .where('user_id', '==', userId)
      .where('activity_type', '==', 'bookmark')
      .where('target_id', '==', targetId)
      .get();

    if (bookmarkSnap.empty) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    // Delete all matching bookmarks (should be only one)
    const deletions = bookmarkSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(deletions);

    console.log('Post unbookmarked successfully');

    res.json({ message: 'Post unbookmarked.' });
  } catch (error) {
    console.error('Error unbookmarking post:', error);
    res.status(500).json({
      error: 'Failed to unbookmark post.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- POST (track) a share ---
app.post('/api/posts/:id/share', authenticateToken, async (req, res) => {
  const postId = req.params.id;

  try {
    console.log(`Tracking share for post ${postId}`);

    const postRef = db.collection('social_activities').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    await postRef.update({
      share_count: firebase.firestore.FieldValue.increment(1)
    });

    console.log('Share tracked successfully');

    res.json({ message: 'Share tracked.' });
  } catch (error) {
    console.error('Error tracking share:', error);
    res.status(500).json({
      error: 'Failed to track share.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
