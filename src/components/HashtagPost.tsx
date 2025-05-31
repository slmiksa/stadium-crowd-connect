import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Clock, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import CollapsibleComments from './CollapsibleComments';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

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
  hideCommentsButton?: boolean;
}

const HashtagPost: React.FC<HashtagPostProps> = ({ post, onLikeChange, hideCommentsButton = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize like status based on current user
  useEffect(() => {
    if (user && post.hashtag_likes && Array.isArray(post.hashtag_likes)) {
      const userLike = post.hashtag_likes.find(like => like.user_id === user.id);
      setIsLiked(!!userLike);
    } else {
      setIsLiked(false);
    }
  }, [user, post.hashtag_likes]);

  // Real-time updates for comments
  useEffect(() => {
    const channel = supabase
      .channel(`post-${post.id}-comments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hashtag_comments',
          filter: `post_id=eq.${post.id}`
        },
        async () => {
          const { count } = await supabase
            .from('hashtag_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);
          
          if (count !== null) {
            setCommentsCount(count);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id]);

  // Real-time updates for likes - simplified approach
  useEffect(() => {
    const channel = supabase
      .channel(`post-${post.id}-likes`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hashtag_likes',
          filter: `post_id=eq.${post.id}`
        },
        async (payload) => {
          console.log('Like added:', payload.new);
          // Fetch fresh data to ensure accuracy
          const { data: likesData, error } = await supabase
            .from('hashtag_likes')
            .select('user_id')
            .eq('post_id', post.id);

          if (!error && likesData) {
            setLikesCount(likesData.length);
            if (user) {
              const userLike = likesData.find(like => like.user_id === user.id);
              setIsLiked(!!userLike);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'hashtag_likes',
          filter: `post_id=eq.${post.id}`
        },
        async (payload) => {
          console.log('Like removed:', payload.old);
          // Fetch fresh data to ensure accuracy
          const { data: likesData, error } = await supabase
            .from('hashtag_likes')
            .select('user_id')
            .eq('post_id', post.id);

          if (!error && likesData) {
            setLikesCount(likesData.length);
            if (user) {
              const userLike = likesData.find(like => like.user_id === user.id);
              setIsLiked(!!userLike);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const handleLike = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);
    
    try {
      if (!isLiked) {
        // Optimistically update UI first
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        
        // Add like to database
        const { error } = await supabase
          .from('hashtag_likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });
        
        if (error) {
          console.error('Error adding like:', error);
          // Revert optimistic update on error
          setIsLiked(false);
          setLikesCount(prev => prev - 1);
          toast.error('حدث خطأ في إضافة الإعجاب');
        } else {
          toast.success('تم إضافة الإعجاب');
        }
      } else {
        // Optimistically update UI first
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        
        // Remove like from database
        const { error } = await supabase
          .from('hashtag_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error removing like:', error);
          // Revert optimistic update on error
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
          toast.error('حدث خطأ في إزالة الإعجاب');
        } else {
          toast.success('تم إزالة الإعجاب');
        }
      }
      
      if (onLikeChange) {
        onLikeChange();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert any optimistic updates
      if (user && post.hashtag_likes && Array.isArray(post.hashtag_likes)) {
        const userLike = post.hashtag_likes.find(like => like.user_id === user.id);
        setIsLiked(!!userLike);
        setLikesCount(post.likes_count || 0);
      }
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: 'منشور من تطبيق الهاشتاقات',
        text: post.content,
        url: window.location.href
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('تم مشاركة المنشور');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${post.content}\n\n${window.location.href}`);
        toast.success('تم نسخ المنشور للحافظة');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to clipboard if sharing fails
      try {
        await navigator.clipboard.writeText(`${post.content}\n\n${window.location.href}`);
        toast.success('تم نسخ المنشور للحافظة');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        toast.error('حدث خطأ في المشاركة');
      }
    }
  };

  const handleDelete = async () => {
    if (!user || user.id !== post.user_id) {
      toast.error('لا يمكنك حذف هذا المنشور');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('hashtag_posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting post:', error);
        toast.error('حدث خطأ في حذف المنشور');
      } else {
        toast.success('تم حذف المنشور بنجاح');
        if (onLikeChange) {
          onLikeChange();
        }
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('حدث خطأ غير متوقع');
    }
  };

  const handleProfileClick = () => {
    if (post.user_id === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/user-profile/${post.user_id}`);
    }
  };

  const handleCommentAdded = () => {
    if (onLikeChange) {
      onLikeChange();
    }
  };

  const handleCommentsClick = () => {
    navigate(`/post/${post.id}`);
  };

  const renderContentWithHashtags = (content: string) => {
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    const parts = content.split(hashtagRegex);
    const hashtags = content.match(hashtagRegex) || [];
    
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      result.push(<span key={`text-${i}`}>{parts[i]}</span>);
      if (hashtags[i]) {
        const hashtag = hashtags[i].slice(1);
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
    <div className="w-full bg-black border-b border-gray-800">
      <div className="px-4 py-3">
        <div className="flex items-start space-x-3 space-x-reverse">
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={handleProfileClick}
                  className="font-bold text-white hover:text-blue-400 transition-colors text-base"
                >
                  {post.profiles?.username || 'مستخدم مجهول'}
                </button>
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock size={14} className="ml-1" />
                  {formatTimestamp(post.created_at)}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-800">
                    <MoreVertical size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                  {user?.id === post.user_id && (
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer"
                    >
                      <Trash2 size={16} className="ml-2" />
                      حذف المنشور
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={handleShare}
                    className="text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer"
                  >
                    <Share2 size={16} className="ml-2" />
                    مشاركة
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="text-white mb-3 leading-relaxed whitespace-pre-wrap text-base">
              {renderContentWithHashtags(post.content)}
            </div>
            
            {post.image_url && (
              <div className="mb-3 rounded-2xl overflow-hidden border border-gray-800">
                <img 
                  src={post.image_url} 
                  alt="Post content" 
                  className="w-full max-h-96 object-cover"
                />
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-6 space-x-reverse">
                <button
                  onClick={handleLike}
                  disabled={!user || isProcessing}
                  className={`flex items-center space-x-2 space-x-reverse transition-all duration-150 group disabled:opacity-70 transform active:scale-95 ${
                    isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
                  } ${isProcessing ? 'cursor-wait' : 'cursor-pointer'}`}
                >
                  <Heart 
                    size={20} 
                    className={`transition-all duration-150 group-hover:scale-110 ${
                      isLiked ? 'fill-current scale-110' : ''
                    } ${isProcessing ? 'animate-pulse' : ''}`}
                  />
                  <span className="text-sm font-medium">{likesCount}</span>
                </button>
                
                {!hideCommentsButton && (
                  <button 
                    onClick={handleCommentsClick}
                    className="flex items-center space-x-2 space-x-reverse text-gray-500 hover:text-blue-400 transition-all duration-200 group"
                  >
                    <MessageCircle size={20} className="transition-transform group-hover:scale-110" />
                    <span className="text-sm font-medium">{commentsCount}</span>
                  </button>
                )}

                {hideCommentsButton && (
                  <Collapsible open={showComments} onOpenChange={setShowComments}>
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center space-x-2 space-x-reverse text-gray-500 hover:text-blue-400 transition-all duration-200 group">
                        <MessageCircle size={20} className="transition-transform group-hover:scale-110" />
                        <span className="text-sm font-medium">{commentsCount}</span>
                      </button>
                    </CollapsibleTrigger>
                  </Collapsible>
                )}
                
                <button 
                  onClick={handleShare}
                  className="text-gray-500 hover:text-green-400 transition-colors"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
            
            {hideCommentsButton && (
              <Collapsible open={showComments} onOpenChange={setShowComments}>
                <CollapsibleContent className="space-y-0 overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <CollapsibleComments
                    postId={post.id}
                    onCommentAdded={handleCommentAdded}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HashtagPost;
