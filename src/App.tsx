
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
import ChatRooms from "./pages/ChatRooms";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
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
      <Route path="/chat-rooms" element={<ChatRooms />} />
      <Route path="/messages" element={<Messages />} />
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
