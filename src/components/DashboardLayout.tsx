import { ReactNode, useState, useMemo, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, BarChart3, Settings, Users, MessageSquare, Bell, Mail, Menu, X, MoreHorizontal, ClipboardList, UsersRound, Megaphone, Award, Home, CreditCard, BookOpen, Store, Share2, ChevronLeft, GraduationCap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { WinterEffectsWrapper } from '@/components/WinterEffectsWrapper';
import { useGlassTheme } from '@/contexts/GlassThemeContext';

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
  const { glassEnabled } = useGlassTheme();
  const isGlass = glassEnabled && user?.role === 'student';
  const isFullWidthPage = location.pathname === '/dashboard/chat';

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

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
        { path: '/dashboard/admin/exams', label: 'Imtihonlar', icon: GraduationCap },
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
        { path: '/dashboard/manager/exams', label: 'Imtihonlar', icon: GraduationCap },
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
        { path: '/dashboard/student/exams', label: 'Imtihonlar', icon: GraduationCap },
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

  const getBackgroundStyle = () => {
    if (!isGlass) return {};
    const bgImage = isMobile 
      ? 'url(/backround_image2.jpeg)' 
      : 'url(/backround_image1.jpeg)';
    return {
      backgroundImage: bgImage,
      backgroundSize: isMobile ? 'cover' : 'auto',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: isMobile ? 'no-repeat' : 'repeat',
    };
  };

  return (
    <div 
      className={`min-h-screen ${isGlass ? 'bg-background' : 'bg-background'}`}
      style={getBackgroundStyle()}
    >
      <WinterEffectsWrapper />

      {/* Desktop Sidebar */}
      {!isMobile && (
         <aside
          className={`fixed left-0 top-0 h-full transition-all duration-300 ease-in-out z-30 ${
            sidebarOpen ? 'w-[260px]' : 'w-[68px]'
          } flex flex-col border-r ${isGlass ? 'bg-sidebar/30 border-sidebar-border/50 backdrop-blur-2xl' : 'bg-sidebar border-sidebar-border'}`}
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
          className={`fixed top-0 right-0 h-16 border-b-2 transition-all duration-300 ${
            sidebarOpen ? 'left-[260px]' : 'left-[68px]'
          } z-40 flex items-center justify-between px-6 ${isGlass ? 'bg-background/20 backdrop-blur-3xl border-border/50' : 'bg-background/80 backdrop-blur-xl border-border/60'}`}
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
        {isFullWidthPage ? (
          children
        ) : (
          <div className={`p-4 md:p-6 max-w-[1600px] mx-auto ${!isGlass ? '[&>*]:shadow-[0_20px_60px_rgba(0,0,0,0.3)] [&>*]:backdrop-blur-sm' : ''}`}>
            {children}
          </div>
        )}
      </main>

      {/* Mobile Top Navbar */}
      {isMobile && (
        <header className={`fixed top-0 left-0 right-0 h-16 border-b z-40 flex items-center justify-between px-4 ${isGlass ? 'bg-background/20 backdrop-blur-3xl border-border/30' : 'bg-background/80 backdrop-blur-xl border-border/50'}`}>
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
                : 'bottom-0 rounded-t-3xl'
            }`}
          >
            {!mobileMoreOpen ? (
              /* Compact bottom bar */
              <div className={`w-full rounded-t-3xl ${isGlass ? 'bg-sidebar/30 backdrop-blur-2xl border-sidebar-border/50' : 'bg-sidebar/95 backdrop-blur-xl'} border-t-2 border-l border-r border-sidebar-border`}>
                <div className="flex justify-around items-center h-16 px-2 w-full">
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
                          isGlass
                            ? `glass-nav-item ${active ? 'active' : ''}`
                            : active
                              ? 'text-sidebar-primary scale-105'
                              : 'text-sidebar-foreground/60'
                        }`}
                        title={item.label}
                      >
                        <div className={`p-1.5 rounded-xl transition-all duration-200 ${!isGlass && active ? 'bg-sidebar-primary/15' : ''}`}>
                          <Icon className={`h-5 w-5 ${active ? (isGlass ? 'text-primary' : 'text-sidebar-primary') : (isGlass ? 'text-foreground/60' : '')}`} />
                        </div>
                      </button>
                    );
                  })}

                  {/* Profile Button */}
                  <button
                    onClick={() => navigate(navItems.find(item => item.label === 'Profil')?.path || '/dashboard/profile')}
                    className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                      isGlass
                        ? `glass-nav-item ${isActive(navItems.find(item => item.label === 'Profil')?.path || '/dashboard/profile') ? 'active' : ''}`
                        : isActive(navItems.find(item => item.label === 'Profil')?.path || '/dashboard/profile')
                          ? 'text-sidebar-primary scale-105'
                          : 'text-sidebar-foreground/60'
                    }`}
                    title="Profil"
                  >
                    <div className={`p-1.5 rounded-xl transition-all duration-200 ${!isGlass && isActive(navItems.find(item => item.label === 'Profil')?.path || '/dashboard/profile') ? 'bg-sidebar-primary/15' : ''}`}>
                      <User className={`h-5 w-5 ${isActive(navItems.find(item => item.label === 'Profil')?.path || '/dashboard/profile') ? (isGlass ? 'text-primary' : 'text-sidebar-primary') : (isGlass ? 'text-foreground/60' : '')}`} />
                    </div>
                  </button>

                  <button
                    onClick={() => setMobileMoreOpen(true)}
                    className={`flex items-center justify-center rounded-2xl transition-all duration-200 border-2 p-1.5 ${isGlass ? 'border-sidebar-border/50 text-foreground/70' : 'border-sidebar-border text-sidebar-foreground/60'}`}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Expanded menu */
              <div className={`glass-nav-item-noactive rounded-t-3xl max-h-[75vh] overflow-y-auto ${isGlass ? 'bg-sidebar/35 backdrop-blur-8xl' : 'bg-sidebar'}`}>
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className={`w-10 h-1 rounded-full ${isGlass ? 'bg-foreground/35' : 'bg-sidebar-foreground/20'}`} />
                </div>

                <div className="px-4 pb-2">
                  <p className={`text-sm font-semibold uppercase tracking-wider px-2 mb-3 ${isGlass ? 'text-foreground/70' : 'text-sidebar-foreground/50'}`}>
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
                        className={`flex flex-col glass-nav-item-noactive bg-sidebar/50 shadow-lg items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-200 ${
                          isGlass
                            ? `${active ? 'glass-nav-item active bg-sidebar/95 shadow-lg' : 'bg-sidebar/10 backdrop-blur-md'}`
                            : active
                              ? 'bg-sidebar-primary/15 ring-1 ring-sidebar-primary/30'
                              : 'bg-sidebar-accent/50 active:scale-95'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${active ? (isGlass ? 'text-primary' : 'text-sidebar-primary') : (isGlass ? 'text-foreground/90' : 'text-sidebar-foreground/70')}`} />
                        <span className={`text-[10px] font-semibold text-center leading-tight ${
                          active ? (isGlass ? 'text-primary' : 'text-sidebar-primary') : (isGlass ? 'text-foreground/90' : 'text-sidebar-foreground/70')
                        }`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Logout button in mobile menu */}
                <div className={`px-4 pb-6 pt-3 ${isGlass ? 'border-t border-border/30' : 'border-t border-sidebar-border'}`}>
                  <button
                    onClick={() => {
                      setMobileMoreOpen(false);
                      handleLogout();
                    }}
                    className={`glass-nav-item-chiqish w-full flex items-center justify-center gap-2 py-3 rounded-2xl transition-all text-sm font-medium ${isGlass ? 'glass-btn ' : 'text-red-400 bg-red-500/10 hover:bg-red-500/15'}`}
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
