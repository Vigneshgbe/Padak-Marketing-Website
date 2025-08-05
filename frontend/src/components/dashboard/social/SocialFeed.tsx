// src/components/dashboard/social/SocialFeed.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Heart, Share2, Bookmark, MoreVertical,
  Send, Image as ImageIcon, X, Loader2, AlertCircle, BadgeCheck,
  Edit2, Trash2, Plus, Camera, Smile, Hash, AtSign, ChevronDown,
  Globe, Lock, Users, Check
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
  updated_at?: string;
  visibility?: 'public' | 'connections' | 'private';
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
  share_count?: number;
  achievement?: boolean;
}

const SocialFeed: React.FC = () => {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState<{ [key: number]: string }>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAchievement, setIsAchievement] = useState(false);
  const [postVisibility, setPostVisibility] = useState<'public' | 'connections' | 'private'>('public');
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const createPostRef = useRef<HTMLDivElement>(null);

  // Common emojis for quick access
  const commonEmojis = ['😊', '❤️', '👍', '🎉', '🔥', '💪', '🙌', '✨', '🚀', '💯'];

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see this' },
    { value: 'connections', label: 'Connections', icon: Users, description: 'Only your connections' },
    { value: 'private', label: 'Only Me', icon: Lock, description: 'Private post' }
  ];

  const fetchPosts = async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await fetch(`http://localhost:5000/api/posts?page=${pageNum}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }

      setHasMore(data.pagination.page < data.pagination.totalPages);
      setPage(pageNum);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (token) fetchPosts(1);
  }, [token]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current || loadingMore || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        fetchPosts(page + 1);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [page, loadingMore, hasMore]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showDropdown && !(e.target as Element).closest('.post-dropdown')) {
        setShowDropdown(null);
      }
      if (showVisibilityDropdown && !(e.target as Element).closest('.visibility-dropdown')) {
        setShowVisibilityDropdown(false);
      }
      if (showEmojiPicker && !(e.target as Element).closest('.emoji-picker')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown, showVisibilityDropdown, showEmojiPicker]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedImage) return;

    setIsPosting(true);
    const formData = new FormData();
    formData.append('content', newPostContent);
    formData.append('achievement', String(isAchievement));
    formData.append('visibility', postVisibility);
    if (selectedImage) formData.append('image', selectedImage);

    try {
      const response = await fetch('http://localhost:5000/api/posts', {
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
      setIsAchievement(false);
      setPostVisibility('public');
      setShowCreatePost(false);
    } catch (err) {
      setError('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleEditPost = async (postId: number) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editContent })
      });

      if (!response.ok) throw new Error('Failed to edit post');

      setPosts(posts.map(post =>
        post.id === postId ? { ...post, content: editContent, updated_at: new Date().toISOString() } : post
      ));
      setEditingPost(null);
      setEditContent('');
    } catch (err) {
      setError('Failed to edit post. Please try again.');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete post');

      setPosts(posts.filter(post => post.id !== postId));
      setShowDropdown(null);
    } catch (err) {
      setError('Failed to delete post. Please try again.');
    }
  };

  const handleEngagement = async (postId: number, type: string, content = '') => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/${type}`, {
        method: type === 'like' || type === 'bookmark' ?
          (posts.find(p => p.id === postId)?.[`has_${type}d`] ? 'DELETE' : 'POST') :
          'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: type === 'comment' ? JSON.stringify({ content }) : undefined
      });

      if (!response.ok) throw new Error(`Failed to ${type}`);

      if (type === 'comment') {
        const newComment = await response.json();
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...(post.comments || []), newComment],
              comment_count: (post.comment_count || 0) + 1
            };
          }
          return post;
        }));
        setNewCommentContent({ ...newCommentContent, [postId]: '' });
      } else {
        setPosts(posts.map(post => {
          if (post.id === postId) {
            if (type === 'like') {
              return {
                ...post,
                has_liked: !post.has_liked,
                likes: post.has_liked ? (post.likes || 0) - 1 : (post.likes || 0) + 1
              };
            } else if (type === 'bookmark') {
              return {
                ...post,
                has_bookmarked: !post.has_bookmarked
              };
            }
          }
          return post;
        }));
      }
    } catch (err) {
      setError(`Failed to ${type}. Please try again.`);
    }
  };

  const handleShare = async (postId: number) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
      alert('Post link copied to clipboard!');

      // Track share
      await fetch(`http://localhost:5000/api/posts/${postId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setPosts(posts.map(post =>
        post.id === postId ? { ...post, share_count: (post.share_count || 0) + 1 } : post
      ));
    } catch (err) {
      setError('Failed to share post.');
    }
  };

  const insertEmoji = (emoji: string) => {
    setNewPostContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" ref={scrollContainerRef}>
      {/* Floating Create Post Button */}
      {!showCreatePost && (
        <button
          onClick={() => setShowCreatePost(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Create Post Modal/Card */}
      {showCreatePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div
            ref={createPostRef}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Post</h3>
              <button
                onClick={() => {
                  setShowCreatePost(false);
                  setNewPostContent('');
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* User Info */}
              <div className="flex items-center space-x-3 mb-4">
                {user?.profileImage ? (
                  <img
                    src={getImageUrl(user.profileImage)}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-100"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                      className="visibility-dropdown relative flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      {visibilityOptions.find(opt => opt.value === postVisibility)?.icon &&
                        React.createElement(visibilityOptions.find(opt => opt.value === postVisibility)!.icon, { size: 14 })
                      }
                      <span>{visibilityOptions.find(opt => opt.value === postVisibility)?.label}</span>
                      <ChevronDown size={14} />
                    </button>

                    {showVisibilityDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-50 w-48">
                        {visibilityOptions.map(option => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setPostVisibility(option.value as any);
                              setShowVisibilityDropdown(false);
                            }}
                            className="w-full px-4 py-2 flex items-start space-x-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <option.icon size={16} className="mt-0.5 text-gray-600 dark:text-gray-400" />
                            <div className="text-left">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {option.label}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {option.description}
                              </div>
                            </div>
                            {postVisibility === option.value && (
                              <Check size={16} className="ml-auto text-orange-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Area */}
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-0 border-0 focus:ring-0 resize-none text-gray-900 dark:text-white bg-transparent placeholder-gray-400 text-lg"
                rows={5}
                autoFocus
              />

              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-4 relative rounded-xl overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              {/* Achievement Badge */}
              {isAchievement && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                    <BadgeCheck size={20} />
                    <span className="text-sm font-medium">This will be marked as an achievement</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                  >
                    <Camera size={20} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="emoji-picker p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors relative"
                  >
                    <Smile size={20} />

                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-5 gap-1">
                          {commonEmojis.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => insertEmoji(emoji)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors text-xl"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setIsAchievement(!isAchievement)}
                    className={`p-2 rounded-lg transition-colors ${isAchievement
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    <BadgeCheck size={20} />
                  </button>
                </div>

                <button
                  onClick={handleCreatePost}
                  disabled={(!newPostContent.trim() && !selectedImage) || isPosting}
                  className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${newPostContent.trim() || selectedImage
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg transform hover:scale-105'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  {isPosting ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Posting...</span>
                    </div>
                  ) : (
                    'Post'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2 text-red-700 dark:text-red-400">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
              <MessageSquare size={40} className="text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No posts yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Be the first to share something with your network!
            </p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Create First Post
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${post.achievement ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-900' : ''
                }`}
            >
              {/* Post Header */}
              <div className="p-4 flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {post.user?.profile_image ? (
                    <img
                      src={getImageUrl(post.user.profile_image)}
                      alt={post.user.first_name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold">
                      {post.user?.first_name?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {post.user?.first_name} {post.user?.last_name}
                      </h3>
                      {post.user?.account_type === 'admin' && (
                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full font-medium">
                          Admin
                        </span>
                      )}
                      {post.achievement && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium flex items-center space-x-1">
                          <BadgeCheck size={12} />
                          <span>Achievement</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
                      {post.updated_at && post.updated_at !== post.created_at && (
                        <>
                          <span>•</span>
                          <span>edited</span>
                        </>
                      )}
                      {post.visibility && post.visibility !== 'public' && (
                        <>
                          <span>•</span>
                          {post.visibility === 'connections' ? <Users size={12} /> : <Lock size={12} />}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {post.user_id === user?.id && (
                  <div className="post-dropdown relative">
                    <button
                      onClick={() => setShowDropdown(showDropdown === post.id ? null : post.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                      <MoreVertical size={20} />
                    </button>

                    {showDropdown === post.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-50">
                        <button
                          onClick={() => {
                            setEditingPost(post.id);
                            setEditContent(post.content);
                            setShowDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          <Edit2 size={16} />
                          <span>Edit Post</span>
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-red-600 dark:text-red-400"
                        >
                          <Trash2 size={16} />
                          <span>Delete Post</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Post Content */}
              <div className="px-4 pb-4">
                {editingPost === post.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setEditingPost(null);
                          setEditContent('');
                        }}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditPost(post.id)}
                        disabled={!editContent.trim()}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                    {post.content}
                  </p>
                )}

                {post.image_url && (
                  <div className="mt-3 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900">
                    <img
                      src={getImageUrl(post.image_url)}
                      alt="Post content"
                      className="w-full h-96 object-contain"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                )}
              </div>

              {/* Post Stats */}
              {(post.likes > 0 || post.comment_count > 0 || post.share_count > 0) && (
                <div className="px-4 pb-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    {post.likes > 0 && (
                      <span className="flex items-center space-x-1">
                        <div className="flex -space-x-1">
                          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                            <Heart size={12} className="text-white fill-white" />
                          </div>
                        </div>
                        <span>{post.likes}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    {post.comment_count > 0 && (
                      <span>{post.comment_count} comment{post.comment_count > 1 ? 's' : ''}</span>
                    )}
                    {post.share_count > 0 && (
                      <span>{post.share_count} share{post.share_count > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Post Actions */}
              <div className="border-t border-gray-100 dark:border-gray-700 px-2 py-1 flex items-center justify-around">
                <button
                  onClick={() => handleEngagement(post.id, 'like')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors ${post.has_liked
                      ? 'text-red-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                  <Heart size={20} className={post.has_liked ? 'fill-red-500' : ''} />
                  <span className="text-sm font-medium">Like</span>
                </button>

                <button
                  onClick={() => {
                    const input = document.getElementById(`comment-${post.id}`) as HTMLInputElement;
                    input?.focus();
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <MessageSquare size={20} />
                  <span className="text-sm font-medium">Comment</span>
                </button>

                <button
                  onClick={() => handleShare(post.id)}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <Share2 size={20} />
                  <span className="text-sm font-medium">Share</span>
                </button>

                <button
                  onClick={() => handleEngagement(post.id, 'bookmark')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors ${post.has_bookmarked
                      ? 'text-orange-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                  <Bookmark size={20} className={post.has_bookmarked ? 'fill-orange-500' : ''} />
                  <span className="text-sm font-medium">Save</span>
                </button>
              </div>

              {/* Comments Section */}
              {post.comments && post.comments.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        {comment.user?.profile_image ? (
                          <img
                            src={getImageUrl(comment.user.profile_image)}
                            alt={comment.user.first_name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {comment.user?.first_name?.charAt(0) || 'U'}
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
                            <div className="flex items-baseline space-x-2">
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                                {comment.user?.first_name} {comment.user?.last_name}
                              </h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(comment.created_at))} ago
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Comment */}
              <div className="border-t border-gray-100 dark:border-gray-700 p-4">
                <div className="flex space-x-3">
                  {user?.profileImage ? (
                    <img
                      src={getImageUrl(user.profileImage)}
                      alt="Your profile"
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {user?.firstName?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2">
                    <input
                      id={`comment-${post.id}`}
                      type="text"
                      value={newCommentContent[post.id] || ''}
                      onChange={(e) => setNewCommentContent({
                        ...newCommentContent,
                        [post.id]: e.target.value
                      })}
                      placeholder="Write a comment..."
                      className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && newCommentContent[post.id]?.trim()) {
                          e.preventDefault();
                          handleEngagement(post.id, 'comment', newCommentContent[post.id]);
                        }
                      }}
                    />

                    <button
                      onClick={() => handleEngagement(post.id, 'comment', newCommentContent[post.id])}
                      disabled={!newCommentContent[post.id]?.trim()}
                      className={`ml-2 p-1.5 rounded-full transition-colors ${newCommentContent[post.id]?.trim()
                          ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                          : 'text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Load More Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>You've reached the end of the feed</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialFeed;