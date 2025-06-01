import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
}

interface PostCommentsProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
}

const PostComments: React.FC<PostCommentsProps> = ({ 
  postId, 
  isOpen, 
  onClose, 
  onCommentAdded 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      
      console.log('Fetching comments for post:', postId);
      
      const { data: commentsData, error: commentsError } = await supabase
        .from('hashtag_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

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

  const updateCommentsCount = async () => {
    try {
      const { data: allComments, error } = await supabase
        .from('hashtag_comments')
        .select('id')
        .eq('post_id', postId);

      if (error) {
        console.error('Error counting comments:', error);
        return;
      }

      const totalCount = allComments?.length || 0;

      const { error: updateError } = await supabase
        .from('hashtag_posts')
        .update({ comments_count: totalCount })
        .eq('id', postId);

      if (updateError) {
        console.error('Error updating comments count:', updateError);
      }
    } catch (error) {
      console.error('Error in updateCommentsCount:', error);
    }
  };

  const extractHashtags = (text: string) => {
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  const handleSubmitComment = async (content: string, mediaFile?: File, mediaType?: string) => {
    if (!user) {
      console.log('No user found');
      return;
    }

    if (!content.trim() && !mediaFile) {
      console.log('No content or media');
      return;
    }

    console.log('Submitting comment:', { content, hasMedia: !!mediaFile, replyTo, mediaType });
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

      // Extract hashtags from comment content
      const hashtags = extractHashtags(content);
      console.log('Extracted hashtags:', hashtags);

      console.log('Inserting comment into database...');
      
      // Prepare comment data with explicit hashtags array
      const commentData: any = {
        post_id: postId,
        user_id: user.id,
        content: content.trim() || '',
        hashtags: hashtags.length > 0 ? hashtags : []
      };

      // Add parent_id if replying to a comment
      if (replyTo) {
        commentData.parent_id = replyTo.id;
      }

      // Add media fields if available
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
        throw insertError;
      }

      console.log('Comment inserted successfully:', insertData);

      // Clear reply state after successful submission
      setReplyTo(null);
      
      // Add the new comment to the top of the list
      if (insertData && insertData[0]) {
        const newComment = {
          ...insertData[0],
          profiles: {
            id: user.id,
            username: user.email?.split('@')[0] || 'مستخدم',
            avatar_url: null
          }
        };
        setComments(prevComments => [newComment, ...prevComments]);
      }
      
      await updateCommentsCount();
      
    } catch (error) {
      console.error('Error in handleSubmitComment:', error);
      alert('حدث خطأ أثناء إضافة التعليق');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId: string, username: string) => {
    console.log('Setting reply to:', { commentId, username });
    setReplyTo({ id: commentId, username });
  };

  const handleCancelReply = () => {
    console.log('Cancelling reply');
    setReplyTo(null);
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/user/${userId}`);
    onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center">
      <div className="bg-gray-900/95 backdrop-blur-md w-full max-w-lg h-[90vh] rounded-t-3xl border border-gray-700/50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-800/50 flex-shrink-0">
          <h3 className="text-lg font-bold text-white">التعليقات</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comment Input - Now at the top */}
        <div className="bg-gray-800/98 backdrop-blur-lg border-b border-gray-700/50 flex-shrink-0">
          <div className="p-4">
            <CommentInput
              onSubmit={handleSubmitComment}
              isSubmitting={isSubmitting}
              placeholder="اكتب تعليقاً..."
              replyTo={replyTo}
              onCancelReply={handleCancelReply}
            />
          </div>
        </div>

        {/* Comments List - Now takes remaining space */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="relative">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-r-purple-500 rounded-full animate-spin animation-delay-150"></div>
              </div>
            </div>
          ) : organizedComments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-gray-400 text-lg">لا توجد تعليقات بعد</p>
              <p className="text-gray-500 text-sm mt-2">كن أول من يعلق!</p>
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
    </div>
  );
};

export default PostComments;
