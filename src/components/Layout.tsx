
import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import InstallPwaButton from './InstallPwaButton';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const hiddenFooterPaths = ['/chat-room/', '/private-chat/'];
  const shouldHideFooter = hiddenFooterPaths.some(path => location.pathname.includes(path));

  // ارتفاع الفوتر المحدث (h-16 == 64px) للمحتوى الرئيسي
  const mainStyle: React.CSSProperties = {
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: shouldHideFooter ? '0' : '64px', // ارتفاع الفوتر المحدث
    minHeight: '100dvh'
  };

  return (
    <div className="full-screen-container bg-zinc-900">
      <main className="w-full flex-grow overflow-x-hidden" style={mainStyle}>
        {children}
      </main>
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 md:bottom-5 md:left-auto md:right-5 md:translate-x-0">
        <InstallPwaButton />
      </div>
      {!shouldHideFooter && <BottomNavigation />}
    </div>
  );
};

export default Layout;
