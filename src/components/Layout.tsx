
import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Hide footer in chat rooms, private chat, and hashtags page
  const hiddenFooterPaths = ['/chat-room/', '/private-chat/', '/hashtags'];
  const shouldHideFooter = hiddenFooterPaths.some(path => location.pathname.includes(path)) || location.pathname === '/hashtags';

  return (
    <div className="min-h-screen bg-zinc-900">
      <main className={shouldHideFooter ? '' : 'pb-16'}>
        {children}
      </main>
      {!shouldHideFooter && <BottomNavigation />}
    </div>
  );
};

export default Layout;
