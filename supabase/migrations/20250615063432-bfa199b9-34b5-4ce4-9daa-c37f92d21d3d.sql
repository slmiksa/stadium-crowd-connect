
-- أولاً: حذف جميع التقارير المرتبطة بمنشورات في reports
DELETE FROM public.reports WHERE reported_post_id IS NOT NULL;

-- ثانياً: حذف جميع المنشورات من hashtag_posts
DELETE FROM public.hashtag_posts;

-- (اختياري) إذا أردت حذف التعليقات أيضاً يمكن إضافة:
-- DELETE FROM public.hashtag_comments;
