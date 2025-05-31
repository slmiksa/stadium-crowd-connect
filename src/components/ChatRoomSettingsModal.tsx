
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

interface ChatRoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  currentAnnouncement?: string;
  onAnnouncementUpdate: (announcement: string | null) => void;
}

const ChatRoomSettingsModal: React.FC<ChatRoomSettingsModalProps> = ({
  isOpen,
  onClose,
  roomId,
  currentAnnouncement,
  onAnnouncementUpdate
}) => {
  const [announcement, setAnnouncement] = useState(currentAnnouncement || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({ 
          announcement: announcement.trim() || null 
        })
        .eq('id', roomId);

      if (error) {
        console.error('Error updating announcement:', error);
        return;
      }

      onAnnouncementUpdate(announcement.trim() || null);
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAnnouncement = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({ announcement: null })
        .eq('id', roomId);

      if (error) {
        console.error('Error clearing announcement:', error);
        return;
      }

      setAnnouncement('');
      onAnnouncementUpdate(null);
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle>إعدادات الغرفة</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="announcement" className="text-white">
              إعلان الغرفة
            </Label>
            <Textarea
              id="announcement"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="اكتب إعلان للغرفة (اختياري)..."
              className="bg-zinc-700 border-zinc-600 text-white mt-2"
              rows={3}
            />
            <p className="text-sm text-zinc-400 mt-1">
              سيظهر الإعلان في أعلى الغرفة لجميع الأعضاء
            </p>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
            
            {currentAnnouncement && (
              <Button
                onClick={handleClearAnnouncement}
                disabled={isSaving}
                variant="outline"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              >
                إزالة الإعلان
              </Button>
            )}
            
            <Button
              onClick={onClose}
              variant="outline"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatRoomSettingsModal;
