
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Megaphone, 
  Eye, 
  Check, 
  X, 
  Phone,
  Link as LinkIcon,
  Clock,
  DollarSign,
  Calendar,
  User
} from 'lucide-react';

interface AdRequest {
  id: string;
  user_id: string;
  ad_name: string;
  phone_number: string;
  ad_link: string | null;
  image_url: string;
  duration_hours: number;
  price: number;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
}

interface AdRequestStats {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  total_revenue: number;
}

const AdRequestsManagement = () => {
  const [requests, setRequests] = useState<AdRequest[]>([]);
  const [stats, setStats] = useState<AdRequestStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AdRequest | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // جلب طلبات الإعلانات
      const { data: requestsData, error: requestsError } = await supabase
        .from('ad_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching ad requests:', requestsError);
      } else {
        setRequests(requestsData || []);
      }

      // جلب الإحصائيات
      const { data: statsData, error: statsError } = await supabase.rpc('get_ad_requests_statistics');
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

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ad_requests')
        .update({
          status: newStatus,
          admin_response: adminResponse.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: `تم ${newStatus === 'approved' ? 'قبول' : 'رفض'} الطلب بنجاح`
      });

      setSelectedRequest(null);
      setAdminResponse('');
      await fetchData();
    } catch (error) {
      console.error('Error updating ad request:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الطلب',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: 'قيد المراجعة', color: 'bg-yellow-500/20 text-yellow-400' },
      approved: { text: 'مقبول', color: 'bg-green-500/20 text-green-400' },
      rejected: { text: 'مرفوض', color: 'bg-red-500/20 text-red-400' }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
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
          <h2 className="text-lg md:text-2xl font-bold text-white mb-2">إدارة طلبات الإعلانات</h2>
          <p className="text-zinc-400 text-sm md:text-base">مراجعة وإدارة طلبات الإعلانات الواردة</p>
        </div>
      </div>

      {/* إحصائيات طلبات الإعلانات */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              إجمالي الطلبات
            </CardTitle>
            <Megaphone className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold text-blue-400">
              {stats?.total_requests || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              قيد المراجعة
            </CardTitle>
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold text-yellow-400">
              {stats?.pending_requests || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              مقبولة
            </CardTitle>
            <Check className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold text-green-400">
              {stats?.approved_requests || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              مرفوضة
            </CardTitle>
            <X className="h-3 w-3 md:h-4 md:w-4 text-red-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold text-red-400">
              {stats?.rejected_requests || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              إجمالي الإيرادات
            </CardTitle>
            <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-purple-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold text-purple-400">
              {stats?.total_revenue || 0} ريال
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة طلبات الإعلانات */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">طلبات الإعلانات</CardTitle>
          <CardDescription className="text-zinc-400">
            مراجعة جميع طلبات الإعلانات الواردة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone size={48} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">لا توجد طلبات إعلانات بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
                >
                  <div className="flex items-center space-x-4 space-x-reverse flex-1">
                    <div className="w-16 h-16 bg-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={request.image_url}
                        alt={request.ad_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{request.ad_name}</h3>
                      <div className="flex items-center space-x-4 space-x-reverse text-xs text-zinc-400 mt-1">
                        <span className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {request.phone_number}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {request.duration_hours === 24 ? 'يوم كامل' : `${request.duration_hours} ساعة`}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {request.price} ريال
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(request.created_at).toLocaleDateString('ar')}
                        </span>
                      </div>
                      {request.ad_link && (
                        <div className="flex items-center text-xs text-blue-400 mt-1">
                          <LinkIcon className="h-3 w-3 mr-1" />
                          <a href={request.ad_link} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                            {request.ad_link}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {getStatusBadge(request.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* مودال تفاصيل الطلب */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-zinc-900 border-zinc-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white">تفاصيل طلب الإعلان</CardTitle>
              <CardDescription className="text-zinc-400">
                مراجعة وإدارة طلب الإعلان
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">اسم الإعلان</Label>
                  <p className="text-zinc-300 bg-zinc-800 p-2 rounded">{selectedRequest.ad_name}</p>
                </div>
                <div>
                  <Label className="text-white">رقم التواصل</Label>
                  <p className="text-zinc-300 bg-zinc-800 p-2 rounded">{selectedRequest.phone_number}</p>
                </div>
                <div>
                  <Label className="text-white">المدة</Label>
                  <p className="text-zinc-300 bg-zinc-800 p-2 rounded">
                    {selectedRequest.duration_hours === 24 ? 'يوم كامل' : `${selectedRequest.duration_hours} ساعة`}
                  </p>
                </div>
                <div>
                  <Label className="text-white">المبلغ</Label>
                  <p className="text-zinc-300 bg-zinc-800 p-2 rounded">{selectedRequest.price} ريال</p>
                </div>
              </div>

              {selectedRequest.ad_link && (
                <div>
                  <Label className="text-white">رابط الإعلان</Label>
                  <p className="text-blue-400 bg-zinc-800 p-2 rounded truncate">
                    <a href={selectedRequest.ad_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {selectedRequest.ad_link}
                    </a>
                  </p>
                </div>
              )}

              <div>
                <Label className="text-white">صورة الإعلان</Label>
                <div className="w-full h-48 bg-zinc-800 rounded overflow-hidden">
                  <img
                    src={selectedRequest.image_url}
                    alt={selectedRequest.ad_name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {selectedRequest.status === 'pending' && (
                <div>
                  <Label className="text-white">رد الإدارة (اختياري)</Label>
                  <Textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="أضف رد أو ملاحظات للعميل..."
                    rows={3}
                  />
                </div>
              )}

              {selectedRequest.admin_response && (
                <div>
                  <Label className="text-white">رد الإدارة السابق</Label>
                  <p className="text-zinc-300 bg-zinc-800 p-2 rounded">{selectedRequest.admin_response}</p>
                </div>
              )}

              <div className="flex gap-4">
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700 flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      قبول الطلب
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                      disabled={isSubmitting}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      رفض الطلب
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  className="text-white border-zinc-700 hover:bg-zinc-800"
                >
                  إغلاق
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdRequestsManagement;
