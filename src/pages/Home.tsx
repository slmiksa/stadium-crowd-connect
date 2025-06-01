
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="max-w-2xl mx-auto p-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">مرحباً بك</h1>
            <p className="text-gray-300">الصفحة الرئيسية</p>
          </div>

          <div className="grid gap-4">
            <button
              onClick={() => navigate('/hashtags')}
              className="p-4 bg-zinc-800 rounded-lg text-white hover:bg-zinc-700 transition-colors"
            >
              الهاشتاجات
            </button>
            
            <button
              onClick={() => navigate('/chat-rooms')}
              className="p-4 bg-zinc-800 rounded-lg text-white hover:bg-zinc-700 transition-colors"
            >
              غرف الدردشة
            </button>
            
            <button
              onClick={() => navigate('/messages')}
              className="p-4 bg-zinc-800 rounded-lg text-white hover:bg-zinc-700 transition-colors"
            >
              الرسائل
            </button>
            
            <button
              onClick={() => navigate('/notifications')}
              className="p-4 bg-zinc-800 rounded-lg text-white hover:bg-zinc-700 transition-colors"
            >
              الإشعارات
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
