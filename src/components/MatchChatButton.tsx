
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Users } from 'lucide-react';

interface Match {
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
  match: Match;
}

const MatchChatButton: React.FC<MatchChatButtonProps> = ({ match }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const createOrJoinMatchRoom = async () => {
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول للدردشة",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingRoom(true);

    try {
      console.log('🔍 البحث عن غرفة دردشة للمباراة:', match.id);

      // البحث عن غرفة موجودة للمباراة
      const { data: existingRoom, error: searchError } = await supabase
        .from('match_chat_rooms')
        .select('room_id')
        .eq('match_id', match.id)
        .single();

      let roomId: string;

      if (existingRoom && !searchError) {
        console.log('✅ تم العثور على غرفة موجودة:', existingRoom.room_id);
        roomId = existingRoom.room_id;
      } else {
        console.log('🆕 إنشاء غرفة جديدة للمباراة');
        
        // إنشاء غرفة دردشة جديدة
        const roomName = `${match.homeTeam} ضد ${match.awayTeam}`;
        const roomDescription = `غرفة دردشة مباراة ${match.competition}`;

        const { data: newRoom, error: roomError } = await supabase
          .from('chat_rooms')
          .insert({
            name: roomName,
            description: roomDescription,
            is_private: false,
            password: null,
            owner_id: user.id,
            members_count: 1
          })
          .select('id')
          .single();

        if (roomError) {
          console.error('❌ خطأ في إنشاء الغرفة:', roomError);
          throw new Error('فشل في إنشاء غرفة الدردشة');
        }

        roomId = newRoom.id;
        console.log('✅ تم إنشاء الغرفة بنجاح:', roomId);

        // ربط الغرفة بالمباراة
        await supabase
          .from('match_chat_rooms')
          .insert({
            room_id: roomId,
            match_id: match.id,
            match_data: match as any
          });

        // إضافة المالك كعضو في الغرفة
        await supabase
          .from('room_members')
          .insert({
            room_id: roomId,
            user_id: user.id,
            role: 'owner'
          });
      }

      // التأكد من أن المستخدم عضو في الغرفة
      const { data: membership } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        console.log('🔗 إضافة المستخدم كعضو في الغرفة');
        await supabase
          .from('room_members')
          .insert({
            room_id: roomId,
            user_id: user.id,
            role: 'member'
          });
      }

      console.log('🚀 الانتقال إلى الغرفة:', roomId);
      
      // الانتقال إلى غرفة الدردشة
      navigate(`/chat-room/${roomId}`);

    } catch (error) {
      console.error('💥 خطأ عام:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء أو الانضمام لغرفة المباراة",
        variant: "destructive"
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <Button
      onClick={createOrJoinMatchRoom}
      disabled={isCreatingRoom}
      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white transition-all duration-200"
    >
      <MessageSquare size={18} className="ml-2" />
      {isCreatingRoom ? 'جاري التحضير...' : 'دردشة المباراة'}
      <Users size={16} className="mr-2 opacity-75" />
    </Button>
  );
};

export default MatchChatButton;
