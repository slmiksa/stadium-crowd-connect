
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AuthGuard from "@/components/AuthGuard";
import AdminGuard from "@/components/AdminGuard";

// Import pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ProfileRedirect from "./pages/ProfileRedirect";
import UserProfile from "./pages/UserProfile";
import FollowersFollowing from "./pages/FollowersFollowing";
import Hashtags from "./pages/Hashtags";
import HashtagPage from "./pages/HashtagPage";
import CreateHashtagPost from "./pages/CreateHashtagPost";
import PostPage from "./pages/PostPage";
import PostDetails from "./pages/PostDetails";
import Comments from "./pages/Comments";
import MyPosts from "./pages/MyPosts";
import Messages from "./pages/Messages";
import PrivateChat from "./pages/PrivateChat";
import ChatRooms from "./pages/ChatRooms";
import CreateChatRoom from "./pages/CreateChatRoom";
import ChatRoom from "./pages/ChatRoom";
import Matches from "./pages/Matches";
import MatchDetails from "./pages/MatchDetails";
import Notifications from "./pages/Notifications";
import EditProfile from "./pages/EditProfile";
import AdvertiseWithUs from "./pages/AdvertiseWithUs";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ApiSettings from "./pages/ApiSettings";
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
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route path="/profile" element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              } />
              
              <Route path="/user-profile/:userId" element={
                <AuthGuard>
                  <UserProfile />
                </AuthGuard>
              } />
              
              <Route path="/followers-following/:userId/:type" element={
                <AuthGuard>
                  <FollowersFollowing />
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
              
              <Route path="/create-post" element={
                <AuthGuard>
                  <CreateHashtagPost />
                </AuthGuard>
              } />
              
              <Route path="/post/:postId" element={
                <AuthGuard>
                  <PostPage />
                </AuthGuard>
              } />
              
              <Route path="/post-details/:postId" element={
                <AuthGuard>
                  <PostDetails />
                </AuthGuard>
              } />
              
              <Route path="/comments/:postId" element={
                <AuthGuard>
                  <Comments />
                </AuthGuard>
              } />
              
              <Route path="/my-posts" element={
                <AuthGuard>
                  <MyPosts />
                </AuthGuard>
              } />
              
              <Route path="/messages" element={
                <AuthGuard>
                  <Messages />
                </AuthGuard>
              } />
              
              <Route path="/private-chat/:userId" element={
                <AuthGuard>
                  <PrivateChat />
                </AuthGuard>
              } />
              
              <Route path="/chat-rooms" element={
                <AuthGuard>
                  <ChatRooms />
                </AuthGuard>
              } />
              
              <Route path="/create-chat-room" element={
                <AuthGuard>
                  <CreateChatRoom />
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
              
              <Route path="/api-settings" element={
                <AuthGuard>
                  <ApiSettings />
                </AuthGuard>
              } />

              {/* Profile redirect route */}
              <Route path="/profile-redirect" element={
                <AuthGuard>
                  <ProfileRedirect />
                </AuthGuard>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              } />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
