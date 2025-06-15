
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Hash, Plus, Search, TrendingUp, Clock, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Hashtag {
  id: string;
  name: string;
  posts_count: number;
  created_at: string;
  is_trending: boolean;
}

const Hashtags = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'trending' | 'recent'>('all');

  useEffect(() => {
    fetchHashtags();
  }, [filter]);

  const fetchHashtags = async () => {
    try {
      let query = supabase
        .from('hashtags')
        .select('*');

      if (filter === 'trending') {
        query = query.eq('is_trending', true);
      }

      if (filter === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('posts_count', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching hashtags:', error);
        return;
      }

      setHashtags(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHashtags = hashtags.filter(hashtag =>
    hashtag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Hash size={24} className="text-blue-400" />
              <h1 className="text-2xl font-bold text-white">الهاشتاقات</h1>
            </div>
            <Button
              onClick={() => navigate('/create-hashtag-post')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus size={20} className="ml-2" />
              إنشاء منشور
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="البحث في الهاشتاقات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          {/* Filter Buttons - Moved Below */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={`${
                filter === 'all' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Hash size={16} className="ml-2" />
              جميع الهاشتاقات
            </Button>
            
            <Button
              variant={filter === 'trending' ? 'default' : 'outline'}
              onClick={() => setFilter('trending')}
              className={`${
                filter === 'trending' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <TrendingUp size={16} className="ml-2" />
              الهاشتاقات الشائعة
            </Button>
            
            <Button
              variant={filter === 'recent' ? 'default' : 'outline'}
              onClick={() => setFilter('recent')}
              className={`${
                filter === 'recent' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Clock size={16} className="ml-2" />
              الأحدث
            </Button>
          </div>
        </div>

        {/* Hashtags Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredHashtags.map((hashtag) => (
            <div
              key={hashtag.id}
              onClick={() => navigate(`/hashtag/${hashtag.name}`)}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-colors">
                    <Hash size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      #{hashtag.name}
                    </h3>
                    {hashtag.is_trending && (
                      <span className="text-red-400 text-sm flex items-center">
                        <TrendingUp size={12} className="ml-1" />
                        ترند
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Users size={16} className="text-blue-400" />
                  <span className="text-gray-400 text-sm">
                    {hashtag.posts_count} منشور
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(hashtag.created_at).toLocaleDateString('ar-SA')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredHashtags.length === 0 && (
          <div className="text-center py-12">
            <Hash size={64} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              {searchTerm ? 'لا توجد نتائج بحث' : 'لا توجد هاشتاقات'}
            </h2>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? `لم يتم العثور على هاشتاقات تحتوي على "${searchTerm}"`
                : 'كن أول من ينشر محتوى مميز واكتشف عالم الهاشتاقات!'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => navigate('/create-hashtag-post')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus size={20} className="ml-2" />
                إنشاء أول منشور
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Hashtags;
