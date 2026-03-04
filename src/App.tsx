import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SeasonProvider } from "@/contexts/SeasonContext";
import { GlassThemeProvider } from "@/contexts/GlassThemeContext";
import { SystemStatusProvider } from "@/contexts/SystemStatusContext";
import { AppRoutes } from "@/components/AppRoutes";
import { ThemeProvider } from 'next-themes';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SeasonProvider>
        <GlassThemeProvider>
        <AuthProvider>
          <SystemStatusProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </TooltipProvider>
          </SystemStatusProvider>
        </AuthProvider>
        </GlassThemeProvider>
      </SeasonProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
