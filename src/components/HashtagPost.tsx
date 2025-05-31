
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PostComments from './PostComments';

interface HashtagPostProps {
  post: {
    id: string;
    content: string;
    hashtags: string[];
    likes_count: number;
    comments_count: number;
    created_at: string;
    image_url?: string;
    user_id: string;
    profiles: {
      id: string;
      username: string;
      avatar_url?: string;
    };
    hashtag_likes: Array<{
      user_id: string;
    }>;
  };
  onLikeChange: () => void;
}

const HashtagPost: React.FC<HashtagPostProps> = ({ post, onLikeChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(post.likes_count);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.comments_count);
  const [localIsLiked, setLocalIsLiked] = useState(
    post.hashtag_likes.some(like => like.user_id === user?.id)
  );
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}م`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}س`;
    return `${Math.floor(diffMins / 1440)}ي`;
  };

  const handleLike = async () => {
    if (!user || isLiking) return;
    
    setIsLiking(true);
    
    try {
      if (localIsLiked) {
        // Unlike
        const { error } = await supabase
          .from('hashtag_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error unliking post:', error);
          return;
        }
        
        setLocalIsLiked(false);
        setLocalLikesCount(prev => prev - 1);
      } else {
        // Like
        const { error } = await supabase
          .from('hashtag_likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });
          
        if (error) {
          console.error('Error liking post:', error);
          return;
        }
        
        setLocalIsLiked(true);
        setLocalLikesCount(prev => prev + 1);
      }
      
      // Call onLikeChange to update the parent component
      onLikeChange();
    } catch (error) {
      console.error('Error handling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentAdded = () => {
    // Update local comments count
    setLocalCommentsCount(prev => prev + 1);
    // Also call onLikeChange to refresh the posts
    onLikeChange();
  };

  const handleUsernameClick = () => {
    navigate(`/user/${post.user_id}`);
  };

  const handleHashtagClick = (hashtag: string) => {
    navigate(`/hashtag/${hashtag}`);
  };

  const renderContentWithHashtags = (content: string) => {
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    const parts = content.split(hashtagRegex);
    const hashtags = content.match(hashtagRegex) || [];
    
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      result.push(parts[i]);
      if (hashtags[i]) {
        result.push(
          <button
            key={i}
            onClick={() => handleHashtagClick(hashtags[i].slice(1))}
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            {hashtags[i]}
          </button>
        );
      }
    }
    return result;
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

  return (
    <>
      <div className="group bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:bg-gray-800/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
        {/* Post Header */}
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${getAvatarGradient()} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <span className="text-sm font-bold text-white">
              {post.profiles?.username?.charAt(0).toUpperCase() || post.user_id?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleUsernameClick}
                className="font-semibold text-white hover:text-blue-400 transition-colors"
              >
                {post.profiles?.username || 'مستخدم مجهول'}
              </button>
              <span className="text-gray-500 text-sm">•</span>
              <div className="flex items-center text-gray-500 text-sm">
                <Clock size={12} className="ml-1" />
                {formatTimestamp(post.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-white leading-relaxed text-lg mb-3">
            {renderContentWithHashtags(post.content)}
          </p>

          {/* Image */}
          {post.image_url && (
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img 
                src={post.image_url} 
                alt="Post" 
                className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
          <div className="flex items-center space-x-6">
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className={`group flex items-center space-x-2 transition-all duration-300 ${
                localIsLiked 
                  ? 'text-red-400 hover:text-red-300' 
                  : 'text-gray-400 hover:text-red-400'
              } ${isLiking ? 'opacity-50' : ''}`}
            >
              <div className="relative">
                <Heart 
                  size={20} 
                  fill={localIsLiked ? 'currentColor' : 'none'} 
                  className="transition-transform duration-200 group-hover:scale-110"
                />
                {localIsLiked && (
                  <div className="absolute inset-0 animate-ping">
                    <Heart size={20} fill="currentColor" className="opacity-75" />
                  </div>
                )}
              </div>
              <span className="text-sm font-medium">{localLikesCount}</span>
            </button>
            
            <button 
              onClick={() => setShowComments(true)}
              className="group flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-all duration-300"
            >
              <MessageCircle 
                size={20} 
                className="transition-transform duration-200 group-hover:scale-110"
              />
              <span className="text-sm font-medium">{localCommentsCount || 0}</span>
            </button>
          </div>
          
          <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-700/50">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Comments Modal */}
      <PostComments
        postId={post.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onCommentAdded={handleCommentAdded}
      />
    </>
  );
};

export default HashtagPost;
