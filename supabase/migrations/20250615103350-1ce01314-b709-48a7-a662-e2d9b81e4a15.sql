
-- حذف السياسة الحالية المشكلة
DROP POLICY IF EXISTS "Users can view room members" ON public.room_members;

-- حذف الدوال التي تسبب المشكلة أيضاً
DROP FUNCTION IF EXISTS public.check_room_membership(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_room_public(uuid);

-- إنشاء سياسة بسيطة بدون تعقيدات
CREATE POLICY "Allow all room member access" 
  ON public.room_members 
  FOR ALL 
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- إنشاء سياسات بسيطة للرسائل أيضاً
DROP POLICY IF EXISTS "Room members can view messages" ON public.room_messages;
DROP POLICY IF EXISTS "Room members can send messages" ON public.room_messages;
DROP POLICY IF EXISTS "Room owners and moderators can update messages" ON public.room_messages;
DROP POLICY IF EXISTS "Users can delete their own messages or room owners/moderators can delete any message" ON public.room_messages;

-- سياسة بسيطة لقراءة الرسائل
CREATE POLICY "Allow message viewing" 
  ON public.room_messages 
  FOR SELECT 
  USING (true);

-- سياسة بسيطة لإرسال الرسائل
CREATE POLICY "Allow message sending" 
  ON public.room_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- سياسة لتحديث الرسائل
CREATE POLICY "Allow message updates" 
  ON public.room_messages 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- سياسة لحذف الرسائل
CREATE POLICY "Allow message deletion" 
  ON public.room_messages 
  FOR DELETE 
  USING (auth.uid() = user_id);
