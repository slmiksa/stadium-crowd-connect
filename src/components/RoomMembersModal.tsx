
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
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    if (isOpen && roomId) {
      fetchMembers();
      fetchRoomOwner();
      getCurrentUser();
    }
  }, [isOpen, roomId]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        console.log('Current user ID:', user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

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

      console.log('Room owner:', data.owner_id);
      setRoomOwner(data.owner_id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMembers = async () => {
    setIsLoading(true);
    console.log('=== FETCHING MEMBERS ===');
    console.log('Room ID:', roomId);
    
    try {
      // جرب استعلام مبسط أولاً لتجنب مشاكل RLS
      const { data: simpleData, error: simpleError } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId);

      console.log('Simple query result:', simpleData);
      console.log('Simple query error:', simpleError);

      // إذا فشل الاستعلام البسيط، جرب الاستعلام الكامل
      if (simpleError) {
        console.error('Simple query failed, trying full query...');
      }

      const { data, error } = await supabase
        .from('room_members')
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('joined_at', { ascending: false });

      console.log('Full query result:', data);
      console.log('Full query error:', error);

      if (error) {
        console.error('Error fetching members:', error);
        
        // إذا فشل كل شيء، جرب إدراج المستخدم الحالي يدوياً كعضو
        if (user) {
          console.log('Attempting to insert current user as member...');
          const { error: insertError } = await supabase
            .from('room_members')
            .insert({
              room_id: roomId,
              user_id: user.id,
              role: isOwner ? 'owner' : 'member'
            });
          
          if (insertError) {
            console.error('Insert error:', insertError);
          } else {
            console.log('Successfully inserted current user');
            // جرب الاستعلام مرة أخرى
            setTimeout(() => fetchMembers(), 1000);
          }
        }
        return;
      }

      console.log('Members found:', data?.length || 0);
      setMembers(data || []);
    } catch (error) {
      console.error('Error:', error);
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
        promoter_id_param: currentUserId
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
        fetchMembers();
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
        demoter_id_param: currentUserId
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
        fetchMembers();
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

      fetchMembers();
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

      fetchMembers();
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

      fetchMembers();
      onMembershipChange?.();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const isCurrentUserModerator = (): boolean => {
    return members.some(member => 
      member.user_id === currentUserId && member.role === 'moderator'
    );
  };

  const navigateToProfile = (userId: string) => {
    onClose();
    console.log('Navigating to profile - userId:', userId, 'current user:', user?.id);
    
    if (userId === user?.id) {
      console.log('Going to own profile');
      navigate('/profile');
    } else {
      console.log('Going to user profile:', `/user-profile/${userId}`);
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

  // استخدم التحقق بعدم وجود الحظر بشكل صريح (بحيث لو القيمة false أو undefined أو null فهو عضو نشط)
  const activemembers = members.filter(member => member.is_banned !== true);
  const bannedMembers = members.filter(member => member.is_banned === true);

  console.log('Active members count:', activemembers.length);
  console.log('Banned members count:', bannedMembers.length);

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
            <div className="space-y-4">
              {/* Debug Info */}
              <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
                المالك: {roomOwner}<br/>
                المستخدم الحالي: {currentUserId}<br/>
                عدد الأعضاء: {members.length}<br/>
                نشط: {activemembers.length} | محظور: {bannedMembers.length}
              </div>

              {/* Active Members */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-400">الأعضاء النشطون</h3>
                {activemembers.map((member) => (
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
                          <ModeratorBadge isModerator={member.role === 'moderator'} />
                        </div>
                        <span className="text-xs text-zinc-500">
                          انضم في {formatJoinDate(member.joined_at)}
                        </span>
                      </div>
                    </div>
                    
                    {(isOwner || isCurrentUserModerator()) && member.user_id !== roomOwner && (
                      <div className="flex items-center space-x-2">
                        {/* Promote/Demote to Moderator - Only owners can do this */}
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
                        
                        {/* Ban/Kick buttons - Both owners and moderators can do this */}
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
                
                {activemembers.length === 0 && (
                  <div className="text-center text-zinc-500 py-4">
                    لا يوجد أعضاء نشطون في الغرفة
                    <br/>
                    <small>إجمالي الأعضاء المسترجعين: {members.length}</small>
                  </div>
                )}
              </div>

              {/* Banned Members - Only show if there are any and user has permission */}
              {bannedMembers.length > 0 && (isOwner || isCurrentUserModerator()) && (
                <div className="space-y-3 pt-4 border-t border-zinc-700">
                  <h3 className="text-sm font-semibold text-zinc-400">الأعضاء المحظورون</h3>
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
