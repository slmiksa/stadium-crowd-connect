
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Edit2, Users, Heart, MessageSquare, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      setProfile(profileData);
      await fetchFollowData();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowData = async () => {
    if (!user) return;

    try {
      // Fetch followers with explicit column selection
      const { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select(`
          id,
          follower_id,
          following_id,
          created_at,
          follower_profile:profiles!follows_follower_id_fkey(id, username, avatar_url)
        `)
        .eq('following_id', user.id);

      if (followersError) {
        console.error('Error fetching followers:', followersError);
      } else {
        const formattedFollowers = followersData?.map(item => ({
          ...item,
          profiles: item.follower_profile
        })) || [];
        setFollowers(formattedFollowers);
      }

      // Fetch following with explicit column selection
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select(`
          id,
          follower_id,
          following_id,
          created_at,
          following_profile:profiles!follows_following_id_fkey(id, username, avatar_url)
        `)
        .eq('follower_id', user.id);

      if (followingError) {
        console.error('Error fetching following:', followingError);
      } else {
        const formattedFollowing = followingData?.map(item => ({
          ...item,
          profiles: item.following_profile
        })) || [];
        setFollowing(formattedFollowing);
      }
    } catch (error) {
      console.error('Error fetching follow data:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
          <p className="text-zinc-400">خطأ في تحميل البروفايل</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">البروفايل</h1>
          <button
            onClick={() => navigate('/api-settings')}
            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <Settings size={20} className="text-white" />
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {profile.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{profile.username}</h2>
              <p className="text-zinc-400">{profile.email}</p>
              {profile.bio && (
                <p className="text-zinc-300 mt-1">{profile.bio}</p>
              )}
              {profile.favorite_team && (
                <p className="text-blue-400 mt-1">⚽ {profile.favorite_team}</p>
              )}
            </div>
            <button
              onClick={() => navigate('/edit-profile')}
              className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Edit2 size={18} className="text-white" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex space-x-6">
            <button
              onClick={() => setShowFollowers(true)}
              className="flex items-center space-x-2 text-zinc-300 hover:text-white transition-colors"
            >
              <Users size={18} />
              <span>{profile.followers_count || 0} متابِع</span>
            </button>
            <button
              onClick={() => setShowFollowing(true)}
              className="flex items-center space-x-2 text-zinc-300 hover:text-white transition-colors"
            >
              <Heart size={18} />
              <span>{profile.following_count || 0} متابَع</span>
            </button>
            <button
              onClick={() => navigate('/my-posts')}
              className="flex items-center space-x-2 text-zinc-300 hover:text-white transition-colors"
            >
              <MessageSquare size={18} />
              <span>المنشورات</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/my-posts')}
            className="w-full bg-zinc-800 p-4 rounded-lg text-white text-right hover:bg-zinc-700 transition-colors"
          >
            منشوراتي
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full bg-red-600 p-4 rounded-lg text-white text-right hover:bg-red-700 transition-colors"
          >
            تسجيل الخروج
          </button>
        </div>

        {/* Followers Modal */}
        {showFollowers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">المتابعون</h3>
                <button
                  onClick={() => setShowFollowers(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2">
                {followers.length === 0 ? (
                  <p className="text-zinc-400 text-center">لا يوجد متابعون</p>
                ) : (
                  followers.map((follow) => (
                    <div key={follow.id} className="flex items-center space-x-3 p-2 rounded hover:bg-zinc-700">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {follow.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="text-white">{follow.profiles?.username}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Following Modal */}
        {showFollowing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">المتابَعون</h3>
                <button
                  onClick={() => setShowFollowing(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2">
                {following.length === 0 ? (
                  <p className="text-zinc-400 text-center">لا تتابع أحد</p>
                ) : (
                  following.map((follow) => (
                    <div key={follow.id} className="flex items-center space-x-3 p-2 rounded hover:bg-zinc-700">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {follow.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="text-white">{follow.profiles?.username}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;
