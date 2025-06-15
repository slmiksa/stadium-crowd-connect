
-- حذف السياسات المسببة للتضارب أو الأخطاء القديمة
DROP POLICY IF EXISTS "Allow message viewing" ON public.room_messages;
DROP POLICY IF EXISTS "Allow message sending" ON public.room_messages;
DROP POLICY IF EXISTS "Allow message updates" ON public.room_messages;
DROP POLICY IF EXISTS "Allow message deletion" ON public.room_messages;

DROP POLICY IF EXISTS "Allow select all room members" ON public.room_members;
DROP POLICY IF EXISTS "Allow insert room member" ON public.room_members;
DROP POLICY IF EXISTS "Allow update room member" ON public.room_members;
DROP POLICY IF EXISTS "Allow delete room member" ON public.room_members;

DROP FUNCTION IF EXISTS public.is_room_public(uuid);

-- دالة تحقق إذا الغرفة عامة
CREATE OR REPLACE FUNCTION public.is_room_public(room_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE id = room_id_param AND is_private = false
  );
$$;
-- دالة تتحقق أن المستخدم عضو غير محظور في غرفة
CREATE OR REPLACE FUNCTION public.is_room_member(room_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = room_id_param AND user_id = user_id_param AND is_banned = false
  );
$$;

-- سياسة قراءة room_members: أي عضو نشط أو في غرفة عامة
CREATE POLICY "Allow select all room members"
  ON public.room_members
  FOR SELECT
  USING (
    public.is_room_member(room_members.room_id, auth.uid())
    OR public.is_room_public(room_members.room_id)
  );

-- سياسة INSERT/UPDATE/DELETE: فقط للمستخدم نفسه
CREATE POLICY "Allow insert room member"
  ON public.room_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update room member"
  ON public.room_members
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow delete room member"
  ON public.room_members
  FOR DELETE
  USING (auth.uid() = user_id);

-- سياسة قراءة room_messages: أي عضو نشط فقط
CREATE POLICY "Room members can view messages" 
  ON public.room_messages 
  FOR SELECT 
  USING (
    public.is_room_member(room_messages.room_id, auth.uid())
  );

-- سياسة إرسال الرسائل كالعادة
CREATE POLICY "Room members can send messages"
  ON public.room_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_room_member(room_messages.room_id, auth.uid())
  );

-- سياسة تحديث الرسائل (يمكن ممكن التوسعة في السياسات لاحقًا)
CREATE POLICY "Allow message updates"
  ON public.room_messages
  FOR UPDATE
  USING (auth.uid() = user_id);

-- سياسة حذف الرسائل
CREATE POLICY "Allow message deletion"
  ON public.room_messages
  FOR DELETE
  USING (auth.uid() = user_id);

