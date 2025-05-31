
import React from 'react';
import { Megaphone } from 'lucide-react';

interface ChatRoomAnnouncementProps {
  announcement: string;
}

const ChatRoomAnnouncement: React.FC<ChatRoomAnnouncementProps> = ({ announcement }) => {
  return (
    <div className="bg-blue-600 border-b border-blue-500 p-3">
      <div className="flex items-start space-x-3">
        <Megaphone size={18} className="text-blue-100 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-blue-50 text-sm font-medium mb-1">إعلان الغرفة</p>
          <p className="text-blue-100 text-sm leading-relaxed">
            {announcement}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatRoomAnnouncement;
