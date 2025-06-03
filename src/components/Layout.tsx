
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
    <div className="full-screen-container bg-zinc-900">
      <main className={`w-full h-full ${shouldHideFooter ? 'pt-safe pb-safe' : 'pt-safe pb-16'} overflow-x-hidden`}>
        {children}
      </main>
      {!shouldHideFooter && <BottomNavigation />}
    </div>
  );
};

export default Layout;
