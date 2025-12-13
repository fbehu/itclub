import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, BarChart3, Settings, Users, ScanLine, MessageSquare, Bell, Mail, Menu, X, MoreHorizontal, ClipboardList, UsersRound } from 'lucide-react';
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
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = user?.role === 'admin' 
    ? [
        { path: '/dashboard/admin/users', label: 'Users', icon: Users },
        { path: '/dashboard/admin/qr-scanner', label: 'Scanner', icon: ScanLine },
        { path: '/dashboard/admin/groups', label: 'Guruhlar', icon: UsersRound },
        { path: '/dashboard/admin/attendance', label: 'Davomat', icon: ClipboardList },
        { path: '/dashboard/admin/send-sms', label: 'SMS', icon: Mail },
        { path: '/dashboard/chat', label: 'Chat', icon: MessageSquare },
        { path: '/dashboard/notifications', label: 'Notifications', icon: Bell },
        { path: '/dashboard/profile', label: 'Profile', icon: User },
        { path: '/dashboard/statistics', label: 'Stats', icon: BarChart3 },
        { path: '/dashboard/settings', label: 'Settings', icon: Settings },
      ]
    : [
        { path: '/dashboard/attendance', label: 'Davomat', icon: ClipboardList },
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

  const isSettingsPage = location.pathname === '/dashboard/settings';

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
          : 'pt-16 pb-20'
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
        <>
          {/* Backdrop when menu is open */}
          {mobileMoreOpen && (
            <div 
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => setMobileMoreOpen(false)}
            />
          )}

          <nav className={`fixed left-0 right-0 bg-sidebar border-t border-sidebar-border z-40 transition-all duration-300 ${
            mobileMoreOpen ? 'bottom-0 h-auto max-h-96 overflow-y-auto' : 'bottom-0 h-16'
          }`}>
            {!mobileMoreOpen ? (
              // Normal nav bar (4 items + more button)
              <div className="flex justify-around items-center h-16 px-2">
                {navItems.slice(0, 4).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMoreOpen(false);
                      }}
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

                {/* More button */}
                <button
                  onClick={() => setMobileMoreOpen(v => !v)}
                  className="flex flex-col items-center justify-center p-3 rounded-lg text-sidebar-foreground transition-transform duration-300"
                  title="Barcha menyular"
                  aria-expanded={mobileMoreOpen}
                >
                  <MoreHorizontal className="h-6 w-6" />
                </button>
              </div>
            ) : (
              // Expanded menu view - 4 column grid with animation
              <div className="p-4">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setMobileMoreOpen(false);
                        }}
                        style={{
                          animation: `slideUpFade 0.4s ease-out ${index * 0.05}s both`
                        }}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-all duration-200 ${
                          isActive(item.path)
                            ? 'bg-sidebar-primary/20 border-2 border-sidebar-primary scale-105'
                            : 'bg-sidebar-accent hover:bg-sidebar-accent/80 border-2 border-transparent'
                        }`}
                      >
                        <Icon className="h-6 w-6 text-sidebar-primary" />
                        <span className="text-xs font-semibold text-sidebar-foreground text-center leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                
                {/* Close button at bottom */}
                <button
                  onClick={() => setMobileMoreOpen(false)}
                  style={{
                    animation: `slideUpFade 0.4s ease-out ${navItems.length * 0.05}s both`
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 text-left border-t border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium">Yopish</span>
                </button>
              </div>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
