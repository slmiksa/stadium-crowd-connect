
import React, { useState } from 'react';
import { X, Users, ExternalLink, Copy, MessageCircle, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import FollowerSelector from './FollowerSelector';

interface PostShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postContent: string;
  postAuthor: string;
}

const PostShareModal: React.FC<PostShareModalProps> = ({
  isOpen,
  onClose,
  postId,
  postContent,
  postAuthor
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFollowerSelector, setShowFollowerSelector] = useState(false);
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const shareToAllFollowers = async () => {
    if (!user) return;

    setIsSharing(true);
    try {
      const { error } = await supabase
        .from('post_shares')
        .insert({
          post_id: postId,
          user_id: user.id,
          shared_to: 'followers'
        });

      if (error) {
        console.error('Error sharing post:', error);
        throw error;
      }

      toast({
        title: 'تم مشاركة المنشور',
        description: 'تم مشاركة المنشور مع جميع متابعيك وسيصلهم تنبيه',
      });

      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء مشاركة المنشور',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const shareToSelectedFollowers = async () => {
    if (!user || selectedFollowers.length === 0) return;

    setIsSharing(true);
    try {
      // إنشاء تنبيهات للمتابعين المختارين
      const notifications = selectedFollowers.map(followerId => ({
        user_id: followerId,
        type: 'post_share',
        title: 'مشاركة منشور',
        message: `${postAuthor} شارك منشوراً معك`,
        data: {
          post_id: postId,
          sharer_id: user.id,
          share_type: 'selected_followers'
        }
      }));

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error creating notifications:', notificationError);
        throw notificationError;
      }

      // تسجيل المشاركة
      const { error: shareError } = await supabase
        .from('post_shares')
        .insert({
          post_id: postId,
          user_id: user.id,
          shared_to: 'selected_followers'
        });

      if (shareError) {
        console.error('Error recording share:', shareError);
      }

      toast({
        title: 'تم مشاركة المنشور',
        description: `تم مشاركة المنشور مع ${selectedFollowers.length} من متابعيك`,
      });

      onClose();
      setShowFollowerSelector(false);
      setSelectedFollowers([]);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء مشاركة المنشور',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const shareExternal = async () => {
    const shareUrl = `${window.location.origin}/post-details/${postId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `منشور من ${postAuthor}`,
          text: postContent.slice(0, 100) + (postContent.length > 100 ? '...' : ''),
          url: shareUrl,
        });

        if (user) {
          await supabase
            .from('post_shares')
            .insert({
              post_id: postId,
              user_id: user.id,
              shared_to: 'external'
            });
        }
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        
        toast({
          title: 'تم نسخ الرابط',
          description: 'تم نسخ رابط المنشور إلى الحافظة',
        });

        if (user) {
          await supabase
            .from('post_shares')
            .insert({
              post_id: postId,
              user_id: user.id,
              shared_to: 'external'
            });
        }
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
    const shareUrl = `${window.location.origin}/post-details/${postId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      
      toast({
        title: 'تم نسخ الرابط',
        description: 'تم نسخ رابط المنشور إلى الحافظة',
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <h3 className="text-xl font-bold text-white">مشاركة المنشور</h3>
          <button
            onClick={() => {
              onClose();
              setShowFollowerSelector(false);
              setSelectedFollowers([]);
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* منشور معاينة */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
            <p className="text-sm text-gray-400 mb-2">من {postAuthor}</p>
            <p className="text-white text-sm line-clamp-3">{postContent}</p>
          </div>

          {!showFollowerSelector ? (
            /* خيارات المشاركة */
            <div className="space-y-3">
              {/* مشاركة لجميع المتابعين */}
              <Button
                onClick={shareToAllFollowers}
                disabled={isSharing || !user}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl transition-all duration-200"
              >
                <Users size={20} />
                <div className="text-right">
                  <div className="font-medium">مشاركة لجميع المتابعين</div>
                  <div className="text-xs opacity-80">سيصل تنبيه لجميع متابعيك</div>
                </div>
              </Button>

              {/* مشاركة لمتابعين محددين */}
              <Button
                onClick={() => setShowFollowerSelector(true)}
                disabled={!user}
                className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl transition-all duration-200"
              >
                <Users size={20} />
                <div className="text-right">
                  <div className="font-medium">اختيار متابعين محددين</div>
                  <div className="text-xs opacity-80">اختر من تريد مشاركة المنشور معه</div>
                </div>
              </Button>

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
                className="w-full flex items-center justify-center gap-3 bg-gray-600 hover:bg-gray-700 text-white py-4 rounded-xl transition-all duration-200"
              >
                {copiedLink ? <Check size={20} /> : <Copy size={20} />}
                <div className="text-right">
                  <div className="font-medium">
                    {copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}
                  </div>
                  <div className="text-xs opacity-80">نسخ رابط المنشور</div>
                </div>
              </Button>
            </div>
          ) : (
            /* اختيار المتابعين */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-white">اختر المتابعين</h4>
                <Button
                  onClick={() => {
                    setShowFollowerSelector(false);
                    setSelectedFollowers([]);
                    setSelectAll(false);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  إلغاء
                </Button>
              </div>

              {user && (
                <FollowerSelector
                  userId={user.id}
                  selectedFollowers={selectedFollowers}
                  onFollowersChange={setSelectedFollowers}
                  selectAll={selectAll}
                  onSelectAllChange={setSelectAll}
                />
              )}

              <Button
                onClick={shareToSelectedFollowers}
                disabled={isSharing || selectedFollowers.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
              >
                {isSharing ? 'جاري المشاركة...' : `مشاركة مع ${selectedFollowers.length} متابع`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostShareModal;
