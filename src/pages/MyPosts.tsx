import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import HashtagPost from '@/components/HashtagPost';
import { ArrowLeft, Plus } from 'lucide-react';
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

const MyPosts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myPosts, setMyPosts] = useState<HashtagPostWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyPosts();
    }
  }, [user]);

  const fetchMyPosts = async () => {
    if (!user) return;

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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my posts:', error);
        return;
      }

      setMyPosts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostLikeChange = () => {
    fetchMyPosts();
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

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">منشوراتي</h1>
          </div>
          <button
            onClick={() => navigate('/create-hashtag-post')}
            className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {myPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-400 mb-4">لم تنشر أي منشورات بعد</p>
              <button
                onClick={() => navigate('/create-hashtag-post')}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                إنشاء منشور جديد
              </button>
            </div>
          ) : (
            myPosts.map((post) => (
              <HashtagPost 
                key={post.id} 
                post={{
                  ...post,
                  hashtag: post.hashtags?.[0] || ''
                }} 
                onLikeChange={handlePostLikeChange}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyPosts;
