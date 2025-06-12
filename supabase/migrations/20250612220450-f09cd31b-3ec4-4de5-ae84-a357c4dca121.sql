
-- إضافة عمود media_type و media_url إلى جدول hashtag_comments
ALTER TABLE public.hashtag_comments 
ADD COLUMN IF NOT EXISTS media_type TEXT,
ADD COLUMN IF NOT EXISTS media_url TEXT;
