
import React, { useState, useEffect } from 'react';
import { Check, Search, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Follower {
  id: string;
  follower_id: string;
  profiles: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

interface FollowerSelectorProps {
  userId: string;
  selectedFollowers: string[];
  onFollowersChange: (followers: string[]) => void;
  selectAll: boolean;
  onSelectAllChange: (selectAll: boolean) => void;
}

const FollowerSelector: React.FC<FollowerSelectorProps> = ({
  userId,
  selectedFollowers,
  onFollowersChange,
  selectAll,
  onSelectAllChange
}) => {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFollowers();
  }, [userId]);

  useEffect(() => {
    if (selectAll) {
      onFollowersChange(followers.map(f => f.follower_id));
    } else {
      onFollowersChange([]);
    }
  }, [selectAll, followers]);

  const fetchFollowers = async () => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          follower_id,
          follower:profiles!follows_follower_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('following_id', userId);

      if (error) {
        console.error('Error fetching followers:', error);
        return;
      }

      // تحويل البيانات إلى الشكل المطلوب
      const transformedData = (data || []).map(item => ({
        id: item.id,
        follower_id: item.follower_id,
        profiles: item.follower as {
          id: string;
          username: string;
          avatar_url?: string;
        }
      }));

      setFollowers(transformedData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFollower = (followerId: string) => {
    if (selectedFollowers.includes(followerId)) {
      onFollowersChange(selectedFollowers.filter(id => id !== followerId));
    } else {
      onFollowersChange([...selectedFollowers, followerId]);
    }
  };

  const filteredFollowers = followers.filter(follower =>
    follower.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="البحث في المتابعين..."
          className="bg-zinc-900 border-zinc-700 text-white pr-10"
        />
      </div>

      {/* Select All Button */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSelectAllChange(!selectAll)}
          className="bg-zinc-700 border-zinc-600 hover:bg-zinc-600"
        >
          <Users size={18} className="mr-2" />
          {selectAll ? 'إلغاء تحديد الكل' : 'تحديد كل المتابعين'}
        </Button>
        <span className="text-sm text-zinc-400">
          تم اختيار {selectedFollowers.length} من {followers.length}
        </span>
      </div>

      {/* Followers List */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {filteredFollowers.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            {searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد متابعون'}
          </div>
        ) : (
          filteredFollowers.map((follower) => (
            <div
              key={follower.id}
              onClick={() => toggleFollower(follower.follower_id)}
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedFollowers.includes(follower.follower_id)
                  ? 'bg-blue-600'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={follower.profiles?.avatar_url} alt={follower.profiles?.username} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {follower.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <p className="font-medium text-white">
                  {follower.profiles?.username || 'مستخدم مجهول'}
                </p>
              </div>

              {selectedFollowers.includes(follower.follower_id) && (
                <Check size={20} className="text-white" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FollowerSelector;
