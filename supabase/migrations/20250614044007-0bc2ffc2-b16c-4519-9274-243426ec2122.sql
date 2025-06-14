
-- إضافة سياسات Row Level Security لجدول room_live_matches
-- السماح لجميع أعضاء الغرفة برؤية المباريات المباشرة
DROP POLICY IF EXISTS "Room members can view live matches" ON public.room_live_matches;
DROP POLICY IF EXISTS "Room owners and moderators can manage live matches" ON public.room_live_matches;

-- سياسة للسماح لجميع أعضاء الغرفة برؤية المباريات المباشرة
CREATE POLICY "Room members can view live matches" 
  ON public.room_live_matches 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_id = room_live_matches.room_id 
      AND user_id = auth.uid()
      AND is_banned = false
    )
  );

-- سياسة للسماح لمالكي الغرف والمشرفين بإدارة المباريات المباشرة
CREATE POLICY "Room owners and moderators can manage live matches" 
  ON public.room_live_matches 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      LEFT JOIN public.room_members rm ON rm.room_id = cr.id AND rm.user_id = auth.uid()
      WHERE cr.id = room_live_matches.room_id 
      AND (cr.owner_id = auth.uid() OR rm.role = 'moderator')
      AND rm.is_banned = false
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      LEFT JOIN public.room_members rm ON rm.room_id = cr.id AND rm.user_id = auth.uid()
      WHERE cr.id = room_live_matches.room_id 
      AND (cr.owner_id = auth.uid() OR rm.role = 'moderator')
      AND rm.is_banned = false
    )
  );

-- إضافة الجدول إلى منشورات real-time للتحديثات الفورية
ALTER TABLE public.room_live_matches REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.room_live_matches;
