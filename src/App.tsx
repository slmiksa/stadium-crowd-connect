
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import AuthGuard from "./components/AuthGuard";
import Matches from "./pages/Matches";
import MatchDetails from "./pages/MatchDetails";
import Hashtags from "./pages/Hashtags";
import CreateHashtagPost from "./pages/CreateHashtagPost";
import HashtagPage from "./pages/HashtagPage";
import ChatRooms from "./pages/ChatRooms";
import CreateChatRoom from "./pages/CreateChatRoom";
import ChatRoom from "./pages/ChatRoom";
import Messages from "./pages/Messages";
import PrivateChat from "./pages/PrivateChat";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import MyPosts from "./pages/MyPosts";
import ApiSettings from "./pages/ApiSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Separate component to handle authenticated routes
const AuthenticatedApp = () => (
  <AuthGuard>
    <Routes>
      <Route path="/" element={<Navigate to="/matches" replace />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/match/:matchId" element={<MatchDetails />} />
      <Route path="/hashtags" element={<Hashtags />} />
      <Route path="/create-hashtag-post" element={<CreateHashtagPost />} />
      <Route path="/hashtag/:hashtag" element={<HashtagPage />} />
      <Route path="/user/:userId" element={<UserProfile />} />
      <Route path="/my-posts" element={<MyPosts />} />
      <Route path="/chat-rooms" element={<ChatRooms />} />
      <Route path="/create-chat-room" element={<CreateChatRoom />} />
      <Route path="/chat-room/:roomId" element={<ChatRoom />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/private-chat/:userId" element={<PrivateChat />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/api-settings" element={<ApiSettings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </AuthGuard>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AuthenticatedApp />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
