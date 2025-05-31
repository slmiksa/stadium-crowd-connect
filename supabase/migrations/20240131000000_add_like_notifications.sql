
-- Create function to handle like notifications
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Don't create notification if user is liking their own post
  IF NEW.user_id != (SELECT user_id FROM hashtag_posts WHERE id = NEW.post_id) THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      hp.user_id,
      'like',
      'إعجاب جديد',
      COALESCE(p.username, 'مستخدم مجهول') || ' أعجب بمنشورك',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'like_id', NEW.id,
        'liker_id', NEW.user_id
      )
    FROM hashtag_posts hp
    JOIN profiles p ON p.id = NEW.user_id
    WHERE hp.id = NEW.post_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for like notifications
DROP TRIGGER IF EXISTS trigger_create_like_notification ON public.hashtag_likes;
CREATE TRIGGER trigger_create_like_notification
  AFTER INSERT ON public.hashtag_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_like_notification();
