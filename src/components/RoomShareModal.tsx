
import React, { useState } from 'react';
import { X, Users, ExternalLink, Copy, Check, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface RoomShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  roomDescription?: string;
  isPrivate: boolean;
  password?: string;
}

const RoomShareModal: React.FC<RoomShareModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomName,
  roomDescription,
  isPrivate,
  password
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [showFollowersList, setShowFollowersList] = useState(false);

  const fetchFollowers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          profiles:follower_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('following_id', user.id);

      if (error) {
        console.error('Error fetching followers:', error);
        return;
      }

      setFollowers(data || []);
      setShowFollowersList(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const inviteFollowers = async () => {
    if (!user || selectedFollowers.length === 0) return;

    setIsSharing(true);
    try {
      const invitations = selectedFollowers.map(followerId => ({
        room_id: roomId,
        inviter_id: user.id,
        invitee_id: followerId
      }));

      const { error } = await supabase
        .from('room_invitations')
        .insert(invitations);

      if (error) {
        console.error('Error sending invitations:', error);
        throw error;
      }

      toast({
        title: 'تم إرسال الدعوات',
        description: `تم إرسال دعوات إلى ${selectedFollowers.length} متابع`,
      });

      setSelectedFollowers([]);
      setShowFollowersList(false);
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إرسال الدعوات',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const shareExternal = async () => {
    const shareUrl = `${window.location.origin}/chat-room/${roomId}`;
    const shareText = `انضم إلى غرفة الدردشة: ${roomName}${roomDescription ? '\n' + roomDescription : ''}${password ? '\nكلمة المرور: ' + password : ''}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `غرفة دردشة: ${roomName}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        
        toast({
          title: 'تم نسخ الرابط',
          description: 'تم نسخ رابط الغرفة مع التفاصيل إلى الحافظة',
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: 'خطأ',
          description: 'لم نتمكن من نسخ الرابط',
          variant: 'destructive',
        });
      }
    }
  };

  const copyLink = async () => {
    const shareUrl = `${window.location.origin}/chat-room/${roomId}`;
    const shareText = `غرفة دردشة: ${roomName}${roomDescription ? '\n' + roomDescription : ''}${password ? '\nكلمة المرور: ' + password : ''}\nالرابط: ${shareUrl}`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      
      toast({
        title: 'تم نسخ الرابط',
        description: 'تم نسخ رابط الغرفة مع جميع التفاصيل',
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: 'خطأ',
        description: 'لم نتمكن من نسخ الرابط',
        variant: 'destructive',
      });
    }
  };

  const toggleFollowerSelection = (followerId: string) => {
    setSelectedFollowers(prev => 
      prev.includes(followerId)
        ? prev.filter(id => id !== followerId)
        : [...prev, followerId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <h3 className="text-xl font-bold text-white">مشاركة الغرفة</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="p-6 space-y-4">
            {/* معاينة الغرفة */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
              <h4 className="font-medium text-white mb-2">{roomName}</h4>
              {roomDescription && (
                <p className="text-gray-400 text-sm mb-2">{roomDescription}</p>
              )}
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded-full ${isPrivate ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {isPrivate ? 'خاصة' : 'عامة'}
                </span>
                {password && (
                  <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                    محمية بكلمة مرور
                  </span>
                )}
              </div>
            </div>

            {/* خيارات المشاركة */}
            <div className="space-y-3">
              {/* دعوة المتابعين */}
              {!showFollowersList ? (
                <Button
                  onClick={fetchFollowers}
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl transition-all duration-200"
                >
                  <UserPlus size={20} />
                  <div className="text-right">
                    <div className="font-medium">دعوة المتابعين</div>
                    <div className="text-xs opacity-80">إرسال دعوات للمتابعين</div>
                  </div>
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">اختر المتابعين:</h4>
                    <button
                      onClick={() => {
                        setShowFollowersList(false);
                        setSelectedFollowers([]);
                      }}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      إلغاء
                    </button>
                  </div>
                  
                  <div className="bg-gray-800/30 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {followers.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">لا توجد متابعين</p>
                    ) : (
                      followers.map((follower) => (
                        <div
                          key={follower.follower_id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedFollowers.includes(follower.follower_id)
                              ? 'bg-blue-600/20 border border-blue-500/30'
                              : 'hover:bg-gray-700/30'
                          }`}
                          onClick={() => toggleFollowerSelection(follower.follower_id)}
                        >
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">
                            {follower.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <span className="text-white text-sm">{follower.profiles?.username || 'مستخدم مجهول'}</span>
                          {selectedFollowers.includes(follower.follower_id) && (
                            <Check size={16} className="text-blue-400 ml-auto" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {selectedFollowers.length > 0 && (
                    <Button
                      onClick={inviteFollowers}
                      disabled={isSharing}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                    >
                      {isSharing ? 'جاري الإرسال...' : `دعوة ${selectedFollowers.length} متابع`}
                    </Button>
                  )}
                </div>
              )}

              {/* مشاركة خارجية */}
              <Button
                onClick={shareExternal}
                className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl transition-all duration-200"
              >
                <ExternalLink size={20} />
                <div className="text-right">
                  <div className="font-medium">مشاركة خارجية</div>
                  <div className="text-xs opacity-80">مشاركة خارج التطبيق</div>
                </div>
              </Button>

              {/* نسخ الرابط */}
              <Button
                onClick={copyLink}
                className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl transition-all duration-200"
              >
                {copiedLink ? <Check size={20} /> : <Copy size={20} />}
                <div className="text-right">
                  <div className="font-medium">
                    {copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}
                  </div>
                  <div className="text-xs opacity-80">نسخ رابط الغرفة مع التفاصيل</div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomShareModal;
