
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = () => {
      const adminData = localStorage.getItem('admin_user');
      if (adminData) {
        try {
          const admin = JSON.parse(adminData);
          if (admin.is_super_admin) {
            setIsAdmin(true);
          } else {
            navigate('/admin/login');
          }
        } catch (error) {
          navigate('/admin/login');
        }
      } else {
        navigate('/admin/login');
      }
      setIsChecking(false);
    };

    checkAdminStatus();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return isAdmin ? <>{children}</> : null;
};

export default AdminGuard;
