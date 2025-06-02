import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";

// Regular app pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import EditProfile from "./pages/EditProfile";
import FollowersFollowing from "./pages/FollowersFollowing";
import Hashtags from "./pages/Hashtags";
import HashtagPage from "./pages/HashtagPage";
import CreateHashtagPost from "./pages/CreateHashtagPost";
import PostDetails from "./pages/PostDetails";
import PostPage from "./pages/PostPage";
import Comments from "./pages/Comments";
import MyPosts from "./pages/MyPosts";
import ChatRooms from "./pages/ChatRooms";
import CreateChatRoom from "./pages/CreateChatRoom";
import ChatRoom from "./pages/ChatRoom";
import PrivateChat from "./pages/PrivateChat";
import Matches from "./pages/Matches";
import MatchDetails from "./pages/MatchDetails";
import ApiSettings from "./pages/ApiSettings";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              
              {/* Regular app routes */}
              <Route path="/" element={
                <AuthGuard>
                  <Layout>
                    <Index />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/messages" element={
                <AuthGuard>
                  <Layout>
                    <Messages />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/notifications" element={
                <AuthGuard>
                  <Layout>
                    <Notifications />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/profile" element={
                <AuthGuard>
                  <Layout>
                    <Profile />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/profile/:userId" element={
                <AuthGuard>
                  <Layout>
                    <UserProfile />
                  </Layout>
                </AuthGuard>
              } />
              
              {/* Redirect old route to new route with parameter mapping */}
              <Route path="/user-profile/:userId" element={<Navigate to={window.location.pathname.replace('/user-profile/', '/profile/')} replace />} />
              
              <Route path="/edit-profile" element={
                <AuthGuard>
                  <Layout>
                    <EditProfile />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/followers-following/:userId/:type" element={
                <AuthGuard>
                  <Layout>
                    <FollowersFollowing />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/hashtags" element={
                <AuthGuard>
                  <Layout>
                    <Hashtags />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/hashtag/:hashtag" element={
                <AuthGuard>
                  <Layout>
                    <HashtagPage />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/create-post" element={
                <AuthGuard>
                  <Layout>
                    <CreateHashtagPost />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/post/:postId" element={
                <AuthGuard>
                  <Layout>
                    <PostDetails />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/posts/:postId" element={
                <AuthGuard>
                  <Layout>
                    <PostPage />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/posts/:postId/comments" element={
                <AuthGuard>
                  <Layout>
                    <Comments />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/my-posts" element={
                <AuthGuard>
                  <Layout>
                    <MyPosts />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/chat-rooms" element={
                <AuthGuard>
                  <Layout>
                    <ChatRooms />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/create-chat-room" element={
                <AuthGuard>
                  <Layout>
                    <CreateChatRoom />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/chat-room/:roomId" element={
                <AuthGuard>
                  <Layout>
                    <ChatRoom />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/private-chat/:userId" element={
                <AuthGuard>
                  <Layout>
                    <PrivateChat />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/matches" element={
                <AuthGuard>
                  <Layout>
                    <Matches />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/match/:matchId" element={
                <AuthGuard>
                  <Layout>
                    <MatchDetails />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/api-settings" element={
                <AuthGuard>
                  <Layout>
                    <ApiSettings />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
