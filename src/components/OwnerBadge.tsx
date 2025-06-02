
import React from 'react';
import { Crown } from 'lucide-react';

interface OwnerBadgeProps {
  isOwner: boolean;
  verificationStatus?: string;
  size?: number;
}

const OwnerBadge: React.FC<OwnerBadgeProps> = ({ 
  isOwner, 
  size = 16 
}) => {
  if (!isOwner) return null;

  return (
    <div className="inline-flex items-center bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded-md text-xs border border-yellow-600/30">
      <Crown size={12} className="mr-1" />
      <span>مالك الغرفة</span>
    </div>
  );
};

export default OwnerBadge;
