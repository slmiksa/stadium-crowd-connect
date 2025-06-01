
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useRoomInvitationUpdate } from '@/hooks/useRoomInvitationUpdate';
import AuthGuard from '@/components/AuthGuard';
import Profile from '@/pages/Profile';
import EditProfile from '@/pages/EditProfile';
import Hashtags from '@/pages/Hashtags';
import HashtagPage from '@/pages/HashtagPage';
import UserProfile from '@/pages/UserProfile';
import PostDetails from '@/pages/PostDetails';
import ChatRooms from '@/pages/ChatRooms';
import ChatRoom from '@/pages/ChatRoom';
import Messages from '@/pages/Messages';
import PrivateChat from '@/pages/PrivateChat';
import Notifications from '@/pages/Notifications';
import Matches from '@/pages/Matches';
import MatchDetails from '@/pages/MatchDetails';
import Comments from '@/pages/Comments';
import CreateHashtagPost from '@/pages/CreateHashtagPost';
import MyPosts from '@/pages/MyPosts';

const queryClient = new QueryClient();

function AppContent() {
  useRoomInvitationUpdate();
  
  return (
    <Routes>
      <Route path="/" element={<AuthGuard><Hashtags /></AuthGuard>} />
      <Route path="/hashtags" element={<AuthGuard><Hashtags /></AuthGuard>} />
      <Route path="/hashtag/:hashtag" element={<AuthGuard><HashtagPage /></AuthGuard>} />
      <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
      <Route path="/edit-profile" element={<AuthGuard><EditProfile /></AuthGuard>} />
      <Route path="/user-profile/:userId" element={<AuthGuard><UserProfile /></AuthGuard>} />
      <Route path="/post/:postId" element={<AuthGuard><PostDetails /></AuthGuard>} />
      <Route path="/chat-rooms" element={<AuthGuard><ChatRooms /></AuthGuard>} />
      <Route path="/chat-room/:roomId" element={<AuthGuard><ChatRoom /></AuthGuard>} />
      <Route path="/messages" element={<AuthGuard><Messages /></AuthGuard>} />
      <Route path="/private-chat/:receiverId" element={<AuthGuard><PrivateChat /></AuthGuard>} />
      <Route path="/notifications" element={<AuthGuard><Notifications /></AuthGuard>} />
      <Route path="/matches" element={<AuthGuard><Matches /></AuthGuard>} />
      <Route path="/match-details/:matchId" element={<AuthGuard><MatchDetails /></AuthGuard>} />
      <Route path="/comments/:postId" element={<AuthGuard><Comments /></AuthGuard>} />
      <Route path="/create-hashtag-post" element={<AuthGuard><CreateHashtagPost /></AuthGuard>} />
      <Route path="/my-posts" element={<AuthGuard><MyPosts /></AuthGuard>} />
      <Route path="*" element={<Navigate to="/hashtags" />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
