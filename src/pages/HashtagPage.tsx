
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import HashtagPost from '@/components/HashtagPost';
import CommentItem from '@/components/CommentItem';
import { ArrowLeft, Hash, TrendingUp, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HashtagPostWithProfile {
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
}

interface HashtagCommentWithProfile {
  id: string;
  content: string;
  hashtags: string[];
  created_at: string;
  user_id: string;
  post_id: string;
  parent_id?: string;
  media_url?: string;
  media_type?: string;
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

const HashtagPage = () => {
  const { hashtag } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<HashtagPostWithProfile[]>([]);
  const [comments, setComments] = useState<HashtagCommentWithProfile[]>([]);
  const [content, setContent] = useState(`#${hashtag} `);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hashtag) {
      fetchHashtagContent();
    }
  }, [hashtag]);

  const fetchHashtagContent = async () => {
    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('hashtag_posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          ),
          hashtag_likes (
            user_id
          )
        `)
        .contains('hashtags', [hashtag])
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching hashtag posts:', postsError);
      } else {
        setPosts(postsData || []);
      }

      // Fetch comments with hashtags
      const { data: commentsData, error: commentsError } = await supabase
        .from('hashtag_comments')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .contains('hashtags', [hashtag])
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching hashtag comments:', commentsError);
      } else {
        setComments(commentsData || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractHashtags = (text: string) => {
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const hashtags = extractHashtags(content);
      
      const { error } = await supabase
        .from('hashtag_posts')
        .insert({
          content: content.trim(),
          hashtags,
          user_id: user.id
        });

      if (error) {
        console.error('Error creating post:', error);
        return;
      }

      setContent(`#${hashtag} `);
      fetchHashtagContent();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostLikeChange = () => {
    fetchHashtagContent();
  };

  const handleCommentClick = (commentData: HashtagCommentWithProfile) => {
    navigate(`/post/${commentData.post_id}`);
  };

  const handleProfileClick = (userId: string) => {
    if (userId === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/user-profile/${userId}`);
    }
  };

  const isTrending = posts.filter(post => post.comments_count >= 35).length > 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/hashtags')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div className="flex items-center space-x-2">
              <Hash size={24} className="text-blue-400" />
              <h1 className="text-xl font-bold text-white">{hashtag}</h1>
              {isTrending && (
                <TrendingUp size={20} className="text-orange-400" />
              )}
            </div>
          </div>
        </div>

        {/* Hashtag Stats */}
        <div className="bg-zinc-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-zinc-400">عدد المنشورات</p>
                <p className="text-lg font-bold text-white">{posts.length}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">عدد التعليقات</p>
                <p className="text-lg font-bold text-white">{comments.length}</p>
              </div>
            </div>
            {isTrending && (
              <div className="flex items-center space-x-2 bg-orange-500/20 px-3 py-1 rounded-full">
                <TrendingUp size={16} className="text-orange-400" />
                <span className="text-sm text-orange-400 font-medium">ترند</span>
              </div>
            )}
          </div>
        </div>

        {/* Create Post */}
        {user && (
          <div className="bg-zinc-800 rounded-lg p-4 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`شارك شيئاً عن #${hashtag}...`}
                    className="w-full bg-transparent border-0 text-white placeholder-zinc-400 resize-none text-lg focus:outline-none min-h-24"
                    maxLength={500}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-zinc-700">
                <span className="text-sm text-zinc-400">
                  {content.length}/500
                </span>
                <Button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isSubmitting ? 'جاري النشر...' : 'نشر'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800 mb-6">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Hash size={16} />
              المنشورات ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageCircle size={16} />
              التعليقات ({comments.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-8">
                <Hash size={48} className="mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-400">لا توجد منشورات لهذا الهاشتاق بعد</p>
                <p className="text-zinc-500 text-sm">كن أول من ينشر!</p>
              </div>
            ) : (
              posts.map((post) => (
                <HashtagPost 
                  key={post.id} 
                  post={{
                    ...post,
                    hashtag: hashtag || ''
                  }} 
                  onLikeChange={handlePostLikeChange}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="comments" className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle size={48} className="mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-400">لا توجد تعليقات تحتوي على هذا الهاشتاق بعد</p>
                <p className="text-zinc-500 text-sm">اكتب تعليقاً يحتوي على #{hashtag}!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 hover:bg-zinc-800/70 transition-colors cursor-pointer"
                  onClick={() => handleCommentClick(comment)}
                >
                  <CommentItem
                    comment={comment}
                    onReply={() => {}}
                    onProfileClick={handleProfileClick}
                  />
                  <div className="mt-3 pt-3 border-t border-zinc-700/30">
                    <p className="text-xs text-zinc-500">
                      تعليق على منشور • اضغط للذهاب إلى المنشور
                    </p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default HashtagPage;
