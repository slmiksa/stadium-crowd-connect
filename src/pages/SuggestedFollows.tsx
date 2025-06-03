
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, UserPlus, Users } from 'lucide-react';
import VerificationBadge from '@/components/VerificationBadge';
import { toast } from 'sonner';

interface SuggestedUser {
  id: string;
  username: string;
  avatar_url?: string;
  verification_status: string;
  followers_count: number;
  following_count: number;
  bio?: string;
}

const SuggestedFollows = () => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSuggestedUsers();
    }
  }, [user]);

  const fetchSuggestedUsers = async () => {
    try {
      // جلب المستخدمين الموثقين والمستخدمين ذوي المشاركات العالية
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, verification_status, followers_count, following_count, bio')
        .neq('id', user?.id)
        .or('verification_status.neq.none,followers_count.gte.50')
        .order('followers_count', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching suggested users:', error);
        return;
      }

      // فلترة المستخدمين الذين لا نتابعهم بالفعل
      const { data: existingFollows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user?.id);

      const followingIds = new Set(existingFollows?.map(f => f.following_id) || []);
      const filteredUsers = users?.filter(u => !followingIds.has(u.id)) || [];

      setSuggestedUsers(filteredUsers);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        });

      if (error) {
        console.error('Error following user:', error);
        toast.error(isRTL ? 'حدث خطأ أثناء المتابعة' : 'Error following user');
        return;
      }

      setFollowingUsers(prev => new Set([...prev, userId]));
      toast.success(isRTL ? 'تم متابعة المستخدم بنجاح' : 'User followed successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error(isRTL ? 'حدث خطأ أثناء المتابعة' : 'Error following user');
    }
  };

  const handleSkip = () => {
    // تحديث حالة المستخدم لإخفاء هذه الصفحة في المستقبل
    markSuggestionsAsSeen();
    navigate('/');
  };

  const markSuggestionsAsSeen = async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error marking suggestions as seen:', error);
    }
  };

  const handleContinue = () => {
    markSuggestionsAsSeen();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isRTL ? 'اقتراحات للمتابعة' : 'Suggested Follows'}
            </h1>
            <p className="text-zinc-400">
              {isRTL ? 'ابدأ بمتابعة بعض الحسابات المميزة' : 'Start by following some featured accounts'}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-zinc-400" />
          </button>
        </div>

        {/* Suggested Users List */}
        <div className="space-y-4">
          {suggestedUsers.map((suggestedUser) => (
            <div key={suggestedUser.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    {suggestedUser.avatar_url ? (
                      <img
                        src={suggestedUser.avatar_url}
                        alt={suggestedUser.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-medium">
                        {suggestedUser.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {suggestedUser.username}
                      </span>
                      <VerificationBadge verificationStatus={suggestedUser.verification_status} />
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {suggestedUser.followers_count} {isRTL ? 'متابع' : 'followers'}
                      </span>
                    </div>
                    
                    {suggestedUser.bio && (
                      <p className="text-sm text-zinc-300 mt-2 line-clamp-2">
                        {suggestedUser.bio}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => handleFollow(suggestedUser.id)}
                  disabled={followingUsers.has(suggestedUser.id)}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-green-600 disabled:opacity-80 text-white px-4 py-2"
                >
                  {followingUsers.has(suggestedUser.id) ? (
                    <span className="flex items-center gap-2">
                      <UserPlus size={16} />
                      {isRTL ? 'تم المتابعة' : 'Following'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus size={16} />
                      {isRTL ? 'متابعة' : 'Follow'}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={handleContinue}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3"
          >
            {isRTL ? 'المتابعة إلى الصفحة الرئيسية' : 'Continue to Home'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuggestedFollows;
