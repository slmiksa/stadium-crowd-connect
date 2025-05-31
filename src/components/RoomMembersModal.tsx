
import React, { useState, useEffect } from 'react';
import { X, Crown, UserX, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Member {
  id: string;
  user_id: string;
  joined_at: string;
  is_banned: boolean;
  profiles: {
    username: string;
    avatar_url?: string;
  };
}

interface RoomMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  isOwner: boolean;
}

const RoomMembersModal: React.FC<RoomMembersModalProps> = ({
  isOpen,
  onClose,
  roomId,
  isOwner
}) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [roomOwner, setRoomOwner] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && roomId) {
      fetchMembers();
      fetchRoomOwner();
    }
  }, [isOpen, roomId]);

  const fetchRoomOwner = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('owner_id')
        .eq('id', roomId)
        .single();

      if (error) {
        console.error('Error fetching room owner:', error);
        return;
      }

      setRoomOwner(data.owner_id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching members:', error);
        return;
      }

      setMembers(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const banMember = async (userId: string) => {
    if (!isOwner || userId === roomOwner) return;

    try {
      const { error } = await supabase
        .from('room_members')
        .update({ is_banned: true })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error banning member:', error);
        return;
      }

      fetchMembers();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const unbanMember = async (userId: string) => {
    if (!isOwner || userId === roomOwner) return;

    try {
      const { error } = await supabase
        .from('room_members')
        .update({ is_banned: false })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unbanning member:', error);
        return;
      }

      fetchMembers();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const kickMember = async (userId: string) => {
    if (!isOwner || userId === roomOwner) return;

    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error kicking member:', error);
        return;
      }

      fetchMembers();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const navigateToProfile = (userId: string) => {
    onClose();
    navigate(`/user/${userId}`);
  };

  const formatJoinDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg max-w-md w-full max-h-96">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-bold text-white">أعضاء الغرفة</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Members List */}
        <div className="p-4 overflow-y-auto max-h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer hover:bg-zinc-800 rounded-lg p-2 transition-colors flex-1"
                    onClick={() => navigateToProfile(member.user_id)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.profiles?.avatar_url} alt={member.profiles?.username} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {member.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white">
                          {member.profiles?.username || 'مستخدم مجهول'}
                        </span>
                        {member.user_id === roomOwner && (
                          <Crown size={16} className="text-yellow-500" />
                        )}
                        {member.is_banned && (
                          <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">محظور</span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">
                        انضم في {formatJoinDate(member.joined_at)}
                      </span>
                    </div>
                  </div>
                  
                  {isOwner && member.user_id !== roomOwner && (
                    <div className="flex items-center space-x-2">
                      {member.is_banned ? (
                        <button
                          onClick={() => unbanMember(member.user_id)}
                          className="p-2 text-green-400 hover:bg-green-900/20 rounded-lg transition-colors"
                          title="فك الحظر"
                        >
                          <Ban size={16} />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => banMember(member.user_id)}
                            className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                            title="حظر"
                          >
                            <Ban size={16} />
                          </button>
                          <button
                            onClick={() => kickMember(member.user_id)}
                            className="p-2 text-orange-400 hover:bg-orange-900/20 rounded-lg transition-colors"
                            title="طرد"
                          >
                            <UserX size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {members.length === 0 && (
                <div className="text-center text-zinc-500 py-8">
                  لا يوجد أعضاء في الغرفة
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomMembersModal;
