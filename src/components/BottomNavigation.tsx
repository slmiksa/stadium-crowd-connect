import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageSquare, User, Trophy, Hash } from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'hashtags',
      label: 'الرئيسية',
      icon: Hash,
      path: '/hashtags',
      isActive: location.pathname === '/' || location.pathname === '/hashtags' || location.pathname.startsWith('/hashtag/')
    },
    {
      id: 'matches',
      label: 'المباريات',
      icon: Trophy,
      path: '/matches',
      isActive: location.pathname === '/matches' || location.pathname.startsWith('/match/')
    },
    {
      id: 'chatRooms',
      label: 'الدردشات',
      icon: MessageSquare,
      path: '/chat-rooms',
      isActive: location.pathname === '/chat-rooms' || location.pathname.startsWith('/chat-room/') || location.pathname === '/create-chat-room'
    },
    {
      id: 'profile',
      label: 'الملف الشخصي',
      icon: User,
      path: '/profile',
      isActive: location.pathname === '/profile' || location.pathname === '/edit-profile' || location.pathname.startsWith('/profile/')
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900 to-zinc-800/95 backdrop-blur-lg border-t border-zinc-700/50 z-50 safe-area-padding">
      <ul className="flex justify-around items-center p-3">
        {menuItems.map((item) => (
          <li key={item.id} className="flex-1 text-center">
            <button
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 text-xs ${
                item.isActive ? 'text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {React.createElement(item.icon, { size: 20 })}
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BottomNavigation;
