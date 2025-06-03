
import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Hide footer only in chat rooms and private chat
  const hiddenFooterPaths = ['/chat-room/', '/private-chat/'];
  const shouldHideFooter = hiddenFooterPaths.some(path => location.pathname.includes(path));

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-zinc-900 overflow-x-hidden pt-safe-top">
      <main className={`w-full min-h-screen min-h-[100dvh] ${shouldHideFooter ? '' : 'pb-16 pb-safe-bottom'}`}>
        {children}
      </main>
      {!shouldHideFooter && <BottomNavigation />}
    </div>
  );
};

export default Layout;
