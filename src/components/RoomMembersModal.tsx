import React, { useState, useEffect } from 'react';
import { X, Crown, UserX, Ban, Shield, ShieldOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ModeratorBadge from './ModeratorBadge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Member {
  id: string;
  user_id: string;
  room_id: string;
  joined_at: string;
  is_banned: boolean;
  role: string;
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
  onMembershipChange?: () => void;
}

const RoomMembersModal: React.FC<RoomMembersModalProps> = ({
  isOpen,
  onClose,
  roomId,
  isOwner,
  onMembershipChange
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [roomOwner, setRoomOwner] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && roomId) {
      fetchRoomData();
    }
  }, [isOpen, roomId]);

  const fetchRoomData = async () => {
    setIsLoading(true);
    try {
      // Fetch room owner and members in parallel
      const [roomResponse, membersResponse] = await Promise.all([
        supabase
          .from('chat_rooms')
          .select('owner_id')
          .eq('id', roomId)
          .single(),
        supabase
          .from('room_members')
          .select(`
            *,
            profiles (username, avatar_url)
          `)
          .eq('room_id', roomId)
          .order('joined_at', { ascending: false })
      ]);

      if (roomResponse.error) {
        console.error('Error fetching room owner:', roomResponse.error);
        return;
      }

      if (membersResponse.error) {
        console.error('Error fetching members:', membersResponse.error);
        return;
      }

      const ownerId = roomResponse.data.owner_id;
      setRoomOwner(ownerId);

      let allMembers = membersResponse.data || [];

      // Check if owner is in members list
      const ownerInMembers = allMembers.find(member => member.user_id === ownerId);
      
      if (!ownerInMembers) {
        // Fetch owner profile
        const { data: ownerProfile, error: ownerError } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', ownerId)
          .single();

        if (!ownerError && ownerProfile) {
          // Add owner as first member with proper type structure
          const ownerMember: Member = {
            id: `owner-${ownerId}`,
            user_id: ownerId,
            room_id: roomId,
            joined_at: new Date().toISOString(),
            is_banned: false,
            role: 'owner',
            profiles: {
              username: ownerProfile.username,
              avatar_url: ownerProfile.avatar_url
            }
          };
          
          allMembers = [ownerMember, ...allMembers];
        }
      } else {
        // Update owner's role in the list
        allMembers = allMembers.map(member => 
          member.user_id === ownerId 
            ? { ...member, role: 'owner' }
            : member
        );
      }

      console.log('Members fetched successfully:', allMembers.length, 'members');
      setMembers(allMembers);
      
    } catch (error) {
      console.error('Error in fetchRoomData:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب قائمة الأعضاء",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const promoteToModerator = async (userId: string) => {
    if (!isOwner || userId === roomOwner) return;

    try {
      const { data, error } = await supabase.rpc('promote_to_moderator', {
        room_id_param: roomId,
        user_id_param: userId,
        promoter_id_param: user?.id
      });

      if (error) {
        console.error('Error promoting to moderator:', error);
        toast({
          title: "خطأ",
          description: "فشل في ترقية العضو",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        toast({
          title: "تم بنجاح",
          description: "تم ترقية العضو إلى مشرف"
        });
        fetchRoomData();
        onMembershipChange?.();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const demoteFromModerator = async (userId: string) => {
    if (!isOwner || userId === roomOwner) return;

    try {
      const { data, error } = await supabase.rpc('demote_from_moderator', {
        room_id_param: roomId,
        user_id_param: userId,
        demoter_id_param: user?.id
      });

      if (error) {
        console.error('Error demoting from moderator:', error);
        toast({
          title: "خطأ",
          description: "فشل في تنزيل رتبة العضو",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        toast({
          title: "تم بنجاح",
          description: "تم تنزيل رتبة العضو من مشرف"
        });
        fetchRoomData();
        onMembershipChange?.();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const banMember = async (userId: string) => {
    if ((!isOwner && !isCurrentUserModerator()) || userId === roomOwner) return;

    try {
      const { error } = await supabase
        .from('room_members')
        .update({ is_banned: true })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error banning member:', error);
        toast({
          title: "خطأ",
          description: "فشل في حظر العضو",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "تم الحظر",
        description: "تم حظر العضو من الغرفة"
      });

      fetchRoomData();
      onMembershipChange?.();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const unbanMember = async (userId: string) => {
    if ((!isOwner && !isCurrentUserModerator()) || userId === roomOwner) return;

    try {
      const { error } = await supabase
        .from('room_members')
        .update({ is_banned: false })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unbanning member:', error);
        toast({
          title: "خطأ",
          description: "فشل في إلغاء حظر العضو",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "تم الإلغاء",
        description: "تم إلغاء حظر العضو"
      });

      fetchRoomData();
      onMembershipChange?.();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const kickMember = async (userId: string) => {
    if ((!isOwner && !isCurrentUserModerator()) || userId === roomOwner) return;

    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error kicking member:', error);
        toast({
          title: "خطأ",
          description: "فشل في طرد العضو",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "تم الطرد",
        description: "تم طرد العضو من الغرفة"
      });

      fetchRoomData();
      onMembershipChange?.();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const isCurrentUserModerator = (): boolean => {
    return members.some(member => 
      member.user_id === user?.id && member.role === 'moderator'
    );
  };

  const navigateToProfile = (userId: string) => {
    onClose();
    
    if (userId === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/user-profile/${userId}`);
    }
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

  const activeMembers = members.filter(member => member.is_banned !== true);
  const bannedMembers = members.filter(member => member.is_banned === true);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg max-w-md w-full max-h-96">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-bold text-white">أعضاء الغرفة</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-400">الأعضاء النشطون ({activeMembers.length})</h3>
                {activeMembers.map((member) => (
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
                          {(member.user_id === roomOwner || member.role === 'owner') && (
                            <Crown size={16} className="text-yellow-500" />
                          )}
                          <ModeratorBadge isModerator={member.role === 'moderator'} />
                        </div>
                        <span className="text-xs text-zinc-500">
                          {member.user_id === roomOwner ? 'مؤسس الغرفة' : `انضم في ${formatJoinDate(member.joined_at)}`}
                        </span>
                      </div>
                    </div>
                    
                    {(isOwner || isCurrentUserModerator()) && member.user_id !== roomOwner && member.role !== 'owner' && (
                      <div className="flex items-center space-x-2">
                        {isOwner && (
                          <>
                            {member.role === 'moderator' ? (
                              <button
                                onClick={() => demoteFromModerator(member.user_id)}
                                className="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="إزالة صلاحيات المشرف"
                              >
                                <ShieldOff size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => promoteToModerator(member.user_id)}
                                className="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="ترقية لمشرف"
                              >
                                <Shield size={16} />
                              </button>
                            )}
                          </>
                        )}
                        
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
                      </div>
                    )}
                  </div>
                ))}
                
                {activeMembers.length === 0 && (
                  <div className="text-center text-zinc-500 py-4">
                    <p>لا يوجد أعضاء نشطون في الغرفة</p>
                  </div>
                )}
              </div>

              {bannedMembers.length > 0 && (isOwner || isCurrentUserModerator()) && (
                <div className="space-y-3 pt-4 border-t border-zinc-700">
                  <h3 className="text-sm font-semibold text-zinc-400">الأعضاء المحظورون ({bannedMembers.length})</h3>
                  {bannedMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div 
                        className="flex items-center space-x-3 cursor-pointer hover:bg-zinc-800 rounded-lg p-2 transition-colors flex-1 opacity-60"
                        onClick={() => navigateToProfile(member.user_id)}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.profiles?.avatar_url} alt={member.profiles?.username} />
                          <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                            {member.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white line-through">
                              {member.profiles?.username || 'مستخدم مجهول'}
                            </span>
                            <span className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">محظور</span>
                          </div>
                        </div>
                      </div>
                      
                      {(isOwner || isCurrentUserModerator()) && (
                        <button
                          onClick={() => unbanMember(member.user_id)}
                          className="p-2 text-green-400 hover:bg-green-900/20 rounded-lg transition-colors"
                          title="إلغاء الحظر"
                        >
                          <ShieldOff size={16} />
                        </button>
                      )}
                    </div>
                  ))}
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
