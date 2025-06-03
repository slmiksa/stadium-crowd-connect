import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LikeButtonProps {
  postId?: string;
  commentId?: string;
  initialLikesCount?: number;
  onLikeChange?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const LikeButton: React.FC<LikeButtonProps> = ({ 
  postId, 
  commentId, 
  initialLikesCount = 0, 
  onLikeChange,
  size = 'md' 
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: { icon: 16, text: 'text-xs' },
    md: { icon: 20, text: 'text-sm' },
    lg: { icon: 24, text: 'text-base' }
  };

  const config = sizeConfig[size];

  // Fetch current like status and count
  const fetchLikeData = async () => {
    if (!postId && !commentId) return;

    try {
      if (postId) {
        // Get current likes count
        const { count: currentCount } = await supabase
          .from('hashtag_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (currentCount !== null) {
          setLikesCount(currentCount);
        }

        // Check if user liked this post
        if (user) {
          const { data } = await supabase
            .from('hashtag_likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('post_id', postId)
            .single();

          setIsLiked(!!data);
        }
      } else if (commentId) {
        // Get current likes count for comment
        const { count: currentCount } = await supabase
          .from('hashtag_comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', commentId);

        if (currentCount !== null) {
          setLikesCount(currentCount);
        }

        // Check if user liked this comment
        if (user) {
          const { data } = await supabase
            .from('hashtag_comment_likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('comment_id', commentId)
            .single();

          setIsLiked(!!data);
        }
      }
    } catch (error) {
      console.error('Error fetching like data:', error);
    }
  };

  useEffect(() => {
    fetchLikeData();
  }, [user, postId, commentId]);

  useEffect(() => {
    setLikesCount(initialLikesCount);
  }, [initialLikesCount]);

  // Real-time updates
  useEffect(() => {
    if (!postId && !commentId) return;

    const channel = supabase
      .channel(`likes-${postId || commentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: postId ? 'hashtag_likes' : 'hashtag_comment_likes',
          filter: postId ? `post_id=eq.${postId}` : `comment_id=eq.${commentId}`
        },
        () => {
          // Refetch like data when changes occur
          fetchLikeData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, commentId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('يجب تسجيل الدخول للإعجاب');
      return;
    }

    if (!postId && !commentId) {
      console.error('No post or comment ID provided');
      return;
    }

    setIsLoading(true);

    try {
      if (postId) {
        if (isLiked) {
          // Remove like from post
          const { error } = await supabase
            .from('hashtag_likes')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', postId);

          if (error) {
            console.error('Error removing like:', error);
            toast.error('حدث خطأ في إلغاء الإعجاب');
            return;
          }

          toast.success('تم إلغاء الإعجاب');
        } else {
          // Add like to post
          const { error } = await supabase
            .from('hashtag_likes')
            .insert({
              user_id: user.id,
              post_id: postId
            });

          if (error) {
            console.error('Error adding like:', error);
            toast.error('حدث خطأ في الإعجاب');
            return;
          }

          toast.success('تم الإعجاب بنجاح');
        }
      } else if (commentId) {
        if (isLiked) {
          // Remove like from comment
          const { error } = await supabase
            .from('hashtag_comment_likes')
            .delete()
            .eq('user_id', user.id)
            .eq('comment_id', commentId);

          if (error) {
            console.error('Error removing comment like:', error);
            toast.error('حدث خطأ في إلغاء الإعجاب');
            return;
          }

          toast.success('تم إلغاء الإعجاب');
        } else {
          // Add like to comment
          const { error } = await supabase
            .from('hashtag_comment_likes')
            .insert({
              user_id: user.id,
              comment_id: commentId
            });

          if (error) {
            console.error('Error adding comment like:', error);
            toast.error('حدث خطأ في الإعجاب');
            return;
          }

          toast.success('تم الإعجاب بنجاح');
        }
      }

      // Refresh data and notify parent
      await fetchLikeData();
      if (onLikeChange) {
        onLikeChange();
      }
    } catch (error) {
      console.error('Error in handleLike:', error);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`flex items-center space-x-2 space-x-reverse transition-all duration-200 group ${
        isLiked 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-500 hover:text-red-400'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
    >
      <Heart 
        size={config.icon} 
        className={`transition-transform group-hover:scale-110 ${
          isLiked ? 'fill-current' : ''
        }`}
      />
      <span className={`font-medium ${config.text}`}>
        {likesCount}
      </span>
    </button>
  );
};

export default LikeButton;
