import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/Layout';
import { User, Settings, Users, Hash, MessageSquare, Calendar, MapPin, Link as LinkIcon, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  followers_count: number;
  following_count: number;
  favorite_team?: string;
  created_at: string;
}

interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [postsCount, setPostsCount] = useState(0);
  const [roomsCount, setRoomsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchCounts();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCounts = async () => {
    if (!user) return;

    try {
      // Get posts count
      const { count: postsCount, error: postsError } = await supabase
        .from('hashtag_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!postsError) {
        setPostsCount(postsCount || 0);
      }

      // Get rooms count (where user is owner)
      const { count: roomsCount, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      if (!roomsError) {
        setRoomsCount(roomsCount || 0);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const fetchFollowers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          *,
          profiles:follower_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('following_id', user.id);

      if (error) {
        console.error('Error fetching followers:', error);
        return;
      }

      setFollowers(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchFollowing = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          *,
          profiles:following_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('follower_id', user.id);

      if (error) {
        console.error('Error fetching following:', error);
        return;
      }

      setFollowing(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleShowFollowers = () => {
    fetchFollowers();
    setShowFollowers(true);
  };

  const handleShowFollowing = () => {
    fetchFollowing();
    setShowFollowing(true);
  };

  const handleMyPosts = () => {
    navigate('/my-posts');
  };

  const handleMyRooms = () => {
    navigate('/chat-rooms');
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
          <p className="text-zinc-400">خطأ في تحميل الملف الشخصي</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{t('profile')}</h1>
          <button
            onClick={() => navigate('/api-settings')}
            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <Settings size={20} className="text-white" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">
                {profile.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-xl font-bold text-white">{profile.username}</h2>
                <button className="p-1 text-zinc-400 hover:text-white transition-colors">
                  <Edit3 size={16} />
                </button>
              </div>
              <p className="text-zinc-400 mb-3">{profile.email}</p>
              {profile.bio && <p className="text-zinc-300 mb-3">{profile.bio}</p>}
              
              <div className="flex items-center space-x-4 text-sm text-zinc-400 mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>انضم في {new Date(profile.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
                {profile.favorite_team && (
                  <div className="flex items-center space-x-1">
                    <span>⚽</span>
                    <span>{profile.favorite_team}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex space-x-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{postsCount}</div>
                  <div className="text-sm text-zinc-400">منشور</div>
                </div>
                <button onClick={handleShowFollowers} className="text-center hover:bg-zinc-700 p-2 rounded transition-colors">
                  <div className="text-lg font-bold text-white">{profile.followers_count}</div>
                  <div className="text-sm text-zinc-400">متابع</div>
                </button>
                <button onClick={handleShowFollowing} className="text-center hover:bg-zinc-700 p-2 rounded transition-colors">
                  <div className="text-lg font-bold text-white">{profile.following_count}</div>
                  <div className="text-sm text-zinc-400">متابَع</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button 
            onClick={handleMyPosts}
            className="bg-zinc-800 rounded-lg p-4 text-center hover:bg-zinc-700 transition-colors"
          >
            <Hash size={24} className="mx-auto mb-2 text-blue-400" />
            <span className="text-white font-medium">منشوراتي</span>
            <div className="text-sm text-zinc-400">{postsCount} منشور</div>
          </button>
          <button 
            onClick={handleMyRooms}
            className="bg-zinc-800 rounded-lg p-4 text-center hover:bg-zinc-700 transition-colors"
          >
            <MessageSquare size={24} className="mx-auto mb-2 text-green-400" />
            <span className="text-white font-medium">غرفي</span>
            <div className="text-sm text-zinc-400">{roomsCount} غرفة</div>
          </button>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={signOut}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors"
        >
          تسجيل الخروج
        </button>

        {/* Followers Modal */}
        <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
          <DialogContent className="bg-zinc-800 border-zinc-700">
            <DialogHeader>
              <DialogTitle className="text-white">المتابعون</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {followers.length === 0 ? (
                <p className="text-zinc-400 text-center py-4">لا يوجد متابعون بعد</p>
              ) : (
                followers.map((follow) => (
                  <div key={follow.id} className="flex items-center space-x-3 p-2 hover:bg-zinc-700 rounded transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {follow.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowFollowers(false);
                        navigate(`/user/${follow.profiles?.id}`);
                      }}
                      className="flex-1 text-right"
                    >
                      <p className="text-white font-medium hover:text-blue-400 transition-colors">
                        {follow.profiles?.username || 'مستخدم مجهول'}
                      </p>
                    </button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Following Modal */}
        <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
          <DialogContent className="bg-zinc-800 border-zinc-700">
            <DialogHeader>
              <DialogTitle className="text-white">المتابَعون</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {following.length === 0 ? (
                <p className="text-zinc-400 text-center py-4">لا تتابع أحداً بعد</p>
              ) : (
                following.map((follow) => (
                  <div key={follow.id} className="flex items-center space-x-3 p-2 hover:bg-zinc-700 rounded transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {follow.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowFollowing(false);
                        navigate(`/user/${follow.profiles?.id}`);
                      }}
                      className="flex-1 text-right"
                    >
                      <p className="text-white font-medium hover:text-blue-400 transition-colors">
                        {follow.profiles?.username || 'مستخدم مجهول'}
                      </p>
                    </button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Profile;
