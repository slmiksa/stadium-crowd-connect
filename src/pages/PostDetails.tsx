
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import HashtagPost from '@/components/HashtagPost';
import CollapsibleComments from '@/components/CollapsibleComments';
import { ArrowLeft, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

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
}

const PostDetails = () => {
  const { postId } = useParams();
  const { user, isInitialized } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<HashtagPostWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostLikeChange = () => {
    fetchPost();
  };

  const handleCommentAdded = () => {
    fetchPost();
    setRefreshKey(prev => prev + 1);
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <p className="text-gray-400">المنشور غير موجود</p>
        </div>
      </Layout>
    );
  }

  // إذا لم يكن المستخدم مسجل دخول، اعرض معاينة المنشور مع دعوة لتسجيل الدخول
  if (!user && isInitialized) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center p-4 border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors mr-2"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <h1 className="text-lg font-bold text-white">المنشور</h1>
            </div>

            {/* Post Preview */}
            <div className="p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3 space-x-reverse mb-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {post.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-white">
                      {post.profiles?.username || 'مستخدم مجهول'}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-white whitespace-pre-wrap break-words mb-2">
                    {post.content.substring(0, 200)}
                    {post.content.length > 200 && '...'}
                  </p>

                  {post.image_url && (
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={post.image_url}
                        alt="Post image"
                        className="w-full max-h-96 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center text-zinc-400 space-x-4 space-x-reverse">
                  <span>❤️ {post.likes_count}</span>
                  <span>💬 {post.comments_count}</span>
                </div>
              </div>

              {/* Login Prompt */}
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-6 text-center">
                <LogIn size={48} className="mx-auto text-blue-400 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">سجل دخولك لرؤية المنشور كاملاً</h2>
                <p className="text-zinc-400 mb-4">
                  للتفاعل مع المنشور وقراءة التعليقات، يرجى تسجيل الدخول أولاً
                </p>
                <Button 
                  onClick={handleLoginRedirect}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  تسجيل الدخول
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // إذا كان المستخدم مسجل دخول، اعرض المنشور كاملاً
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors mr-2"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-lg font-bold text-white">المنشور</h1>
          </div>

          {/* Post */}
          <div className="border-b border-gray-800">
            <HashtagPost 
              post={post}
              onPostUpdate={handlePostLikeChange}
              showComments={false}
            />
          </div>

          {/* Comments Section */}
          <div className="bg-black">
            <CollapsibleComments
              key={refreshKey}
              postId={post.id}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PostDetails;
