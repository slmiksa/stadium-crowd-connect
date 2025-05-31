
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import HashtagPost from '@/components/HashtagPost';
import { ArrowLeft, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface UserProfileData {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  followers_count: number;
  following_count: number;
}

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

const UserProfile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<HashtagPostWithProfile[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [postsCount, setPostsCount] = useState(0);

  useEffect(() => {
    if (userId) {
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
        console.error('Error fetching user profile:', error);
        return;
      }

      setProfileData(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUserPosts = async () => {
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user posts:', error);
        return;
      }

      setUserPosts(data || []);
      setPostsCount(data?.length || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || userId === user.id) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !profileData) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id);

        if (error) {
          console.error('Error unfollowing:', error);
          return;
        }

        setIsFollowing(false);
        setProfileData(prev => prev ? {
          ...prev,
          followers_count: prev.followers_count - 1
        } : null);
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profileData.id
          });

        if (error) {
          console.error('Error following:', error);
          return;
        }

        setIsFollowing(true);
        setProfileData(prev => prev ? {
          ...prev,
          followers_count: prev.followers_count + 1
        } : null);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePostLikeChange = () => {
    fetchUserPosts();
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

  if (!profileData) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <p className="text-zinc-400">المستخدم غير موجود</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            العودة
          </Button>
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
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">الملف الشخصي</h1>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">
                {profileData.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                {profileData.username}
              </h2>
              {profileData.bio && (
                <p className="text-zinc-300 mb-3">{profileData.bio}</p>
              )}
              
              {/* Stats */}
              <div className="flex space-x-6 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{postsCount}</div>
                  <div className="text-sm text-zinc-400">منشور</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{profileData.followers_count}</div>
                  <div className="text-sm text-zinc-400">متابع</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{profileData.following_count}</div>
                  <div className="text-sm text-zinc-400">متابَع</div>
                </div>
              </div>

              {/* Action Buttons */}
              {user && userId !== user.id && (
                <div className="flex space-x-3">
                  <Button
                    onClick={handleFollow}
                    className={`flex items-center space-x-2 ${
                      isFollowing 
                        ? 'bg-zinc-600 hover:bg-zinc-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isFollowing ? <UserMinus size={18} /> : <UserPlus size={18} />}
                    <span>{isFollowing ? 'إلغاء المتابعة' : 'متابعة'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center space-x-2 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                  >
                    <MessageCircle size={18} />
                    <span>رسالة</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Posts */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">منشورات {profileData.username}</h3>
          {userPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-400">لا توجد منشورات بعد</p>
            </div>
          ) : (
            userPosts.map((post) => (
              <HashtagPost 
                key={post.id} 
                post={post} 
                onLikeChange={handlePostLikeChange}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
