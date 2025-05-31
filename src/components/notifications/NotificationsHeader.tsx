
import React from 'react';
import { ArrowLeft, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationsHeaderProps {
  hasUnreadNotifications: boolean;
  onMarkAllAsRead: () => void;
}

const NotificationsHeader: React.FC<NotificationsHeaderProps> = ({
  hasUnreadNotifications,
  onMarkAllAsRead
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/hashtags')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            التنبيهات
          </h1>
          <p className="text-gray-400 text-sm mt-1">آخر الإشعارات والتحديثات</p>
        </div>
      </div>
      
      {hasUnreadNotifications && (
        <button
          onClick={onMarkAllAsRead}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <CheckCheck size={16} />
          <span className="text-sm">قراءة الكل</span>
        </button>
      )}
    </div>
  );
};

export default NotificationsHeader;
