
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/Layout';
import { Camera, Edit3, Users, MessageSquare, Hash, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ImageCropModal from '@/components/ImageCropModal';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  favorite_team?: string;
  followers_count: number;
  following_count: number;
  created_at: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    favorite_team: ''
  });
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile for user:', user?.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      console.log('Profile data:', data);

      // جلب عدد المتابعين والمتابعين بشكل منفصل للتأكد من الدقة
      const [followersResult, followingResult] = await Promise.all([
        supabase
          .from('follows')
          .select('id')
          .eq('following_id', user?.id),
        supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user?.id)
      ]);

      const actualFollowersCount = followersResult.data?.length || 0;
      const actualFollowingCount = followingResult.data?.length || 0;

      console.log('Actual followers count:', actualFollowersCount);
      console.log('Actual following count:', actualFollowingCount);

      // تحديث البيانات مع العدد الصحيح
      const updatedProfile = {
        ...data,
        followers_count: actualFollowersCount,
        following_count: actualFollowingCount
      };

      setProfile(updatedProfile);
      setEditForm({
        username: data?.username || '',
        bio: data?.bio || '',
        favorite_team: data?.favorite_team || ''
      });

      // تحديث قاعدة البيانات بالعدد الصحيح إذا كان مختلف
      if (data.followers_count !== actualFollowersCount || data.following_count !== actualFollowingCount) {
        console.log('Updating profile with correct counts...');
        await supabase
          .from('profiles')
          .update({
            followers_count: actualFollowersCount,
            following_count: actualFollowingCount
          })
          .eq('id', user?.id);
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editForm.username,
          bio: editForm.bio,
          favorite_team: editForm.favorite_team
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return;
      }

      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setShowCropModal(true);
    }
  };

  const handleImageSave = async (croppedImage: File) => {
    if (!user) return;

    try {
      const fileExt = 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedImage);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return;
      }

      setShowCropModal(false);
      setSelectedImage(null);
      fetchProfile();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long'
    });
  };

  const handleFollowersClick = () => {
    navigate(`/followers-following/${user?.id}/followers`);
  };

  const handleFollowingClick = () => {
    navigate(`/followers-following/${user?.id}/following`);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <p className="text-zinc-400">لم يتم العثور على الملف الشخصي</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-32">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => navigate('/api-settings')}
              className="p-2 bg-black/20 backdrop-blur-sm rounded-full hover:bg-black/30 transition-colors"
            >
              <Settings size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Profile content */}
        <div className="relative px-4 -mt-16">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {profile?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <label className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors cursor-pointer">
                <Camera size={14} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Profile info */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <h1 className="text-2xl font-bold text-white">{profile?.username}</h1>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <Edit3 size={16} className="text-zinc-400" />
              </button>
            </div>
            
            <p className="text-zinc-400 text-sm mb-2">{profile?.email}</p>
            
            {profile?.bio && (
              <p className="text-zinc-300 max-w-md mx-auto mb-4">{profile.bio}</p>
            )}
            
            {profile?.favorite_team && (
              <div className="inline-flex items-center space-x-2 bg-zinc-800 px-3 py-1 rounded-full mb-4">
                <span className="text-sm text-zinc-300">الفريق المفضل:</span>
                <span className="text-sm font-medium text-blue-400">{profile.favorite_team}</span>
              </div>
            )}

            {profile?.created_at && (
              <p className="text-xs text-zinc-500">
                انضم في {formatDate(profile.created_at)}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button 
              onClick={handleFollowersClick}
              className="bg-zinc-800/50 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-zinc-700/50 transition-colors"
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Users size={16} className="text-blue-400" />
                <span className="text-lg font-bold text-white">{profile?.followers_count || 0}</span>
              </div>
              <p className="text-sm text-zinc-400">متابعين</p>
            </button>
            
            <button 
              onClick={handleFollowingClick}
              className="bg-zinc-800/50 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-zinc-700/50 transition-colors"
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Users size={16} className="text-green-400" />
                <span className="text-lg font-bold text-white">{profile?.following_count || 0}</span>
              </div>
              <p className="text-sm text-zinc-400">يتابع</p>
            </button>
          </div>

          {/* Edit form */}
          {isEditing && (
            <div className="bg-zinc-800 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-bold text-white mb-4">تعديل الملف الشخصي</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    اسم المستخدم
                  </label>
                  <Input
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    نبذة شخصية
                  </label>
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="اكتب نبذة عن نفسك..."
                    className="bg-zinc-700 border-zinc-600 text-white resize-none"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    الفريق المفضل
                  </label>
                  <Input
                    value={editForm.favorite_team}
                    onChange={(e) => setEditForm({ ...editForm, favorite_team: e.target.value })}
                    placeholder="مثال: الأهلي، برشلونة..."
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSaveProfile}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    حفظ التغييرات
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              onClick={() => navigate('/my-posts')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
              variant="outline"
            >
              <Hash size={18} className="ml-2" />
              منشوراتي
            </Button>
            
            <Button
              onClick={() => navigate('/messages')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
              variant="outline"
            >
              <MessageSquare size={18} className="ml-2" />
              الرسائل
            </Button>
          </div>

          {/* Sign out button */}
          <div className="pb-8">
            <Button
              onClick={handleSignOut}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut size={18} className="ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      {showCropModal && selectedImage && (
        <ImageCropModal
          imageUrl={selectedImage}
          onSave={handleImageSave}
          onClose={() => {
            setShowCropModal(false);
            setSelectedImage(null);
          }}
        />
      )}
    </Layout>
  );
};

export default Profile;
