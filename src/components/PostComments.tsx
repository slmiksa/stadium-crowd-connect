
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
      
      // Get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('hashtag_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

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

  const handleSubmitComment = async (content: string, imageFile?: File, parentId?: string) => {
    if (!user) {
      console.log('No user found');
      return;
    }

    if (!content.trim() && !imageFile) {
      console.log('No content or image');
      return;
    }

    console.log('Submitting comment:', { content, hasImage: !!imageFile, parentId });
    setIsSubmitting(true);
    
    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        console.log('Uploading image...');
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
        console.log('Image uploaded successfully:', imageUrl);
      }

      // Insert the comment
      console.log('Inserting comment into database...');
      const { data: insertData, error: insertError } = await supabase
        .from('hashtag_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim() || '',
          image_url: imageUrl,
          parent_id: parentId || null
        })
        .select();

      if (insertError) {
        console.error('Error inserting comment:', insertError);
        throw insertError;
      }

      console.log('Comment inserted successfully:', insertData);

      // Refresh comments and notify parent
      await fetchComments();
      onCommentAdded();
      
    } catch (error) {
      console.error('Error in handleSubmitComment:', error);
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

  // Organize comments into thread structure
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-md h-[80vh] rounded-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">التعليقات</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comment Input */}
        <div className="p-4 border-b border-zinc-700 flex-shrink-0">
          <CommentInput
            onSubmit={handleSubmitComment}
            isSubmitting={isSubmitting}
            placeholder="اكتب تعليقاً..."
            replyTo={replyTo}
            onCancelReply={handleCancelReply}
          />
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : organizedComments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-400">لا توجد تعليقات بعد</p>
            </div>
          ) : (
            organizedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={comment.replies}
                onReply={handleReply}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostComments;
