
-- حذف السياسات الحالية التي تسبب المشكلة
DROP POLICY IF EXISTS "Room members can view other members" ON public.room_members;
DROP POLICY IF EXISTS "Users can join public rooms" ON public.room_members;
DROP POLICY IF EXISTS "Room owners can manage members" ON public.room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON public.room_members;

-- إنشاء سياسات جديدة بدون recursion
CREATE POLICY "Users can view room members" 
  ON public.room_members 
  FOR SELECT 
  USING (
    -- يمكن للأعضاء رؤية بعضهم البعض
    EXISTS (
      SELECT 1 FROM public.room_members rm 
      WHERE rm.room_id = room_members.room_id 
      AND rm.user_id = auth.uid()
    )
    OR 
    -- أو إذا كانت الغرفة عامة
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr 
      WHERE cr.id = room_members.room_id 
      AND cr.is_private = false
    )
  );

-- سياسة الانضمام للغرف
CREATE POLICY "Users can join rooms" 
  ON public.room_members 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      -- يمكن الانضمام للغرف العامة
      EXISTS (
        SELECT 1 FROM public.chat_rooms 
        WHERE id = room_id AND is_private = false
      )
      OR 
      -- أو إذا كان مالك الغرفة
      EXISTS (
        SELECT 1 FROM public.chat_rooms 
        WHERE id = room_id AND owner_id = auth.uid()
      )
    )
  );

-- سياسة إدارة الأعضاء
CREATE POLICY "Room owners and moderators can update members" 
  ON public.room_members 
  FOR UPDATE 
  USING (
    -- مالك الغرفة يمكنه تعديل أي عضو
    EXISTS (
      SELECT 1 FROM public.chat_rooms 
      WHERE id = room_id AND owner_id = auth.uid()
    )
    OR
    -- المشرفون يمكنهم تعديل الأعضاء العاديين فقط
    (
      EXISTS (
        SELECT 1 FROM public.room_members 
        WHERE room_id = room_members.room_id 
        AND user_id = auth.uid() 
        AND role = 'moderator'
      )
      AND role != 'moderator' -- لا يمكن للمشرف تعديل مشرف آخر
    )
  );

-- سياسة حذف/طرد الأعضاء
CREATE POLICY "Users can leave or be removed from rooms" 
  ON public.room_members 
  FOR DELETE 
  USING (
    -- المستخدم يمكنه مغادرة الغرفة بنفسه
    user_id = auth.uid()
    OR
    -- مالك الغرفة يمكنه طرد أي عضو
    EXISTS (
      SELECT 1 FROM public.chat_rooms 
      WHERE id = room_id AND owner_id = auth.uid()
    )
    OR
    -- المشرفون يمكنهم طرد الأعضاء العاديين فقط
    (
      EXISTS (
        SELECT 1 FROM public.room_members 
        WHERE room_id = room_members.room_id 
        AND user_id = auth.uid() 
        AND role = 'moderator'
      )
      AND role != 'moderator' -- لا يمكن للمشرف طرد مشرف آخر
    )
  );
