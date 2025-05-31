
import React from 'react';
import { Crown } from 'lucide-react';
import VerificationBadge from './VerificationBadge';

interface OwnerBadgeProps {
  isOwner: boolean;
  verificationStatus?: string;
  size?: number;
}

const OwnerBadge: React.FC<OwnerBadgeProps> = ({ 
  isOwner, 
  verificationStatus,
  size = 16 
}) => {
  return (
    <div className="flex items-center gap-1">
      {isOwner && (
        <div title="منشئ الغرفة">
          <Crown 
            size={size} 
            className="text-yellow-500" 
          />
        </div>
      )}
      <VerificationBadge 
        verificationStatus={verificationStatus} 
        size={size} 
      />
    </div>
  );
};

export default OwnerBadge;
