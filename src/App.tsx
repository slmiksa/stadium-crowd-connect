
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import UserProfile from '@/pages/UserProfile';
import FollowersFollowing from '@/pages/FollowersFollowing';
import ChatRooms from '@/pages/ChatRooms';
import ChatRoom from '@/pages/ChatRoom';
import CreateChatRoom from '@/pages/CreateChatRoom';
import Messages from '@/pages/Messages';
import PrivateChat from '@/pages/PrivateChat';
import Hashtags from '@/pages/Hashtags';
import HashtagPage from '@/pages/HashtagPage';
import CreateHashtagPost from '@/pages/CreateHashtagPost';
import MyPosts from '@/pages/MyPosts';
import Matches from '@/pages/Matches';
import MatchDetails from '@/pages/MatchDetails';
import ApiSettings from '@/pages/ApiSettings';
import NotFound from '@/pages/NotFound';
import { Toaster } from "@/components/ui/toaster"
import Notifications from '@/pages/Notifications';

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!user && !isLoading) {
      window.location.href = '/login';
    }
  }, [user, isLoading]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-zinc-900">
              <Toaster />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                <Route path="/user-profile/:userId" element={<AuthGuard><UserProfile /></AuthGuard>} />
                <Route path="/followers-following/:userId" element={<AuthGuard><FollowersFollowing /></AuthGuard>} />
                <Route path="/chat-rooms" element={<AuthGuard><ChatRooms /></AuthGuard>} />
                <Route path="/chat-room/:roomId" element={<AuthGuard><ChatRoom /></AuthGuard>} />
                <Route path="/create-chat-room" element={<AuthGuard><CreateChatRoom /></AuthGuard>} />
                <Route path="/messages" element={<AuthGuard><Messages /></AuthGuard>} />
                <Route path="/private-chat/:userId" element={<AuthGuard><PrivateChat /></AuthGuard>} />
                <Route path="/hashtags" element={<AuthGuard><Hashtags /></AuthGuard>} />
                <Route path="/hashtag/:hashtag" element={<AuthGuard><HashtagPage /></AuthGuard>} />
                <Route path="/create-hashtag-post" element={<AuthGuard><CreateHashtagPost /></AuthGuard>} />
                <Route path="/my-posts" element={<AuthGuard><MyPosts /></AuthGuard>} />
                <Route path="/matches" element={<AuthGuard><Matches /></AuthGuard>} />
                <Route path="/match/:matchId" element={<AuthGuard><MatchDetails /></AuthGuard>} />
                <Route path="/api-settings" element={<AuthGuard><ApiSettings /></AuthGuard>} />
                <Route path="/notifications" element={<AuthGuard><Notifications /></AuthGuard>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
