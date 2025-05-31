
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Clock, User, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import CommentInput from './CommentInput';
import PostComments from './PostComments';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url?: string;
  parent_id?: string;
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface HashtagPostProps {
  post: {
    id: string;
    content: string;
    hashtags?: string[];
    hashtag?: string;
    created_at: string;
    image_url?: string;
    video_url?: string;
    likes_count: number;
    comments_count: number;
    user_id: string;
    profiles: {
      id: string;
      username: string;
      avatar_url?: string;
    };
  };
  onLike?: (postId: string) => void;
  onLikeChange?: () => void;
  isLiked?: boolean;
}

const HashtagPost: React.FC<HashtagPostProps> = ({ post, onLike, onLikeChange, isLiked = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.comments_count);
  const [showImageModal, setShowImageModal] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(post.likes_count);
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [isLiking, setIsLiking] = useState(false);

  // Check if we're on the hashtags page to determine comment display style
  const isHashtagsPage = location.pathname === '/hashtags' || location.pathname.startsWith('/hashtag/');

  // Check if post is liked by current user on component mount
  useEffect(() => {
    const checkIfLiked = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('hashtag_likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single();
        
        if (!error && data) {
          setLocalIsLiked(true);
        }
      } catch (error) {
        // No like found, which is fine
        setLocalIsLiked(false);
      }
    };

    checkIfLiked();
  }, [post.id, user]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}م`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}س`;
    return `${Math.floor(diffMins / 1440)}ي`;
  };

  const getAvatarGradient = () => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-yellow-500',
      'from-red-500 to-rose-500',
      'from-indigo-500 to-blue-500'
    ];
    const index = (post.user_id?.charCodeAt(0) || 0) % gradients.length;
    return gradients[index];
  };

  const handleProfileClick = () => {
    navigate(`/user-profile/${post.user_id}`);
  };

  const handleCommentProfileClick = (userId: string) => {
    navigate(`/user-profile/${userId}`);
  };

  const loadComments = async () => {
    if (isLoadingComments) return;
    
    setIsLoadingComments(true);
    try {
      console.log('Loading comments for post:', post.id);
      
      // First get all comments for this post
      const { data: commentsData, error: commentsError } = await supabase
        .from('hashtag_comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error loading comments:', commentsError);
        return;
      }

      console.log('Comments data:', commentsData);

      if (commentsData && commentsData.length > 0) {
        // Get unique user IDs from comments
        const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
        
        console.log('Fetching profiles for user IDs:', userIds);
        
        // Get profiles for these user IDs
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setComments([]);
          return;
        }

        console.log('Profiles data:', profilesData);

        // Combine comments with profiles
        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesData?.find(profile => profile.id === comment.user_id) || {
            id: comment.user_id,
            username: 'مستخدم مجهول',
            avatar_url: null
          }
        }));

        console.log('Comments with profiles:', commentsWithProfiles);
        const organizedComments = organizeComments(commentsWithProfiles);
        setComments(organizedComments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const organizeComments = (commentsData: any[]): Comment[] => {
    const commentMap = new Map();
    const rootComments: Comment[] = [];

    // First, create all comment objects
    commentsData.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Then, organize them into parent-child relationships
    commentsData.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return rootComments;
  };

  const handleCommentsToggle = async () => {
    if (isHashtagsPage) {
      // For hashtags page, show inline comments
      if (!showComments) {
        await loadComments();
      }
      setShowComments(!showComments);
    } else {
      // For other pages, show modal
      setShowComments(!showComments);
    }
  };

  const handleCommentAdded = async () => {
    if (isHashtagsPage) {
      await loadComments();
    }
    setLocalCommentsCount(prev => prev + 1);
  };

  const handleReply = (commentId: string, username: string) => {
    console.log('Reply to comment:', commentId, 'by', username);
  };

  const handleLike = async () => {
    if (!user || isLiking) {
      console.log('User not logged in or already liking');
      return;
    }

    console.log('Handling like for post:', post.id, 'Current liked state:', localIsLiked);
    setIsLiking(true);

    try {
      if (localIsLiked) {
        // Unlike
        console.log('Unliking post...');
        const { error } = await supabase
          .from('hashtag_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (!error) {
          console.log('Successfully unliked post');
          setLocalIsLiked(false);
          setLocalLikesCount(prev => Math.max(0, prev - 1));
          if (onLikeChange) onLikeChange();
        } else {
          console.error('Error unliking post:', error);
        }
      } else {
        // Like
        console.log('Liking post...');
        const { error } = await supabase
          .from('hashtag_likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });

        if (!error) {
          console.log('Successfully liked post');
          setLocalIsLiked(true);
          setLocalLikesCount(prev => prev + 1);
          if (onLikeChange) onLikeChange();
        } else {
          console.error('Error liking post:', error);
        }
      }
    } catch (error) {
      console.error('Error handling like:', error);
    } finally {
      setIsLiking(false);
    }

    if (onLike) {
      onLike(post.id);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'منشور من التطبيق',
        text: post.content,
        url: window.location.href
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      console.log('Link copied to clipboard');
    }
  };

  const displayHashtag = post.hashtag || (post.hashtags && post.hashtags[0]) || '';

  return (
    <>
      <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleProfileClick}
              className={`w-12 h-12 bg-gradient-to-br ${getAvatarGradient()} rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-200`}
            >
              {post.profiles?.avatar_url ? (
                <img 
                  src={post.profiles.avatar_url} 
                  alt={post.profiles.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={20} className="text-white" />
              )}
            </button>
            <div>
              <button
                onClick={handleProfileClick}
                className="font-semibold text-white hover:text-blue-400 transition-colors text-lg"
              >
                {post.profiles?.username || 'مستخدم مجهول'}
              </button>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock size={12} />
                <span>{formatTimestamp(post.created_at)}</span>
              </div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          {displayHashtag && (
            <span className="inline-block bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium mb-3 border border-blue-500/30">
              #{displayHashtag}
            </span>
          )}
          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Post Media */}
        {post.image_url && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <img 
              src={post.image_url} 
              alt="Post content" 
              className="w-full h-auto rounded-xl hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => setShowImageModal(true)}
            />
          </div>
        )}

        {post.video_url && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <video 
              src={post.video_url} 
              controls 
              className="w-full h-auto rounded-xl"
            />
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleLike}
              disabled={!user || isLiking}
              className={`flex items-center gap-2 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed ${
                localIsLiked 
                  ? 'text-red-400 hover:text-red-300' 
                  : 'text-gray-400 hover:text-red-400'
              } ${isLiking ? 'opacity-50' : ''}`}
            >
              <Heart 
                size={20} 
                fill={localIsLiked ? 'currentColor' : 'none'} 
                className="group-hover:scale-110 transition-transform" 
              />
              <span className="font-medium">{localLikesCount}</span>
            </button>
            <button 
              onClick={handleCommentsToggle}
              className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-all duration-200 group"
            >
              <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">{localCommentsCount}</span>
            </button>
          </div>
          <button 
            onClick={handleShare}
            className="text-gray-400 hover:text-green-400 transition-colors group"
          >
            <Share2 size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Comments Section - Inline dropdown for hashtags page */}
        {showComments && isHashtagsPage && (
          <div className="mt-6 pt-6 border-t border-gray-700/50">
            {user && (
              <div className="mb-4">
                <CommentInput 
                  onSubmit={async (content: string, imageFile?: File, parentId?: string) => {
                    if (!user || (!content.trim() && !imageFile)) return;

                    try {
                      let imageUrl = null;

                      if (imageFile) {
                        const fileExt = imageFile.name.split('.').pop();
                        const fileName = `${Math.random()}.${fileExt}`;
                        const filePath = `comment-images/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                          .from('hashtag-images')
                          .upload(filePath, imageFile);

                        if (!uploadError) {
                          const { data: { publicUrl } } = supabase.storage
                            .from('hashtag-images')
                            .getPublicUrl(filePath);
                          imageUrl = publicUrl;
                        }
                      }

                      const { error } = await supabase
                        .from('hashtag_comments')
                        .insert({
                          post_id: post.id,
                          user_id: user.id,
                          content: content.trim() || '',
                          image_url: imageUrl,
                          parent_id: parentId || null
                        });

                      if (!error) {
                        handleCommentAdded();
                      }
                    } catch (error) {
                      console.error('Error submitting comment:', error);
                    }
                  }}
                  isSubmitting={false}
                  placeholder="اكتب تعليقك..."
                />
              </div>
            )}
            
            <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
              {isLoadingComments ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">لا توجد تعليقات بعد</p>
                  <p className="text-gray-500 text-sm">كن أول من يعلق!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleCommentProfileClick(comment.user_id)}
                        className={`w-10 h-10 bg-gradient-to-br ${getAvatarGradient()} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg hover:scale-105 transition-transform duration-200`}
                      >
                        {comment.profiles?.avatar_url ? (
                          <img 
                            src={comment.profiles.avatar_url} 
                            alt={comment.profiles.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-white">
                            {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => handleCommentProfileClick(comment.user_id)}
                            className="font-medium text-gray-200 hover:text-blue-400 transition-colors text-sm"
                          >
                            {comment.profiles?.username || 'مستخدم مجهول'}
                          </button>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(comment.created_at)}
                          </span>
                        </div>
                        {comment.content && (
                          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-2">{comment.content}</p>
                        )}
                        {comment.image_url && (
                          <img 
                            src={comment.image_url} 
                            alt="Comment image" 
                            className="mt-2 max-w-full h-auto rounded-lg border border-gray-600/50 cursor-pointer hover:scale-105 transition-transform duration-300"
                            onClick={() => {
                              // Create a modal for comment image
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4';
                              modal.innerHTML = `
                                <div class="relative max-w-full max-h-full">
                                  <button class="absolute top-4 right-4 p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full text-white transition-colors z-10">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                      <line x1="18" y1="6" x2="6" y2="18"></line>
                                      <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                  </button>
                                  <img src="${comment.image_url}" alt="Comment image" class="max-w-full max-h-[90vh] rounded-xl shadow-2xl" />
                                </div>
                              `;
                              document.body.appendChild(modal);
                              
                              // Close modal on click
                              modal.addEventListener('click', (e) => {
                                if (e.target === modal || e.target?.closest('button')) {
                                  document.body.removeChild(modal);
                                }
                              });
                            }}
                          />
                        )}
                        {/* Show replies if any */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 ml-4 space-y-3 border-l-2 border-gray-700/50 pl-4">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="bg-gray-700/30 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <button
                                    onClick={() => handleCommentProfileClick(reply.user_id)}
                                    className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0"
                                  >
                                    {reply.profiles?.avatar_url ? (
                                      <img 
                                        src={reply.profiles.avatar_url} 
                                        alt={reply.profiles.username}
                                        className="w-full h-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-xs font-bold text-white">
                                        {reply.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                                      </span>
                                    )}
                                  </button>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <button
                                        onClick={() => handleCommentProfileClick(reply.user_id)}
                                        className="font-medium text-gray-200 hover:text-blue-400 transition-colors text-xs"
                                      >
                                        {reply.profiles?.username || 'مستخدم مجهول'}
                                      </button>
                                      <span className="text-xs text-gray-500">
                                        {formatTimestamp(reply.created_at)}
                                      </span>
                                    </div>
                                    {reply.content && (
                                      <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                                    )}
                                    {reply.image_url && (
                                      <img 
                                        src={reply.image_url} 
                                        alt="Reply image" 
                                        className="mt-1 max-w-full h-auto rounded-lg border border-gray-600/50 cursor-pointer hover:scale-105 transition-transform duration-300"
                                        onClick={() => {
                                          // Create a modal for reply image
                                          const modal = document.createElement('div');
                                          modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4';
                                          modal.innerHTML = `
                                            <div class="relative max-w-full max-h-full">
                                              <button class="absolute top-4 right-4 p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full text-white transition-colors z-10">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                              </button>
                                              <img src="${reply.image_url}" alt="Reply image" class="max-w-full max-h-[90vh] rounded-xl shadow-2xl" />
                                            </div>
                                          `;
                                          document.body.appendChild(modal);
                                          
                                          // Close modal on click
                                          modal.addEventListener('click', (e) => {
                                            if (e.target === modal || e.target?.closest('button')) {
                                              document.body.removeChild(modal);
                                            }
                                          });
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Comments for non-hashtags pages */}
      {showComments && !isHashtagsPage && (
        <PostComments 
          postId={post.id}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          onCommentAdded={handleCommentAdded}
        />
      )}

      {/* Image Modal */}
      {showImageModal && post.image_url && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full text-white transition-colors z-10"
            >
              <X size={20} />
            </button>
            <img 
              src={post.image_url} 
              alt="Post content" 
              className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default HashtagPost;
