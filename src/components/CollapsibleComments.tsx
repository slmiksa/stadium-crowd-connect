import React, { useState, useEffect } from 'react';
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
  media_url?: string;
  media_type?: string;
  parent_id?: string;
  hashtags?: string[];
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface CollapsibleCommentsProps {
  postId: string;
  onCommentAdded: () => void;
}

const CollapsibleComments: React.FC<CollapsibleCommentsProps> = ({ 
  postId, 
  onCommentAdded 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      
      console.log('Fetching comments for post:', postId);
      
      const { data: commentsData, error: commentsError } = await supabase
        .from('hashtag_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false }); // الأحدث أولاً

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        setComments([]);
        return;
      }

      console.log('Comments data:', commentsData);

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
        
        console.log('Fetching profiles for user IDs:', userIds);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setComments([]);
          return;
        }

        console.log('Profiles data:', profilesData);

        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesData?.find(profile => profile.id === comment.user_id) || {
            id: comment.user_id,
            username: 'مستخدم مجهول',
            avatar_url: null
          }
        }));

        console.log('Comments with profiles:', commentsWithProfiles);
        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error in fetchComments:', error);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadMedia = async (file: File, type: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `comment-media/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('hashtag-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading media:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('hashtag-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const extractHashtags = (text: string) => {
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  const handleSubmitComment = async (content: string, mediaFile?: File, mediaType?: string) => {
    if (!user) {
      console.log('No user found');
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    if (!content.trim() && !mediaFile) {
      console.log('No content or media');
      alert('يرجى كتابة تعليق أو إرفاق وسائط');
      return;
    }

    console.log('Submitting comment:', { 
      content, 
      hasMedia: !!mediaFile, 
      parentId: replyTo?.id, 
      mediaType,
      replyTo,
      postId,
      userId: user.id
    });
    
    setIsSubmitting(true);
    
    try {
      let mediaUrl = null;

      if (mediaFile && mediaType) {
        console.log('Uploading media...');
        mediaUrl = await uploadMedia(mediaFile, mediaType);
        
        if (!mediaUrl) {
          throw new Error('Failed to upload media');
        }
        console.log('Media uploaded successfully:', mediaUrl);
      }

      const hashtags = extractHashtags(content);
      console.log('Extracted hashtags:', hashtags);

      console.log('Inserting comment into database...');
      
      const commentData: any = {
        post_id: postId,
        user_id: user.id,
        content: content.trim() || '',
        parent_id: replyTo?.id || null,
        hashtags: hashtags
      };

      if (mediaUrl && mediaType) {
        commentData.media_url = mediaUrl;
        commentData.media_type = mediaType;
      }

      console.log('Comment data to insert:', commentData);

      const { data: insertData, error: insertError } = await supabase
        .from('hashtag_comments')
        .insert(commentData)
        .select();

      if (insertError) {
        console.error('Error inserting comment:', insertError);
        console.error('Insert error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw insertError;
      }

      console.log('Comment inserted successfully:', insertData);

      setReplyTo(null);
      
      await fetchComments();
      
      onCommentAdded();
      
    } catch (error) {
      console.error('Error in handleSubmitComment:', error);
      
      let errorMessage = 'حدث خطأ أثناء إضافة التعليق';
      
      if (error?.message?.includes('media_url')) {
        errorMessage = 'خطأ في رفع الوسائط';
      } else if (error?.message?.includes('user_id')) {
        errorMessage = 'خطأ في المصادقة';
      } else if (error?.message?.includes('post_id')) {
        errorMessage = 'خطأ في ربط التعليق بالمنشور';
      }
      
      alert(errorMessage + ': ' + (error?.message || 'خطأ غير معروف'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyTo({ id: commentId, username });
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleProfileClick = (userId: string) => {
    if (userId === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/user-profile/${userId}`);
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

  return (
    <div className="mt-3 border-t border-gray-700/30 pt-3">
      {/* Comment Input - Moved to top */}
      <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/40 mb-4">
        <CommentInput
          onSubmit={handleSubmitComment}
          isSubmitting={isSubmitting}
          placeholder="اكتب تعليقاً..."
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
        />
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="relative">
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : organizedComments.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-base">💬</span>
            </div>
            <p className="text-gray-400 text-sm">لا توجد تعليقات بعد</p>
            <p className="text-gray-500 text-xs mt-1">كن أول من يعلق!</p>
          </div>
        ) : (
          organizedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={comment.replies}
              onReply={handleReply}
              onProfileClick={handleProfileClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CollapsibleComments;
