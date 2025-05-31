
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import HashtagPost from '@/components/HashtagPost';
import CollapsibleComments from '@/components/CollapsibleComments';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

const PostPage = () => {
  const { postId } = useParams();
  const { user } = useAuth();
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
          ),
          hashtag_likes (
            user_id
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
              post={{
                ...post,
                hashtag: post.hashtags?.[0] || ''
              }} 
              onLikeChange={handlePostLikeChange}
              hideCommentsButton={true}
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

export default PostPage;
