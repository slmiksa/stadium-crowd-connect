
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageSquare, Hash, Users, Mail, User } from 'lucide-react';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRTL } = useLanguage();

  const tabs = [
    { 
      id: 'matches', 
      path: '/matches', 
      icon: Users, 
      label: t('matches') 
    },
    { 
      id: 'hashtags', 
      path: '/hashtags', 
      icon: Hash, 
      label: t('hashtags') 
    },
    { 
      id: 'chat-rooms', 
      path: '/chat-rooms', 
      icon: MessageSquare, 
      label: t('chatRooms') 
    },
    { 
      id: 'messages', 
      path: '/messages', 
      icon: Mail, 
      label: t('messages') 
    },
    { 
      id: 'profile', 
      path: '/profile', 
      icon: User, 
      label: t('profile') 
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50">
      <div className="flex items-center justify-around py-2 px-1 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive 
                  ? 'text-blue-400 bg-blue-950/50' 
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1 font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
