
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-bold text-blue-400 mb-4">404</h1>
          <h2 className="text-xl md:text-2xl font-semibold mb-2">الصفحة غير موجودة</h2>
          <p className="text-zinc-400 mb-6">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى موقع آخر
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="text-white border-zinc-700 hover:bg-zinc-800 flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            العودة للخلف
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Home size={16} />
            الصفحة الرئيسية
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-zinc-500">
          <p>المسار المطلوب: <code className="bg-zinc-800 px-2 py-1 rounded">{location.pathname}</code></p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
