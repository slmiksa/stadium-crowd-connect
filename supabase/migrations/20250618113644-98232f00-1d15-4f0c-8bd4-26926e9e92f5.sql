
-- حذف السياسات الحالية المعطلة
DROP POLICY IF EXISTS "Allow reading room messages for room members" ON public.room_messages;
DROP POLICY IF EXISTS "Allow inserting room messages for authenticated users" ON public.room_messages;
DROP POLICY IF EXISTS "Allow updating messages for owners and moderators" ON public.room_messages;
DROP POLICY IF EXISTS "Allow deleting own messages or by owners/moderators" ON public.room_messages;

-- حذف سياسات room_members المشكلة
DROP POLICY IF EXISTS "Room members can view live matches" ON public.room_live_matches;
DROP POLICY IF EXISTS "Room owners and moderators can manage live matches" ON public.room_live_matches;

-- إنشاء سياسات جديدة مبسطة لـ room_members
CREATE POLICY "Users can view room members" 
  ON public.room_members 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can join rooms" 
  ON public.room_members 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms or owners can manage members" 
  ON public.room_members 
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_members.room_id 
      AND cr.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners and moderators can update member roles" 
  ON public.room_members 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_members.room_id 
      AND cr.owner_id = auth.uid()
    )
  );

-- إنشاء سياسات جديدة مبسطة لـ room_messages
CREATE POLICY "Users can view room messages" 
  ON public.room_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_messages.room_id 
      AND (
        cr.is_private = false 
        OR cr.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.room_members rm
          WHERE rm.room_id = cr.id 
          AND rm.user_id = auth.uid()
          AND rm.is_banned = false
        )
      )
    )
  );

CREATE POLICY "Users can send messages" 
  ON public.room_messages 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.chat_rooms cr
        WHERE cr.id = room_messages.room_id 
        AND cr.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.room_members rm
        WHERE rm.room_id = room_messages.room_id 
        AND rm.user_id = auth.uid()
        AND rm.is_banned = false
      )
    )
  );

CREATE POLICY "Users can update their messages or owners can manage" 
  ON public.room_messages 
  FOR UPDATE 
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_messages.room_id 
      AND cr.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their messages or owners can manage" 
  ON public.room_messages 
  FOR DELETE 
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_messages.room_id 
      AND cr.owner_id = auth.uid()
    )
  );

-- إصلاح سياسات room_live_matches
CREATE POLICY "Users can view live matches in accessible rooms" 
  ON public.room_live_matches 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_live_matches.room_id 
      AND (
        cr.is_private = false 
        OR cr.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.room_members rm
          WHERE rm.room_id = cr.id 
          AND rm.user_id = auth.uid()
          AND rm.is_banned = false
        )
      )
    )
  );

CREATE POLICY "Room owners can manage live matches" 
  ON public.room_live_matches 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_live_matches.room_id 
      AND cr.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_live_matches.room_id 
      AND cr.owner_id = auth.uid()
    )
  );
