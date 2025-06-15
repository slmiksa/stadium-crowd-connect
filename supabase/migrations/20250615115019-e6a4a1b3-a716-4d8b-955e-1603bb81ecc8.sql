
-- إنشاء جدول لربط المباريات بغرف الدردشة
CREATE TABLE public.match_chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL UNIQUE,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  match_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهرس لتحسين الأداء
CREATE INDEX idx_match_chat_rooms_match_id ON public.match_chat_rooms(match_id);
CREATE INDEX idx_match_chat_rooms_room_id ON public.match_chat_rooms(room_id);

-- تفعيل RLS
ALTER TABLE public.match_chat_rooms ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح لجميع المستخدمين المسجلين بمشاهدة غرف المباريات
CREATE POLICY "Authenticated users can view match rooms" 
  ON public.match_chat_rooms 
  FOR SELECT 
  TO authenticated
  USING (true);

-- سياسة للسماح بإنشاء غرف المباريات (للنظام فقط)
CREATE POLICY "System can create match rooms" 
  ON public.match_chat_rooms 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- تفعيل real-time للتحديثات الفورية
ALTER TABLE public.match_chat_rooms REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.match_chat_rooms;
