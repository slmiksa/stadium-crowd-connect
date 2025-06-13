
-- حذف السياسات الحالية
DROP POLICY IF EXISTS "Room members can view messages" ON public.room_messages;
DROP POLICY IF EXISTS "Room members can send messages" ON public.room_messages;
DROP POLICY IF EXISTS "Room owners and moderators can update messages" ON public.room_messages;
DROP POLICY IF EXISTS "Users can delete their own messages or room owners/moderators can delete any message" ON public.room_messages;

-- إنشاء سياسة أساسية للقراءة (يمكن لأي عضو في الغرفة قراءة الرسائل)
CREATE POLICY "Allow reading room messages for room members" 
  ON public.room_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = room_messages.room_id 
      AND rm.user_id = auth.uid()
      AND rm.is_banned = false
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_messages.room_id 
      AND cr.owner_id = auth.uid()
    )
  );

-- إنشاء سياسة مبسطة للإدراج
CREATE POLICY "Allow inserting room messages for authenticated users" 
  ON public.room_messages 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

-- إنشاء سياسة للتحديث
CREATE POLICY "Allow updating messages for owners and moderators" 
  ON public.room_messages 
  FOR UPDATE 
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_messages.room_id 
      AND cr.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = room_messages.room_id 
      AND rm.user_id = auth.uid()
      AND rm.role = 'moderator'
    )
  );

-- إنشاء سياسة للحذف
CREATE POLICY "Allow deleting own messages or by owners/moderators" 
  ON public.room_messages 
  FOR DELETE 
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_messages.room_id 
      AND cr.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = room_messages.room_id 
      AND rm.user_id = auth.uid()
      AND rm.role = 'moderator'
    )
  );

-- إضافة bucket التخزين إذا لم يكن موجوداً
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hashtag-images', 'hashtag-images', true)
ON CONFLICT (id) DO NOTHING;

-- حذف سياسات التخزين الموجودة وإعادة إنشاؤها
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to view files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- إنشاء سياسات التخزين
CREATE POLICY "Allow authenticated users to upload files" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow public access to view files" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'hashtag-images');

CREATE POLICY "Allow users to update their own files" 
  ON storage.objects 
  FOR UPDATE 
  USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own files" 
  ON storage.objects 
  FOR DELETE 
  USING (auth.uid()::text = (storage.foldername(name))[1]);
