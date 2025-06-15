
-- حذف كل السياسات المتعلقة بـ room_members
DROP POLICY IF EXISTS "Allow all room member access" ON public.room_members;
DROP POLICY IF EXISTS "Allow select all room members" ON public.room_members;

-- حذف الدوال إذا وجدت
DROP FUNCTION IF EXISTS public.is_room_public(uuid);

-- إنشاء دالة تتحقق إذا الغرفة عامة
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

-- سياسة قراءة: يمكن لأي عضو بالغرفة (أو إذا كانت الغرفة عامة) مشاهدة جميع أعضاء الغرفة
CREATE POLICY "Allow select all room members"
  ON public.room_members
  FOR SELECT
  USING (
    -- أي مستخدم عضو في الغرفة
    EXISTS (
      SELECT 1 FROM public.room_members
      WHERE room_id = room_members.room_id
      AND user_id = auth.uid()
      AND is_banned = false
    )
    OR
    -- أو إذا كانت الغرفة عامة
    public.is_room_public(room_members.room_id)
  );

-- سياسة إدراج/تحديث/حذف: فقط المستخدم نفسه
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

-- سياسات الرسائل كما هي (مبسطة)
DROP POLICY IF EXISTS "Allow message viewing" ON public.room_messages;
DROP POLICY IF EXISTS "Allow message sending" ON public.room_messages;
DROP POLICY IF EXISTS "Allow message updates" ON public.room_messages;
DROP POLICY IF EXISTS "Allow message deletion" ON public.room_messages;

CREATE POLICY "Allow message viewing" 
  ON public.room_messages 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow message sending"
  ON public.room_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow message updates"
  ON public.room_messages
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow message deletion"
  ON public.room_messages
  FOR DELETE
  USING (auth.uid() = user_id);
