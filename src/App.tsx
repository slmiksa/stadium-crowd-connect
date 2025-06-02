
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AuthGuard from "@/components/AuthGuard";
import AdminGuard from "@/components/AdminGuard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import ProfileRedirect from "./pages/ProfileRedirect";
import Hashtags from "./pages/Hashtags";
import HashtagPage from "./pages/HashtagPage";
import CreateHashtagPost from "./pages/CreateHashtagPost";
import PostDetails from "./pages/PostDetails";
import PostPage from "./pages/PostPage";
import Comments from "./pages/Comments";
import EditProfile from "./pages/EditProfile";
import MyPosts from "./pages/MyPosts";
import Notifications from "./pages/Notifications";
import FollowersFollowing from "./pages/FollowersFollowing";
import ChatRooms from "./pages/ChatRooms";
import CreateChatRoom from "./pages/CreateChatRoom";
import ChatRoom from "./pages/ChatRoom";
import Messages from "./pages/Messages";
import PrivateChat from "./pages/PrivateChat";
import Matches from "./pages/Matches";
import MatchDetails from "./pages/MatchDetails";
import AdvertiseWithUs from "./pages/AdvertiseWithUs";
import ApiSettings from "./pages/ApiSettings";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/profile"
                  element={
                    <AuthGuard>
                      <Profile />
                    </AuthGuard>
                  }
                />
                {/* Redirect route for incorrect /profile/:userId paths */}
                <Route
                  path="/profile/:userId"
                  element={
                    <AuthGuard>
                      <ProfileRedirect />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/user-profile/:userId"
                  element={
                    <AuthGuard>
                      <UserProfile />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/hashtags"
                  element={
                    <AuthGuard>
                      <Hashtags />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/hashtag/:hashtag"
                  element={
                    <AuthGuard>
                      <HashtagPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/create-post"
                  element={
                    <AuthGuard>
                      <CreateHashtagPost />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/post-details/:postId"
                  element={
                    <AuthGuard>
                      <PostDetails />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/post/:postId"
                  element={
                    <AuthGuard>
                      <PostPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/comments/:postId"
                  element={
                    <AuthGuard>
                      <Comments />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/edit-profile"
                  element={
                    <AuthGuard>
                      <EditProfile />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/my-posts"
                  element={
                    <AuthGuard>
                      <MyPosts />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <AuthGuard>
                      <Notifications />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/followers-following/:userId/:tab"
                  element={
                    <AuthGuard>
                      <FollowersFollowing />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/chat-rooms"
                  element={
                    <AuthGuard>
                      <ChatRooms />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/create-chat-room"
                  element={
                    <AuthGuard>
                      <CreateChatRoom />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/chat-room/:roomId"
                  element={
                    <AuthGuard>
                      <ChatRoom />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <AuthGuard>
                      <Messages />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/private-chat/:userId"
                  element={
                    <AuthGuard>
                      <PrivateChat />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/matches"
                  element={
                    <AuthGuard>
                      <Matches />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/match-details/:matchId"
                  element={
                    <AuthGuard>
                      <MatchDetails />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/advertise-with-us"
                  element={
                    <AuthGuard>
                      <AdvertiseWithUs />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/api-settings"
                  element={
                    <AuthGuard>
                      <ApiSettings />
                    </AuthGuard>
                  }
                />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminGuard>
                      <AdminDashboard />
                    </AdminGuard>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
