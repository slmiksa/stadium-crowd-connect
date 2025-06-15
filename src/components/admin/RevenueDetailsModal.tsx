import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar, DollarSign, User, X } from 'lucide-react';

interface AdRequest {
  id: string;
  ad_name: string;
  price: number;
  duration_hours: number;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  phone_number: string;
  profiles: {
    username: string;
  };
}

interface RevenueDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  adRequests: AdRequest[];
  totalRevenue: number;
}

const RevenueDetailsModal: React.FC<RevenueDetailsModalProps> = ({
  isOpen,
  onClose,
  adRequests,
  totalRevenue
}) => {
  const approvedRequests = adRequests.filter(request => request.status === 'approved');

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white text-xl flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                تفاصيل الإيرادات
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                جميع طلبات الإعلانات المعتمدة والإيرادات المحققة
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* ملخص الإيرادات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-sm text-zinc-400">إجمالي الإيرادات</span>
              </div>
              <div className="text-2xl font-bold text-green-400">
                {totalRevenue.toLocaleString()} ر.س
              </div>
            </div>
            
            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-zinc-400">الطلبات المعتمدة</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {approvedRequests.length}
              </div>
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-zinc-400">متوسط سعر الإعلان</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {approvedRequests.length > 0 
                  ? Math.round(totalRevenue / approvedRequests.length).toLocaleString()
                  : 0
                } ر.س
              </div>
            </div>
          </div>

          {/* جدول التفاصيل */}
          <div className="bg-zinc-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-zinc-700">
              <h3 className="text-white font-medium">تفاصيل الطلبات المعتمدة</h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {approvedRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <DollarSign size={48} className="mx-auto text-zinc-600 mb-4" />
                  <p className="text-zinc-400">لا توجد طلبات معتمدة بعد</p>
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
                      <TableHead className="text-zinc-400">تاريخ الموافقة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedRequests.map((request) => (
                      <TableRow key={request.id} className="border-zinc-700">
                        <TableCell className="text-white font-medium">
                          {request.ad_name}
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-zinc-400" />
                            {request.profiles.username || 'مستخدم مجهول'}
                          </div>
                        </TableCell>
                        <TableCell className="text-green-400 font-medium">
                          {request.price.toLocaleString()} ر.س
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          {request.duration_hours} ساعة
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell className="text-zinc-400 text-sm">
                          {formatDistanceToNow(new Date(request.updated_at), {
                            addSuffix: true,
                            locale: ar
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RevenueDetailsModal;
