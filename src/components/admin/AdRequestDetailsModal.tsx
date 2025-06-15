
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Calendar, 
  DollarSign, 
  User, 
  X, 
  Phone, 
  Clock, 
  ExternalLink,
  MessageSquare,
  CheckCircle,
  XCircle
} from 'lucide-react';

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
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
}

interface AdRequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  adRequest: AdRequest | null;
  onUpdateStatus: (requestId: string, newStatus: string, adminResponse?: string) => void;
}

const AdRequestDetailsModal: React.FC<AdRequestDetailsModalProps> = ({
  isOpen,
  onClose,
  adRequest,
  onUpdateStatus
}) => {
  if (!adRequest) return null;

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(adRequest.status)}
              <div>
                <DialogTitle className="text-white text-xl">
                  تفاصيل طلب الإعلان
                </DialogTitle>
                <DialogDescription className="text-zinc-400">
                  معلومات مفصلة عن طلب الإعلان
                </DialogDescription>
              </div>
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

        <div className="space-y-6">
          {/* معلومات الإعلان الأساسية */}
          <div className="bg-zinc-800 p-4 rounded-lg">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              معلومات الإعلان
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-400">اسم الإعلان</label>
                <p className="text-white font-medium">{adRequest.ad_name}</p>
              </div>
              
              <div>
                <label className="text-sm text-zinc-400">الحالة</label>
                <div className="mt-1">
                  {getStatusBadge(adRequest.status)}
                </div>
              </div>
              
              <div>
                <label className="text-sm text-zinc-400 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  المبلغ
                </label>
                <p className="text-green-400 font-bold text-lg">
                  {adRequest.price.toLocaleString()} ر.س
                </p>
              </div>
              
              <div>
                <label className="text-sm text-zinc-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  مدة العرض
                </label>
                <p className="text-white font-medium">{adRequest.duration_hours} ساعة</p>
              </div>
            </div>

            {/* صورة الإعلان */}
            <div className="mt-4">
              <label className="text-sm text-zinc-400">صورة الإعلان</label>
              <div className="mt-2 max-w-xs">
                <img
                  src={adRequest.image_url}
                  alt={adRequest.ad_name}
                  className="w-full h-32 object-cover rounded-lg border border-zinc-700"
                />
              </div>
            </div>

            {/* رابط الإعلان */}
            {adRequest.ad_link && (
              <div className="mt-4">
                <label className="text-sm text-zinc-400">رابط الإعلان</label>
                <div className="flex items-center gap-2 mt-1">
                  <a
                    href={adRequest.ad_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                  >
                    <ExternalLink className="h-3 w-3" />
                    فتح الرابط
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* معلومات المعلن */}
          <div className="bg-zinc-800 p-4 rounded-lg">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              معلومات المعلن
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-400">اسم المستخدم</label>
                <p className="text-white font-medium">
                  {adRequest.profiles?.username || 'مستخدم مجهول'}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-zinc-400 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  رقم الهاتف
                </label>
                <p className="text-white font-medium">{adRequest.phone_number}</p>
              </div>
            </div>
          </div>

          {/* التواريخ */}
          <div className="bg-zinc-800 p-4 rounded-lg">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              التواريخ المهمة
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-400">تاريخ الإنشاء</label>
                <p className="text-white">
                  {formatDistanceToNow(new Date(adRequest.created_at), {
                    addSuffix: true,
                    locale: ar
                  })}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-zinc-400">آخر تحديث</label>
                <p className="text-white">
                  {formatDistanceToNow(new Date(adRequest.updated_at), {
                    addSuffix: true,
                    locale: ar
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* رد الإدارة */}
          {adRequest.admin_response && (
            <div className="bg-zinc-800 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-2">رد الإدارة</h3>
              <p className="text-zinc-300">{adRequest.admin_response}</p>
            </div>
          )}

          {/* أزرار الإجراءات */}
          {adRequest.status === 'pending' && (
            <div className="flex gap-3 pt-4 border-t border-zinc-700">
              <Button
                className="bg-green-600 hover:bg-green-700 flex-1"
                onClick={() => {
                  onUpdateStatus(adRequest.id, 'approved');
                  onClose();
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                قبول الطلب
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  onUpdateStatus(adRequest.id, 'rejected');
                  onClose();
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                رفض الطلب
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdRequestDetailsModal;
