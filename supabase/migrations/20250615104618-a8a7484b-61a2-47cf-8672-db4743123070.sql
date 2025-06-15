
-- حذف جميع السياسات الموجودة على جدول room_members
DROP POLICY IF EXISTS "Members can view room members" ON public.room_members;
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;
DROP POLICY IF EXISTS "Owners and moderators can update members" ON public.room_members;
DROP POLICY IF EXISTS "Users can leave or be removed" ON public.room_members;

-- حذف أي سياسات أخرى قد تكون موجودة
DROP POLICY IF EXISTS "Allow select all room members" ON public.room_members;
DROP POLICY IF EXISTS "Allow insert room member" ON public.room_members;
DROP POLICY IF EXISTS "Allow update room member" ON public.room_members;
DROP POLICY IF EXISTS "Allow delete room member" ON public.room_members;

-- إنشاء سياسات جديدة مبسطة
CREATE POLICY "room_members_select_policy"
  ON public.room_members
  FOR SELECT
  USING (
    -- المستخدم يمكنه رؤية نفسه في أي غرفة
    user_id = auth.uid()
    OR 
    -- أو إذا كانت الغرفة عامة
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_members.room_id AND cr.is_private = false
    )
    OR
    -- أو إذا كان مالك الغرفة
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_members.room_id AND cr.owner_id = auth.uid()
    )
  );

-- سياسة إدراج عضو جديد
CREATE POLICY "room_members_insert_policy"
  ON public.room_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- سياسة تحديث الأعضاء
CREATE POLICY "room_members_update_policy"
  ON public.room_members
  FOR UPDATE
  USING (
    -- المالك يمكنه تحديث أي عضو
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_members.room_id AND cr.owner_id = auth.uid()
    )
    OR
    -- المستخدم يمكنه تحديث نفسه فقط
    user_id = auth.uid()
  );

-- سياسة حذف/طرد الأعضاء
CREATE POLICY "room_members_delete_policy"
  ON public.room_members
  FOR DELETE
  USING (
    -- المستخدم يمكنه مغادرة الغرفة
    user_id = auth.uid()
    OR
    -- المالك يمكنه طرد أي عضو
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_members.room_id AND cr.owner_id = auth.uid()
    )
  );
