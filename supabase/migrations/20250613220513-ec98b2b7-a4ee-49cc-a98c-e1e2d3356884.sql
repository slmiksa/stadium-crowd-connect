
-- Create table to link live matches with chat rooms
CREATE TABLE public.room_live_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  match_data JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  activated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id)
);

-- Enable RLS on the new table
ALTER TABLE public.room_live_matches ENABLE ROW LEVEL SECURITY;

-- Create policy for room members to view active live matches
CREATE POLICY "Room members can view live matches" 
  ON public.room_live_matches 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_id = room_live_matches.room_id 
      AND user_id = auth.uid()
      AND is_banned = false
    )
  );

-- Create policy for room owners and moderators to manage live matches
CREATE POLICY "Room owners and moderators can manage live matches" 
  ON public.room_live_matches 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      LEFT JOIN public.room_members rm ON rm.room_id = cr.id AND rm.user_id = auth.uid()
      WHERE cr.id = room_live_matches.room_id 
      AND (cr.owner_id = auth.uid() OR rm.role = 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      LEFT JOIN public.room_members rm ON rm.room_id = cr.id AND rm.user_id = auth.uid()
      WHERE cr.id = room_live_matches.room_id 
      AND (cr.owner_id = auth.uid() OR rm.role = 'moderator')
    )
  );

-- Add index for better performance
CREATE INDEX idx_room_live_matches_room_id ON public.room_live_matches(room_id);
CREATE INDEX idx_room_live_matches_active ON public.room_live_matches(is_active) WHERE is_active = true;
