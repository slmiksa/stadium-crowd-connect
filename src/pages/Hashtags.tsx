
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Hash, Heart, MessageSquare, Share } from 'lucide-react';

interface HashtagPost {
  id: string;
  username: string;
  avatar?: string;
  content: string;
  hashtags: string[];
  likes: number;
  comments: number;
  timestamp: string;
  image?: string;
}

const Hashtags = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [posts, setPosts] = useState<HashtagPost[]>([]);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [newPost, setNewPost] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data
  const mockPosts: HashtagPost[] = [
    {
      id: '1',
      username: 'أحمد_الريال',
      content: 'ما أجمل الفوز على برشلونة! هالا مدريد 💪 #الريال_برشلونة #الكلاسيكو #هالا_مدريد',
      hashtags: ['الريال_برشلونة', 'الكلاسيكو', 'هالا_مدريد'],
      likes: 127,
      comments: 23,
      timestamp: '2024-05-30T20:30:00Z'
    },
    {
      id: '2',
      username: 'ليفربول_فان',
      content: 'Ready for the match tomorrow! YNWA ❤️ #LFC #Liverpool #YNWA #PremierLeague',
      hashtags: ['LFC', 'Liverpool', 'YNWA', 'PremierLeague'],
      likes: 89,
      comments: 15,
      timestamp: '2024-05-30T19:15:00Z'
    },
    {
      id: '3',
      username: 'مشجع_الأهلي',
      content: 'الأهلي الأقوى دائماً! 🔴 #الاهلي #الاحمر #النادي_الاهلي',
      hashtags: ['الاهلي', 'الاحمر', 'النادي_الاهلي'],
      likes: 156,
      comments: 34,
      timestamp: '2024-05-30T18:45:00Z'
    }
  ];

  useEffect(() => {
    setPosts(mockPosts);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setPosts([...mockPosts]);
      setIsRefreshing(false);
    }, 1000);
  };

  const extractHashtags = (text: string) => {
    const hashtagRegex = /#[\u0600-\u06FF\w]+/g;
    return text.match(hashtagRegex) || [];
  };

  const handlePostSubmit = () => {
    if (!newPost.trim()) return;

    const hashtags = extractHashtags(newPost);
    const post: HashtagPost = {
      id: Date.now().toString(),
      username: user?.username || 'Unknown',
      content: newPost,
      hashtags: hashtags.map(h => h.substring(1)),
      likes: 0,
      comments: 0,
      timestamp: new Date().toISOString()
    };

    setPosts([post, ...posts]);
    setNewPost('');
  };

  const filteredPosts = selectedHashtag 
    ? posts.filter(post => post.hashtags.includes(selectedHashtag))
    : posts;

  const allHashtags = Array.from(new Set(posts.flatMap(post => post.hashtags)));

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  return (
    <Layout>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{t('hashtags')}</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <div className={`w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`}></div>
          </button>
        </div>

        {/* New Post */}
        <div className="bg-zinc-800 rounded-lg p-4 mb-6">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder={isRTL ? 'شارك رأيك مع #هاشتاغ...' : 'Share your thoughts with #hashtag...'}
            className="w-full bg-transparent text-white placeholder-zinc-400 resize-none focus:outline-none"
            rows={3}
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-zinc-500">
              {extractHashtags(newPost).length} hashtags
            </span>
            <button
              onClick={handlePostSubmit}
              disabled={!newPost.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRTL ? 'نشر' : 'Post'}
            </button>
          </div>
        </div>

        {/* Popular Hashtags */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            {isRTL ? 'الهاشتاغات الشائعة' : 'Popular Hashtags'}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedHashtag(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                !selectedHashtag 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {isRTL ? 'الكل' : 'All'}
            </button>
            {allHashtags.slice(0, 10).map((hashtag) => (
              <button
                key={hashtag}
                onClick={() => setSelectedHashtag(hashtag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedHashtag === hashtag
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                #{hashtag}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-zinc-800 rounded-lg p-4">
              {/* Post Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {post.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{post.username}</p>
                    <p className="text-xs text-zinc-500">{formatTimestamp(post.timestamp)}</p>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-white mb-3 leading-relaxed">{post.content}</p>

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-700">
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-2 text-zinc-400 hover:text-red-400 transition-colors">
                    <Heart size={18} />
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-zinc-400 hover:text-blue-400 transition-colors">
                    <MessageSquare size={18} />
                    <span className="text-sm">{post.comments}</span>
                  </button>
                  <button className="text-zinc-400 hover:text-green-400 transition-colors">
                    <Share size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-8">
            <Hash size={48} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-400">
              {selectedHashtag 
                ? (isRTL ? `لا توجد منشورات لهاشتاغ #${selectedHashtag}` : `No posts for #${selectedHashtag}`)
                : (isRTL ? 'لا توجد منشورات حالياً' : 'No posts yet')
              }
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Hashtags;
