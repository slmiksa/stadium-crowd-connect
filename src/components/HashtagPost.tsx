
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Clock, User, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
}

interface HashtagPostProps {
  post: {
    id: string;
    content: string;
    hashtag: string;
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
  isLiked?: boolean;
}

const HashtagPost: React.FC<HashtagPostProps> = ({ post, onLike, isLiked = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.comments_count);
  const [showImageModal, setShowImageModal] = useState(false);

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
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles (
            id,
            username,
            avatar_url
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        return;
      }

      const organizedComments = organizeComments(data || []);
      setComments(organizedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const organizeComments = (commentsData: any[]): Comment[] => {
    const commentMap = new Map();
    const rootComments: Comment[] = [];

    commentsData.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

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

  const handleCommentsToggle = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleCommentAdded = () => {
    loadComments();
    setLocalCommentsCount(prev => prev + 1);
  };

  const handleReply = (commentId: string, username: string) => {
    // This functionality can be implemented later
    console.log('Reply to comment:', commentId, 'by', username);
  };

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
          <span className="inline-block bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium mb-3 border border-blue-500/30">
            #{post.hashtag}
          </span>
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
              onClick={() => onLike?.(post.id)}
              className={`flex items-center gap-2 transition-all duration-200 group ${
                isLiked 
                  ? 'text-red-400 hover:text-red-300' 
                  : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <Heart 
                size={20} 
                fill={isLiked ? 'currentColor' : 'none'} 
                className="group-hover:scale-110 transition-transform" 
              />
              <span className="font-medium">{post.likes_count}</span>
            </button>
            <button 
              onClick={handleCommentsToggle}
              className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-all duration-200 group"
            >
              <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">{localCommentsCount}</span>
            </button>
          </div>
          <button className="text-gray-400 hover:text-green-400 transition-colors group">
            <Share2 size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-6 pt-6 border-t border-gray-700/50">
            {user && (
              <CommentInput 
                postId={post.id} 
                onCommentAdded={handleCommentAdded}
                placeholder="اكتب تعليقك..."
              />
            )}
            
            <PostComments 
              postId={post.id}
              comments={comments}
              isLoading={isLoadingComments}
              onReply={handleReply}
              onProfileClick={handleCommentProfileClick}
            />
          </div>
        )}
      </div>

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
