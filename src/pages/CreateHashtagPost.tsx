
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { ArrowLeft, Hash, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';

const CreateHashtagPost = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const extractHashtags = (text: string) => {
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const hashtags = extractHashtags(content);
      
      const { error } = await supabase
        .from('hashtag_posts')
        .insert({
          content: content.trim(),
          hashtags,
          user_id: user.id
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-white">{user?.email}</h3>
              </div>
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="ماذا يحدث؟ استخدم # لإضافة هاشتاقات"
              className="w-full bg-transparent border-0 text-white placeholder-zinc-400 resize-none text-lg focus:outline-none min-h-32"
              maxLength={500}
            />

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-700">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  className="p-2 text-zinc-400 hover:text-blue-400 transition-colors"
                >
                  <Image size={20} />
                </button>
                <button
                  type="button"
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
