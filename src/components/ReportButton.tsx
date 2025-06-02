
import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReportModal from './ReportModal';
import { useAuth } from '@/contexts/AuthContext';

interface ReportButtonProps {
  type: 'post' | 'comment' | 'user' | 'room';
  targetId: string;
  size?: 'sm' | 'default';
  targetTitle?: string;
}

const ReportButton: React.FC<ReportButtonProps> = ({ 
  type, 
  targetId, 
  size = 'sm', 
  targetTitle 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      <Button
        variant="ghost"
        size={size}
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2"
      >
        <Flag size={size === 'sm' ? 14 : 16} />
        <span className="mr-1 text-xs">إبلاغ</span>
      </Button>

      <ReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        type={type}
        targetId={targetId}
        targetTitle={targetTitle}
      />
    </>
  );
};

export default ReportButton;
