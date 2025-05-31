import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Share2, MoreHorizontal, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LikeButton from './LikeButton';
import PostComments from './PostComments';
import { useNavigate } from 'react-router-dom';
import VerificationBadge from './VerificationBadge';

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
    hashtag?: string;
    profiles?: {
      id: string;
      username: string;
      avatar_url?: string;
      verification_status?: string;
    };
  };
  onLikeChange?: () => void;
  hideCommentsButton?: boolean;
}

const HashtagPost: React.FC<HashtagPostProps> = ({ 
  post, 
  onLikeChange,
  hideCommentsButton = false 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [profile, setProfile] = useState(post.profiles);

  useEffect(() => {
    if (!post.profiles && post.user_id) {
      fetchProfile();
    }
  }, [post.user_id, post.profiles]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, verification_status')
        .eq('id', post.user_id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}د`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}س`;
    return `${Math.floor(diffMins / 1440)}ي`;
  };

  const handleUsernameClick = () => {
    if (profile?.id) {
      navigate(`/user-profile/${profile.id}`);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'منشور من ' + profile?.username,
          text: post.content,
          url: window.location.href,
        });
        console.log('تمت المشاركة بنجاح');
      } catch (error) {
        console.error('خطأ في المشاركة:', error);
      }
    } else {
      alert('المشاركة غير مدعومة في هذا المتصفح.');
    }
  };

  return (
    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 hover:bg-zinc-800/70 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
            onClick={handleUsernameClick}
          >
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.username} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-sm">
                {profile?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 
                className="font-medium text-white hover:text-blue-400 cursor-pointer transition-colors"
                onClick={handleUsernameClick}
              >
                {profile?.username || 'مستخدم مجهول'}
              </h3>
              <VerificationBadge verificationStatus={profile?.verification_status} size={16} />
            </div>
            <p className="text-xs text-zinc-400">
              {formatTimestamp(post.created_at)}
            </p>
          </div>
        </div>
        
        <button className="p-1 hover:bg-zinc-700 rounded-lg transition-colors">
          <MoreHorizontal size={16} className="text-zinc-400" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-white mb-2 leading-relaxed">{post.content}</p>
        
        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {post.hashtags.map((hashtag, index) => (
              <span 
                key={index} 
                className="text-blue-400 text-sm hover:text-blue-300 cursor-pointer transition-colors"
                onClick={() => navigate(`/hashtag/${encodeURIComponent(hashtag)}`)}
              >
                #{hashtag}
              </span>
            ))}
          </div>
        )}
        
        {/* Image */}
        {post.image_url && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img 
              src={post.image_url} 
              alt="Post image" 
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-700/50">
        <div className="flex items-center space-x-6">
          <LikeButton 
            postId={post.id}
            initialLikesCount={post.likes_count}
            onLikeChange={onLikeChange}
          />
          
          {!hideCommentsButton && (
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-zinc-400 hover:text-green-400 transition-colors group"
            >
              <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm">{post.comments_count}</span>
            </button>
          )}
        </div>
        
        <button 
          onClick={handleShare}
          className="flex items-center space-x-2 text-zinc-400 hover:text-blue-400 transition-colors group"
        >
          <Share2 size={16} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs">مشاركة</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <PostComments 
          postId={post.id} 
          onCommentAdded={onLikeChange}
        />
      )}
    </div>
  );
};

export default HashtagPost;
