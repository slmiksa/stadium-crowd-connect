
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
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
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            {hashtags[i]}
          </button>
        );
      }
    }
    return result;
  };

  return (
    <>
      <div className="bg-zinc-800 rounded-lg p-4">
        {/* Post Header */}
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">
              {post.profiles?.username?.charAt(0).toUpperCase() || post.user_id?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="ml-3 flex-1">
            <button
              onClick={handleUsernameClick}
              className="font-medium text-white hover:text-blue-400 transition-colors"
            >
              {post.profiles?.username || 'مستخدم مجهول'}
            </button>
            <p className="text-xs text-zinc-500">
              {formatTimestamp(post.created_at)}
            </p>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-3">
          <p className="text-white mb-2">
            {renderContentWithHashtags(post.content)}
          </p>

          {/* Image */}
          {post.image_url && (
            <img 
              src={post.image_url} 
              alt="Post" 
              className="w-full h-48 object-cover rounded-lg mt-2"
            />
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-700">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-1 transition-colors ${
                localIsLiked ? 'text-red-400' : 'text-zinc-400 hover:text-red-400'
              } ${isLiking ? 'opacity-50' : ''}`}
            >
              <Heart size={18} fill={localIsLiked ? 'currentColor' : 'none'} />
              <span className="text-sm">{localLikesCount}</span>
            </button>
            <button 
              onClick={() => setShowComments(true)}
              className="flex items-center space-x-1 text-zinc-400 hover:text-blue-400 transition-colors"
            >
              <MessageCircle size={18} />
              <span className="text-sm">{localCommentsCount || 0}</span>
            </button>
          </div>
          <button className="text-zinc-400 hover:text-blue-400 transition-colors">
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
