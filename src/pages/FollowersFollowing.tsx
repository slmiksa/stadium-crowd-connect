
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import VerificationBadge from '@/components/VerificationBadge';
import { ArrowLeft, Users, UserPlus, UserMinus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface UserProfile {
  id: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  verification_status?: string;
}

interface FollowData {
  follower_id?: string;
  following_id?: string;
  profiles?: UserProfile;
}

const FollowersFollowing = () => {
  const { userId, type } = useParams(); // type can be 'followers' or 'following'
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userId) {
      fetchUsers();
      if (user) {
        fetchCurrentUserFollowing();
      }
    }
  }, [userId, type, user]);

  const fetchUsers = async () => {
    try {
      let query;
      
      if (type === 'followers') {
        query = supabase
          .from('follows')
          .select(`
            follower_id,
            profiles:follower_id (id, username, bio, avatar_url, verification_status)
          `)
          .eq('following_id', userId);
      } else {
        query = supabase
          .from('follows')
          .select(`
            following_id,
            profiles:following_id (id, username, bio, avatar_url, verification_status)
          `)
          .eq('follower_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      const usersList = data?.map((item: FollowData) => item.profiles).filter(Boolean) as UserProfile[];
      setUsers(usersList || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentUserFollowing = async () => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user?.id);

      if (error) {
        console.error('Error fetching following:', error);
        return;
      }

      const followingSet = new Set(data?.map(f => f.following_id) || []);
      setFollowingIds(followingSet);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!user) return;

    try {
      if (followingIds.has(targetUserId)) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (!error) {
          setFollowingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(targetUserId);
            return newSet;
          });
        }
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });

        if (!error) {
          setFollowingIds(prev => new Set(prev).add(targetUserId));
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUserProfileClick = (userProfileId: string) => {
    // تصحيح المسار للذهاب للبروفايل
    navigate(`/profile/${userProfileId}`);
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
        <div className="flex items-center space-x-3 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">
            {type === 'followers' ? 'المتابعين' : 'يتابع'}
          </h1>
        </div>

        <div className="space-y-4">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">
                {type === 'followers' ? 'لا يوجد متابعين' : 'لا يتابع أحد'}
              </p>
            </div>
          ) : (
            users.map((userProfile) => (
              <div key={userProfile.id} className="bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-zinc-700/50 rounded-lg p-2 -m-2 transition-colors"
                    onClick={() => handleUserProfileClick(userProfile.id)}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                      {userProfile.avatar_url ? (
                        <img 
                          src={userProfile.avatar_url} 
                          alt={userProfile.username} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-white">
                          {userProfile.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white">{userProfile.username}</h3>
                        <VerificationBadge 
                          verificationStatus={userProfile.verification_status} 
                          size={16} 
                        />
                      </div>
                      {userProfile.bio && (
                        <p className="text-sm text-zinc-400">{userProfile.bio}</p>
                      )}
                      <p className="text-xs text-blue-400 mt-1">
                        انقر للذهاب إلى البروفايل
                      </p>
                    </div>
                  </div>
                  
                  {user && user.id !== userProfile.id && (
                    <Button
                      onClick={() => handleFollow(userProfile.id)}
                      variant={followingIds.has(userProfile.id) ? "outline" : "default"}
                      size="sm"
                      className={followingIds.has(userProfile.id) 
                        ? "border-zinc-600 text-zinc-300 hover:bg-zinc-700" 
                        : "bg-blue-500 hover:bg-blue-600"
                      }
                    >
                      {followingIds.has(userProfile.id) ? (
                        <>
                          <UserMinus size={16} className="ml-1" />
                          إلغاء المتابعة
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} className="ml-1" />
                          متابعة
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FollowersFollowing;
