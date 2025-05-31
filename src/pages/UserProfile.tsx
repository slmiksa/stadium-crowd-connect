
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import HashtagPost from '@/components/HashtagPost';
import { ArrowLeft, Users, Heart, MessageSquare, UserPlus, UserMinus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileData {
  id: string;
  username: string;
  email: string;
  bio?: string;
  favorite_team?: string;
  avatar_url?: string;
  followers_count: number;
  following_count: number;
}

interface HashtagPost {
  id: string;
  content: string;
  hashtags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  image_url?: string;
}

const UserProfile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [posts, setPosts] = useState<HashtagPost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    if (userId && user) {
      fetchUserProfile();
      fetchUserPosts();
      checkFollowStatus();
    }
  }, [userId, user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        navigate('/hashtags');
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('hashtag_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user?.id)
        .eq('following_id', userId)
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      // No follow relationship exists
      setIsFollowing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !userId || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) {
          console.error('Error unfollowing:', error);
          return;
        }

        setIsFollowing(false);
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) {
          console.error('Error following:', error);
          return;
        }

        setIsFollowing(true);
      }

      // Refresh profile to get updated counts
      fetchUserProfile();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!userId) return;
    navigate(`/private-chat/${userId}`);
  };

  const handlePostInteraction = () => {
    // تحديث المنشورات عند حدوث تفاعل
    fetchUserPosts();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}د`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}س`;
    return `${Math.floor(diffMins / 1440)}ي`;
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

  if (!profile) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <p className="text-zinc-400">المستخدم غير موجود</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            العودة
          </button>
        </div>
      </Layout>
    );
  }

  // Don't show this page if viewing own profile
  if (user?.id === userId) {
    navigate('/profile');
    return null;
  }

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">ملف المستخدم</h1>
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {profile.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{profile.username}</h2>
              {profile.bio && (
                <p className="text-zinc-300 mt-1">{profile.bio}</p>
              )}
              {profile.favorite_team && (
                <p className="text-blue-400 mt-1">⚽ {profile.favorite_team}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex space-x-6 mb-4">
            <div className="flex items-center space-x-2 text-zinc-300">
              <Users size={18} />
              <span>{profile.followers_count || 0} متابِع</span>
            </div>
            <div className="flex items-center space-x-2 text-zinc-300">
              <Heart size={18} />
              <span>{profile.following_count || 0} متابَع</span>
            </div>
            <div className="flex items-center space-x-2 text-zinc-300">
              <MessageSquare size={18} />
              <span>{posts.length} منشور</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleFollow}
              disabled={isFollowLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                isFollowing 
                  ? 'bg-zinc-600 hover:bg-zinc-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isFollowing ? <UserMinus size={18} /> : <UserPlus size={18} />}
              <span>{isFollowing ? 'إلغاء المتابعة' : 'متابعة'}</span>
            </button>
            
            <button
              onClick={handleSendMessage}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <MessageSquare size={18} />
              <span>رسالة</span>
            </button>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">المنشورات</h3>
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={48} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">لا توجد منشورات</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-zinc-800 rounded-lg overflow-hidden">
                <HashtagPost
                  post={{
                    ...post,
                    user_id: profile.id,
                    hashtag: post.hashtags?.[0] || '',
                    profiles: {
                      id: profile.id,
                      username: profile.username,
                      avatar_url: profile.avatar_url
                    },
                    hashtag_likes: []
                  }}
                  onLikeChange={handlePostInteraction}
                  hideCommentsButton={false}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
