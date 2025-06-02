
import { supabase } from '@/integrations/supabase/client';

export const createVerificationNotification = async (userId: string, newStatus: string, oldStatus: string | null) => {
  // لا نرسل إشعار إذا لم تتغير حالة التوثيق أو إذا كانت الحالة الجديدة "none"
  if (newStatus === oldStatus || newStatus === 'none') {
    return;
  }

  const verificationMessages = {
    'bronze': 'تهانينا! لقد حصلت على التوثيق البرونزي 🥉 (20+ متابع)',
    'silver': 'مبروك! تم ترقيتك للتوثيق الفضي 🥈 (180+ متابع)',
    'gold': 'عظيم! حصلت على التوثيق الذهبي 🥇 (500+ متابع)',
    'diamond': 'رائع! وصلت للتوثيق الماسي 💎 (1000+ متابع)'
  };

  const message = verificationMessages[newStatus as keyof typeof verificationMessages];
  if (!message) return;

  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'verification',
        title: 'ترقية التوثيق',
        message: message,
        data: {
          verification_status: newStatus,
          previous_status: oldStatus
        }
      });

    if (error) {
      console.error('Error creating verification notification:', error);
    } else {
      console.log(`Verification notification sent to user ${userId} for status ${newStatus}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
