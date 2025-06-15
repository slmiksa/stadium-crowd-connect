
-- حذف السياسة المشكلة
DROP POLICY IF EXISTS "Users can view room members" ON public.room_members;

-- إنشاء دالة آمنة للتحقق من عضوية الغرفة
CREATE OR REPLACE FUNCTION public.check_room_membership(room_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members 
    WHERE room_id = room_id_param 
    AND user_id = user_id_param
    AND is_banned = false
  );
$$;

-- إنشاء دالة للتحقق من كون الغرفة عامة
CREATE OR REPLACE FUNCTION public.is_room_public(room_id_param uuid)
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_rooms 
    WHERE id = room_id_param 
    AND is_private = false
  );
$$;

-- إنشاء سياسة جديدة باستخدام الدوال الآمنة
CREATE POLICY "Users can view room members" 
  ON public.room_members 
  FOR SELECT 
  USING (
    -- المستخدم عضو في الغرفة
    public.check_room_membership(room_id, auth.uid())
    OR 
    -- أو الغرفة عامة
    public.is_room_public(room_id)
  );
