import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/Layout';
import VerificationBadge from '@/components/VerificationBadge';
import { Camera, Edit3, Users, MessageSquare, Hash, Settings, LogOut, Trash2, Crown, Mail, Key, Check, X, Megaphone, Sparkles, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ImageCropModal from '@/components/ImageCropModal';
import { useToast } from '@/hooks/use-toast';

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
  verification_status?: string;
}
interface ChatRoom {
  id: string;
  name: string;
  description: string;
  members_count: number;
  created_at: string;
  avatar_url?: string;
  is_private: boolean;
  password?: string;
}
interface RoomInvitation {
  id: string;
  room_id: string;
  inviter_id: string;
  status: string;
  created_at: string;
  chat_rooms: ChatRoom & {
    password: string;
  };
  inviter_profile: UserProfile;
}
const Profile = () => {
  const {
    user,
    signOut
  } = useAuth();
  const {
    t,
    isRTL
  } = useLanguage();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [myRooms, setMyRooms] = useState<ChatRoom[]>([]);
  const [roomInvitations, setRoomInvitations] = useState<RoomInvitation[]>([]);
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
      fetchMyRooms();
      fetchRoomInvitations();
    }
  }, [user]);
  const fetchProfile = async () => {
    try {
      console.log('Fetching profile for user:', user?.id);
      const {
        data,
        error
      } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      console.log('Profile data:', data);

      // جلب عدد المتابعين والمتابعين بشكل منفصل للتأكد من الدقة
      const [followersResult, followingResult] = await Promise.all([supabase.from('follows').select('id').eq('following_id', user?.id), supabase.from('follows').select('id').eq('follower_id', user?.id)]);
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
        await supabase.from('profiles').update({
          followers_count: actualFollowersCount,
          following_count: actualFollowingCount
        }).eq('id', user?.id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchMyRooms = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('chat_rooms').select('*').eq('owner_id', user?.id).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching my rooms:', error);
        return;
      }
      setMyRooms(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  const fetchRoomInvitations = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('room_invitations').select(`
          *,
          chat_rooms (*),
          profiles!room_invitations_inviter_id_fkey (id, username, avatar_url, verification_status, email, bio, favorite_team, followers_count, following_count, created_at)
        `).eq('invitee_id', user?.id).eq('status', 'pending').order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching room invitations:', error);
        return;
      }

      // التحقق من وجود الغرف - إذا تم حذف الغرفة، احذف الدعوة
      const validInvitations = [];
      for (const invitation of data || []) {
        if (invitation.chat_rooms) {
          validInvitations.push({
            ...invitation,
            inviter_profile: invitation.profiles
          });
        } else {
          // إذا لم تعد الغرفة موجودة، احذف الدعوة
          await supabase.from('room_invitations').delete().eq('id', invitation.id);
        }
      }
      setRoomInvitations(validInvitations);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  const handleAcceptInvitation = async (invitation: RoomInvitation) => {
    try {
      // التحقق أولاً من أن المستخدم ليس عضواً بالفعل في الغرفة
      const {
        data: existingMember
      } = await supabase.from('room_members').select('id').eq('room_id', invitation.room_id).eq('user_id', user!.id).single();

      // إذا كان المستخدم عضواً بالفعل، فقط نقبل الدعوة وننتقل للغرفة
      if (existingMember) {
        const {
          error: updateError
        } = await supabase.from('room_invitations').update({
          status: 'accepted'
        }).eq('id', invitation.id);
        if (updateError) {
          console.error('Error accepting invitation:', updateError);
          toast({
            title: "خطأ",
            description: "فشل في قبول الدعوة",
            variant: "destructive"
          });
          return;
        }
        toast({
          title: "تم بنجاح",
          description: "تم قبول الدعوة والانتقال للغرفة"
        });

        // تحديث قائمة الدعوات
        fetchRoomInvitations();

        // الانتقال إلى الغرفة
        navigate(`/chat-room/${invitation.room_id}`);
        return;
      }

      // إذا لم يكن المستخدم عضواً، نضيفه أولاً ثم نقبل الدعوة
      const {
        error: memberError
      } = await supabase.from('room_members').insert({
        room_id: invitation.room_id,
        user_id: user!.id,
        role: 'member'
      });
      if (memberError) {
        console.error('Error adding to room members:', memberError);
        toast({
          title: "خطأ",
          description: "فشل في الانضمام إلى الغرفة",
          variant: "destructive"
        });
        return;
      }

      // قبول الدعوة
      const {
        error: updateError
      } = await supabase.from('room_invitations').update({
        status: 'accepted'
      }).eq('id', invitation.id);
      if (updateError) {
        console.error('Error accepting invitation:', updateError);
        toast({
          title: "خطأ",
          description: "فشل في قبول الدعوة",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "تم بنجاح",
        description: "تم قبول الدعوة والانضمام للغرفة"
      });

      // تحديث قائمة الدعوات
      fetchRoomInvitations();

      // الانتقال إلى الغرفة
      navigate(`/chat-room/${invitation.room_id}`);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء قبول الدعوة",
        variant: "destructive"
      });
    }
  };
  const handleRejectInvitation = async (invitationId: string) => {
    try {
      const {
        error
      } = await supabase.from('room_invitations').delete().eq('id', invitationId);
      if (error) {
        console.error('Error rejecting invitation:', error);
        toast({
          title: "خطأ",
          description: "فشل في رفض الدعوة",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "تم",
        description: "تم رفض الدعوة"
      });

      // إزالة الدعوة من القائمة فوراً
      setRoomInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء رفض الدعوة",
        variant: "destructive"
      });
    }
  };
  const handleDeleteRoom = async (roomId: string) => {
    try {
      // حذف دعوات الغرفة أولاً
      await supabase.from('room_invitations').delete().eq('room_id', roomId);

      // حذف أعضاء الغرفة
      await supabase.from('room_members').delete().eq('room_id', roomId);

      // حذف رسائل الغرفة
      await supabase.from('room_messages').delete().eq('room_id', roomId);

      // حذف الغرفة
      const {
        error
      } = await supabase.from('chat_rooms').delete().eq('id', roomId).eq('owner_id', user?.id); // التأكد من أن المستخدم هو المنشئ

      if (error) {
        console.error('Error deleting room:', error);
        toast({
          title: "خطأ",
          description: "فشل في حذف الغرفة",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "تم الحذف",
        description: "تم حذف الغرفة وجميع الدعوات المرتبطة بها"
      });

      // تحديث قائمة الغرف والدعوات
      fetchMyRooms();
      fetchRoomInvitations(); // تحديث الدعوات أيضاً
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الغرفة",
        variant: "destructive"
      });
    }
  };
  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const {
        error
      } = await supabase.from('profiles').update({
        username: editForm.username,
        bio: editForm.bio,
        favorite_team: editForm.favorite_team
      }).eq('id', user.id);
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
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(fileName, croppedImage);
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return;
      }
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const {
        error: updateError
      } = await supabase.from('profiles').update({
        avatar_url: publicUrl
      }).eq('id', user.id);
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
    if (user?.id) {
      navigate(`/followers-following/${user.id}/followers`);
    }
  };
  const handleFollowingClick = () => {
    if (user?.id) {
      navigate(`/followers-following/${user.id}/following`);
    }
  };
  if (isLoading) {
    return <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>;
  }
  if (!profile) {
    return <Layout>
        <div className="p-4 text-center">
          <p className="text-zinc-400">لم يتم العثور على الملف الشخصي</p>
        </div>
      </Layout>;
  }
  return <Layout>
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-32">
          <div className="absolute top-4 right-4">
            
          </div>
        </div>

        {/* Profile content */}
        <div className="relative px-4 -mt-16 my-[27px]">
          {/* قسم أعلن معنا - مبسط */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/advertise-with-us')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-[1.02] shadow-xl"
            >
              <div className="flex items-center justify-center space-x-3 space-x-reverse">
                <Megaphone className="h-6 w-6" />
                <span>ابدأ حملتك الإعلانية الآن</span>
              </div>
            </button>
          </div>

          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-white">
                    {profile?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>}
              </div>
              <label className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors cursor-pointer">
                <Camera size={14} className="text-white" />
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </label>
            </div>
          </div>

          {/* Profile info */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <h1 className="text-2xl font-bold text-white">{profile?.username}</h1>
              <VerificationBadge verificationStatus={profile?.verification_status} size={20} showLabel={true} />
              <button onClick={() => setIsEditing(!isEditing)} className="p-1 hover:bg-zinc-700 rounded-lg transition-colors">
                <Edit3 size={16} className="text-zinc-400" />
              </button>
            </div>
            
            <p className="text-zinc-400 text-sm mb-2">{profile?.email}</p>
            
            {profile?.bio && <p className="text-zinc-300 max-w-md mx-auto mb-4">{profile.bio}</p>}
            
            {profile?.favorite_team && <div className="inline-flex items-center space-x-2 bg-zinc-800 px-3 py-1 rounded-full mb-4">
                <span className="text-sm text-zinc-300">الفريق المفضل:</span>
                <span className="text-sm font-medium text-blue-400">{profile.favorite_team}</span>
              </div>}

            {profile?.created_at && <p className="text-xs text-zinc-500">
                انضم في {formatDate(profile.created_at)}
              </p>}
          </div>

          {/* Room Invitations */}
          {roomInvitations.length > 0 && <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 mb-6 border border-purple-500/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Mail size={20} className="text-purple-400 ml-2" />
                دعوات الغرف ({roomInvitations.length})
              </h3>
              
              <div className="space-y-3">
                {roomInvitations.map(invitation => <div key={invitation.id} className="bg-zinc-800/70 rounded-lg p-4 border border-purple-400/30">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-purple-200">{invitation.chat_rooms.name}</h4>
                          <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-1 rounded">خاصة</span>
                        </div>
                        {invitation.chat_rooms.description && <p className="text-sm text-gray-300 mb-2">{invitation.chat_rooms.description}</p>}
                        <p className="text-xs text-purple-300">
                          دعوة من: {invitation.inviter_profile?.username || 'مستخدم مجهول'}
                        </p>
                        
                        {/* Password Display */}
                        <div className="mt-3 p-3 bg-gray-900/80 rounded-lg border border-yellow-400/40">
                          <div className="flex items-center gap-2 mb-2">
                            <Key size={14} className="text-yellow-400" />
                            <span className="text-xs text-yellow-300 font-semibold">كلمة المرور:</span>
                          </div>
                          <div className="bg-zinc-800 rounded-md p-2 border border-yellow-300/20">
                            <span className="text-sm text-yellow-100 font-mono select-all">
                              {invitation.chat_rooms.password || 'غير متوفرة'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={() => handleAcceptInvitation(invitation)} size="sm" className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                        <Check size={16} />
                        قبول ودخول الغرفة
                      </Button>
                      <Button onClick={() => handleRejectInvitation(invitation.id)} size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/20 flex items-center gap-2">
                        <X size={16} />
                        رفض
                      </Button>
                    </div>
                  </div>)}
              </div>
            </div>}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button onClick={handleFollowersClick} className="bg-zinc-800/50 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-zinc-700/50 transition-colors">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Users size={16} className="text-blue-400" />
                <span className="text-lg font-bold text-white">{profile?.followers_count || 0}</span>
              </div>
              <p className="text-sm text-zinc-400">متابعين</p>
            </button>
            
            <button onClick={handleFollowingClick} className="bg-zinc-800/50 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-zinc-700/50 transition-colors">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Users size={16} className="text-green-400" />
                <span className="text-lg font-bold text-white">{profile?.following_count || 0}</span>
              </div>
              <p className="text-sm text-zinc-400">يتابع</p>
            </button>
          </div>

          {/* Edit form */}
          {isEditing && <div className="bg-zinc-800 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-bold text-white mb-4">تعديل الملف الشخصي</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    اسم المستخدم
                  </label>
                  <Input value={editForm.username} onChange={e => setEditForm({
                ...editForm,
                username: e.target.value
              })} className="bg-zinc-700 border-zinc-600 text-white" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    نبذة شخصية
                  </label>
                  <Textarea value={editForm.bio} onChange={e => setEditForm({
                ...editForm,
                bio: e.target.value
              })} placeholder="اكتب نبذة عن نفسك..." className="bg-zinc-700 border-zinc-600 text-white resize-none" rows={3} />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    الفريق المفضل
                  </label>
                  <Input value={editForm.favorite_team} onChange={e => setEditForm({
                ...editForm,
                favorite_team: e.target.value
              })} placeholder="مثال: الأهلي، برشلونة..." className="bg-zinc-700 border-zinc-600 text-white" />
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={handleSaveProfile} className="flex-1 bg-blue-500 hover:bg-blue-600">
                    حفظ التغييرات
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700">
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>}

          {/* My Chat Rooms */}
          {myRooms.length > 0 && <div className="bg-zinc-800 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Crown size={20} className="text-yellow-500 ml-2" />
                الغرف التي أنشأتها ({myRooms.length})
              </h3>
              
              <div className="space-y-3">
                {myRooms.map(room => <div key={room.id} className="bg-zinc-700 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-white">{room.name}</h4>
                        {room.is_private && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">خاصة</span>}
                      </div>
                      {room.description && <p className="text-sm text-zinc-400 mb-1">{room.description}</p>}
                      <p className="text-xs text-zinc-500">
                        {room.members_count} عضو • {formatDate(room.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button onClick={() => navigate(`/chat-room/${room.id}`)} size="sm" className="bg-blue-500 hover:bg-blue-600 text-slate-50">
                        دخول
                      </Button>
                      <Button onClick={() => handleDeleteRoom(room.id)} size="sm" variant="destructive" className="bg-red-500 hover:bg-red-600">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>)}
              </div>
            </div>}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button onClick={() => navigate('/my-posts')} className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600" variant="outline">
              <Hash size={18} className="ml-2" />
              منشوراتي
            </Button>
            
            <Button onClick={() => navigate('/messages')} className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600" variant="outline">
              <MessageSquare size={18} className="ml-2" />
              الرسائل
            </Button>
          </div>

          {/* Sign out button with safe area padding */}
          <div className="pb-safe">
            <Button onClick={handleSignOut} className="w-full bg-red-600 hover:bg-red-700 text-white mb-4">
              <LogOut size={18} className="ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      {showCropModal && selectedImage && <ImageCropModal imageUrl={selectedImage} onSave={handleImageSave} onClose={() => {
      setShowCropModal(false);
      setSelectedImage(null);
    }} />}
    </Layout>;
};
export default Profile;
