
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { ArrowLeft, Lock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CreateChatRoom = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      // Create the room
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_private: formData.isPrivate,
          owner_id: user.id,
          members_count: 1
        })
        .select()
        .single();

      if (roomError) {
        console.error('Error creating room:', roomError);
        return;
      }

      // Add the creator as a member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error adding member:', memberError);
        return;
      }

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
            <h1 className="text-xl font-bold text-white">غرفة جديدة</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
            {/* Room Name */}
            <div>
              <label className="block text-white font-medium mb-2">
                اسم الغرفة
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="أدخل اسم الغرفة"
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                maxLength={50}
                required
              />
            </div>

            {/* Room Description */}
            <div>
              <label className="block text-white font-medium mb-2">
                الوصف (اختياري)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر للغرفة"
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 resize-none"
                rows={3}
                maxLength={200}
              />
            </div>

            {/* Privacy Setting */}
            <div className="flex items-center justify-between p-4 bg-zinc-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-zinc-600 rounded-lg">
                  {formData.isPrivate ? (
                    <Lock size={20} className="text-white" />
                  ) : (
                    <Users size={20} className="text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-medium">
                    {formData.isPrivate ? 'غرفة خاصة' : 'غرفة عامة'}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {formData.isPrivate 
                      ? 'يمكن للأعضاء المدعوين فقط الانضمام'
                      : 'يمكن لأي شخص الانضمام والمشاركة'
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isPrivate ? 'bg-blue-500' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isPrivate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateChatRoom;
