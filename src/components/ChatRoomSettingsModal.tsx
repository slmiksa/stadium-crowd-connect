
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Settings } from 'lucide-react';
import LiveMatchManager from './LiveMatchManager';

interface ChatRoomSettingsModalProps {
  roomId: string;
  currentAnnouncement?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onAnnouncementUpdate: (announcement: string | null) => void;
}

const ChatRoomSettingsModal: React.FC<ChatRoomSettingsModalProps> = ({
  roomId,
  currentAnnouncement,
  isOpen,
  onClose,
  onAnnouncementUpdate
}) => {
  const [announcement, setAnnouncement] = useState(currentAnnouncement || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLiveMatchManager, setShowLiveMatchManager] = useState(false);
  const { toast } = useToast();

  const updateAnnouncement = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({ announcement: announcement.trim() || null })
        .eq('id', roomId);

      if (error) {
        console.error('Error updating announcement:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحديث الإعلان",
          variant: "destructive"
        });
        return;
      }

      onAnnouncementUpdate(announcement.trim() || null);
      toast({
        title: "تم التحديث",
        description: "تم تحديث إعلان الغرفة بنجاح"
      });
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-zinc-800 text-white border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">إعدادات الغرفة</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* إدارة الإعلان */}
            <div className="space-y-2">
              <Label htmlFor="announcement" className="text-sm font-medium text-gray-300">
                إعلان الغرفة
              </Label>
              <Textarea
                id="announcement"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="اكتب إعلان للغرفة (اختياري)..."
                className="bg-zinc-700 border-zinc-600 text-white resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-400">
                سيظهر الإعلان في أعلى الغرفة لجميع الأعضاء
              </p>
            </div>

            {/* إدارة النقل المباشر */}
            <div className="border-t border-zinc-600 pt-4">
              <Button
                onClick={() => setShowLiveMatchManager(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Play size={16} className="ml-2" />
                إدارة النقل المباشر للمباريات
              </Button>
              <p className="text-xs text-gray-400 mt-2">
                اختر مباراة لبثها مباشرة في الغرفة مع التحديثات التلقائية
              </p>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex space-x-2 space-x-reverse">
              <Button 
                onClick={updateAnnouncement} 
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? 'جاري التحديث...' : 'حفظ التغييرات'}
              </Button>
              <Button 
                onClick={onClose} 
                variant="outline"
                className="flex-1 border-zinc-600 text-gray-300 hover:bg-zinc-700"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* مدير النقل المباشر */}
      {showLiveMatchManager && (
        <LiveMatchManager
          isOpen={showLiveMatchManager}
          onClose={() => setShowLiveMatchManager(false)}
          roomId={roomId}
          userId="" // سيتم تمريره من المكون الأب
        />
      )}
    </>
  );
};

export default ChatRoomSettingsModal;
