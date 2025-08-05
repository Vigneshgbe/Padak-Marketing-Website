import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Heart, Share2, Bookmark, MoreHorizontal, 
  Send, Image as ImageIcon, X, Loader2, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../../hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';

interface SocialActivity {
  id: number;
  user_id: number;
  activity_type: string;
  content: string;
  image_url: string | null;
  target_id: number | null;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    profile_image: string | null;
    account_type: string;
  };
  comments?: SocialActivity[];
  likes?: number;
  has_liked?: boolean;
  has_bookmarked?: boolean;
  comment_count?: number;
}

const SocialFeed: React.FC = () => {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState<{[key: number]: string}>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/social', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPosts();
  }, [token]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedImage) return;

    const formData = new FormData();
    formData.append('content', newPostContent);
    if (selectedImage) formData.append('image', selectedImage);

    try {
      const response = await fetch('http://localhost:5000/api/social', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to create post');
      const newPost = await response.json();
      
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setSelectedImage(null);
      setImagePreview(null);
    } catch (err) {
      setError('Failed to create post. Please try again.');
    }
  };

  const handleEngagement = async (postId: number, type: string, content = '') => {
    try {
      const response = await fetch(`http://localhost:5000/api/social/${postId}/engagement`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, content })
      });

      if (!response.ok) throw new Error('Failed to process engagement');
      const result = await response.json();

      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id !== postId) return post;
        
        const updatedPost = { ...post };
        
        switch (type) {
          case 'like':
            updatedPost.likes = result.action === 'removed' 
              ? (post.likes || 0) - 1 
              : (post.likes || 0) + 1;
            updatedPost.has_liked = result.action !== 'removed';
            break;
            
          case 'bookmark':
            updatedPost.has_bookmarked = result.action !== 'removed';
            break;
            
          case 'comment':
            if (result.action !== 'removed' && result.user) {
              updatedPost.comments = [
                ...(post.comments || []),
                {
                  ...result,
                  activity_type: 'comment',
                  user: result.user
                }
              ];
              updatedPost.comment_count = (post.comment_count || 0) + 1;
            }
            break;
        }
        
        return updatedPost;
      }));
      
      // Clear comment input
      if (type === 'comment' && result.action !== 'removed') {
        setNewCommentContent(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      setError('Failed to process engagement. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Create Post Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {user?.profile_image ? (
              <img 
                src={user.profile_image} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover" 
              />
            ) : (
              <div className="bg-gray-200 dark:bg-gray-700 border-2 border-dashed rounded-full w-10 h-10 flex items-center justify-center">
                <span className="text-lg font-semibold text-gray-400">
                  {user?.first_name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share something with your network..."
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none min-h-[100px]"
            />
            
            {imagePreview && (
              <div className="mt-3 relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="rounded-lg max-h-80 object-contain mx-auto"
                />
                <button 
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 rounded-full p-1 text-white"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <label className="cursor-pointer text-gray-500 hover:text-orange-500 transition-colors">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
                <ImageIcon size={20} />
              </label>
              
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() && !selectedImage}
                className={`px-4 py-2 rounded-full font-medium ${
                  newPostContent.trim() || selectedImage
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto text-orange-400 mb-4" />
            <p className="text-lg">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              {/* Post Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {post.user?.profile_image ? (
                      <img 
                        src={post.user.profile_image} 
                        alt={post.user.first_name} 
                        className="w-10 h-10 rounded-full object-cover" 
                      />
                    ) : (
                      <div className="bg-gray-200 dark:bg-gray-700 border-2 border-dashed rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-400">
                          {post.user?.first_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {post.user?.first_name} {post.user?.last_name}
                      {post.user?.account_type === 'admin' && (
                        <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                          Admin
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(post.created_at))} ago
                    </p>
                  </div>
                </div>
                
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              
              {/* Post Content */}
              <div className="p-4">
                <p className="text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-line">
                  {post.content}
                </p>
                
                {post.image_url && (
                  <div className="my-3 rounded-lg overflow-hidden">
                    <img 
                      src={post.image_url} 
                      alt="Post content" 
                      className="w-full max-h-96 object-contain"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between text-gray-500 text-sm mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <Heart className={`${post.has_liked ? 'fill-red-500 text-red-500' : ''}`} size={16} />
                      <span>{post.likes || 0}</span>
                    </div>
                    <span>{post.comment_count || 0} comments</span>
                  </div>
                </div>
              </div>
              
              {/* Post Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 grid grid-cols-3">
                <button
                  onClick={() => handleEngagement(post.id, 'like')}
                  className={`py-3 flex items-center justify-center space-x-2 text-sm font-medium ${
                    post.has_liked 
                      ? 'text-red-500' 
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Heart className={post.has_liked ? 'fill-red-500' : ''} size={18} />
                  <span>Like</span>
                </button>
                
                <button
                  onClick={() => document.getElementById(`comment-input-${post.id}`)?.focus()}
                  className="py-3 flex items-center justify-center space-x-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium"
                >
                  <MessageSquare size={18} />
                  <span>Comment</span>
                </button>
                
                <button
                  onClick={() => handleEngagement(post.id, 'bookmark')}
                  className={`py-3 flex items-center justify-center space-x-2 text-sm font-medium ${
                    post.has_bookmarked 
                      ? 'text-orange-500' 
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Bookmark className={post.has_bookmarked ? 'fill-orange-500' : ''} size={18} />
                  <span>Save</span>
                </button>
              </div>
              
              {/* Comments Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto pr-2">
                  {(post.comments || []).map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {comment.user?.profile_image ? (
                          <img 
                            src={comment.user.profile_image} 
                            alt={comment.user.first_name} 
                            className="w-8 h-8 rounded-full object-cover" 
                          />
                        ) : (
                          <div className="bg-gray-200 dark:bg-gray-700 border-2 border-dashed rounded-full w-8 h-8 flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-400">
                              {comment.user?.first_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2 flex-1">
                        <div className="flex items-baseline">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {comment.user?.first_name} {comment.user?.last_name}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {formatDistanceToNow(new Date(comment.created_at))} ago
                          </span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 text-sm mt-1">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center space-x-2">
                  {user?.profile_image ? (
                    <img 
                      src={user.profile_image} 
                      alt="Your profile" 
                      className="w-8 h-8 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="bg-gray-200 dark:bg-gray-700 border-2 border-dashed rounded-full w-8 h-8 flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-400">
                        {user?.first_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1 flex bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <input
                      id={`comment-input-${post.id}`}
                      type="text"
                      value={newCommentContent[post.id] || ''}
                      onChange={(e) => setNewCommentContent({
                        ...newCommentContent,
                        [post.id]: e.target.value
                      })}
                      placeholder="Write a comment..."
                      className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleEngagement(post.id, 'comment', newCommentContent[post.id]);
                        }
                      }}
                    />
                    
                    <button
                      onClick={() => handleEngagement(post.id, 'comment', newCommentContent[post.id])}
                      disabled={!newCommentContent[post.id]?.trim()}
                      className={`px-3 ${
                        newCommentContent[post.id]?.trim()
                          ? 'text-orange-500 hover:text-orange-600'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SocialFeed;