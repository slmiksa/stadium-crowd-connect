
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BottomNavigation from './BottomNavigation';
import LoadingSpinner from './LoadingSpinner';

interface LayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showBottomNav = true }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col w-full fixed inset-0 overflow-hidden">
      {/* Main content */}
      <div className={`flex-1 overflow-y-auto ${showBottomNav ? 'pb-20' : ''}`}>
        {children}
      </div>
      
      {/* Bottom Navigation */}
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};

export default Layout;
