import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';

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
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
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

  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      
      const { data: commentsData, error: commentsError } = await supabase
        .from('hashtag_comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return;
      }

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesData?.find(profile => profile.id === comment.user_id) || {
            id: comment.user_id,
            username: 'مستخدم مجهول',
            avatar_url: null
          }
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error in fetchComments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async (content: string, imageFile?: File, parentId?: string) => {
    if (!user) return;
    if (!content.trim() && !imageFile) return;

    setIsSubmittingComment(true);
    
    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `comment-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('hashtag-images')
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('hashtag-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const { error: insertError } = await supabase
        .from('hashtag_comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: content.trim() || '',
          image_url: imageUrl,
          parent_id: parentId || null
        });

      if (insertError) {
        console.error('Error inserting comment:', insertError);
        throw insertError;
      }

      await fetchComments();
      setLocalCommentsCount(prev => prev + 1);
      onLikeChange();
      
    } catch (error) {
      console.error('Error in handleSubmitComment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyTo({ id: commentId, username });
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleProfileClick = (userId: string) => {
    if (userId && userId !== user?.id) {
      navigate(`/user/${userId}`);
    } else if (userId === user?.id) {
      navigate('/profile');
    }
  };

  const organizeComments = (comments: Comment[]) => {
    const topLevel = comments.filter(c => !c.parent_id);
    const replies = comments.filter(c => c.parent_id);
    
    return topLevel.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_id === comment.id)
    }));
  };

  const organizedComments = organizeComments(comments);

  const handleLike = async () => {
    if (!user || isLiking) return;
    
    setIsLiking(true);
    
    try {
      if (localIsLiked) {
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
      
      onLikeChange();
    } catch (error) {
      console.error('Error handling like:', error);
    } finally {
      setIsLiking(false);
    }
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
            onClick={() => navigate(`/hashtag/${hashtags[i].slice(1)}`)}
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
    <div className="group bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:bg-gray-800/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 overflow-hidden">
      <div className="p-6">
        {/* Post Header */}
        <div className="flex items-center mb-4">
          <button
            onClick={() => handleProfileClick(post.user_id)}
            className={`w-12 h-12 bg-gradient-to-br ${getAvatarGradient()} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg hover:scale-105 transition-transform duration-200`}
          >
            <span className="text-sm font-bold text-white">
              {post.profiles?.username?.charAt(0).toUpperCase() || post.user_id?.charAt(0).toUpperCase() || 'U'}
            </span>
          </button>
          <div className="ml-4 flex-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleProfileClick(post.user_id)}
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
              onClick={handleToggleComments}
              className="group flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-all duration-300"
            >
              <MessageCircle 
                size={20} 
                className="transition-transform duration-200 group-hover:scale-110"
              />
              <span className="text-sm font-medium">{localCommentsCount || 0}</span>
              {showComments ? (
                <ChevronUp size={16} className="transition-transform duration-200" />
              ) : (
                <ChevronDown size={16} className="transition-transform duration-200" />
              )}
            </button>
          </div>
          
          <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-700/50">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-700/50 bg-gray-800/20">
          <div className="p-6 space-y-4">
            {/* Comment Input */}
            <CommentInput
              onSubmit={handleSubmitComment}
              isSubmitting={isSubmittingComment}
              placeholder="اكتب تعليقاً..."
              replyTo={replyTo}
              onCancelReply={handleCancelReply}
            />

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="flex justify-center py-8">
                <div className="relative">
                  <div className="w-6 h-6 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              </div>
            ) : organizedComments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">لا توجد تعليقات بعد</p>
                <p className="text-gray-500 text-sm mt-1">كن أول من يعلق!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {organizedComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    replies={comment.replies}
                    onReply={handleReply}
                    onProfileClick={handleProfileClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HashtagPost;
