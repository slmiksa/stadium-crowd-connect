
import React from 'react';
import { Crown } from 'lucide-react';

interface OwnerBadgeProps {
  isOwner: boolean;
  size?: number;
}

const OwnerBadge: React.FC<OwnerBadgeProps> = ({ isOwner, size = 16 }) => {
  if (!isOwner) return null;

  return (
    <div title="منشئ الغرفة">
      <Crown 
        size={size} 
        className="text-yellow-500 ml-1" 
      />
    </div>
  );
};

export default OwnerBadge;
