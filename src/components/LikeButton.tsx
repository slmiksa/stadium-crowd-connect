
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

  useEffect(() => {
    if (user && (postId || commentId)) {
      checkIfLiked();
    }
  }, [user, postId, commentId]);

  useEffect(() => {
    setLikesCount(initialLikesCount);
  }, [initialLikesCount]);

  const checkIfLiked = async () => {
    if (!user) return;

    try {
      if (postId) {
        const { data, error } = await supabase
          .from('hashtag_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking like status:', error);
          return;
        }

        setIsLiked(!!data);
      } else if (commentId) {
        const { data, error } = await supabase
          .from('hashtag_comment_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('comment_id', commentId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking like status:', error);
          return;
        }

        setIsLiked(!!data);
      }
    } catch (error) {
      console.error('Error in checkIfLiked:', error);
    }
  };

  const handleLike = async () => {
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

          setIsLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
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

          setIsLiked(true);
          setLikesCount(prev => prev + 1);
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

          setIsLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
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

          setIsLiked(true);
          setLikesCount(prev => prev + 1);
          toast.success('تم الإعجاب بنجاح');
        }
      }

      // Call parent callback
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
