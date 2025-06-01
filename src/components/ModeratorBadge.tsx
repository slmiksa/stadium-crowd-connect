
import React from 'react';
import { Shield } from 'lucide-react';

interface ModeratorBadgeProps {
  isModerator: boolean;
}

const ModeratorBadge: React.FC<ModeratorBadgeProps> = ({ isModerator }) => {
  if (!isModerator) return null;

  return (
    <div className="inline-flex items-center bg-blue-600/20 text-blue-400 px-2 py-1 rounded-md text-xs border border-blue-600/30">
      <Shield size={12} className="mr-1" />
      <span>مشرف</span>
    </div>
  );
};

export default ModeratorBadge;
