
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
      console.log('🔍 البحث عن غرفة موجودة للمباراة:', match.id);

      // البحث عن غرفة موجودة لهذه المباراة
      const { data: existingRoom, error: searchError } = await supabase
        .from('match_chat_rooms')
        .select('room_id')
        .eq('match_id', match.id)
        .maybeSingle();

      if (searchError) {
        console.error('❌ خطأ في البحث عن الغرفة:', searchError);
        throw new Error('فشل في البحث عن الغرفة');
      }

      let roomId: string;

      if (existingRoom) {
        console.log('✅ تم العثور على غرفة موجودة:', existingRoom.room_id);
        roomId = existingRoom.room_id;
      } else {
        console.log('🆕 إنشاء غرفة جديدة للمباراة');
        
        // إنشاء غرفة دردشة جديدة
        const roomName = `${match.homeTeam} vs ${match.awayTeam}`;
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
        const { error: linkError } = await supabase
          .from('match_chat_rooms')
          .insert({
            room_id: roomId,
            match_id: match.id,
            match_data: match as any
          });

        if (linkError) {
          console.error('❌ خطأ في ربط الغرفة بالمباراة:', linkError);
          // نتابع حتى لو فشل الربط
        }

        // إضافة المالك كعضو في الغرفة
        const { error: memberError } = await supabase
          .from('room_members')
          .insert({
            room_id: roomId,
            user_id: user.id,
            role: 'owner'
          });

        if (memberError && memberError.code !== '23505') {
          console.error('❌ خطأ في إضافة العضو:', memberError);
          // نتابع حتى لو فشلت إضافة العضو
        }
      }

      // التأكد من أن المستخدم عضو في الغرفة
      const { data: membership, error: membershipError } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (membershipError) {
        console.error('❌ خطأ في فحص العضوية:', membershipError);
      }

      if (!membership) {
        console.log('🔗 إضافة المستخدم كعضو في الغرفة');
        const { error: joinError } = await supabase
          .from('room_members')
          .insert({
            room_id: roomId,
            user_id: user.id,
            role: 'member'
          });

        if (joinError && joinError.code !== '23505') {
          console.error('❌ خطأ في الانضمام للغرفة:', joinError);
          // نتابع حتى لو فشل الانضمام
        }
      }

      console.log('🚀 الانتقال إلى الغرفة:', roomId);
      
      // الانتقال إلى غرفة الدردشة
      navigate(`/chat-room/${roomId}`);

    } catch (error) {
      console.error('💥 خطأ عام:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
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
      {isCreatingRoom ? 'جاري المباراة...' : 'دردشة المباراة'}
      <Users size={16} className="mr-2 opacity-75" />
    </Button>
  );
};

export default MatchChatButton;
