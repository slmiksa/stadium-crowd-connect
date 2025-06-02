
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AuthGuard from '@/components/AuthGuard';
import AdminGuard from '@/components/AdminGuard';

// Import pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import EditProfile from '@/pages/EditProfile';
import UserProfile from '@/pages/UserProfile';
import CreateHashtagPost from '@/pages/CreateHashtagPost';
import PostPage from '@/pages/PostPage';
import PostDetails from '@/pages/PostDetails';
import Comments from '@/pages/Comments';
import Hashtags from '@/pages/Hashtags';
import HashtagPage from '@/pages/HashtagPage';
import MyPosts from '@/pages/MyPosts';
import FollowersFollowing from '@/pages/FollowersFollowing';
import Messages from '@/pages/Messages';
import PrivateChat from '@/pages/PrivateChat';
import ChatRooms from '@/pages/ChatRooms';
import CreateChatRoom from '@/pages/CreateChatRoom';
import ChatRoom from '@/pages/ChatRoom';
import Matches from '@/pages/Matches';
import MatchDetails from '@/pages/MatchDetails';
import Notifications from '@/pages/Notifications';
import NotFound from '@/pages/NotFound';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import ApiSettings from '@/pages/ApiSettings';
import AdvertiseWithUs from '@/pages/AdvertiseWithUs';

import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <AuthGuard>
                    <Index />
                  </AuthGuard>
                } />
                <Route path="/profile" element={
                  <AuthGuard>
                    <Profile />
                  </AuthGuard>
                } />
                <Route path="/edit-profile" element={
                  <AuthGuard>
                    <EditProfile />
                  </AuthGuard>
                } />
                <Route path="/advertise-with-us" element={
                  <AuthGuard>
                    <AdvertiseWithUs />
                  </AuthGuard>
                } />
                <Route path="/user/:userId" element={
                  <AuthGuard>
                    <UserProfile />
                  </AuthGuard>
                } />
                <Route path="/create" element={
                  <AuthGuard>
                    <CreateHashtagPost />
                  </AuthGuard>
                } />
                <Route path="/post/:id" element={
                  <AuthGuard>
                    <PostPage />
                  </AuthGuard>
                } />
                <Route path="/post-details/:id" element={
                  <AuthGuard>
                    <PostDetails />
                  </AuthGuard>
                } />
                <Route path="/comments/:postId" element={
                  <AuthGuard>
                    <Comments />
                  </AuthGuard>
                } />
                <Route path="/hashtags" element={
                  <AuthGuard>
                    <Hashtags />
                  </AuthGuard>
                } />
                <Route path="/hashtag/:hashtag" element={
                  <AuthGuard>
                    <HashtagPage />
                  </AuthGuard>
                } />
                <Route path="/my-posts" element={
                  <AuthGuard>
                    <MyPosts />
                  </AuthGuard>
                } />
                <Route path="/followers-following/:userId" element={
                  <AuthGuard>
                    <FollowersFollowing />
                  </AuthGuard>
                } />
                <Route path="/messages" element={
                  <AuthGuard>
                    <Messages />
                  </AuthGuard>
                } />
                <Route path="/chat/:userId" element={
                  <AuthGuard>
                    <PrivateChat />
                  </AuthGuard>
                } />
                <Route path="/chat-rooms" element={
                  <AuthGuard>
                    <ChatRooms />
                  </AuthGuard>
                } />
                <Route path="/rooms" element={
                  <AuthGuard>
                    <ChatRooms />
                  </AuthGuard>
                } />
                <Route path="/create-room" element={
                  <AuthGuard>
                    <CreateChatRoom />
                  </AuthGuard>
                } />
                <Route path="/room/:roomId" element={
                  <AuthGuard>
                    <ChatRoom />
                  </AuthGuard>
                } />
                <Route path="/chat-room/:roomId" element={
                  <AuthGuard>
                    <ChatRoom />
                  </AuthGuard>
                } />
                <Route path="/matches" element={
                  <AuthGuard>
                    <Matches />
                  </AuthGuard>
                } />
                <Route path="/match/:matchId" element={
                  <AuthGuard>
                    <MatchDetails />
                  </AuthGuard>
                } />
                <Route path="/notifications" element={
                  <AuthGuard>
                    <Notifications />
                  </AuthGuard>
                } />
                <Route path="/api-settings" element={
                  <AuthGuard>
                    <ApiSettings />
                  </AuthGuard>
                } />
                
                {/* Admin routes */}
                <Route path="/admin" element={
                  <AdminGuard>
                    <AdminDashboard />
                  </AdminGuard>
                } />
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
          <Toaster />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
