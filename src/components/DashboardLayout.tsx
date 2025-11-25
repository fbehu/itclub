import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, BarChart3, Settings, Users, ScanLine, MessageSquare, Bell, Mail, Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = user?.role === 'admin' 
    ? [
        { path: '/dashboard/admin/users', label: 'Users', icon: Users },
        { path: '/dashboard/admin/qr-scanner', label: 'Scanner', icon: ScanLine },
        { path: '/dashboard/admin/send-sms', label: 'SMS', icon: Mail },
        { path: '/dashboard/chat', label: 'Chat', icon: MessageSquare },
        { path: '/dashboard/notifications', label: 'Notifications', icon: Bell },
        { path: '/dashboard/profile', label: 'Profile', icon: User },
        { path: '/dashboard/statistics', label: 'Stats', icon: BarChart3 },
        { path: '/dashboard/settings', label: 'Settings', icon: Settings },
      ]
    : [
        { path: '/dashboard/chat', label: 'Chat', icon: MessageSquare },
        { path: '/dashboard/notifications', label: 'Notifications', icon: Bell },
        { path: '/dashboard/profile', label: 'Profile', icon: User },
        { path: '/dashboard/statistics', label: 'Stats', icon: BarChart3 },
        { path: '/dashboard/settings', label: 'Settings', icon: Settings },
      ];

  const isActive = (path: string) => location.pathname === path;

  const getCurrentPageTitle = () => {
    const currentItem = navItems.find(item => isActive(item.path));
    return currentItem?.label || 'Dashboard';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside 
          className={`fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 animate-fade-in ${
            sidebarOpen ? 'w-64' : 'w-16'
          }`}
        >
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-sidebar-foreground"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
            
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.photo} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sidebar-foreground">{user.first_name || ''}</p>
                  <p className="text-sm text-sidebar-foreground/70">{user.role === 'student' ? 'Talaba' : 'Admin'}</p>
                </div>
              </div>
            )}
          </div>

          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? 'default' : 'ghost'}
                  className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center'} ${
                    isActive(item.path) 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                  onClick={() => navigate(item.path)}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className={`h-4 w-4 ${sidebarOpen ? 'mr-2' : ''}`} />
                  {sidebarOpen && item.label}
                </Button>
              );
            })}
          </nav>

          <div className="absolute bottom-6 left-4 right-4">
            <Button
              variant="ghost"
              className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center'} text-sidebar-foreground hover:bg-sidebar-accent`}
              onClick={handleLogout}
              title={!sidebarOpen ? 'Chiqish' : undefined}
            >
              <LogOut className={`h-4 w-4 ${sidebarOpen ? 'mr-2' : ''}`} />
              {sidebarOpen && 'Chiqish'}
            </Button>
          </div>
        </aside>
      )}

      {/* Top Navbar (Desktop) */}
      {!isMobile && (
        <div className={`fixed top-0 right-0 h-16 bg-background border-b border-border transition-all duration-300 ${
          sidebarOpen ? 'left-64' : 'left-16'
        } z-40 flex items-center justify-between px-6`}>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">{getCurrentPageTitle()}</h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`${
        !isMobile 
          ? (sidebarOpen ? 'ml-64 mt-16' : 'ml-16 mt-16') 
          : 'mb-20'
      } transition-all duration-300 min-h-screen`}>
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Mobile Top Navbar */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-40 flex items-center justify-between px-4">
          <h2 className="text-lg font-semibold text-foreground">{getCurrentPageTitle()}</h2>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border animate-slide-in-right h-16">
          <div className="flex justify-around items-center h-full px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground scale-110'
                      : 'text-sidebar-foreground'
                  }`}
                  title={item.label}
                >
                  <Icon className="h-6 w-6" />
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center p-3 rounded-lg text-sidebar-foreground"
              title="Chiqish"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
