
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { ArrowLeft, Hash, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const CreateHashtagPost = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const extractHashtags = (text: string) => {
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `hashtag-posts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('hashtag-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('hashtag-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت');
        return;
      }

      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const insertHashtag = () => {
    const hashtag = prompt('أدخل الهاشتاق (بدون رمز #):');
    if (hashtag && hashtag.trim()) {
      const cleanHashtag = hashtag.trim().replace(/^#/, '');
      setContent(prev => prev + `#${cleanHashtag} `);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setIsSubmitting(true);
    try {
      let imageUrl = null;
      
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          alert('فشل في رفع الصورة');
          setIsSubmitting(false);
          return;
        }
      }

      const hashtags = extractHashtags(content);
      
      const { error } = await supabase
        .from('hashtag_posts')
        .insert({
          content: content.trim(),
          hashtags,
          user_id: user.id,
          image_url: imageUrl
        });

      if (error) {
        console.error('Error creating post:', error);
        return;
      }

      navigate('/hashtags');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContentWithHashtags = (text: string) => {
    const parts = text.split(/(#[\u0600-\u06FF\w]+)/g);
    return parts.map((part, index) => {
      if (part.match(/#[\u0600-\u06FF\w]+/)) {
        const hashtag = part.slice(1);
        return (
          <span
            key={index}
            className="text-blue-400 cursor-pointer hover:text-blue-300"
            onClick={() => navigate(`/hashtag/${hashtag}`)}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/hashtags')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">منشور جديد</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'جاري النشر...' : 'نشر'}
          </button>
        </div>

        {/* Post Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-start space-x-3 mb-4">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white font-bold">
                  {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-white">
                  {profile?.username || user?.email?.split('@')[0] || 'مستخدم'}
                </h3>
              </div>
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="ماذا يحدث؟ استخدم # لإضافة هاشتاقات"
              className="w-full bg-transparent border-0 text-white placeholder-zinc-400 resize-none text-lg focus:outline-none min-h-32"
              maxLength={500}
            />

            {/* Live Preview */}
            {content && (
              <div className="mt-3 p-3 bg-zinc-700 rounded-lg">
                <p className="text-sm text-zinc-400 mb-2">معاينة:</p>
                <div className="text-white">
                  {renderContentWithHashtags(content)}
                </div>
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-4 relative">
                <img 
                  src={imagePreview} 
                  alt="معاينة الصورة" 
                  className="max-h-64 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors text-white text-sm w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-700">
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="p-2 text-zinc-400 hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <Image size={20} />
                </label>
                <button
                  type="button"
                  onClick={insertHashtag}
                  className="p-2 text-zinc-400 hover:text-blue-400 transition-colors"
                >
                  <Hash size={20} />
                </button>
              </div>
              <span className="text-sm text-zinc-400">
                {content.length}/500
              </span>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateHashtagPost;
