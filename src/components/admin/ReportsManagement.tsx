
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Eye, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Report {
  id: string;
  report_type: string;
  reason: string;
  description: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_post_id: string | null;
  reported_comment_id: string | null;
  reported_room_id: string | null;
}

interface PostDetails {
  id: string;
  content: string;
  image_url?: string;
  user_id: string;
  created_at: string;
  profiles?: {
    username: string;
  };
}

const ReportsManagement = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [postDetails, setPostDetails] = useState<{[key: string]: PostDetails}>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    const filtered = statusFilter === 'all' 
      ? reports 
      : reports.filter(report => report.status === statusFilter);
    setFilteredReports(filtered);
  }, [reports, statusFilter]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: 'خطأ',
          description: 'فشل في جلب البلاغات',
          variant: 'destructive'
        });
      } else {
        setReports(data || []);
        
        // Fetch post details for post reports
        const postReports = (data || []).filter(report => report.reported_post_id);
        for (const report of postReports) {
          if (report.reported_post_id && !postDetails[report.reported_post_id]) {
            await fetchPostDetails(report.reported_post_id);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPostDetails = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('hashtag_posts')
        .select(`
          *,
          profiles:user_id (username)
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error fetching post details:', error);
        return;
      }

      setPostDetails(prev => ({
        ...prev,
        [postId]: data
      }));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateReportStatus = async (reportId: string, status: string, response?: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status, 
          admin_response: response || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) {
        console.error('Error updating report:', error);
        toast({
          title: 'خطأ',
          description: 'فشل في تحديث البلاغ',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث حالة البلاغ بنجاح'
        });
        fetchReports();
        setSelectedReport(null);
        setAdminResponse('');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteReportedPost = async (postId: string, reportId: string) => {
    try {
      const { error } = await supabase
        .from('hashtag_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Error deleting post:', error);
        toast({
          title: 'خطأ',
          description: 'فشل في حذف المنشور',
          variant: 'destructive'
        });
        return;
      }

      // Update report status to resolved
      await updateReportStatus(reportId, 'resolved', 'تم حذف المنشور المبلغ عنه');
      
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المنشور بنجاح'
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'pending': { label: 'قيد المراجعة', color: 'bg-yellow-500' },
      'reviewed': { label: 'تمت المراجعة', color: 'bg-blue-500' },
      'resolved': { label: 'تم الحل', color: 'bg-green-500' },
      'dismissed': { label: 'مرفوض', color: 'bg-red-500' }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <Badge className={`${badge.color} text-white text-xs`}>
        {badge.label}
      </Badge>
    );
  };

  const getReportTypeLabel = (type: string) => {
    const types = {
      'user': 'مستخدم',
      'post': 'منشور',
      'comment': 'تعليق',
      'room': 'غرفة دردشة'
    };
    return types[type as keyof typeof types] || type;
  };

  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">جاري تحميل البلاغات...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">إدارة البلاغات</CardTitle>
          <div className="flex items-center justify-between">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all">جميع البلاغات</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="reviewed">تمت المراجعة</SelectItem>
                <SelectItem value="resolved">تم الحل</SelectItem>
                <SelectItem value="dismissed">مرفوض</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="bg-zinc-800 text-white">
              {filteredReports.length} بلاغ
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-4 bg-zinc-800 rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge variant="outline" className="text-white border-zinc-600">
                        {getReportTypeLabel(report.report_type)}
                      </Badge>
                      {getStatusBadge(report.status)}
                    </div>
                    <h3 className="font-medium text-white">{report.reason}</h3>
                    <p className="text-sm text-zinc-400">{report.description}</p>
                    <p className="text-xs text-zinc-500">
                      تم الإبلاغ في {new Date(report.created_at).toLocaleDateString('ar-SA')}
                    </p>
                    
                    {/* Post Details */}
                    {report.reported_post_id && postDetails[report.reported_post_id] && (
                      <div className="mt-3 p-3 bg-zinc-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-white">المنشور المبلغ عنه:</h4>
                          <div className="flex space-x-2 space-x-reverse">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-white border-zinc-600"
                              onClick={() => window.open(`/post/${report.reported_post_id}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              عرض المنشور
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteReportedPost(report.reported_post_id!, report.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              حذف المنشور
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-300">
                          {postDetails[report.reported_post_id].content.substring(0, 200)}
                          {postDetails[report.reported_post_id].content.length > 200 && '...'}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          بواسطة: {postDetails[report.reported_post_id].profiles?.username || 'مستخدم مجهول'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 space-x-reverse">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-white border-zinc-700"
                      onClick={() => setSelectedReport(report)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      عرض التفاصيل
                    </Button>
                  </div>
                </div>
                
                {selectedReport?.id === report.id && (
                  <div className="mt-4 p-4 bg-zinc-700 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        رد المشرف
                      </label>
                      <Textarea
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="اكتب ردك على هذا البلاغ..."
                        className="bg-zinc-800 border-zinc-600 text-white"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateReportStatus(report.id, 'resolved', adminResponse)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        حل البلاغ
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => updateReportStatus(report.id, 'dismissed', adminResponse)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        رفض البلاغ
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-white border-zinc-600"
                        onClick={() => setSelectedReport(null)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {filteredReports.length === 0 && (
              <div className="text-center py-8 text-zinc-400">
                لا توجد بلاغات
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsManagement;
