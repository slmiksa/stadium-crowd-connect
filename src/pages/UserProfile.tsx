import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import HashtagPost from '@/components/HashtagPost';
import VerificationBadge from '@/components/VerificationBadge';
import { ArrowLeft, Users, Heart, MessageSquare, UserPlus, UserMinus, Megaphone, Ban } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface UserProfileData {
  id: string;
  username: string;
  email: string;
  bio?: string;
  favorite_team?: string;
  avatar_url?: string;
  followers_count: number;
  following_count: number;
  verification_status?: string;
  is_banned: boolean;
  ban_reason?: string | null;
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
  const { toast } = useToast();
  
  // Redirect to /profile if user is viewing their own profile OR if no userId
  useEffect(() => {
    console.log('UserProfile useEffect - userId:', userId, 'current user:', user?.id);
    
    if (!userId) {
      console.log('No userId provided, redirecting to /profile');
      navigate('/profile', { replace: true });
      return;
    }
    
    if (user && userId === user.id) {
      console.log('User viewing own profile, redirecting to /profile');
      navigate('/profile', { replace: true });
      return;
    }
  }, [user, userId, navigate]);

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [posts, setPosts] = useState<HashtagPost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [realFollowersCount, setRealFollowersCount] = useState(0);
  const [realFollowingCount, setRealFollowingCount] = useState(0);

  useEffect(() => {
    console.log('UserProfile data fetching useEffect - userId:', userId, 'user:', user?.id);
    
    if (userId && user && userId !== user.id) {
      console.log('Fetching data for different user profile');
      fetchUserProfile();
      fetchUserPosts();
      checkFollowStatus();
      fetchRealCounts();
    } else if (!userId || (user && userId === user.id)) {
      console.log('Should not fetch data - either no userId or same user');
      setIsLoading(false);
    }
  }, [userId, user]);

  const fetchRealCounts = async () => {
    try {
      console.log('Fetching real counts for userId:', userId);
      
      // Get followers count
      const { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select('id')
        .eq('following_id', userId);

      // Get following count
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', userId);

      if (followersError) {
        console.error('Error fetching followers count:', followersError);
      } else {
        const followersCount = followersData?.length || 0;
        console.log('Real followers count:', followersCount);
        setRealFollowersCount(followersCount);
      }

      if (followingError) {
        console.error('Error fetching following count:', followingError);
      } else {
        const followingCount = followingData?.length || 0;
        console.log('Real following count:', followingCount);
        setRealFollowingCount(followingCount);
      }
    } catch (error) {
      console.error('Error fetching real counts:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching profile for userId:', userId);
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

      console.log('Profile data:', data);
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
    if (!user?.id || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Checking follow status for follower:', user.id, 'following:', userId);
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking follow status:', error);
        setIsFollowing(false);
      } else {
        const followStatus = !!data;
        console.log('Follow status result:', followStatus, 'data:', data);
        setIsFollowing(followStatus);
      }
    } catch (error) {
      console.error('Error in checkFollowStatus:', error);
      setIsFollowing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !userId || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      console.log('Handle follow - current status:', isFollowing);
      
      if (isFollowing) {
        console.log('Unfollowing user...');
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) {
          console.error('Error unfollowing:', error);
          throw error;
        }

        setIsFollowing(false);
        console.log('Successfully unfollowed');
      } else {
        console.log('Following user...');
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) {
          console.error('Error following:', error);
          throw error;
        }

        setIsFollowing(true);
        console.log('Successfully followed');
      }

      // Refresh counts after follow/unfollow
      await fetchRealCounts();
    } catch (error: any) {
      console.error('Error in handleFollow:', error);
      toast({
        title: 'خطأ',
        description: error.message.includes('violates row-level security policy')
            ? 'لا يمكنك المتابعة أو إلغاء المتابعة. قد يكون حسابك محظوراً.'
            : 'حدث خطأ ما. الرجاء المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!userId) return;
    navigate(`/private-chat/${userId}`);
  };

  const handlePostInteraction = () => {
    fetchUserPosts();
  };

  const handleFollowersClick = () => {
    console.log('Navigating to followers for userId:', userId);
    navigate(`/followers-following/${userId}/followers`);
  };

  const handleFollowingClick = () => {
    console.log('Navigating to following for userId:', userId);
    navigate(`/followers-following/${userId}/following`);
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

  // Return null if user is viewing their own profile or no userId
  if (!userId || (user && userId === user.id)) {
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-500"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent rounded-full animate-pulse border-t-purple-400"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
            <Users size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">المستخدم غير موجود</h2>
          <p className="text-zinc-400 mb-6">عذراً، لم نتمكن من العثور على هذا المستخدم</p>
          <Button
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            العودة
          </Button>
        </div>
      </Layout>
    );
  }

  if (profile.is_banned) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-zinc-950">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Ban size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">هذا المستخدم محظور</h2>
          <p className="text-zinc-400 mb-2">
            تم حظر هذا المستخدم.
          </p>
          {profile.ban_reason && (
            <p className="text-zinc-400 mb-6 bg-zinc-800/50 px-4 py-2 rounded-lg border border-zinc-700">
              السبب: {profile.ban_reason}
            </p>
          )}
          <Button
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            العودة
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        {/* Header with Glass Effect */}
        <div className="sticky top-0 z-10 backdrop-blur-md bg-zinc-900/70 border-b border-zinc-800/50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => navigate(-1)}
                variant="ghost" 
                size="icon"
                className="hover:bg-zinc-800/50 text-white rounded-xl transition-all duration-300"
              >
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                ملف المستخدم
              </h1>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* زر أعلن معنا */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold mb-1">روّج لعملك معنا</h3>
                <p className="text-zinc-400 text-sm">ابدأ حملتك الإعلانية الآن وصل لآلاف المستخدمين</p>
              </div>
              <button
                onClick={() => navigate('/advertise-with-us')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center space-x-2 space-x-reverse"
              >
                <Megaphone className="h-4 w-4" />
                <span>أعلن معنا</span>
              </button>
            </div>
          </div>

          {/* Profile Card with Enhanced Design */}
          <Card className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border-zinc-700/50 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-8">
              {/* Cover Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-lg"></div>
              
              <div className="relative">
                {/* Avatar and Basic Info */}
                <div className="flex items-start space-x-6 mb-8">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-gradient-to-br from-blue-400 via-purple-500 to-pink-500 shadow-xl">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.username} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 text-white text-2xl font-bold">
                        {profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-4 border-zinc-800 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                        {profile?.username}
                      </h2>
                      <VerificationBadge 
                        verificationStatus={profile?.verification_status} 
                        size={20} 
                        showLabel={true} 
                      />
                    </div>
                    {profile?.bio && (
                      <p className="text-zinc-300 leading-relaxed mb-3 bg-zinc-800/30 p-3 rounded-lg border border-zinc-700/30">
                        {profile.bio}
                      </p>
                    )}
                    {profile?.favorite_team && (
                      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 px-4 py-2 rounded-full border border-blue-400/30">
                        <span className="text-lg">⚽</span>
                        <span className="text-blue-300 font-medium">{profile.favorite_team}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div 
                    className="text-center bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/30 hover:bg-zinc-700/40 transition-all duration-300 cursor-pointer group"
                    onClick={handleFollowersClick}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Users className="text-blue-400 group-hover:text-blue-300 transition-colors" size={20} />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{realFollowersCount}</div>
                    <div className="text-xs text-zinc-400">متابِع</div>
                  </div>
                  
                  <div 
                    className="text-center bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/30 hover:bg-zinc-700/40 transition-all duration-300 cursor-pointer group"
                    onClick={handleFollowingClick}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Heart className="text-pink-400 group-hover:text-pink-300 transition-colors" size={20} />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{realFollowingCount}</div>
                    <div className="text-xs text-zinc-400">متابَع</div>
                  </div>
                  
                  <div className="text-center bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/30 hover:bg-zinc-700/40 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-center mb-2">
                      <MessageSquare className="text-green-400 group-hover:text-green-300 transition-colors" size={20} />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{posts.length}</div>
                    <div className="text-xs text-zinc-400">منشور</div>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                      isFollowing 
                        ? 'bg-gradient-to-r from-zinc-600 to-zinc-700 hover:from-zinc-700 hover:to-zinc-800 text-white border border-zinc-500' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-500/25'
                    }`}
                  >
                    {isFollowing ? <UserMinus size={18} /> : <UserPlus size={18} />}
                    <span>{isFollowing ? 'إلغاء المتابعة' : 'متابعة'}</span>
                  </Button>
                  
                  <Button
                    onClick={handleSendMessage}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-green-500/25"
                  >
                    <MessageSquare size={18} />
                    <span>رسالة</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts Section with Enhanced Design */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                المنشورات
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-zinc-700 to-transparent"></div>
            </div>
            
            {posts.length === 0 ? (
              <Card className="bg-zinc-800/30 border-zinc-700/50 backdrop-blur-sm">
                <CardContent className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageSquare size={40} className="text-zinc-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">لا توجد منشورات</h4>
                  <p className="text-zinc-400">لم ينشر هذا المستخدم أي منشورات بعد</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur-sm overflow-hidden hover:bg-zinc-800/70 transition-all duration-300 shadow-lg">
                    <HashtagPost
                      post={{
                        ...post,
                        user_id: profile.id,
                        profiles: {
                          id: profile.id,
                          username: profile.username,
                          avatar_url: profile.avatar_url
                        }
                      }}
                      onPostUpdate={handlePostInteraction}
                      showComments={false}
                    />
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
