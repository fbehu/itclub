import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader, Sparkles, Calendar, Mail, Phone, Users, Award, Star, BookOpen, TrendingUp, Clock, Target, Zap, ChevronRight, Edit2, Lock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import EditProfileDialog from '@/pages/student/EditProfileDialog';
import ChangePasswordDialog from '@/pages/student/ChangePasswordDialog';

interface ProfileUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  parent_phone_number?: { father?: string; mother?: string } | null;
  tg_username?: string;
  level?: string;
  student_groups: Array<{ id: number; name: string }>;
  teaching_groups: Array<{ id: number; name: string }>;
  social?: string;
  coins: number;
  invite_code?: string;
  photo?: string | null;
  role: 'student' | 'sub_teacher' | 'teacher' | 'admin' | 'manager';
  created_at: string;
}

interface GroupDetail {
  id: number;
  name: string;
  start_time?: string;
  end_time?: string;
  class_days?: string[];
  teacher?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    phone_number: string;
    photo: string;
    level: string;
    role: string;
  };
  student_count?: number;
  students?: string[];
  created_at?: string;
  updated_at?: string;
  telegram_link?: string;
}

interface ActivityLog {
  id: number;
  action: string;
    telegram_link?: string;
  action_display: string;
  description: string;
  timestamp: string;
  ip_address: string | null;
  content_type: string;
  object_name: string;
}

interface Activity {
  id: number;
  title: string;
  time: string;
  type: 'login' | 'logout' | 'view' | 'create' | 'update' | 'delete' | 'payment';
  icon: string;
}

interface Certificate {
  id: number;
  name: string;
  description: string;
  issued_date: string;
  photo: string;
  owner: {
    id: string;
    username: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [groupsDetails, setGroupsDetails] = useState<GroupDetail[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authFetch(API_ENDPOINTS.USER_ME, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Profil ma\'lumotlarini yuklashda xatolik');
        }

        const userData: ProfileUser = await response.json();
        setProfileUser(userData);

        // Fetch groups details
        await fetchGroupsDetails(userData);

        // Fetch activity logs
        await fetchActivityLogs();

        // Fetch certificates
        await fetchCertificates();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Profil ma\'lumotlarini yuklashda xatolik';
        setError(message);
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchGroupsDetails = async (user: ProfileUser) => {
    setLoadingGroups(true);
    try {
      const groups = user.role === 'student' ? user.student_groups : user.teaching_groups;

      if (!groups || groups.length === 0) {
        setLoadingGroups(false);
        return;
      }

      const groupDetailsPromises = groups.map(async (group) => {
        try {
          const response = await authFetch(API_ENDPOINTS.GROUP_DETAIL(String(group.id)), {
            method: 'GET',
          });

          if (!response.ok) {
            console.error(`Failed to fetch group ${group.id}`);
            return null;
          }

          const groupData: GroupDetail = await response.json();
          return groupData;
        } catch (err) {
          console.error(`Error fetching group ${group.id}:`, err);
          return null;
        }
      });

      const results = await Promise.all(groupDetailsPromises);
      const validGroups = results.filter((g): g is GroupDetail => g !== null);
      setGroupsDetails(validGroups);
    } catch (err) {
      console.error('Error fetching groups details:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchActivityLogs = async () => {
    setLoadingActivities(true);
    try {
      const response = await authFetch('/audit/my-activity/', {
        method: 'GET',
      });

      if (!response.ok) {
        console.error('Failed to fetch activity logs');
        setLoadingActivities(false);
        return;
      }

      const logsData: ActivityLog[] = await response.json();

      // Transform API data to Activity format
      const transformedActivities: Activity[] = logsData.map((log) => {
        const icon = getActivityIcon(log.action);
        const timeString = formatActivityTime(log.timestamp);

        return {
          id: log.id,
          title: log.description,
          time: timeString,
          type: log.action as any,
          icon: icon,
        };
      });

      setActivities(transformedActivities);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const getActivityIcon = (action: string): string => {
    switch (action) {
      case 'login':
        return '🔐';
      case 'logout':
        return '🚪';
      case 'create':
        return '✨';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'payment':
        return '💳';
      case 'view':
        return '👁️';
      default:
        return '📋';
    }
  };

  const formatActivityTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return 'Hozir';
      } else if (diffMins < 60) {
        return `${diffMins} minut oldin`;
      } else if (diffHours < 24) {
        return `${diffHours} soat oldin`;
      } else if (diffDays === 0) {
        return `Bugun, ${date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays === 1) {
        return `Kecha, ${date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return date.toLocaleDateString('uz-UZ');
      }
    } catch {
      return timestamp;
    }
  };

  const handleProfileUpdated = async () => {
    // Refresh profile data after update
    try {
      const response = await authFetch(API_ENDPOINTS.USER_ME, {
        method: 'GET',
      });
      if (response.ok) {
        const userData: ProfileUser = await response.json();
        setProfileUser(userData);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
    setEditProfileOpen(false);
  };

  const getLevelConfig = (level?: string) => {
    switch (level) {
      case 'beginner':
        return {
          color: 'from-emerald-400 to-teal-400',
          bgColor: 'bg-emerald-500/20',
          textColor: 'text-emerald-400',
          label: 'Boshlang\'ich'
        };
      case 'intermediate':
        return {
          color: 'from-amber-400 to-orange-400',
          bgColor: 'bg-amber-500/20',
          textColor: 'text-amber-400',
          label: 'O\'rta'
        };
      case 'expert':
        return {
          color: 'from-rose-400 to-pink-400',
          bgColor: 'bg-rose-500/20',
          textColor: 'text-rose-400',
          label: 'Mutaxassis'
        };
      default:
        return {
          color: 'from-slate-400 to-gray-400',
          bgColor: 'bg-slate-500/20',
          textColor: 'text-slate-400',
          label: 'Belgilanmagan'
        };
    }
  };

  const getRoleConfig = (role?: string) => {
    switch (role) {
      case 'student':
        return {
          label: 'Talaba',
          color: 'from-blue-400 to-cyan-400',
          icon: '🎓'
        };
      case 'teacher':
        return {
          label: 'O\'qituvchi',
          color: 'from-purple-400 to-violet-400',
          icon: '👨‍🏫'
        };
      case 'sub_teacher':
        return {
          label: 'Yordamchi O\'qituvchi',
          color: 'from-green-400 to-emerald-400',
          icon: '🧑‍🏫'
        };
      case 'admin':
        return {
          label: 'CEO & Asoschi',
          color: 'from-red-400 to-orange-400',
          icon: '👑'
        };
      case 'manager':
        return {
          label: 'Administrator',
          color: 'from-amber-400 to-orange-400',
          icon: '⚙️'
        };
      default:
        return {
          label: 'Foydalanuvchi',
          color: 'from-gray-400 to-slate-400',
          icon: '👤'
        };
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'd MMMM, yyyy', { locale: uz });
    } catch {
      return dateString;
    }
  };

  const getDayName = (day: string) => {
    const days: { [key: string]: string } = {
      'Dush': 'Dushanba',
      'Sesh': 'Seshanba',
      'Chor': 'Chorshanba',
      'Pay': 'Payshanba',
      'Juma': 'Juma',
      'Shan': 'Shanba',
      'Yak': 'Yakshanba'
    };
    return days[day] || day;
  };

  const fetchCertificates = async () => {
    setLoadingCertificates(true);
    try {
      const response = await authFetch('/certificates/', {
        method: 'GET',
      });

      if (!response.ok) {
        console.error('Failed to fetch certificates');
        setLoadingCertificates(false);
        return;
      }

      const certificatesData: Certificate[] = await response.json();
      setCertificates(certificatesData);
    } catch (err) {
      console.error('Error fetching certificates:', err);
    } finally {
      setLoadingCertificates(false);
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'border-blue-500/50 bg-blue-500/10';
      case 'logout':
        return 'border-red-500/50 bg-red-500/10';
      case 'create':
        return 'border-green-500/50 bg-green-500/10';
      case 'update':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'delete':
        return 'border-red-600/50 bg-red-600/10';
      case 'payment':
        return 'border-purple-500/50 bg-purple-500/10';
      case 'view':
        return 'border-cyan-500/50 bg-cyan-500/10';
      default:
        return 'border-slate-500/50 bg-slate-500/10';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative flex flex-col items-center space-y-4 p-8">
              <Loader className="w-12 h-12 animate-spin text-blue-500" />
              <p className="text-lg font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Profil ma'lumotlari yuklanmoqda...
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profileUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md border-red-500/50 bg-red-500/5 backdrop-blur-sm">
            <CardContent className="pt-6">
              <p className="text-red-500 text-center font-medium">
                {error || 'Profil ma\'lumotlarini yuklashda xatolik'}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const roleConfig = getRoleConfig(profileUser.role);
  const levelConfig = getLevelConfig(profileUser.level);

  // Calculate statistics
  const attendance = 92; // This should come from API in the future
  const coins = profileUser.coins || 0;
  const groupsCount = profileUser.role === 'student'
    ? profileUser.student_groups.length
    : profileUser.teaching_groups.length;

  return (
    <DashboardLayout>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .shimmer-bar {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
        
        .progress-bar {
          position: relative;
          overflow: hidden;
          transition: width 1s ease-out;
        }
        
        .progress-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        .card-animate {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .slide-in {
          animation: slideIn 0.5s ease-out forwards;
        }
      `}</style>

      <div className="w-full space-y-6 pb-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Shaxsiy ma'lumotlar va sozlamalar</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Profile Card & Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Main Profile Card */}
            <Card className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm overflow-hidden card-animate">
              <CardContent className="p-4 sm:p-6">
                {/* User Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {/* Avatar with Online Badge */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-slate-700/50">
                      <AvatarImage src={profileUser.photo || undefined} alt={profileUser.first_name} />
                      <AvatarFallback className={`text-xl sm:text-2xl font-bold bg-gradient-to-br ${roleConfig.color} text-white`}>
                        {(profileUser.first_name?.[0] || '') + (profileUser.last_name?.[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <div className="absolute bottom-1 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full border-2 sm:border-4 border-slate-900"></div>
                    {/* Target icon overlay on avatar */}
                    <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-full flex items-center justify-center border-2 sm:border-4 border-slate-900">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
                      {profileUser.first_name} {profileUser.last_name}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-3">@{profileUser.username}</p>

                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Online</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => setEditProfileOpen(true)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white h-10"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Profili tahrir</span>
                      <span className="sm:hidden">Tahrir</span>
                    </Button>
                    <Button
                      onClick={() => setChangePasswordOpen(true)}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white h-10"
                      variant="outline"
                      size="sm"
                    >
                      <Lock className="w-4 h-4" />
                      <span className="hidden sm:inline">Parol o'zgartirish</span>
                      <span className="sm:hidden">Parol</span>
                    </Button>
                  </div>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mb-6 sm:mb-8">
                  {/* Role Badge */}
                  <Badge className={`bg-gradient-to-r ${roleConfig.color} border-0 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold`}>
                    <span className="mr-1.5">{roleConfig.icon}</span>
                    {roleConfig.label}
                  </Badge>

                  {/* Level Badge */}
                  {profileUser.level && (
                    <Badge className={`bg-gradient-to-r ${levelConfig.color} border-0 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold`}>
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                      {levelConfig.label}
                    </Badge>
                  )}

                  {/* Coins Badge */}
                  {coins > 0 && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 border-0 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                      {coins} ball
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bog'lanish ma'lumotlari Card */}
            <Card className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm card-animate">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  <CardTitle className="text-lg sm:text-xl text-slate-900 dark:text-white">Bog'lanish ma'lumotlari</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                {/* Email */}
                {profileUser.email && (
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm flex-shrink-0">Email</span>
                    </div>
                    <a href={`mailto:${profileUser.email}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">
                      {profileUser.email}
                    </a>
                  </div>
                )}

                {/* Phone */}
                {profileUser.phone_number && (
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Telefon</span>
                    </div>
                    <a href={`tel:${profileUser.phone_number}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-xs sm:text-sm">
                      {profileUser.phone_number}
                    </a>
                  </div>
                )}

                {/* Parent Phone */}
                {profileUser.parent_phone_number && (
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Ota-ona</span>
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-xs sm:text-sm">
                      {profileUser.parent_phone_number.father || profileUser.parent_phone_number.mother || '-'}
                    </span>
                  </div>
                )}

                {/* Telegram */}
                {profileUser.tg_username && (
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700/50 hover:border-blue-500/50 transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                        </svg>
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Telegram</span>
                    </div>
                    <a
                      href={`https://t.me/${profileUser.tg_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-xs sm:text-sm"
                    >
                      @{profileUser.tg_username}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Groups Details Cards - Only show for students and teachers with groups */}
            {groupsCount > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {profileUser.role === 'student' ? 'Mening Guruhlarim' : 'Dars Beradigan Guruhlar'}
                  </h3>
                </div>

                {loadingGroups ? (
                  <div className="flex items-center justify-center p-8 sm:p-12">
                    <Loader className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {groupsDetails.map((group, index) => (
                      <div
                        key={group.id}
                        onClick={() => {
                          if (profileUser.role === 'student') {
                            navigate(`/dashboard/student/groups/${group.id}`);
                          } else {
                            const roleRoute = profileUser.role === 'admin' ? 'admin' : 'teacher';
                            navigate(`/dashboard/${roleRoute}/groups/${group.id}`);
                          }
                        }}
                        className="cursor-pointer slide-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <Card className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm hover:from-gray-50 dark:hover:from-slate-800/90 dark:hover:to-slate-700/90 transition-all duration-300 h-full hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                          <CardContent className="p-4 sm:p-5 h-full flex flex-col">
                            {/* Guruh nomi */}
                            <div className="mb-4">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex-1 line-clamp-2">
                                  {group.name}
                                </h4>
                                <ChevronRight className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                              </div>
                            </div>

                            {/* Main Info Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
                              {/* O'quvchilar soni */}
                              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">O'QUVCHILAR</span>
                                </div>
                                <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                  {group.student_count !== undefined ? group.student_count : '0'}
                                </p>
                              </div>

                              {/* Dars vaqti */}
                              {group.start_time && group.end_time && (
                                <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">VAQT</span>
                                  </div>
                                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                    {group.start_time}
                                  </p>
                                  <p className="text-[10px] text-slate-600 dark:text-slate-400">
                                    to {group.end_time}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Dars kunlari */}
                            {group.class_days && group.class_days.length > 0 && (
                              <div className="mb-4">

                              {/* Telegram link */}
                              {group.telegram_link && (
                                <div className="mt-auto">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-sky-600 dark:text-sky-400"
                                    onClick={() => window.open(group.telegram_link, '_blank')}
                                  >
                                    <MessageCircle className="w-4 h-4 mr-1" /> Telegram guruhiga o'tish
                                  </Button>
                                </div>
                              )}
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">DARS KUNLARI</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {group.class_days.map((day, idx) => (
                                    <Badge
                                      key={idx}
                                      className="text-xs bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30"
                                    >
                                      {getDayName(day)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Yaratilgan sana */}
                            {group.created_at && (
                              <div className="pt-3 border-t border-gray-200 dark:border-slate-700/50">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                                  <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">YARATILGAN</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400">{formatDate(group.created_at)}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Progress & Activity */}
          <div className="space-y-4 sm:space-y-6">
            {/* Bog'lanish ma'lumotlari Card (Mobile view) */}
            <div className="lg:hidden">
              <Card className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm card-animate">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    <CardTitle className="text-lg sm:text-xl text-slate-900 dark:text-white">Bog'lanish ma'lumotlari</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  {/* Email */}
                  {profileUser.email && (
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700/50 hover:border-blue-500/50 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm flex-shrink-0">Email</span>
                      </div>
                      <a href={`mailto:${profileUser.email}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">
                        {profileUser.email}
                      </a>
                    </div>
                  )}

                  {/* Phone */}
                  {profileUser.phone_number && (
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700/50 hover:border-blue-500/50 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Telefon</span>
                      </div>
                      <a href={`tel:${profileUser.phone_number}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-xs sm:text-sm">
                        {profileUser.phone_number}
                      </a>
                    </div>
                  )}

                  {/* Telegram */}
                  {profileUser.tg_username && (
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700/50 hover:border-blue-500/50 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                          </svg>
                        </div>
                        <span className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Telegram</span>
                      </div>
                      <a
                        href={`https://t.me/${profileUser.tg_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-xs sm:text-sm"
                      >
                        @{profileUser.tg_username}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sertifikatlar Card - Only for student and teacher roles */}
            {profileUser.role !== 'admin' && profileUser.role !== 'manager' && (
              <Card className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm card-animate">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 dark:text-purple-400" />
                    <CardTitle className="text-lg sm:text-xl text-slate-900 dark:text-white">Sertifikatlar</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingCertificates ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="w-6 h-6 animate-spin text-purple-500" />
                    </div>
                  ) : certificates.length === 0 ? (
                    <div className="text-center py-6">
                      <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600 dark:text-slate-400 text-sm">Sertifikatlar hali yo'q</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {certificates.map((cert) => (
                        <div key={cert.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-200 dark:border-purple-500/30 rounded-lg hover:shadow-lg transition-shadow">
                          <div className="flex items-start gap-3">
                            {cert.photo && (
                              <img 
                                src={cert.photo} 
                                alt={cert.name}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover flex-shrink-0 border-2 border-purple-300 dark:border-purple-600"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white line-clamp-2">{cert.name}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{cert.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Calendar className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {formatDate(cert.issued_date)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* So'nggi faoliyat Card */}
            <Card className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm card-animate">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400" />
                  <CardTitle className="text-lg sm:text-xl text-slate-900 dark:text-white">So'nggi faoliyat</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loadingActivities ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Faoliyat yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {activities.map((activity, index) => (
                      <div
                        key={activity.id}
                        className={`relative pl-5 sm:pl-6 pb-4 sm:pb-6 ${index === activities.length - 1 ? 'pb-0' : ''}`}
                      >
                        {/* Timeline line */}
                        {index !== activities.length - 1 && (
                          <div className="absolute left-2 sm:left-2.5 top-5 sm:top-6 bottom-0 w-0.5 bg-gray-300 dark:bg-slate-700"></div>
                        )}

                        {/* Timeline dot */}
                        <div className={`absolute left-0 top-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white dark:border-slate-900 ${activity.type === 'login' ? 'bg-blue-500' :
                            activity.type === 'logout' ? 'bg-red-500' :
                              activity.type === 'create' ? 'bg-green-500' :
                                activity.type === 'update' ? 'bg-yellow-500' :
                                  activity.type === 'delete' ? 'bg-red-600' :
                                    activity.type === 'payment' ? 'bg-purple-500' :
                                      activity.type === 'view' ? 'bg-cyan-500' :
                                        'bg-slate-500'
                          }`}></div>

                        {/* Activity Content */}
                        <div className={`rounded-lg p-2.5 sm:p-3 border ${getActivityColor(activity.type)}`}>
                          <div className="flex items-start gap-2">
                            <span className="text-base sm:text-xl flex-shrink-0">{activity.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white leading-tight mb-1 line-clamp-2">
                                {activity.title}
                              </p>
                              <p className="text-[10px] sm:text-xs text-slate-400">{activity.time}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        {profileUser && (
          <EditProfileDialog
            open={editProfileOpen}
            onOpenChange={setEditProfileOpen}
            currentData={{
              first_name: profileUser.first_name,
              last_name: profileUser.last_name,
              username: profileUser.username,
              photo: profileUser.photo || undefined,
            }}
            onSuccess={handleProfileUpdated}
          />
        )}

        {/* Change Password Dialog */}
        {profileUser && (
          <ChangePasswordDialog
            open={changePasswordOpen}
            onOpenChange={setChangePasswordOpen}
          />
        )}
      </div>
    </DashboardLayout>
  );
}