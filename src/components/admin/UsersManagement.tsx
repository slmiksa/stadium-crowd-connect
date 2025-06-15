import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Ban, UserCheck, Eye, Shield, AlertTriangle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
  verification_status: string;
  created_at: string;
  bio: string | null;
  favorite_team: string | null;
  is_banned: boolean;
  ban_reason: string | null;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [verificationAction, setVerificationAction] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'خطأ',
          description: 'فشل في جلب المستخدمين',
          variant: 'destructive'
        });
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateVerificationStatus = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: newStatus })
        .eq('id', userId);

      if (error) {
        console.error('Error updating verification:', error);
        toast({
          title: 'خطأ',
          description: 'فشل في تحديث حالة التوثيق',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'تم التحديث',
        description: `تم تحديث حالة التوثيق بنجاح`
      });

      fetchUsers();
      setIsVerificationModalOpen(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const banUser = async (userId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: true, ban_reason: reason || 'لم يحدد سبب' })
        .eq('id', userId);

      if (error) {
        console.error('Error banning user:', error);
        toast({ title: 'خطأ', description: 'فشل في حظر المستخدم', variant: 'destructive' });
        return;
      }
      
      toast({ title: 'تم الحظر', description: 'تم حظر المستخدم بنجاح' });
      fetchUsers();
      setIsBanModalOpen(false);
      setBanReason('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error banning user:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: false, ban_reason: null })
        .eq('id', userId);

      if (error) {
        console.error('Error unbanning user:', error);
        toast({ title: 'خطأ', description: 'فشل في رفع الحظر', variant: 'destructive' });
        return;
      }
      
      toast({ title: 'تم رفع الحظر', description: 'تم رفع الحظر عن المستخدم بنجاح' });
      fetchUsers();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  const viewUserProfile = (userId: string) => {
    // تصحيح المسار للذهاب للبروفايل
    navigate(`/profile/${userId}`);
  };

  const getVerificationBadge = (status: string) => {
    const badges = {
      'diamond': { label: 'الماسي', color: 'bg-cyan-500' },
      'gold': { label: 'ذهبي', color: 'bg-yellow-500' },
      'silver': { label: 'فضي', color: 'bg-gray-400' },
      'bronze': { label: 'برونزي', color: 'bg-orange-600' },
      'none': { label: 'غير موثق', color: 'bg-gray-600' }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.none;
    return (
      <Badge className={`${badge.color} text-white text-xs`}>
        {badge.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">جاري تحميل المستخدمين...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg md:text-xl">إدارة المستخدمين</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
              <Input
                placeholder="البحث عن مستخدم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white pl-10 text-sm"
              />
            </div>
            <Badge variant="secondary" className="bg-zinc-800 text-white text-sm px-3 py-2 w-fit">
              {filteredUsers.length} مستخدم
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            <div className="space-y-3 p-4 md:p-6 pt-0">
              {filteredUsers.map((user) => (
                <div key={user.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-zinc-800 rounded-lg gap-3 ${user.is_banned ? 'opacity-70' : ''}`}>
                  <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback className="bg-zinc-700 text-white text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-1">
                        <h3 className="font-medium text-white text-sm md:text-base truncate">{user.username}</h3>
                        {getVerificationBadge(user.verification_status)}
                        {user.is_banned && (
                          <Badge variant="destructive" className="text-xs">محظور</Badge>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-zinc-400 truncate">{user.email}</p>
                      <div className="flex flex-wrap gap-2 md:gap-4 text-xs text-zinc-500">
                        <span>{user.followers_count} متابع</span>
                        <span>{user.following_count} متابع</span>
                        <span className="hidden sm:inline">انضم في {new Date(user.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-white border-zinc-700 hover:bg-zinc-700 text-xs flex-1 sm:flex-none"
                      onClick={() => viewUserProfile(user.id)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      عرض الملف
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-blue-400 border-blue-400 hover:bg-blue-400/10 text-xs flex-1 sm:flex-none"
                      onClick={() => {
                        setSelectedUser(user);
                        setVerificationAction(user.verification_status || 'none');
                        setIsVerificationModalOpen(true);
                      }}
                      disabled={user.is_banned}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      توثيق
                    </Button>

                    {user.is_banned ? (
                      <Button
                        size="sm"
                        className="text-xs flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                        onClick={() => unbanUser(user.id)}
                      >
                        <UserCheck className="h-3 w-3 mr-1" />
                        رفع الحظر
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="text-xs flex-1 sm:flex-none"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsBanModalOpen(true);
                        }}
                      >
                        <Ban className="h-3 w-3 mr-1" />
                        حظر
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-zinc-400">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>لم يتم العثور على مستخدمين</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isVerificationModalOpen} onOpenChange={(isOpen) => {
        setIsVerificationModalOpen(isOpen);
        if (!isOpen) {
          setSelectedUser(null);
          setVerificationAction('');
        }
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">تحديث حالة التوثيق</DialogTitle>
            <DialogDescription className="text-zinc-400">
              اختر حالة التوثيق الجديدة للمستخدم {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select 
              value={verificationAction} 
              onValueChange={setVerificationAction}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="اختر حالة التوثيق" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="diamond">الماسي</SelectItem>
                <SelectItem value="gold">ذهبي</SelectItem>
                <SelectItem value="silver">فضي</SelectItem>
                <SelectItem value="bronze">برونزي</SelectItem>
                <SelectItem value="none">إلغاء التوثيق</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button
                variant="outline"
                onClick={() => setIsVerificationModalOpen(false)}
                className="text-white border-zinc-700 hover:bg-zinc-800"
              >
                إلغاء
              </Button>
              <Button
                onClick={() => {
                  if (selectedUser && verificationAction) {
                    updateVerificationStatus(selectedUser.id, verificationAction);
                  }
                }}
                disabled={!verificationAction}
                className="bg-blue-600 hover:bg-blue-700"
              >
                تحديث
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBanModalOpen} onOpenChange={(isOpen) => {
        setIsBanModalOpen(isOpen);
        if (!isOpen) {
          setSelectedUser(null);
          setBanReason('');
        }
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 ml-2" />
              حظر المستخدم
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              هل أنت متأكد من رغبتك في حظر المستخدم {selectedUser?.username}؟ هذا الإجراء سيمنع المستخدم من الوصول للتطبيق.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="سبب الحظر (اختياري)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button
                variant="outline"
                onClick={() => setIsBanModalOpen(false)}
                className="text-white border-zinc-700 hover:bg-zinc-800"
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedUser) {
                    banUser(selectedUser.id, banReason);
                  }
                }}
              >
                تأكيد الحظر
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;
