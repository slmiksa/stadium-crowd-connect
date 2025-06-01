
import { supabase } from '@/integrations/supabase/client';

export const updateRoomInvitationNotifications = async () => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        message: 'تم دعوتكم لغرفة دردشة خاصة - للدخول من خلال بروفايلكم' 
      })
      .eq('type', 'room_invitation');

    if (error) {
      console.error('Error updating room invitation notifications:', error);
      return false;
    }

    console.log('Successfully updated room invitation notifications');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};
