
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HashtagPostProps {
  post: {
    id: string;
    content: string;
    hashtags: string[];
    likes_count: number;
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
  const [isLiking, setIsLiking] = useState(false);
  
  const isLiked = post.hashtag_likes.some(like => like.user_id === user?.id);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  const handleLike = async () => {
    if (!user || isLiking) return;
    
    setIsLiking(true);
    
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('hashtag_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
          
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('hashtag_likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });
          
        if (error) throw error;
      }
      
      onLikeChange();
    } catch (error) {
      console.error('Error handling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="bg-zinc-800 rounded-lg p-4">
      {/* Post Header */}
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">
            {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="font-medium text-white">
            {post.profiles?.username || 'مستخدم مجهول'}
          </h3>
          <p className="text-xs text-zinc-500">
            {formatTimestamp(post.created_at)}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-3">
        <p className="text-white mb-2">{post.content}</p>
        
        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {post.hashtags.map((hashtag, index) => (
              <span key={index} className="text-blue-400 text-sm">
                #{hashtag}
              </span>
            ))}
          </div>
        )}

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
              isLiked ? 'text-red-400' : 'text-zinc-400 hover:text-red-400'
            } ${isLiking ? 'opacity-50' : ''}`}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-sm">{post.likes_count}</span>
          </button>
          <button className="flex items-center space-x-1 text-zinc-400 hover:text-blue-400 transition-colors">
            <MessageCircle size={18} />
            <span className="text-sm">0</span>
          </button>
        </div>
        <button className="text-zinc-400 hover:text-blue-400 transition-colors">
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default HashtagPost;
