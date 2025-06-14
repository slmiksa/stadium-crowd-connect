
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useVerificationNotifications } from "@/hooks/useVerificationNotifications";
import { useRoomInvitationUpdate } from "@/hooks/useRoomInvitationUpdate";

// Import pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import ProfileRedirect from "./pages/ProfileRedirect";
import EditProfile from "./pages/EditProfile";
import PostDetails from "./pages/PostDetails";
import PostPage from "./pages/PostPage";
import MyPosts from "./pages/MyPosts";
import Comments from "./pages/Comments";
import CreateHashtagPost from "./pages/CreateHashtagPost";
import Hashtags from "./pages/Hashtags";
import HashtagPage from "./pages/HashtagPage";
import FollowersFollowing from "./pages/FollowersFollowing";
import Messages from "./pages/Messages";
import PrivateChat from "./pages/PrivateChat";
import Notifications from "./pages/Notifications";
import ChatRooms from "./pages/ChatRooms";
import CreateChatRoom from "./pages/CreateChatRoom";
import ChatRoom from "./pages/ChatRoom";
import Matches from "./pages/Matches";
import MatchDetails from "./pages/MatchDetails";
import News from "./pages/News";
import AdvertiseWithUs from "./pages/AdvertiseWithUs";
import ApiSettings from "./pages/ApiSettings";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  useVerificationNotifications();
  useRoomInvitationUpdate();
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/profile/:userId" element={<ProfileRedirect />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/post/:postId" element={<PostDetails />} />
        <Route path="/posts/:postId" element={<PostPage />} />
        <Route path="/my-posts" element={<MyPosts />} />
        <Route path="/comments/:postId" element={<Comments />} />
        <Route path="/create-post" element={<CreateHashtagPost />} />
        <Route path="/hashtags" element={<Hashtags />} />
        <Route path="/hashtag/:tag" element={<HashtagPage />} />
        <Route path="/followers-following/:userId" element={<FollowersFollowing />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/chat/:userId" element={<PrivateChat />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/rooms" element={<ChatRooms />} />
        <Route path="/create-room" element={<CreateChatRoom />} />
        <Route path="/room/:roomId" element={<ChatRoom />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/match/:matchId" element={<MatchDetails />} />
        <Route path="/news" element={<News />} />
        <Route path="/advertise" element={<AdvertiseWithUs />} />
        <Route path="/api-settings" element={<ApiSettings />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppContent />
            <Toaster />
            <Sonner />
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
