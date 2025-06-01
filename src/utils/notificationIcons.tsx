
import React from 'react';
import { Heart, MessageCircle, User, Bell, FileText, Users, MessageSquare, Mail } from 'lucide-react';

export const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like':
      return <Heart size={20} className="text-red-400" />;
    case 'comment':
      return <MessageCircle size={20} className="text-blue-400" />;
    case 'follow':
      return <User size={20} className="text-green-400" />;
    case 'message':
      return <Bell size={20} className="text-purple-400" />;
    case 'post':
      return <FileText size={20} className="text-yellow-400" />;
    case 'follower_comment':
      return <Users size={20} className="text-cyan-400" />;
    case 'chat_room':
      return <MessageSquare size={20} className="text-orange-400" />;
    case 'room_invitation':
      return <Mail size={20} className="text-pink-400" />;
    default:
      return <Bell size={20} className="text-gray-400" />;
  }
};
