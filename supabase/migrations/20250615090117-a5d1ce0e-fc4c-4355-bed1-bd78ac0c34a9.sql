
CREATE OR REPLACE FUNCTION public.admin_delete_post(post_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete likes on comments of the post being deleted
    DELETE FROM public.hashtag_comment_likes 
    WHERE comment_id IN (SELECT id FROM public.hashtag_comments WHERE post_id = post_id_to_delete);

    -- Delete comments on the post
    DELETE FROM public.hashtag_comments WHERE post_id = post_id_to_delete;

    -- Delete likes on the post
    DELETE FROM public.hashtag_likes WHERE post_id = post_id_to_delete;

    -- Delete shares of the post
    DELETE FROM public.post_shares WHERE post_id = post_id_to_delete;

    -- We need to handle reports on the post. We will mark them as resolved.
    -- We don't delete the reports themselves to maintain a history.
    -- We set reported_post_id to NULL to avoid foreign key issues after the post is deleted.
    UPDATE public.reports
    SET 
        status = 'resolved', 
        admin_response = COALESCE(admin_response || E'\n', '') || 'تم حذف المنشور المرتبط بهذا البلاغ من قبل الإدارة.',
        reported_post_id = NULL
    WHERE reported_post_id = post_id_to_delete;
    
    -- Finally, delete the post itself
    DELETE FROM public.hashtag_posts WHERE id = post_id_to_delete;
END;
$$;
