import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, BarChart3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/ThemeToggle';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = user?.role === 'admin' 
    ? [
        { path: '/dashboard/admin/users', label: 'Foydalanuvchilar', icon: User },
        { path: '/dashboard/statistics', label: 'Statistika', icon: BarChart3 },
      ]
    : [
        { path: '/dashboard/profile', label: 'Profil', icon: User },
        { path: '/dashboard/statistics', label: 'Statistika', icon: BarChart3 },
      ];

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border animate-fade-in">
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.photo} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.surname[0]}{user.lastname[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sidebar-foreground">{user.surname}</p>
                  <p className="text-sm text-sidebar-foreground/70">{user.role === 'student' ? 'Talaba' : 'Admin'}</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>

          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? 'default' : 'ghost'}
                  className={`w-full justify-start ${
                    isActive(item.path) 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          <div className="absolute bottom-6 left-4 right-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Chiqish
            </Button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`${!isMobile ? 'ml-64' : 'mb-20'} min-h-screen`}>
        <div className="p-6">
          <div className="flex justify-end mb-4 md:hidden">
            <ThemeToggle />
          </div>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border animate-slide-in-right">
          <div className="flex justify-around items-center h-20 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground scale-110'
                      : 'text-sidebar-foreground'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-sidebar-foreground"
            >
              <LogOut className="h-6 w-6" />
              <span className="text-xs font-medium">Chiqish</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
