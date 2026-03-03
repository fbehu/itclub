import { ReactNode, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, BarChart3, Settings, Users, MessageSquare, Bell, Mail, Menu, X, MoreHorizontal, ClipboardList, UsersRound, Megaphone, Award, Home, CreditCard, BookOpen, Store, Share2, ChevronLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { WinterEffectsWrapper } from '@/components/WinterEffectsWrapper';

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

  const getNavItems = () => {
    if (user?.role === 'admin') {
      return [
        { path: '/dashboard/admin/users', label: 'Foydalanuvchilar', icon: Users },
        { path: '/dashboard/admin/attendance', label: 'Davomat', icon: ClipboardList },
        { path: '/dashboard/admin/groups', label: 'Guruhlar', icon: UsersRound },
        { path: '/dashboard/admin/referral', label: 'Takliflar', icon: Share2 },
        { path: '/dashboard/admin/courses', label: 'Kurslar', icon: BookOpen },
        { path: '/dashboard/admin/payments', label: 'To\'lovlar', icon: CreditCard },
        { path: '/dashboard/admin/rooms', label: 'Xonalar', icon: Home },
        { path: '/dashboard/admin/send-sms', label: 'SMS', icon: Mail },
        { path: '/dashboard/admin/system-updates', label: 'Yangiliklar', icon: Megaphone },
        { path: '/dashboard/admin/certificates', label: 'Sertifikatlar', icon: Award },
        { path: '/dashboard/chat', label: 'Suhbat', icon: MessageSquare },
        { path: '/dashboard/notifications', label: 'Bildirishnomalar', icon: Bell },
        { path: '/dashboard/profile', label: 'Profil', icon: User },
        { path: '/dashboard/statistics', label: 'Statistika', icon: BarChart3 },
        { path: '/dashboard/settings', label: 'Sozlamalar', icon: Settings },
      ];
    } else if (user?.role === 'manager') {
      return [
        { path: '/dashboard/manager/users', label: 'Foydalanuvchilar', icon: Users },
        { path: '/dashboard/manager/attendance', label: 'Davomat', icon: ClipboardList },
        { path: '/dashboard/manager/groups', label: 'Guruhlar', icon: UsersRound },
        { path: '/dashboard/manager/referral', label: 'Takliflar', icon: Share2 },
        { path: '/dashboard/manager/courses', label: 'Kurslar', icon: BookOpen },
        { path: '/dashboard/manager/payments', label: 'To\'lovlar', icon: CreditCard },
        { path: '/dashboard/manager/rooms', label: 'Xonalar', icon: Home },
        { path: '/dashboard/manager/send-sms', label: 'SMS', icon: Mail },
        { path: '/dashboard/admin/certificates', label: 'Sertifikatlar', icon: Award },
        { path: '/dashboard/chat', label: 'Suhbat', icon: MessageSquare },
        { path: '/dashboard/notifications', label: 'Bildirishnomalar', icon: Bell },
        { path: '/dashboard/profile', label: 'Profil', icon: User },
        { path: '/dashboard/settings', label: 'Sozlamalar', icon: Settings },
      ];
    } else if (user?.role === 'teacher' || user?.role === 'sub_teacher') {
      return [
        { path: '/dashboard/teacher/groups', label: 'Guruhlar', icon: UsersRound },
        { path: '/dashboard/teacher/attendance', label: 'Davomat', icon: ClipboardList },
        { path: '/dashboard/teacher/marketplace', label: 'Kurslar', icon: Store },
        { path: '/dashboard/teacher/system-updates', label: 'Yangiliklar', icon: Megaphone },
        { path: '/dashboard/chat', label: 'Suhbat', icon: MessageSquare },
        { path: '/dashboard/notifications', label: 'Bildirishnomalar', icon: Bell },
        { path: '/dashboard/profile', label: 'Profil', icon: User },
        { path: '/dashboard/settings', label: 'Sozlamalar', icon: Settings },
      ];
    } else {
      return [
        { path: '/dashboard/attendance', label: 'Davomat', icon: ClipboardList },
        { path: '/dashboard/system-updates', label: 'Yangiliklar', icon: Megaphone },
        { path: '/dashboard/chat', label: 'Suhbat', icon: MessageSquare },
        { path: '/dashboard/referral', label: 'Taklif Qilish', icon: Share2 },
        { path: '/dashboard/profile', label: 'Profil', icon: User },
        { path: '/dashboard/settings', label: 'Sozlamalar', icon: Settings },
        { path: '/dashboard/statistics', label: 'Statistika', icon: BarChart3 },
        { path: '/dashboard/notifications', label: 'Bildirishnomalar', icon: Bell },
      ];
    }
  };

  const navItems = useMemo(() => getNavItems(), [user?.role]);
  const isActive = (path: string) => location.pathname === path;

  const getCurrentPageTitle = () => {
    const currentItem = navItems.find(item => isActive(item.path));
    return currentItem?.label || 'Bosh sahifa';
  };

  const getRoleLabel = () => {
    if (user?.role === 'admin') return 'CEO & Asoschi';
    if (user?.role === 'manager') return 'Administrator';
    if (user?.role === 'sub_teacher') return 'Yordamchi o\'qituvchi';
    if (user?.role === 'teacher') return "O'qituvchi";
    return 'Talaba';
  };

  const getRoleBadgeColor = () => {
    if (user?.role === 'admin') return 'bg-red-500/15 text-red-400 border-red-500/20';
    if (user?.role === 'manager') return 'bg-orange-500/15 text-orange-400 border-orange-500/20';
    if (user?.role === 'teacher' || user?.role === 'sub_teacher') return 'bg-purple-500/15 text-purple-400 border-purple-500/20';
    return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <WinterEffectsWrapper />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={`fixed left-0 top-0 h-full bg-sidebar transition-all duration-300 ease-in-out z-30 ${
            sidebarOpen ? 'w-[260px]' : 'w-[68px]'
          } flex flex-col border-r border-sidebar-border`}
        >
          {/* Sidebar Header */}
          <div className="p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-5">
              {sidebarOpen && (
                <h1 className="text-base font-bold text-sidebar-foreground tracking-wide">
                  Universe Campus
                </h1>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
              >
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>

            {/* User Info */}
            <div className={`flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50 transition-all duration-200 ${!sidebarOpen ? 'justify-center p-2' : ''}`}>
              <Avatar className={`${sidebarOpen ? 'h-10 w-10' : 'h-8 w-8'} ring-2 ring-sidebar-primary/30 transition-all`}>
                <AvatarImage src={user.photo} />
                <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-sm font-semibold">
                  {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
                </AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sidebar-foreground text-sm truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getRoleBadgeColor()}`}>
                    {getRoleLabel()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/70'
                  } ${!sidebarOpen ? 'justify-center px-2' : ''}`}
                >
                  <Icon className={`h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200 ${active ? '' : 'group-hover:scale-110'}`} />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                  {active && sidebarOpen && (
                    <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white/80" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 flex-shrink-0 border-t border-sidebar-border">
            <button
              onClick={handleLogout}
              title={!sidebarOpen ? 'Chiqish' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200 ${
                !sidebarOpen ? 'justify-center px-2' : ''
              }`}
            >
              <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
              {sidebarOpen && 'Chiqish'}
            </button>
          </div>
        </aside>
      )}

      {/* Top Navbar (Desktop) */}
      {!isMobile && (
        <header
          className={`fixed top-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-all duration-300 ${
            sidebarOpen ? 'left-[260px]' : 'left-[68px]'
          } z-40 flex items-center justify-between px-6`}
        >
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">{getCurrentPageTitle()}</h2>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>
      )}

      {/* Main Content */}
      <main
        className={`${
          !isMobile
            ? sidebarOpen
              ? 'ml-[260px] mt-16'
              : 'ml-[68px] mt-16'
            : 'pt-16 pb-20'
        } transition-all duration-300 min-h-screen`}
      >
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">{children}</div>
      </main>

      {/* Mobile Top Navbar */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border/50 z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarImage src={user.photo} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-base font-semibold text-foreground">{getCurrentPageTitle()}</h2>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <>
          {mobileMoreOpen && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
              onClick={() => setMobileMoreOpen(false)}
            />
          )}

          <nav
            className={`fixed left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
              mobileMoreOpen
                ? 'bottom-0 rounded-t-3xl shadow-2xl'
                : 'bottom-0'
            }`}
          >
            {!mobileMoreOpen ? (
              /* Compact bottom bar */
              <div className="bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border">
                <div className="flex justify-around items-center h-16 px-2 max-w-md mx-auto">
                  {navItems.slice(0, 4).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setMobileMoreOpen(false);
                        }}
                        className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                          active
                            ? 'text-sidebar-primary scale-105'
                            : 'text-sidebar-foreground/60'
                        }`}
                      >
                        <div className={`p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-sidebar-primary/15' : ''}`}>
                          <Icon className={`h-5 w-5 ${active ? 'text-sidebar-primary' : ''}`} />
                        </div>
                        <span className={`text-[10px] font-medium ${active ? 'text-sidebar-primary' : 'text-sidebar-foreground/50'}`}>
                          {item.label.length > 8 ? item.label.slice(0, 7) + '…' : item.label}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setMobileMoreOpen(true)}
                    className="flex flex-col items-center justify-center gap-1 py-1.5 px-3 text-sidebar-foreground/60"
                  >
                    <div className="p-1.5 rounded-xl">
                      <MoreHorizontal className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium text-sidebar-foreground/50">Ko'proq</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Expanded menu */
              <div className="bg-sidebar rounded-t-3xl max-h-[75vh] overflow-y-auto">
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 rounded-full bg-sidebar-foreground/20" />
                </div>

                <div className="px-4 pb-2">
                  <p className="text-sm font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-2 mb-3">
                    Menyu
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2 px-4 pb-4">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setMobileMoreOpen(false);
                        }}
                        style={{
                          animation: `slideUpFade 0.3s ease-out ${index * 0.03}s both`,
                        }}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-200 ${
                          active
                            ? 'bg-sidebar-primary/15 ring-1 ring-sidebar-primary/30'
                            : 'bg-sidebar-accent/50 active:scale-95'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${active ? 'text-sidebar-primary' : 'text-sidebar-foreground/70'}`} />
                        <span className={`text-[10px] font-semibold text-center leading-tight ${
                          active ? 'text-sidebar-primary' : 'text-sidebar-foreground/70'
                        }`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Logout button in mobile menu */}
                <div className="px-4 pb-6 border-t border-sidebar-border pt-3">
                  <button
                    onClick={() => {
                      setMobileMoreOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-red-400 bg-red-500/10 hover:bg-red-500/15 transition-all text-sm font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    Chiqish
                  </button>
                </div>
              </div>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
