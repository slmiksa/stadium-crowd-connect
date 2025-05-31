
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { ArrowLeft, Hash, Lock, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const CreateChatRoom = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setIsSubmitting(true);
    try {
      // إنشاء الغرفة
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          is_private: isPrivate,
          owner_id: user.id,
          members_count: 1
        })
        .select()
        .single();

      if (roomError) {
        console.error('Error creating room:', roomError);
        return;
      }

      // إضافة المنشئ كعضو في الغرفة
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error adding owner as member:', memberError);
        return;
      }

      // الانتقال إلى الغرفة
      navigate(`/chat-room/${room.id}`);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/chat-rooms')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">إنشاء غرفة دردشة</h1>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء'}
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
                    <p className="text-sm text-zinc-300">بالدعوة فقط</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateChatRoom;
