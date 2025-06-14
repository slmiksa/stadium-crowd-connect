
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AuthGuard from "@/components/AuthGuard";
import AdminGuard from "@/components/AdminGuard";

// Import all pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Hashtags from "./pages/Hashtags";
import HashtagPage from "./pages/HashtagPage";
import CreateHashtagPost from "./pages/CreateHashtagPost";
import PostPage from "./pages/PostPage";
import PostDetails from "./pages/PostDetails";
import Comments from "./pages/Comments";
import MyPosts from "./pages/MyPosts";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import ProfileRedirect from "./pages/ProfileRedirect";
import EditProfile from "./pages/EditProfile";
import FollowersFollowing from "./pages/FollowersFollowing";
import ChatRooms from "./pages/ChatRooms";
import CreateChatRoom from "./pages/CreateChatRoom";
import ChatRoom from "./pages/ChatRoom";
import Messages from "./pages/Messages";
import PrivateChat from "./pages/PrivateChat";
import Matches from "./pages/Matches";
import MatchDetails from "./pages/MatchDetails";
import News from "./pages/News";
import Notifications from "./pages/Notifications";
import ApiSettings from "./pages/ApiSettings";
import AdvertiseWithUs from "./pages/AdvertiseWithUs";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Protected routes */}
              <Route path="/*" element={
                <AuthGuard>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/hashtags" element={<Hashtags />} />
                    <Route path="/hashtag/:hashtag" element={<HashtagPage />} />
                    <Route path="/create-post" element={<CreateHashtagPost />} />
                    <Route path="/post/:id" element={<PostPage />} />
                    <Route path="/post-details/:id" element={<PostDetails />} />
                    <Route path="/comments/:postId" element={<Comments />} />
                    <Route path="/my-posts" element={<MyPosts />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/user/:userId" element={<UserProfile />} />
                    <Route path="/profile/:userId" element={<ProfileRedirect />} />
                    <Route path="/edit-profile" element={<EditProfile />} />
                    <Route path="/followers-following/:userId/:type" element={<FollowersFollowing />} />
                    <Route path="/chat-rooms" element={<ChatRooms />} />
                    <Route path="/create-chat-room" element={<CreateChatRoom />} />
                    <Route path="/chat-room/:roomId" element={<ChatRoom />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/private-chat/:userId" element={<PrivateChat />} />
                    <Route path="/matches" element={<Matches />} />
                    <Route path="/match/:matchId" element={<MatchDetails />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/api-settings" element={<ApiSettings />} />
                    <Route path="/advertise" element={<AdvertiseWithUs />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AuthGuard>
              } />
              
              {/* Admin routes */}
              <Route path="/admin/dashboard" element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
