import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hash, Plus, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import HashtagPost from '@/components/HashtagPost';
import InlineAd from '@/components/InlineAd';
import AdPopup from '@/components/AdPopup';

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  hashtags: string[];
  user_id: string;
  likes_count: number | null;
  comments_count: number | null;
}

const MyPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hashtag_posts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch posts.',
          variant: 'destructive',
        });
      } else {
        setPosts(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: Post) => {
    setEditPost(post);
    setEditContent(post.content);
  };

  const handleUpdate = async () => {
    if (!editPost) return;

    try {
      const { error } = await supabase
        .from('hashtag_posts')
        .update({ content: editContent })
        .eq('id', editPost.id);

      if (error) {
        console.error('Error updating post:', error);
        toast({
          title: 'Error',
          description: 'Failed to update post.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Post updated successfully.',
        });
        setEditPost(null);
        fetchPosts();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const { error } = await supabase
          .from('hashtag_posts')
          .delete()
          .eq('id', postId);

        if (error) {
          console.error('Error deleting post:', error);
          toast({
            title: 'Error',
            description: 'Failed to delete post.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success',
            description: 'Post deleted successfully.',
          });
          fetchPosts();
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <AdPopup />
      
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">منشوراتي</h1>
          <Link to="/create-hashtag-post">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              إنشاء منشور جديد
            </Button>
          </Link>
        </div>
        <p className="text-zinc-400">إدارة ومراجعة المنشورات الخاصة بك</p>
      </div>

      {/* إضافة الإعلان المدمج */}
      <InlineAd location="my-posts" className="my-6" />

      {posts.length > 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="space-y-4 p-6">
            {posts.map((post, index) => (
              <React.Fragment key={post.id}>
                <div className="relative group">
                  <HashtagPost post={post} />
                  
                  {/* أزرار التحكم */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(post)}
                        className="text-white border-zinc-700 hover:bg-zinc-800"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(post.id)}
                        className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* إضافة إعلان مدمج كل 3 منشورات */}
                {(index + 1) % 3 === 0 && (
                  <InlineAd location="my-posts-list" />
                )}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="text-center py-8">
            <Hash size={48} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-400 mb-4">لم تقم بنشر أي منشورات بعد</p>
            <Link to="/create-hashtag-post">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                إنشاء منشور جديد
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {editPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="bg-zinc-900 border-zinc-800 max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-white">تعديل المنشور</CardTitle>
              <CardDescription className="text-zinc-400">تعديل محتوى المنشور</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-32 bg-zinc-800 border-zinc-700 text-white rounded-md p-2"
              />
              <div className="flex justify-end mt-4 space-x-2 space-x-reverse">
                <Button variant="outline" onClick={() => setEditPost(null)} className="text-white border-zinc-700 hover:bg-zinc-800">
                  إلغاء
                </Button>
                <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">
                  تحديث
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MyPosts;
