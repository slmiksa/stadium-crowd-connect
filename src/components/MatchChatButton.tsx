
import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface MatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'live' | 'upcoming' | 'finished';
  date: string;
  competition: string;
  homeLogo?: string;
  awayLogo?: string;
  minute?: number;
}

interface MatchChatButtonProps {
  match: MatchData;
}

const MatchChatButton: React.FC<MatchChatButtonProps> = ({ match }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [existingRoom, setExistingRoom] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    if (match.id) {
      checkExistingRoom();
    }
  }, [match.id]);

  const checkExistingRoom = async () => {
    try {
      console.log('Checking for existing room for match:', match.id);
      
      const { data, error } = await supabase
        .from('match_chat_rooms')
        .select(`
          room_id,
          chat_rooms!inner (
            id,
            name,
            members_count
          )
        `)
        .eq('match_id', match.id)
        .single();

      if (!error && data) {
        console.log('Found existing room:', data);
        setExistingRoom(data.room_id);
        setMemberCount(data.chat_rooms?.members_count || 0);
      } else {
        console.log('No existing room found');
        setExistingRoom(null);
        setMemberCount(0);
      }
    } catch (error) {
      console.log('No existing room found for this match:', error);
      setExistingRoom(null);
      setMemberCount(0);
    }
  };

  const createOrJoinMatchRoom = async () => {
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول للانضمام لغرفة المباراة",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    console.log('Creating or joining room for match:', match.id);

    try {
      if (existingRoom) {
        console.log('Joining existing room:', existingRoom);
        
        // Check if user is already a member
        const { data: memberCheck } = await supabase
          .from('room_members')
          .select('id')
          .eq('room_id', existingRoom)
          .eq('user_id', user.id)
          .single();

        if (!memberCheck) {
          // Add user as room member
          const { error: memberError } = await supabase
            .from('room_members')
            .insert({
              room_id: existingRoom,
              user_id: user.id,
              role: 'member'
            });

          if (memberError) {
            console.error('Error joining room:', memberError);
          } else {
            console.log('Successfully joined existing room');
          }
        }

        navigate(`/chat-room/${existingRoom}`);
        return;
      }

      console.log('Creating new room for match');

      // Create new chat room for the match
      const roomName = `${match.homeTeam} vs ${match.awayTeam}`;
      const roomDescription = `غرفة دردشة مباراة ${match.homeTeam} ضد ${match.awayTeam} - ${match.competition}`;

      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: roomName,
          description: roomDescription,
          owner_id: user.id,
          is_private: false,
          members_count: 1
        })
        .select()
        .single();

      if (roomError) {
        console.error('Error creating room:', roomError);
        throw roomError;
      }

      console.log('Created new room:', newRoom);

      // Link the match to the chat room
      const { error: linkError } = await supabase
        .from('match_chat_rooms')
        .insert({
          match_id: match.id,
          room_id: newRoom.id,
          match_data: match
        });

      if (linkError) {
        console.error('Error linking match to room:', linkError);
        throw linkError;
      }

      // Add creator as room member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: newRoom.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error adding member:', memberError);
        throw memberError;
      }

      // Try to activate live match for the room (optional)
      try {
        await supabase
          .from('room_live_matches')
          .insert({
            room_id: newRoom.id,
            match_id: match.id,
            match_data: match,
            activated_by: user.id,
            is_active: true
          });
        console.log('Live match activated successfully');
      } catch (liveMatchError) {
        console.warn('Failed to activate live match (non-critical):', liveMatchError);
      }

      toast({
        title: "تم إنشاء الغرفة",
        description: `تم إنشاء غرفة دردشة للمباراة بنجاح`
      });

      console.log('Navigating to room:', newRoom.id);
      navigate(`/chat-room/${newRoom.id}`);

    } catch (error) {
      console.error('Error creating/joining match room:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء أو الانضمام لغرفة المباراة",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={createOrJoinMatchRoom}
      disabled={isCreating}
      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
    >
      {isCreating ? (
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
          <span>جاري المعالجة...</span>
        </div>
      ) : existingRoom ? (
        <div className="flex items-center">
          <MessageCircle size={16} className="ml-2" />
          <span>انضم للدردشة</span>
          {memberCount > 0 && (
            <>
              <Users size={14} className="mr-2" />
              <span>({memberCount})</span>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center">
          <Play size={16} className="ml-2" />
          <span>ابدأ دردشة المباراة</span>
        </div>
      )}
    </Button>
  );
};

export default MatchChatButton;
