
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createVerificationNotification } from '@/utils/verificationNotification';

export const useVerificationNotifications = () => {
  useEffect(() => {
    // الاستماع لتغييرات حالة التوثيق في جدول profiles
    const channel = supabase
      .channel('verification-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: 'verification_status=neq.null'
        },
        async (payload) => {
          const { new: newProfile, old: oldProfile } = payload;
          
          // تحقق من تغيير حالة التوثيق
          if (newProfile.verification_status !== oldProfile.verification_status) {
            await createVerificationNotification(
              newProfile.id,
              newProfile.verification_status,
              oldProfile.verification_status
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};
