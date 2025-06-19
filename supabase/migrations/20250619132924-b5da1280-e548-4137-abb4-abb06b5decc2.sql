
-- حذف جميع السياسات الحالية المعطلة
DROP POLICY IF EXISTS "Users can view room members" ON public.room_members;
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;
DROP POLICY IF EXISTS "Users can leave rooms or owners can manage members" ON public.room_members;
DROP POLICY IF EXISTS "Owners and moderators can update member roles" ON public.room_members;

DROP POLICY IF EXISTS "Users can view room messages" ON public.room_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.room_messages;
DROP POLICY IF EXISTS "Users can update their messages or owners can manage" ON public.room_messages;
DROP POLICY IF EXISTS "Users can delete their messages or owners can manage" ON public.room_messages;

-- إنشاء سياسات مبسطة جداً لـ room_members
CREATE POLICY "Allow all authenticated users to view room members"
  ON public.room_members
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to join rooms"
  ON public.room_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to manage their membership"
  ON public.room_members
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT owner_id FROM public.chat_rooms WHERE id = room_members.room_id
  ));

CREATE POLICY "Allow users to leave or be removed"
  ON public.room_members
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT owner_id FROM public.chat_rooms WHERE id = room_members.room_id
  ));

-- إنشاء سياسات مبسطة لـ room_messages
CREATE POLICY "Allow authenticated users to view messages"
  ON public.room_messages
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to send messages"
  ON public.room_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own messages"
  ON public.room_messages
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own messages"
  ON public.room_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- تفعيل RLS على الجداول
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- سياسة بسيطة لغرف الدردشة
DROP POLICY IF EXISTS "Allow authenticated users to view chat rooms" ON public.chat_rooms;
CREATE POLICY "Allow authenticated users to view chat rooms"
  ON public.chat_rooms
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to create chat rooms"
  ON public.chat_rooms
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Allow room owners to update their rooms"
  ON public.chat_rooms
  FOR UPDATE
  USING (auth.uid() = owner_id);
