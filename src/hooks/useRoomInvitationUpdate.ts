
import { useEffect } from 'react';
import { updateRoomInvitationNotifications } from '@/utils/updateNotifications';

export const useRoomInvitationUpdate = () => {
  useEffect(() => {
    // Update existing notifications when the app loads
    updateRoomInvitationNotifications();
  }, []);
};
