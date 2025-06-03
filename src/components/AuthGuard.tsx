
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/Login';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading, isInitialized } = useAuth();

  // Show loading spinner while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show login if no user after initialization is complete
  if (!user) {
    return <Login />;
  }

  return <>{children}</>;
};

export default AuthGuard;
