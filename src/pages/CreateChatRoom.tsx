
import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { ArrowLeft, Globe, Lock, Camera, Upload, Key, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import FollowerSelector from '@/components/FollowerSelector';

const CreateChatRoom = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([]);
  const [selectAllFollowers, setSelectAllFollowers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "حجم الملف كبير جداً",
          description: "يجب أن يكون حجم الصورة أقل من 5 ميجابايت",
          variant: "destructive"
        });
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (roomId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${roomId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('room-avatars')
        .upload(filePath, avatarFile);

      if (uploadError) {
        console.error('❌ Error uploading avatar:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('room-avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('💥 Error in uploadAvatar:', error);
      return null;
    }
  };

  const sendInvitations = async (roomId: string) => {
    if (!isPrivate || selectedFollowers.length === 0) return;

    try {
      const invitations = selectedFollowers.map(followerId => ({
        room_id: roomId,
        inviter_id: user!.id,
        invitee_id: followerId,
        status: 'pending'
      }));

      const { error } = await supabase
        .from('room_invitations')
        .insert(invitations);

      if (error) {
        console.error('❌ Error sending invitations:', error);
        toast({
          title: "خطأ في إرسال الدعوات",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "تم إرسال الدعوات",
          description: `تم إرسال ${selectedFollowers.length} دعوة بنجاح`
        });
      }
    } catch (error) {
      console.error('💥 Error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive"
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال اسم الغرفة",
        variant: "destructive"
      });
      return;
    }

    if (isPrivate && !password.trim()) {
      toast({
        title: "كلمة السر مطلوبة",
        description: "يجب إدخال كلمة سر للغرف الخاصة",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🏗️ Creating room with data:', { 
        name: name.trim(), 
        description: description.trim(), 
        isPrivate, 
        password: isPrivate ? password.trim() : null,
        userId: user.id 
      });
      
      // Create the room first
      const roomData = {
        name: name.trim(),
        description: description.trim() || null,
        is_private: isPrivate,
        password: isPrivate ? password.trim() : null,
        owner_id: user.id,
        members_count: 1
      };

      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert([roomData])
        .select()
        .single();

      if (roomError) {
        console.error('❌ Error creating room:', roomError);
        toast({
          title: "خطأ في إنشاء الغرفة",
          description: roomError.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Room created successfully:', room);

      // Upload avatar if selected
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(room.id);
        if (avatarUrl) {
          // Update room with avatar URL
          const { error: updateError } = await supabase
            .from('chat_rooms')
            .update({ avatar_url: avatarUrl })
            .eq('id', room.id);

          if (updateError) {
            console.error('❌ Error updating room avatar:', updateError);
          }
        }
      }

      // Add owner as room member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert([{
          room_id: room.id,
          user_id: user.id,
          role: 'owner'
        }]);

      if (memberError && memberError.code !== '23505') { // Ignore duplicate key error
        console.error('❌ Error adding owner as member:', memberError);
        toast({
          title: "خطأ في إضافة العضو",
          description: memberError.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Owner added as member successfully');

      // Send invitations if private room
      if (isPrivate && selectedFollowers.length > 0) {
        await sendInvitations(room.id);
      }
      
      toast({
        title: "تم إنشاء الغرفة بنجاح",
        description: isPrivate ? "تم إرسال دعوات للمتابعين المختارين" : "يمكنك الآن بدء المحادثة"
      });
      
      // Navigate to the room
      navigate(`/chat-room/${room.id}`);
      
    } catch (error) {
      console.error('💥 Error:', error);
      toast({
        title: "حدث خطأ غير متوقع",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/chat-rooms')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">إنشاء غرفة دردشة</h1>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-32">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Avatar */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                أيقونة الغرفة (اختياري)
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-zinc-700 rounded-lg flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="معاينة الأيقونة" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={24} className="text-zinc-400" />
                  )}
                </div>
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-zinc-700 border-zinc-600 hover:bg-zinc-600"
                  >
                    <Upload size={18} className="mr-2" />
                    اختيار صورة
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-zinc-500 mt-1">الحد الأقصى 5 ميجابايت</p>
                </div>
              </div>
            </div>

            {/* Room Name */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                اسم الغرفة *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسم الغرفة"
                className="bg-zinc-900 border-zinc-700 text-white"
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                وصف الغرفة
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="أدخل وصفاً للغرفة (اختياري)"
                className="bg-zinc-900 border-zinc-700 text-white resize-none"
                rows={3}
                maxLength={500}
              />
            </div>

            {/* Privacy Settings */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                إعدادات الخصوصية
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    !isPrivate ? 'bg-blue-600' : 'bg-zinc-700 hover:bg-zinc-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Globe size={20} className="text-white" />
                    <div className="text-right">
                      <p className="font-medium text-white">عامة</p>
                      <p className="text-sm text-zinc-300">يمكن لأي شخص الانضمام</p>
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isPrivate ? 'bg-blue-600' : 'bg-zinc-700 hover:bg-zinc-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Lock size={20} className="text-white" />
                    <div className="text-right">
                      <p className="font-medium text-white">خاصة</p>
                      <p className="text-sm text-zinc-300">بكلمة سر ودعوات للمتابعين</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Password for Private Rooms */}
            {isPrivate && (
              <div className="bg-zinc-800 rounded-lg p-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <Key size={16} className="inline mr-2" />
                  كلمة سر الغرفة *
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة سر قوية"
                  className="bg-zinc-900 border-zinc-700 text-white"
                  required={isPrivate}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  ستُرسل كلمة السر للمتابعين المدعوين
                </p>
              </div>
            )}

            {/* Follower Selection for Private Rooms */}
            {isPrivate && user && (
              <div className="bg-zinc-800 rounded-lg p-4 mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  <Users size={16} className="inline mr-2" />
                  اختيار المتابعين للدعوة (اختياري)
                </label>
                <FollowerSelector
                  userId={user.id}
                  selectedFollowers={selectedFollowers}
                  onFollowersChange={setSelectedFollowers}
                  selectAll={selectAllFollowers}
                  onSelectAllChange={setSelectAllFollowers}
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="pb-4">
              <Button
                type="submit"
                disabled={!name.trim() || isSubmitting || (isPrivate && !password.trim())}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 h-12 text-base font-medium"
              >
                {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الغرفة'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateChatRoom;
