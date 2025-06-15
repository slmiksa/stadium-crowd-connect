import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CommentInput from '@/components/CommentInput';
import CommentItem from '@/components/CommentItem';
import { useToast } from '@/hooks/use-toast';

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
    verification_status?: string;
  };
}

interface Post {
  id: string;
  content: string;
  hashtags: string[];
  user_id: string;
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

const Comments = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    username: string;
    avatar_url?: string;
    verification_status?: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
    if (user) {
      fetchCurrentUserProfile();
    }
  }, [postId, user]);

  const fetchCurrentUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, verification_status')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching current user profile:', error);
        return;
      }

      setCurrentUserProfile(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('hashtag_posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        return;
      }

      setPost(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      
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

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, verification_status')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setComments([]);
          return;
        }

        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesData?.find(profile => profile.id === comment.user_id) || {
            id: comment.user_id,
            username: 'مستخدم مجهول',
            avatar_url: null,
            verification_status: 'none'
          }
        }));

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
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'hashtag-images');
    
    if (!bucketExists) {
      const { error: bucketError } = await supabase.storage.createBucket('hashtag-images', {
        public: true,
        allowedMimeTypes: ['image/*', 'video/*']
      });
      
      if (bucketError) {
        console.error('Error creating bucket:', bucketError);
      }
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `comment-${Date.now()}.${fileExt}`;
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
      toast({ title: 'خطأ', description: 'يجب تسجيل الدخول أولاً', variant: 'destructive' });
      return;
    }

    if (!content.trim() && !mediaFile) {
      toast({ title: 'خطأ', description: 'يرجى كتابة تعليق أو إرفاق وسائط', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let mediaUrl = null;

      if (mediaFile && mediaType) {
        mediaUrl = await uploadMedia(mediaFile, mediaType);
        
        if (!mediaUrl) {
          throw new Error('Failed to upload media');
        }
      }

      const hashtags = extractHashtags(content);

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
        if (mediaType.startsWith('image/')) {
          commentData.image_url = mediaUrl;
        }
      }

      const { data: insertData, error: insertError } = await supabase
        .from('hashtag_comments')
        .insert(commentData)
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting comment:', insertError);
        throw insertError;
      }

      if (insertData) {
        // Fetch fresh user profile to ensure correct username
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, avatar_url, verification_status')
          .eq('id', user.id)
          .single();

        const newComment: Comment = {
          ...insertData,
          profiles: {
            id: user.id,
            username: profileData?.username || currentUserProfile?.username || 'مستخدم',
            avatar_url: profileData?.avatar_url || currentUserProfile?.avatar_url || null,
            verification_status: profileData?.verification_status || currentUserProfile?.verification_status || 'none'
          }
        };

        setComments(prevComments => [newComment, ...prevComments]);
      }

      setReplyTo(null);
      setActiveReplyId(null);
      
    } catch (error: any) {
      console.error('Error in handleSubmitComment:', error);
      toast({
        title: 'خطأ في التعليق',
        description: error.message.includes('violates row-level security policy')
            ? 'لا يمكنك التعليق. قد يكون حسابك محظوراً.'
            : error.message || 'فشل في إضافة التعليق. الرجاء المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyTo({ id: commentId, username });
    setActiveReplyId(commentId);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setActiveReplyId(null);
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/user-profile/${userId}`);
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

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900">
        <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
          <div className="flex items-center p-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors mr-3"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">التعليقات</h1>
              {post && (
                <p className="text-sm text-gray-400">على منشور {post.profiles.username}</p>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Main Comment Input - only show when not replying to a specific comment */}
          {!activeReplyId && (
            <div className="bg-gray-800/50 border-b border-gray-700/50 p-4">
              <CommentInput
                onSubmit={handleSubmitComment}
                isSubmitting={isSubmitting}
                placeholder="اكتب تعليقاً..."
                replyTo={replyTo}
                onCancelReply={handleCancelReply}
              />
            </div>
          )}

          <div className="p-4 space-y-4 pb-20">
            {organizedComments.length === 0 ? (
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
                  onSubmitReply={handleSubmitComment}
                  isSubmittingReply={isSubmitting}
                  activeReplyId={activeReplyId}
                  onCancelReply={handleCancelReply}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Comments;
