import { useSystemStatus } from '@/contexts/SystemStatusContext';
import { useAuth } from '@/contexts/AuthContext';
import { MaintenancePage } from '@/components/MaintenancePage';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import Referral from '@/pages/Referral';
import Statistics from '@/pages/Statistics';
import Settings from '@/pages/Settings';
import UserManagement from '@/pages/admin/UserManagement';
import AddUser from '@/pages/admin/AddUser';
import SendSMS from '@/pages/admin/SendSMS';
import Rooms from '@/pages/admin/Rooms';
import Groups from '@/pages/admin/Groups';
import GroupDetail from '@/pages/admin/groups/GroupDetail';
import Courses from '@/pages/admin/Courses';
import CourseDetail from '@/pages/admin/CourseDetail';
import CourseEdit from '@/pages/admin/CourseEdit';
import CourseCreate from '@/pages/admin/CourseCreate';
import AdminAttendance from '@/pages/admin/Attendance';
import AdminSystemUpdates from '@/pages/admin/SystemUpdates';
import AdminCertificates from '@/pages/admin/Certificates';
import ReferralAdmin from '@/pages/admin/ReferralAdmin';
import ReferralMeneger from '@/pages/manager/ReferralMeneger';
import StudentDetailPage from '@/pages/admin/StudentDetailPage';
import Payments from '@/pages/admin/Payments';
import StudentAttendance from '@/pages/student/Attendance';
import StudentSystemUpdates from '@/pages/student/SystemUpdates';
import StudentGroupDetail from '@/pages/student/groups/GroupDetail';
import MyEnrollments from '@/pages/student/MyEnrollments';
import TeacherGroups from '@/pages/teacher/Groups';
import TeacherGroupDetail from '@/pages/teacher/groups/GroupDetail';
import TeacherSystemUpdates from '@/pages/teacher/SystemUpdates';
import CourseMarketplace from '@/pages/teacher/CourseMarketplace';
import ManagerAttendance from '@/pages/manager/Attendance';
import ManagerGroups from '@/pages/manager/Groups';
import ManagerUserManagement from '@/pages/manager/UserManagement';
import ManagerAddUser from '@/pages/manager/AddUser';
import ManagerRooms from '@/pages/manager/Rooms';
import ManagerGroupDetail from '@/pages/manager/groups/GroupDetail';
import Chat from '@/pages/Chat';
import Notifications from '@/pages/Notifications';
import NotFound from '@/pages/NotFound';
import ExamList from '@/pages/student/exams/ExamList';
import ExamResultPage from '@/pages/student/exams/ExamResultPage';
import ExamResultsDetailPage from '@/pages/student/exams/ExamResultsDetailPage';
import ExamTakePage from '@/pages/student/exams/ExamTakePage';
import ExamManagement from '@/pages/admin/exams/ExamManagement';
import ExamCreate from '@/pages/admin/exams/ExamCreate';
import ExamDetailAdmin from '@/pages/admin/exams/ExamDetailAdmin';
import ExamMonitoring from '@/pages/admin/exams/ExamMonitoring';

export function AppRoutes() {
  const { isMaintenanceActive, isDegraded } = useSystemStatus();
  const { isLoading } = useAuth();

  // Maintenance mode - faqat maintenance page ko'rsatish
  if (isMaintenanceActive || isDegraded) {
    return (
      <Routes>
        <Route path="*" element={<MaintenancePage />} />
      </Routes>
    );
  }

  // Loading state - auth tekshirilmoqda
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 backdrop-blur-xl animate-spin">
            <div className="w-12 h-12 border-3 border-purple-400/30 border-t-purple-400 rounded-full"></div>
          </div>
          <p className="text-white text-lg font-medium">Tekshirilmoqda...</p>
        </div>
      </div>
    );
  }

  // Normal mode - barcha routes
  return (
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
        path="/dashboard/referral" 
        element={
          <ProtectedRoute>
            <Referral />
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
        path="/dashboard/admin/send-sms" 
        element={
          <ProtectedRoute>
            <SendSMS />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/admin/rooms" 
        element={
          <ProtectedRoute>
            <Rooms />
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
        path="/dashboard/admin/groups/:groupId" 
        element={
          <ProtectedRoute>
            <GroupDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/admin/courses" 
        element={
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/admin/courses/create" 
        element={
          <ProtectedRoute>
            <CourseCreate />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/admin/courses/:courseId" 
        element={
          <ProtectedRoute>
            <CourseDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/admin/courses/:courseId/edit" 
        element={
          <ProtectedRoute>
            <CourseEdit />
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
        path="/dashboard/admin/payments" 
        element={
          <ProtectedRoute>
            <Payments />
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
        path="/dashboard/admin/certificates" 
        element={
          <ProtectedRoute>
            <AdminCertificates />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/admin/referral" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ReferralAdmin />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route path="/dashboard/admin/exams" element={<ProtectedRoute><ExamManagement /></ProtectedRoute>} />
      <Route path="/dashboard/admin/exams/create" element={<ProtectedRoute><ExamCreate /></ProtectedRoute>} />
      <Route path="/dashboard/admin/exams/:examId" element={<ProtectedRoute><ExamDetailAdmin /></ProtectedRoute>} />
      <Route path="/dashboard/admin/exams/:examId/edit" element={<ProtectedRoute><ExamCreate /></ProtectedRoute>} />
      <Route 
        path="/admin/student-detail/:studentId" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <StudentDetailPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      {/* Teacher Routes */}
      <Route path="/dashboard/teacher/exams" element={<ProtectedRoute><ExamManagement /></ProtectedRoute>} />
      <Route path="/dashboard/teacher/exams/create" element={<ProtectedRoute><ExamCreate /></ProtectedRoute>} />
      <Route path="/dashboard/teacher/exams/:examId" element={<ProtectedRoute><ExamDetailAdmin /></ProtectedRoute>} />
      <Route path="/dashboard/teacher/exams/:examId/edit" element={<ProtectedRoute><ExamCreate /></ProtectedRoute>} />
      <Route 
        path="/dashboard/teacher/groups" 
        element={
          <ProtectedRoute>
            <TeacherGroups />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/teacher/groups/:groupId" 
        element={
          <ProtectedRoute>
            <TeacherGroupDetail />
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
        path="/dashboard/teacher/chat" 
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/teacher/notifications" 
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/teacher/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/teacher/system-updates" 
        element={
          <ProtectedRoute>
            <TeacherSystemUpdates />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/teacher/marketplace" 
        element={
          <ProtectedRoute>
            <CourseMarketplace />
          </ProtectedRoute>
        } 
      />
      {/* Manager Routes */}
      <Route 
        path="/dashboard/manager/users" 
        element={
          <ProtectedRoute>
            <ManagerUserManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/manager/add-user" 
        element={
          <ProtectedRoute>
            <ManagerAddUser />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/manager/attendance" 
        element={
          <ProtectedRoute>
            <ManagerAttendance />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/manager/groups" 
        element={
          <ProtectedRoute>
            <ManagerGroups />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/manager/groups/:groupId" 
        element={
          <ProtectedRoute>
            <ManagerGroupDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/manager/rooms" 
        element={
          <ProtectedRoute>
            <ManagerRooms />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/manager/referral" 
        element={
          <ProtectedRoute>
            <ReferralMeneger />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/manager/student-detail/:studentId" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <StudentDetailPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/manager/courses" 
        element={
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/manager/payments" 
        element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        } 
      />
      <Route path="/dashboard/manager/exams" element={<ProtectedRoute><ExamManagement /></ProtectedRoute>} />
      <Route path="/dashboard/manager/exams/create" element={<ProtectedRoute><ExamCreate /></ProtectedRoute>} />
      <Route path="/dashboard/manager/exams/:examId" element={<ProtectedRoute><ExamDetailAdmin /></ProtectedRoute>} />
      <Route path="/dashboard/manager/exams/:examId/edit" element={<ProtectedRoute><ExamCreate /></ProtectedRoute>} />

      <Route 
        path="/dashboard/manager/send-sms" 
        element={
          <ProtectedRoute>
            <SendSMS />
          </ProtectedRoute>
        } 
      />

      {/* Student Routes */}
      <Route 
        path="/dashboard/attendance" 
        element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
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
      <Route 
        path="/dashboard/student/groups/:groupId" 
        element={
          <ProtectedRoute>
            <StudentGroupDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/student/my-enrollments" 
        element={
          <ProtectedRoute>
            <MyEnrollments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/student/exams" 
        element={
          <ProtectedRoute>
            <ExamList />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/student/exam-results" 
        element={
          <ProtectedRoute>
            <ExamResultPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/student/exam/:examId/take" 
        element={
          <ProtectedRoute>
            <ExamTakePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/student/exam/:examId/results" 
        element={
          <ProtectedRoute>
            <ExamResultsDetailPage />
          </ProtectedRoute>
        } 
      />
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
  );
}
