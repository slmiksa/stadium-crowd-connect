import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  RefreshCw,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import RevenueDetailsModal from './RevenueDetailsModal';

interface AdRequest {
  id: string;
  ad_name: string;
  phone_number: string;
  image_url: string;
  ad_link: string | null;
  duration_hours: number;
  price: number;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles?: {
    username: string;
    avatar_url: string;
  } | null;
}

interface AdRequestStats {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  total_revenue: number;
}

const AdRequestsManagement = () => {
  const [stats, setStats] = useState<AdRequestStats | null>(null);
  const [adRequests, setAdRequests] = useState<AdRequest[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showRevenueDetails, setShowRevenueDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // جلب الإحصائيات
      const { data: statsData, error: statsError } = await supabase.rpc('get_ad_requests_statistics');
      if (statsError) {
        console.error('Error fetching ad requests stats:', statsError);
      } else if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // جلب طلبات الإعلانات
      const { data: requestsData, error: requestsError } = await supabase
        .from('ad_requests')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching ad requests:', requestsError);
      } else {
        // Handle the case where profiles might be null or have errors
        const processedRequests = (requestsData || []).map(request => ({
          ...request,
          profiles: request.profiles && 
                   request.profiles !== null && 
                   typeof request.profiles === 'object' && 
                   'username' in request.profiles 
            ? request.profiles 
            : null
        }));
        setAdRequests(processedRequests);
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string, adminResponse?: string) => {
    try {
      const { error } = await supabase
        .from('ad_requests')
        .update({ 
          status: newStatus,
          admin_response: adminResponse || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error updating request status:', error);
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء تحديث حالة الطلب',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'تم التحديث',
          description: `تم ${newStatus === 'approved' ? 'قبول' : 'رفض'} الطلب بنجاح`
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'خطأ غير متوقع',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400">موافق عليه</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400">مرفوض</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400">قيد المراجعة</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">{status}</Badge>;
    }
  };

  const filteredRequests = adRequests.filter(request => {
    switch (activeTab) {
      case 'pending':
        return request.status === 'pending';
      case 'approved':
        return request.status === 'approved';
      case 'rejected':
        return request.status === 'rejected';
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
          {[...Array(5)].map((_, i) => (
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
      <div>
        <h2 className="text-lg md:text-2xl font-bold text-white mb-2">إدارة طلبات الإعلانات</h2>
        <p className="text-zinc-400 text-sm md:text-base">مراجعة وإدارة جميع طلبات الإعلانات</p>
      </div>

      {/* إحصائيات طلبات الإعلانات */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              إجمالي الطلبات
            </CardTitle>
            <MessageSquare className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
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
              موافق عليها
            </CardTitle>
            <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
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
            <XCircle className="h-3 w-3 md:h-4 md:w-4 text-red-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold text-red-400">
              {stats?.rejected_requests || 0}
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-zinc-900 border-zinc-800 cursor-pointer hover:bg-zinc-800 transition-colors"
          onClick={() => setShowRevenueDetails(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              إجمالي الإيرادات
            </CardTitle>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
              <Eye className="h-3 w-3 text-zinc-500" />
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold text-green-400">
              {(stats?.total_revenue || 0).toLocaleString()} ر.س
            </div>
            <div className="text-xs text-zinc-500 mt-1">انقر لعرض التفاصيل</div>
          </CardContent>
        </Card>
      </div>

      {/* جدول طلبات الإعلانات */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 md:p-6">
          <div>
            <CardTitle className="text-white text-base md:text-lg">طلبات الإعلانات</CardTitle>
            <CardDescription className="text-zinc-400 text-sm">
              إدارة ومراجعة جميع طلبات الإعلانات
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="text-white border-zinc-700 hover:bg-zinc-800 w-full sm:w-auto"
          >
            <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-4 md:px-6">
              <TabsList className="grid w-full grid-cols-4 bg-zinc-800">
                <TabsTrigger value="all" className="text-xs md:text-sm">الكل</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs md:text-sm">قيد المراجعة</TabsTrigger>
                <TabsTrigger value="approved" className="text-xs md:text-sm">موافق عليها</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs md:text-sm">مرفوضة</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-4">
              <div className="max-h-[600px] overflow-y-auto">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare size={48} className="mx-auto text-zinc-600 mb-4" />
                    <p className="text-zinc-400">لا توجد طلبات في هذه الفئة</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-700">
                        <TableHead className="text-zinc-400">اسم الإعلان</TableHead>
                        <TableHead className="text-zinc-400">المعلن</TableHead>
                        <TableHead className="text-zinc-400">المبلغ</TableHead>
                        <TableHead className="text-zinc-400">المدة</TableHead>
                        <TableHead className="text-zinc-400">الحالة</TableHead>
                        <TableHead className="text-zinc-400">التاريخ</TableHead>
                        <TableHead className="text-zinc-400">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id} className="border-zinc-700">
                          <TableCell className="text-white font-medium">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <img
                                src={request.image_url}
                                alt={request.ad_name}
                                className="w-8 h-8 md:w-10 md:h-10 rounded object-cover"
                              />
                              <span className="text-sm md:text-base">{request.ad_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-300">
                            <div>
                              <div className="font-medium text-sm md:text-base">
                                {request.profiles?.username || 'مستخدم مجهول'}
                              </div>
                              <div className="text-xs md:text-sm text-zinc-500">
                                {request.phone_number}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-green-400 font-medium text-sm md:text-base">
                            {request.price.toLocaleString()} ر.س
                          </TableCell>
                          <TableCell className="text-zinc-300 text-sm md:text-base">
                            {request.duration_hours} ساعة
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell className="text-zinc-400 text-xs md:text-sm">
                            {formatDistanceToNow(new Date(request.created_at), {
                              addSuffix: true,
                              locale: ar
                            })}
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-xs"
                                  onClick={() => updateRequestStatus(request.id, 'approved')}
                                >
                                  قبول
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="text-xs"
                                  onClick={() => updateRequestStatus(request.id, 'rejected')}
                                >
                                  رفض
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* مودال تفاصيل الإيرادات */}
      <RevenueDetailsModal
        isOpen={showRevenueDetails}
        onClose={() => setShowRevenueDetails(false)}
        adRequests={adRequests}
        totalRevenue={stats?.total_revenue || 0}
      />
    </div>
  );
};

export default AdRequestsManagement;
