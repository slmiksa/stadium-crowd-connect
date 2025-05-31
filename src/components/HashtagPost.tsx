import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import CollapsibleComments from './CollapsibleComments';

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
    hashtag: string;
    profiles: {
      id: string;
      username: string;
      avatar_url?: string;
    };
    hashtag_likes: Array<{
      user_id: string;
    }>;
  };
  onLikeChange?: () => void;
}

const HashtagPost: React.FC<HashtagPostProps> = ({ post, onLikeChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(
    post.hashtag_likes?.some(like => like.user_id === user?.id) || false
  );
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showComments, setShowComments] = useState(false);

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
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from('hashtag_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await supabase
          .from('hashtag_likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });
        
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
      
      if (onLikeChange) {
        onLikeChange();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleProfileClick = () => {
    if (post.user_id === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/user/${post.user_id}`);
    }
  };

  const handleCommentAdded = () => {
    setCommentsCount(prev => prev + 1);
    if (onLikeChange) {
      onLikeChange();
    }
  };

  const renderContentWithHashtags = (content: string) => {
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    const parts = content.split(hashtagRegex);
    const hashtags = content.match(hashtagRegex) || [];
    
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      result.push(<span key={`text-${i}`}>{parts[i]}</span>);
      if (hashtags[i]) {
        const hashtag = hashtags[i].slice(1); // Remove the # symbol
        result.push(
          <span
            key={`hashtag-${i}`}
            className="text-blue-400 cursor-pointer hover:text-blue-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/hashtag/${hashtag}`);
            }}
          >
            {hashtags[i]}
          </span>
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
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:bg-gray-800/70 transition-all duration-300 shadow-xl max-w-4xl mx-auto">
      <div className="flex items-start space-x-4 space-x-reverse">
        <button
          onClick={handleProfileClick}
          className={`w-12 h-12 bg-gradient-to-br ${getAvatarGradient()} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg hover:scale-105 transition-transform duration-200`}
        >
          {post.profiles?.avatar_url ? (
            <Avatar className="w-12 h-12">
              <AvatarImage src={post.profiles.avatar_url} />
              <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient()} text-white font-bold`}>
                {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span className="text-base font-bold text-white">
              {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={handleProfileClick}
                className="font-bold text-white hover:text-blue-400 transition-colors text-base"
              >
                {post.profiles?.username || 'مستخدم مجهول'}
              </button>
              <div className="flex items-center text-gray-400 text-sm">
                <Clock size={14} className="ml-1" />
                {formatTimestamp(post.created_at)}
              </div>
            </div>
            <button className="text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50">
              <MoreVertical size={18} />
            </button>
          </div>
          
          <div className="text-gray-200 mb-4 leading-relaxed whitespace-pre-wrap text-base font-medium">
            {renderContentWithHashtags(post.content)}
          </div>
          
          {post.image_url && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img 
                src={post.image_url} 
                alt="Post content" 
                className="w-full max-h-80 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-700/40">
            <div className="flex items-center space-x-8 space-x-reverse">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 space-x-reverse transition-all duration-200 group ${
                  isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                }`}
              >
                <Heart 
                  size={20} 
                  className={`transition-transform group-hover:scale-110 ${isLiked ? 'fill-current' : ''}`}
                />
                <span className="text-sm font-semibold">{likesCount}</span>
              </button>
              
              <Collapsible open={showComments} onOpenChange={setShowComments}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center space-x-2 space-x-reverse text-gray-400 hover:text-blue-400 transition-all duration-200 group">
                    <MessageCircle size={20} className="transition-transform group-hover:scale-110" />
                    <span className="text-sm font-semibold">{commentsCount}</span>
                  </button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>
            
            <button className="text-gray-400 hover:text-green-400 transition-colors p-2 rounded-full hover:bg-gray-700/30">
              <Share2 size={18} />
            </button>
          </div>
          
          <Collapsible open={showComments} onOpenChange={setShowComments}>
            <CollapsibleContent className="space-y-0 overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <CollapsibleComments
                postId={post.id}
                onCommentAdded={handleCommentAdded}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};

export default HashtagPost;
