
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clock, Star, Zap, Crown } from 'lucide-react';

const AdvertiseWithUs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    adName: '',
    phoneNumber: '',
    adLink: '',
    imageFile: null as File | null
  });

  const plans = [
    {
      duration: 1,
      price: 300,
      title: 'باقة ساعة واحدة',
      description: 'مثالية للإعلانات المحدودة',
      icon: Clock,
      color: 'from-blue-500 to-blue-600'
    },
    {
      duration: 2,
      price: 700,
      title: 'باقة ساعتين',
      description: 'خيار رائع للوصول الأوسع',
      icon: Star,
      color: 'from-green-500 to-green-600'
    },
    {
      duration: 5,
      price: 1000,
      title: 'باقة 5 ساعات',
      description: 'تغطية ممتازة في أوقات الذروة',
      icon: Zap,
      color: 'from-purple-500 to-purple-600'
    },
    {
      duration: 24,
      price: 4000,
      title: 'باقة يوم كامل',
      description: 'أقصى انتشار وتأثير',
      icon: Crown,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من حجم الملف (أقل من 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'خطأ',
          description: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت',
          variant: 'destructive'
        });
        return;
      }
      
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'خطأ',
          description: 'يرجى اختيار ملف صورة صحيح',
          variant: 'destructive'
        });
        return;
      }
      
      setFormData({ ...formData, imageFile: file });
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      console.log('Starting image upload...', { fileName: file.name, fileSize: file.size });
      
      const fileName = `ad-${user?.id}-${Date.now()}-${file.name}`;
      
      // محاولة رفع الصورة
      const { data, error } = await supabase.storage
        .from('advertisements')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        
        // إذا كان الـ bucket غير موجود، سنحاول إنشاؤه
        if (error.message.includes('Bucket not found')) {
          console.log('Bucket not found, creating it...');
          
          // إنشاء الـ bucket
          const { error: bucketError } = await supabase.storage
            .createBucket('advertisements', {
              public: true,
              allowedMimeTypes: ['image/*'],
              fileSizeLimit: 5242880 // 5MB
            });
          
          if (bucketError) {
            console.error('Error creating bucket:', bucketError);
            throw new Error('فشل في إنشاء مساحة التخزين');
          }
          
          // إعادة المحاولة بعد إنشاء الـ bucket
          const { data: retryData, error: retryError } = await supabase.storage
            .from('advertisements')
            .upload(fileName, file);
          
          if (retryError) {
            console.error('Retry upload error:', retryError);
            throw retryError;
          }
          
          console.log('Image uploaded successfully after bucket creation:', retryData);
        } else {
          throw error;
        }
      } else {
        console.log('Image uploaded successfully:', data);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('advertisements')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Upload image error:', error);
      throw new Error('فشل في رفع الصورة');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started...');
    
    if (!user) {
      toast({
        title: 'خطأ',
        description: 'يجب تسجيل الدخول أولاً',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedPlan) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار باقة الإعلان',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.adName.trim() || !formData.phoneNumber.trim() || !formData.imageFile) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Uploading image...');
      const imageUrl = await uploadImage(formData.imageFile);
      
      const selectedPlanData = plans.find(p => p.duration === selectedPlan);
      
      console.log('Inserting ad request...', {
        user_id: user.id,
        ad_name: formData.adName.trim(),
        phone_number: formData.phoneNumber.trim(),
        ad_link: formData.adLink.trim() || null,
        image_url: imageUrl,
        duration_hours: selectedPlan,
        price: selectedPlanData?.price || 0
      });

      const { data, error } = await supabase
        .from('ad_requests')
        .insert([{
          user_id: user.id,
          ad_name: formData.adName.trim(),
          phone_number: formData.phoneNumber.trim(),
          ad_link: formData.adLink.trim() || null,
          image_url: imageUrl,
          duration_hours: selectedPlan,
          price: selectedPlanData?.price || 0
        }])
        .select();

      if (error) {
        console.error('Database insertion error:', error);
        throw error;
      }

      console.log('Ad request inserted successfully:', data);

      toast({
        title: 'تم الإرسال بنجاح',
        description: 'سعداء بإعلانك لدينا، سوف نتواصل معكم في أقرب وقت',
      });

      // إعادة تعيين النموذج
      setFormData({
        adName: '',
        phoneNumber: '',
        adLink: '',
        imageFile: null
      });
      setSelectedPlan(null);
      
      // العودة للصفحة السابقة بعد ثانيتين
      setTimeout(() => {
        navigate(-1);
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting ad request:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء إرسال الطلب',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors mr-2"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-lg font-bold text-white">أعلن معنا</h1>
          </div>

          <div className="p-4 space-y-6">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                روّج لعملك معنا
              </h2>
              <p className="text-zinc-400 text-lg">
                اختر الباقة المناسبة لك وابدأ في الوصول لآلاف المستخدمين
              </p>
            </div>

            {/* Pricing Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => {
                const IconComponent = plan.icon;
                return (
                  <Card 
                    key={plan.duration}
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                      selectedPlan === plan.duration 
                        ? 'ring-2 ring-purple-500 bg-purple-900/20' 
                        : 'bg-zinc-900 hover:bg-zinc-800'
                    } border-zinc-700`}
                    onClick={() => setSelectedPlan(plan.duration)}
                  >
                    <CardHeader className="text-center pb-2">
                      <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mb-2`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-white text-lg">{plan.title}</CardTitle>
                      <CardDescription className="text-zinc-400">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">{plan.price} ريال</div>
                      <div className="text-zinc-400 text-sm">لمدة {plan.duration === 24 ? 'يوم كامل' : `${plan.duration} ساعة`}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Form */}
            {selectedPlan && (
              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">تفاصيل الإعلان</CardTitle>
                  <CardDescription className="text-zinc-400">
                    املأ البيانات التالية لإرسال طلب الإعلان
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="adName" className="text-white">اسم الإعلان *</Label>
                      <Input
                        id="adName"
                        value={formData.adName}
                        onChange={(e) => setFormData({ ...formData, adName: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="أدخل اسم الإعلان"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber" className="text-white">رقم التواصل *</Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="05xxxxxxxx"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="adLink" className="text-white">رابط الإعلان</Label>
                      <Input
                        id="adLink"
                        value={formData.adLink}
                        onChange={(e) => setFormData({ ...formData, adLink: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="image" className="text-white">صورة الإعلان *</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="bg-zinc-800 border-zinc-700 text-white file:bg-purple-600 file:text-white file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4"
                        required
                      />
                      <p className="text-zinc-400 text-xs mt-1">يُفضل أن تكون الصورة بأبعاد 1:1 (مربعة)</p>
                    </div>

                    <div className="bg-zinc-800 p-4 rounded-lg">
                      <h3 className="text-white font-medium mb-2">ملخص الطلب:</h3>
                      <div className="text-zinc-300 space-y-1">
                        <p>الباقة: {plans.find(p => p.duration === selectedPlan)?.title}</p>
                        <p>المدة: {selectedPlan === 24 ? 'يوم كامل' : `${selectedPlan} ساعة`}</p>
                        <p className="text-lg font-bold text-purple-400">
                          المبلغ: {plans.find(p => p.duration === selectedPlan)?.price} ريال
                        </p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3"
                    >
                      {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdvertiseWithUs;
