
import React, { useState } from 'react';
import { X, Lock, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RoomPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  onPasswordSubmit: (password: string) => void;
  isLoading?: boolean;
}

const RoomPasswordModal: React.FC<RoomPasswordModalProps> = ({
  isOpen,
  onClose,
  roomName,
  onPasswordSubmit,
  isLoading = false
}) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onPasswordSubmit(password.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-bold text-white flex items-center">
            <Lock size={20} className="mr-2 text-yellow-500" />
            غرفة خاصة
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key size={32} className="text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {roomName}
            </h3>
            <p className="text-zinc-400">
              هذه غرفة خاصة. يرجى إدخال كلمة السر للدخول.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة السر"
                className="bg-zinc-800 border-zinc-700 text-white text-center text-lg"
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-zinc-700 border-zinc-600 hover:bg-zinc-600"
                disabled={isLoading}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={!password.trim() || isLoading}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {isLoading ? 'جاري التحقق...' : 'دخول'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomPasswordModal;
