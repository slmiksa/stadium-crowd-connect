
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProfileRedirect = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('ProfileRedirect - userId:', userId, 'current user:', user?.id);
    
    if (!userId) {
      // No userId, redirect to own profile
      navigate('/profile', { replace: true });
      return;
    }

    if (user && userId === user.id) {
      // Viewing own profile, redirect to /profile
      navigate('/profile', { replace: true });
    } else {
      // Viewing another user's profile, redirect to correct path
      navigate(`/user-profile/${userId}`, { replace: true });
    }
  }, [userId, user, navigate]);

  return null;
};

export default ProfileRedirect;
