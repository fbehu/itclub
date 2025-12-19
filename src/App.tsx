import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from 'next-themes';
import Index from "./pages/Index";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Statistics from "./pages/Statistics";
import Settings from "./pages/Settings";
import UserManagement from "./pages/admin/UserManagement";
import AddUser from "./pages/admin/AddUser";
import QRScannerPage from "./pages/admin/QRScanner";
import SendSMS from "./pages/admin/SendSMS";
import Groups from "./pages/admin/Groups";
import AdminAttendance from "./pages/admin/Attendance";
import AdminSystemUpdates from "./pages/admin/SystemUpdates";
import StudentAttendance from "./pages/student/Attendance";
import StudentSystemUpdates from "./pages/student/SystemUpdates";
import TeacherGroups from "./pages/teacher/Groups";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/statistics" 
                element={
                  <ProtectedRoute>
                    <Statistics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              {/* Admin Routes */}
              <Route 
                path="/dashboard/admin/users" 
                element={
                  <ProtectedRoute>
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/admin/add-user" 
                element={
                  <ProtectedRoute>
                    <AddUser />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/admin/qr-scanner" 
                element={
                  <ProtectedRoute>
                    <QRScannerPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/admin/groups" 
                element={
                  <ProtectedRoute>
                    <Groups />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/admin/attendance" 
                element={
                  <ProtectedRoute>
                    <AdminAttendance />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/admin/system-updates" 
                element={
                  <ProtectedRoute>
                    <AdminSystemUpdates />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/admin/send-sms" 
                element={
                  <ProtectedRoute>
                    <SendSMS />
                  </ProtectedRoute>
                } 
              />
              {/* Teacher Routes */}
              <Route 
                path="/dashboard/teacher/groups" 
                element={
                  <ProtectedRoute>
                    <TeacherGroups />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/teacher/attendance" 
                element={
                  <ProtectedRoute>
                    <AdminAttendance />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/teacher/qr-scanner" 
                element={
                  <ProtectedRoute>
                    <QRScannerPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/teacher/system-updates" 
                element={
                  <ProtectedRoute>
                    <AdminSystemUpdates />
                  </ProtectedRoute>
                } 
              />
              {/* Student Routes */}
              <Route 
                path="/dashboard/attendance" 
                element={
                  <ProtectedRoute>
                    <StudentAttendance />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/system-updates" 
                element={
                  <ProtectedRoute>
                    <StudentSystemUpdates />
                  </ProtectedRoute>
                } 
              />
              {/* Shared Routes */}
              <Route 
                path="/dashboard/chat" 
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/notifications" 
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
