
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import AuthGuard from "./components/AuthGuard";
import IntroScreen from "./components/IntroScreen";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Hashtags from "./pages/Hashtags";
import CreateHashtagPost from "./pages/CreateHashtagPost";
import HashtagPage from "./pages/HashtagPage";
import PostPage from "./pages/PostPage";
import Matches from "./pages/Matches";
import MatchDetails from "./pages/MatchDetails";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import FollowersFollowing from "./pages/FollowersFollowing";
import Messages from "./pages/Messages";
import PrivateChat from "./pages/PrivateChat";
import ChatRooms from "./pages/ChatRooms";
import CreateChatRoom from "./pages/CreateChatRoom";
import ChatRoom from "./pages/ChatRoom";
import MyPosts from "./pages/MyPosts";
import Notifications from "./pages/Notifications";
import ApiSettings from "./pages/ApiSettings";
import NotFound from "./pages/NotFound";
import { useState, useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Check if user has seen intro before
    const hasSeenIntro = localStorage.getItem('hasSeenIntro');
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, []);

  const handleIntroComplete = () => {
    try {
      localStorage.setItem('hasSeenIntro', 'true');
      setShowIntro(false);
    } catch (error) {
      console.error('Error saving intro state:', error);
      setShowIntro(false);
    }
  };

  if (showIntro) {
    return <IntroScreen onComplete={handleIntroComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LanguageProvider>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/hashtags"
                  element={
                    <AuthGuard>
                      <Hashtags />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/create-hashtag-post"
                  element={
                    <AuthGuard>
                      <CreateHashtagPost />
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
                  path="/post/:postId"
                  element={
                    <AuthGuard>
                      <PostPage />
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
                  path="/match/:matchId"
                  element={
                    <AuthGuard>
                      <MatchDetails />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <AuthGuard>
                      <Profile />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/user/:userId"
                  element={
                    <AuthGuard>
                      <UserProfile />
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
                  path="/followers-following/:userId/:type"
                  element={
                    <AuthGuard>
                      <FollowersFollowing />
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
                  path="/api-settings"
                  element={
                    <AuthGuard>
                      <ApiSettings />
                    </AuthGuard>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
