
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import FollowersFollowing from "./pages/FollowersFollowing";
import Hashtags from "./pages/Hashtags";
import HashtagPage from "./pages/HashtagPage";
import CreateHashtagPost from "./pages/CreateHashtagPost";
import MyPosts from "./pages/MyPosts";
import Matches from "./pages/Matches";
import MatchDetails from "./pages/MatchDetails";
import Messages from "./pages/Messages";
import PrivateChat from "./pages/PrivateChat";
import ChatRooms from "./pages/ChatRooms";
import CreateChatRoom from "./pages/CreateChatRoom";
import ChatRoom from "./pages/ChatRoom";
import ApiSettings from "./pages/ApiSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                <Route path="/user-profile/:userId" element={<AuthGuard><UserProfile /></AuthGuard>} />
                <Route path="/followers-following/:userId/:type" element={<AuthGuard><FollowersFollowing /></AuthGuard>} />
                <Route path="/hashtags" element={<AuthGuard><Hashtags /></AuthGuard>} />
                <Route path="/hashtag/:tag" element={<AuthGuard><HashtagPage /></AuthGuard>} />
                <Route path="/create-hashtag-post" element={<AuthGuard><CreateHashtagPost /></AuthGuard>} />
                <Route path="/my-posts" element={<AuthGuard><MyPosts /></AuthGuard>} />
                <Route path="/matches" element={<AuthGuard><Matches /></AuthGuard>} />
                <Route path="/match/:matchId" element={<AuthGuard><MatchDetails /></AuthGuard>} />
                <Route path="/messages" element={<AuthGuard><Messages /></AuthGuard>} />
                <Route path="/private-chat/:userId" element={<AuthGuard><PrivateChat /></AuthGuard>} />
                <Route path="/chat-rooms" element={<AuthGuard><ChatRooms /></AuthGuard>} />
                <Route path="/create-chat-room" element={<AuthGuard><CreateChatRoom /></AuthGuard>} />
                <Route path="/chat-room/:roomId" element={<AuthGuard><ChatRoom /></AuthGuard>} />
                <Route path="/api-settings" element={<AuthGuard><ApiSettings /></AuthGuard>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
