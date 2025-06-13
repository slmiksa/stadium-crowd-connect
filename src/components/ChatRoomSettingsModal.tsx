
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Tv } from 'lucide-react';
import LiveMatchManager from './LiveMatchManager';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [announcement, setAnnouncement] = useState(currentAnnouncement || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showLiveMatchManager, setShowLiveMatchManager] = useState(false);

  const handleSaveAnnouncement = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({ 
          announcement: announcement.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (error) throw error;

      onAnnouncementUpdate(announcement.trim() || null);
      toast({
        title: "تم الحفظ",
        description: "تم تحديث إعلان الغرفة بنجاح"
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الإعلان",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAnnouncement = async () => {
    setAnnouncement('');
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({ 
          announcement: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (error) throw error;

      onAnnouncementUpdate(null);
      toast({
        title: "تم الحذف",
        description: "تم حذف إعلان الغرفة"
      });
    } catch (error) {
      console.error('Error clearing announcement:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الإعلان",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-zinc-800 text-white border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">إعدادات الغرفة</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* إدارة الإعلان */}
            <div className="space-y-3">
              <Label htmlFor="announcement" className="text-white">
                إعلان الغرفة
              </Label>
              <Textarea
                id="announcement"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="اكتب إعلاناً للغرفة (اختياري)..."
                className="bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-400 resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">
                  {announcement.length}/500 حرف
                </span>
                <div className="flex space-x-2 space-x-reverse">
                  <Button
                    onClick={handleClearAnnouncement}
                    variant="outline"
                    size="sm"
                    disabled={isLoading || !announcement.trim()}
                    className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                  >
                    مسح
                  </Button>
                  <Button
                    onClick={handleSaveAnnouncement}
                    size="sm"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save size={16} className="ml-1" />
                    حفظ
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="bg-zinc-700" />

            {/* إدارة النقل المباشر */}
            <div className="space-y-3">
              <Label className="text-white">النقل المباشر للمباريات</Label>
              <p className="text-sm text-zinc-400">
                قم بتفعيل نقل مباراة مباشرة لعرضها في أعلى الدردشة للأعضاء
              </p>
              <Button
                onClick={() => setShowLiveMatchManager(true)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Tv size={16} className="ml-2" />
                إدارة النقل المباشر
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* مكون إدارة المباراة المباشرة */}
      {user && (
        <LiveMatchManager
          isOpen={showLiveMatchManager}
          onClose={() => setShowLiveMatchManager(false)}
          roomId={roomId}
          userId={user.id}
        />
      )}
    </>
  );
};

export default ChatRoomSettingsModal;
