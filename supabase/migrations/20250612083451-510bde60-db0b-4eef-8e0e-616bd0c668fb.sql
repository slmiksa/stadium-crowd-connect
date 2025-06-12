
-- إضافة جدول لتتبع مشاركة المنشورات للمتابعين
CREATE TABLE IF NOT EXISTS public.post_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.hashtag_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_to TEXT NOT NULL, -- 'followers' أو 'external'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, shared_to)
);

-- تفعيل RLS للجدول
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح للمستخدمين بعرض مشاركاتهم
CREATE POLICY "Users can view their own post shares" 
  ON public.post_shares 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- سياسة للسماح للمستخدمين بإنشاء مشاركات
CREATE POLICY "Users can create post shares" 
  ON public.post_shares 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- إضافة دالة لإنشاء تنبيهات مشاركة المنشورات
CREATE OR REPLACE FUNCTION public.create_post_share_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- إنشاء تنبيه للمتابعين عند مشاركة منشور
  IF NEW.shared_to = 'followers' THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      f.follower_id,
      'post_share',
      'مشاركة منشور',
      COALESCE(p.username, 'مستخدم مجهول') || ' شارك منشوراً معك',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'sharer_id', NEW.user_id,
        'share_type', NEW.shared_to
      )
    FROM follows f
    JOIN profiles p ON p.id = NEW.user_id
    WHERE f.following_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء المحفز للتنبيهات
CREATE TRIGGER post_share_notification_trigger
  AFTER INSERT ON public.post_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.create_post_share_notification();

-- إضافة عمود لعدد المشاركات في جدول المنشورات
ALTER TABLE public.hashtag_posts 
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- دالة لتحديث عداد المشاركات
CREATE OR REPLACE FUNCTION public.update_shares_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.hashtag_posts 
    SET shares_count = shares_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.hashtag_posts 
    SET shares_count = shares_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- محفز لتحديث عداد المشاركات
CREATE TRIGGER update_shares_count_trigger
  AFTER INSERT OR DELETE ON public.post_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shares_count();
