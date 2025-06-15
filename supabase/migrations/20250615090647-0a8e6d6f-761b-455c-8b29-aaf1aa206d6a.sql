
ALTER TABLE public.profiles
ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN ban_reason TEXT;
