
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flag, AlertTriangle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'post' | 'comment' | 'user' | 'room';
  targetId: string;
  targetTitle?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen, 
  onClose, 
  type, 
  targetId, 
  targetTitle 
}) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const reportReasons = {
    post: [
      'محتوى مسيء أو غير لائق',
      'محتوى مخل بالآداب العامة',
      'رسائل عشوائية (سبام)',
      'معلومات خاطئة أو مضللة',
      'محتوى مكرر أو منسوخ',
      'انتهاك حقوق الطبع والنشر',
      'خطاب كراهية أو تمييز',
      'تهديد أو تخويف',
      'انتحال شخصية',
      'محتوى إباحي أو جنسي'
    ],
    comment: [
      'تعليق مسيء أو غير لائق',
      'تعليق مخل بالآداب',
      'رسائل عشوائية (سبام)',
      'خارج عن موضوع المنشور',
      'تنمر أو مضايقة',
      'خطاب كراهية',
      'معلومات خاطئة'
    ],
    user: [
      'سلوك مسيء أو غير لائق',
      'انتحال شخصية أو هوية مزيفة',
      'إرسال رسائل عشوائية',
      'حساب وهمي أو آلي',
      'تنمر أو مضايقة مستمرة',
      'نشر محتوى غير مناسب',
      'انتهاك قوانين المجتمع'
    ],
    room: [
      'اسم الغرفة مسيء أو غير لائق',
      'محتوى غير مناسب في الغرفة',
      'رسائل عشوائية (سبام)',
      'نشاطات مشبوهة أو احتيالية',
      'تنمر جماعي',
      'محتوى مخالف للقانون'
    ]
  };

  const getTypeDisplayName = () => {
    switch (type) {
      case 'post': return 'المنشور';
      case 'comment': return 'التعليق';
      case 'user': return 'المستخدم';
      case 'room': return 'الغرفة';
      default: return 'المحتوى';
    }
  };

  const handleSubmit = async () => {
    if (!user || !reason) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار سبب البلاغ',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('إرسال البلاغ:', { type, targetId, reason, description });
      
      const reportData = {
        report_type: type,
        reason,
        description: description.trim() || null,
        status: 'pending',
        reporter_id: user.id,
        reported_post_id: type === 'post' ? targetId : null,
        reported_comment_id: type === 'comment' ? targetId : null,
        reported_user_id: type === 'user' ? targetId : null,
        reported_room_id: type === 'room' ? targetId : null
      };

      const { data, error } = await supabase
        .from('reports')
        .insert(reportData)
        .select();

      if (error) {
        console.error('خطأ في إرسال البلاغ:', error);
        toast({
          title: 'خطأ في الإبلاغ',
          description: 'حدث خطأ أثناء إرسال البلاغ. يرجى المحاولة مرة أخرى.',
          variant: 'destructive'
        });
        return;
      }

      console.log('تم إرسال البلاغ بنجاح:', data);

      toast({
        title: 'تم إرسال البلاغ بنجاح',
        description: 'شكراً لك! تم إرسال بلاغك وسيتم مراجعته من قبل فريق الإدارة في أقرب وقت ممكن.',
      });

      // إعادة تعيين النموذج وإغلاق النافذة
      setReason('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
      toast({
        title: 'خطأ غير متوقع',
        description: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setDescription('');
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-w-[95vw] mx-auto bg-gray-900 border-gray-700 text-white">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white justify-end">
            <Flag size={24} className="text-red-400" />
            إبلاغ عن {getTypeDisplayName()}
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-right">
            {targetTitle && (
              <div className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">العنصر المبلغ عنه:</p>
                <p className="text-white font-medium">{targetTitle}</p>
              </div>
            )}
            ساعدنا في الحفاظ على مجتمع آمن ومحترم بالإبلاغ عن المحتوى المخالف للقوانين والآداب العامة.
            <br />
            <span className="text-yellow-400 font-medium">تذكر:</span> البلاغات الكاذبة قد تؤدي إلى تقييد حسابك.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          {/* سبب البلاغ */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3 text-right">
              <AlertTriangle size={16} className="inline ml-2" />
              سبب الإبلاغ <span className="text-red-400">*</span>
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white text-right">
                <SelectValue placeholder="اختر سبب الإبلاغ..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {reportReasons[type].map((r) => (
                  <SelectItem 
                    key={r} 
                    value={r}
                    className="text-white hover:bg-gray-700 text-right"
                  >
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* تفاصيل إضافية */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3 text-right">
              <Shield size={16} className="inline ml-2" />
              تفاصيل إضافية (اختياري)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أضف تفاصيل إضافية تساعدنا في فهم البلاغ بشكل أفضل..."
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-right resize-none"
              maxLength={500}
              rows={4}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">{description.length}/500</span>
              <span className="text-xs text-gray-400">المعلومات الإضافية تساعد في معالجة البلاغ بشكل أسرع</span>
            </div>
          </div>

          {/* معلومات مهمة */}
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
            <h4 className="text-blue-300 font-medium mb-2 text-right">معلومات مهمة:</h4>
            <ul className="text-sm text-blue-200 space-y-1 text-right">
              <li>• سيتم مراجعة بلاغك خلال 24-48 ساعة</li>
              <li>• جميع البلاغات سرية ولن يتم إشعار المستخدم المبلغ عنه بهويتك</li>
              <li>• سنتخذ الإجراء المناسب حسب خطورة المخالفة</li>
              <li>• البلاغات الكاذبة أو المتكررة بلا مبرر قد تؤدي لتقييد الحساب</li>
            </ul>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason || isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الإرسال...
                </div>
              ) : (
                'إرسال البلاغ'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
