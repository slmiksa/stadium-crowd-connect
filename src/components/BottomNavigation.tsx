
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Hash, MessageSquare, Calendar, Newspaper, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'الرئيسية', path: '/' },
    { icon: Hash, label: 'الهاشتاجات', path: '/hashtags' },
    { icon: MessageSquare, label: 'الغرف', path: '/rooms' },
    { icon: Calendar, label: 'المباريات', path: '/matches' },
    { icon: Newspaper, label: 'الأخبار', path: '/news' },
    { icon: User, label: 'الملف الشخصي', path: '/profile' }
  ];

  if (!user) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 ${
              isActive(path)
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Icon size={20} />
            <span className="text-xs mt-1 truncate">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
