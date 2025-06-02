import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Megaphone, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Link2,
  Image as ImageIcon,
  BarChart3
} from 'lucide-react';

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  created_at: string;
  scheduled_at: string | null;
  expires_at: string | null;
  admin_id: string;
}

interface AdStats {
  total_ads: number;
  active_ads: number;
  total_views: number;
  top_ad_title: string;
  top_ad_views: number;
}

const AdvertisementsManagement = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [stats, setStats] = useState<AdStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    is_active: true,
    scheduled_at: '',
    expires_at: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // جلب الإعلانات
      const { data: adsData, error: adsError } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });

      if (adsError) {
        console.error('Error fetching ads:', adsError);
      } else {
        setAds(adsData || []);
      }

      // جلب الإحصائيات
      const { data: statsData, error: statsError } = await supabase.rpc('get_advertisement_statistics');
      if (statsError) {
        console.error('Error fetching stats:', statsError);
      } else if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      is_active: true,
      scheduled_at: '',
      expires_at: ''
    });
    setEditingAd(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.image_url.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء العنوان ورابط الصورة',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const adminData = localStorage.getItem('admin_user');
      if (!adminData) {
        toast({
          title: 'خطأ',
          description: 'يجب تسجيل الدخول كمدير',
          variant: 'destructive'
        });
        return;
      }

      const admin = JSON.parse(adminData);
      
      // إعداد البيانات مع معالجة التواريخ بشكل صحيح
      const adData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim(),
        link_url: formData.link_url.trim() || null,
        is_active: formData.is_active,
        // البدء مباشرة إذا لم يتم تحديد وقت
        scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : new Date().toISOString(),
        // الانتهاء حسب التاريخ المحدد أو null للاستمرار إلى ما لا نهاية
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        admin_id: admin.id
      };

      console.log('Saving ad data:', adData);

      if (editingAd) {
        const { error } = await supabase
          .from('advertisements')
          .update(adData)
          .eq('id', editingAd.id);

        if (error) throw error;

        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الإعلان بنجاح'
        });
      } else {
        const { error } = await supabase
          .from('advertisements')
          .insert([adData]);

        if (error) throw error;

        toast({
          title: 'تم الإنشاء',
          description: 'تم إنشاء الإعلان بنجاح وسيظهر فوراً'
        });
      }

      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الإعلان',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    
    // تحويل التواريخ بشكل صحيح للنموذج
    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      // تنسيق التاريخ والوقت للحقل datetime-local
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      title: ad.title,
      description: ad.description || '',
      image_url: ad.image_url,
      link_url: ad.link_url || '',
      is_active: ad.is_active,
      scheduled_at: formatDateForInput(ad.scheduled_at),
      expires_at: formatDateForInput(ad.expires_at)
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;

    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف الإعلان بنجاح'
      });

      await fetchData();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الإعلان',
        variant: 'destructive'
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: !currentStatus ? 'تم تفعيل الإعلان' : 'تم إلغاء تفعيل الإعلان'
      });

      await fetchData();
    } catch (error) {
      console.error('Error toggling ad status:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث حالة الإعلان',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-zinc-900 border-zinc-800">
              <CardHeader className="animate-pulse pb-2">
                <div className="h-3 md:h-4 bg-zinc-700 rounded w-3/4"></div>
                <div className="h-6 md:h-8 bg-zinc-700 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-white mb-2">إدارة الإعلانات</h2>
          <p className="text-zinc-400 text-sm md:text-base">إنشاء وإدارة إعلانات التطبيق</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          إعلان جديد
        </Button>
      </div>

      {/* إحصائيات الإعلانات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              إجمالي الإعلانات
            </CardTitle>
            <Megaphone className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold text-blue-400">
              {stats?.total_ads || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              الإعلانات النشطة
            </CardTitle>
            <Eye className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold text-green-400">
              {stats?.active_ads || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              إجمالي المشاهدات
            </CardTitle>
            <BarChart3 className="h-3 w-3 md:h-4 md:w-4 text-purple-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold text-purple-400">
              {stats?.total_views || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              أشهر إعلان
            </CardTitle>
            <Megaphone className="h-3 w-3 md:h-4 md:w-4 text-orange-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-sm md:text-lg font-bold text-orange-400 truncate">
              {stats?.top_ad_title || 'لا يوجد'}
            </div>
            <div className="text-xs md:text-sm text-zinc-400">
              {stats?.top_ad_views || 0} مشاهدة
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نموذج إنشاء/تعديل الإعلان */}
      {showForm && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">
              {editingAd ? 'تعديل الإعلان' : 'إنشاء إعلان جديد'}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {editingAd ? 'تعديل بيانات الإعلان' : 'سيبدأ الإعلان فوراً ما لم تحدد وقت بداية'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-white">العنوان *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="عنوان الإعلان"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="image_url" className="text-white">رابط الصورة *</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description" className="text-white">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="وصف مختصر للإعلان"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="link_url" className="text-white">رابط الإعلان</Label>
                  <Input
                    id="link_url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="scheduled_at" className="text-white">وقت البداية (اتركه فارغ للبدء فوراً)</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="expires_at" className="text-white">تاريخ الانتهاء (اتركه فارغ للاستمرار دائماً)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="text-white">نشط</Label>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'جاري الحفظ...' : (editingAd ? 'تحديث' : 'إنشاء')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="text-white border-zinc-700 hover:bg-zinc-800"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* قائمة الإعلانات */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">الإعلانات الحالية</CardTitle>
          <CardDescription className="text-zinc-400">
            إدارة جميع الإعلانات المنشورة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone size={48} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">لا توجد إعلانات بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
                >
                  <div className="flex items-center space-x-4 space-x-reverse flex-1">
                    <div className="w-16 h-16 bg-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={ad.image_url}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{ad.title}</h3>
                      {ad.description && (
                        <p className="text-zinc-400 text-sm truncate">{ad.description}</p>
                      )}
                      <div className="flex items-center space-x-4 space-x-reverse text-xs text-zinc-500 mt-1">
                        <span>تم الإنشاء: {new Date(ad.created_at).toLocaleDateString('ar')}</span>
                        {ad.scheduled_at && (
                          <span>البداية: {new Date(ad.scheduled_at).toLocaleString('ar')}</span>
                        )}
                        {ad.expires_at && (
                          <span>النهاية: {new Date(ad.expires_at).toLocaleString('ar')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      ad.is_active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {ad.is_active ? 'نشط' : 'غير نشط'}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(ad.id, ad.is_active)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(ad)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(ad.id)}
                      className="text-zinc-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvertisementsManagement;
