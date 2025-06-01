
import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReportButtonProps {
  type: 'post' | 'comment' | 'user' | 'room';
  targetId: string;
  size?: 'sm' | 'default';
}

const ReportButton: React.FC<ReportButtonProps> = ({ type, targetId, size = 'sm' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const reportReasons = {
    post: ['محتوى مسيء', 'محتوى مخل بالآداب', 'سبام', 'معلومات خاطئة', 'محتوى مكرر'],
    comment: ['تعليق مسيء', 'تعليق مخل بالآداب', 'سبام', 'خارج عن الموضوع'],
    user: ['سلوك مسيء', 'انتحال شخصية', 'سبام', 'حساب وهمي'],
    room: ['اسم مسيء', 'محتوى غير مناسب', 'سبام', 'نشاطات مشبوهة']
  };

  const handleSubmit = async () => {
    if (!user || !reason) return;

    setIsSubmitting(true);
    try {
      const reportData = {
        report_type: type,
        reason,
        description,
        reporter_id: user.id,
        [`reported_${type}_id`]: targetId
      };

      const { error } = await supabase
        .from('reports')
        .insert(reportData);

      if (error) {
        console.error('Error submitting report:', error);
        toast({
          title: 'خطأ في الإبلاغ',
          description: 'حدث خطأ أثناء إرسال البلاغ',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'تم الإبلاغ',
        description: 'تم إرسال بلاغك بنجاح وسيتم مراجعته'
      });

      setIsOpen(false);
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className="text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Flag size={size === 'sm' ? 14 : 16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إبلاغ عن محتوى</DialogTitle>
          <DialogDescription>
            ساعدنا في الحفاظ على مجتمع آمن بالإبلاغ عن المحتوى غير المناسب
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              سبب الإبلاغ
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="اختر سبب الإبلاغ" />
              </SelectTrigger>
              <SelectContent>
                {reportReasons[type].map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              تفاصيل إضافية (اختياري)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أضف تفاصيل إضافية عن البلاغ..."
              className="mt-1"
              maxLength={500}
            />
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason || isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال البلاغ'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportButton;
