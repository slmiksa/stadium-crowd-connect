
import React from 'react';
import { Star, Award, Crown, Gem } from 'lucide-react';

interface VerificationBadgeProps {
  verificationStatus: string | null;
  size?: number;
  showLabel?: boolean;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  verificationStatus, 
  size = 16, 
  showLabel = false 
}) => {
  if (!verificationStatus || verificationStatus === 'none') {
    return null;
  }

  const getVerificationConfig = (status: string) => {
    switch (status) {
      case 'bronze':
        return {
          icon: Star,
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
          label: 'برونزي',
          description: '20+ متابع'
        };
      case 'silver':
        return {
          icon: Award,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          label: 'فضي',
          description: '180+ متابع'
        };
      case 'gold':
        return {
          icon: Crown,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          label: 'ذهبي',
          description: '500+ متابع'
        };
      case 'diamond':
        return {
          icon: Gem,
          color: 'text-blue-500',
          bgColor: 'bg-blue-100',
          label: 'ماسي',
          description: '1000+ متابع'
        };
      default:
        return null;
    }
  };

  const config = getVerificationConfig(verificationStatus);
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <div className="inline-flex items-center gap-1" title={`${config.label} - ${config.description}`}>
      <div className={`rounded-full p-1 ${config.bgColor}`}>
        <IconComponent size={size} className={config.color} />
      </div>
      {showLabel && (
        <span className={`text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default VerificationBadge;
