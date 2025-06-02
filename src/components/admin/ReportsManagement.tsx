
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Eye, Trash2, ExternalLink, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
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
      'pending': { 
        label: 'قيد المراجعة', 
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
      },
      'reviewed': { 
        label: 'تمت المراجعة', 
        icon: Eye,
        className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
      },
      'resolved': { 
        label: 'تم الحل', 
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      },
      'dismissed': { 
        label: 'مرفوض', 
        icon: XCircle,
        className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const IconComponent = badge.icon;
    
    return (
      <Badge className={`${badge.className} flex items-center gap-1 text-xs font-medium border`}>
        <IconComponent size={12} />
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

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'post':
        return '📝';
      case 'comment':
        return '💬';
      case 'user':
        return '👤';
      case 'room':
        return '🏠';
      default:
        return '⚠️';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">جاري تحميل البلاغات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-xl p-6 border border-zinc-600">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <AlertTriangle className="text-orange-400" size={28} />
              إدارة البلاغات
            </h1>
            <p className="text-zinc-300 mt-2">مراجعة والتعامل مع بلاغات المستخدمين</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-zinc-700 border-zinc-600 text-white">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-700 border-zinc-600">
                <SelectItem value="all">جميع البلاغات</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="reviewed">تمت المراجعة</SelectItem>
                <SelectItem value="resolved">تم الحل</SelectItem>
                <SelectItem value="dismissed">مرفوض</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="bg-zinc-700 text-white px-4 py-2 text-sm font-medium">
              {filteredReports.length} بلاغ
            </Badge>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="bg-zinc-800 border-zinc-700 hover:bg-zinc-750 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getReportTypeIcon(report.report_type)}</span>
                    <Badge variant="outline" className="text-white border-zinc-600 bg-zinc-700">
                      {getReportTypeLabel(report.report_type)}
                    </Badge>
                    {getStatusBadge(report.status)}
                  </div>
                  
                  <h3 className="font-semibold text-white text-lg mb-2">{report.reason}</h3>
                  
                  {report.description && (
                    <p className="text-zinc-300 mb-3 bg-zinc-700 rounded-lg p-3 border-r-4 border-blue-500">
                      {report.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <span>📅 {new Date(report.created_at).toLocaleDateString('ar-SA')}</span>
                    <span>🕒 {new Date(report.created_at).toLocaleTimeString('ar-SA')}</span>
                  </div>
                  
                  {/* Post Details */}
                  {report.reported_post_id && postDetails[report.reported_post_id] && (
                    <div className="mt-4 p-4 bg-zinc-700 rounded-lg border border-zinc-600">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-medium flex items-center gap-2">
                          📝 المنشور المبلغ عنه
                        </h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-400 border-blue-500 hover:bg-blue-500/10"
                            onClick={() => window.open(`/post/${report.reported_post_id}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            عرض المنشور
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deleteReportedPost(report.reported_post_id!, report.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            حذف المنشور
                          </Button>
                        </div>
                      </div>
                      <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-600">
                        <p className="text-zinc-300 mb-2">
                          {postDetails[report.reported_post_id].content.substring(0, 200)}
                          {postDetails[report.reported_post_id].content.length > 200 && '...'}
                        </p>
                        <p className="text-xs text-zinc-500">
                          👤 بواسطة: {postDetails[report.reported_post_id].profiles?.username || 'مستخدم مجهول'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-white border-zinc-600 hover:bg-zinc-700"
                    onClick={() => setSelectedReport(report)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    مراجعة
                  </Button>
                </div>
              </div>
              
              {/* Admin Response Section */}
              {selectedReport?.id === report.id && (
                <div className="mt-6 p-4 bg-zinc-700 rounded-lg border-t-2 border-blue-500">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                        💬 رد المشرف
                      </label>
                      <Textarea
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="اكتب ردك على هذا البلاغ... (اختياري)"
                        className="bg-zinc-800 border-zinc-600 text-white placeholder-zinc-400 resize-none"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-zinc-300 border-zinc-600 hover:bg-zinc-800"
                        onClick={() => {
                          setSelectedReport(null);
                          setAdminResponse('');
                        }}
                      >
                        إلغاء
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => updateReportStatus(report.id, 'dismissed', adminResponse)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        رفض البلاغ
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateReportStatus(report.id, 'resolved', adminResponse)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        حل البلاغ
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl text-zinc-400 mb-2">لا توجد بلاغات</h3>
            <p className="text-zinc-500">لا توجد بلاغات تطابق المرشح المحدد</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsManagement;
