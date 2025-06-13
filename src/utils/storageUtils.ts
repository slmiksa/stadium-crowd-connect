
import { supabase } from '@/integrations/supabase/client';

export const uploadChatMedia = async (file: File, userId: string, chatType: 'room' | 'private' = 'room') => {
  try {
    console.log('=== STARTING MEDIA UPLOAD ===');
    console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    const fileExt = file.name.split('.').pop() || 'unknown';
    const timestamp = Date.now();
    const fileName = `${chatType}-chat/${userId}/${timestamp}.${fileExt}`;

    console.log('Upload path:', fileName);

    // رفع الملف إلى التخزين
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('hashtag-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`فشل في رفع الملف: ${uploadError.message}`);
    }

    console.log('Upload successful:', uploadData);

    // الحصول على الرابط العام للملف
    const { data: urlData } = supabase.storage
      .from('hashtag-images')
      .getPublicUrl(fileName);

    console.log('Public URL generated:', urlData.publicUrl);
    
    return {
      url: urlData.publicUrl,
      path: fileName
    };
  } catch (error) {
    console.error('Error in uploadChatMedia:', error);
    throw error;
  }
};

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/mov',
    'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg'
  ];

  if (file.size > maxSize) {
    return { isValid: false, error: 'حجم الملف يجب أن يكون أقل من 10 ميجابايت' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'نوع الملف غير مدعوم' };
  }

  return { isValid: true };
};
