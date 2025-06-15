
-- أولاً، سنضيف دالة مساعدة للتحقق مما إذا كان المستخدم محظوراً أم لا
CREATE OR REPLACE FUNCTION public.is_not_banned(user_id_to_check uuid)
RETURNS boolean AS $$
DECLARE
  banned_status boolean;
BEGIN
  SELECT is_banned INTO banned_status FROM public.profiles WHERE id = user_id_to_check;
  IF banned_status IS TRUE THEN
    RETURN false;
  END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- تفعيل سياسات الأمان على جدول المنشورات
ALTER TABLE public.hashtag_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for everyone on posts" ON public.hashtag_posts FOR SELECT USING (true);
CREATE POLICY "Allow users to manage their own posts if not banned" ON public.hashtag_posts FOR ALL
  USING (auth.uid() = user_id AND public.is_not_banned(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_not_banned(auth.uid()));

-- تفعيل سياسات الأمان على جدول التعليقات
ALTER TABLE public.hashtag_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for everyone on comments" ON public.hashtag_comments FOR SELECT USING (true);
CREATE POLICY "Allow users to manage their own comments if not banned" ON public.hashtag_comments FOR ALL
  USING (auth.uid() = user_id AND public.is_not_banned(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_not_banned(auth.uid()));

-- تفعيل سياسات الأمان على جدول الإعجابات
ALTER TABLE public.hashtag_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for everyone on likes" ON public.hashtag_likes FOR SELECT USING (true);
CREATE POLICY "Allow users to manage their own likes if not banned" ON public.hashtag_likes FOR ALL
  USING (auth.uid() = user_id AND public.is_not_banned(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_not_banned(auth.uid()));

-- تفعيل سياسات الأمان على جدول الرسائل الخاصة
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own private messages" ON public.private_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send private messages if not banned" ON public.private_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND public.is_not_banned(auth.uid()));

-- تفعيل سياسات الأمان على جدول رسائل غرف الدردشة
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room members can read messages" ON public.room_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_members WHERE room_id = room_messages.room_id AND user_id = auth.uid())
);
CREATE POLICY "Non-banned room members can send messages" ON public.room_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  public.is_not_banned(auth.uid()) AND
  EXISTS (SELECT 1 FROM public.room_members WHERE room_id = room_messages.room_id AND user_id = auth.uid() AND is_banned = false)
);

-- تفعيل سياسات الأمان على جدول أعضاء الغرف
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see members of rooms they are in" ON public.room_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.chat_rooms cr WHERE cr.id = room_members.room_id AND cr.is_private = false)
);
CREATE POLICY "Non-banned users can join or leave rooms" ON public.room_members FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (public.is_not_banned(auth.uid()));

-- تفعيل سياسات الأمان على جدول المتابعات
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for everyone on follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Non-banned users can follow and unfollow" ON public.follows FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (public.is_not_banned(auth.uid()));
