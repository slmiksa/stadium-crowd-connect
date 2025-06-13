
-- إصلاح سياسات Row Level Security لجدول room_messages
DROP POLICY IF EXISTS "Room members can view messages" ON public.room_messages;
DROP POLICY IF EXISTS "Room members can send messages" ON public.room_messages;

-- إنشاء سياسة جديدة للقراءة
CREATE POLICY "Room members can view messages" 
  ON public.room_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_id = room_messages.room_id 
      AND user_id = auth.uid()
      AND is_banned = false
    )
  );

-- إنشاء سياسة جديدة للإدراج
CREATE POLICY "Room members can send messages" 
  ON public.room_messages 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_id = room_messages.room_id 
      AND user_id = auth.uid()
      AND is_banned = false
    )
  );

-- إنشاء سياسة للتحديث (للرسائل المثبتة)
CREATE POLICY "Room owners and moderators can update messages" 
  ON public.room_messages 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      LEFT JOIN public.room_members rm ON rm.room_id = cr.id AND rm.user_id = auth.uid()
      WHERE cr.id = room_messages.room_id 
      AND (cr.owner_id = auth.uid() OR rm.role = 'moderator')
    )
  );

-- إنشاء سياسة للحذف
CREATE POLICY "Users can delete their own messages or room owners/moderators can delete any message" 
  ON public.room_messages 
  FOR DELETE 
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      LEFT JOIN public.room_members rm ON rm.room_id = cr.id AND rm.user_id = auth.uid()
      WHERE cr.id = room_messages.room_id 
      AND (cr.owner_id = auth.uid() OR rm.role = 'moderator')
    )
  );
