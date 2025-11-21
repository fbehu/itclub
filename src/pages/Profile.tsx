import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, User as UserIcon, Trophy, Coins, TrendingUp, Loader, Edit, KeyRound } from 'lucide-react';
import EditProfileDialog from '@/pages/student/EditProfileDialog';
import ChangePasswordDialog from '@/pages/student/ChangePasswordDialog';

interface ProfileUser {
  id: string;
  username: string;
  role: 'student' | 'admin';
  first_name: string;
  last_name: string;
  uuid?: string;
  image_qrkod?: string;
  phone_number: string;
  tg_username?: string;
  level?: string;
  course?: string;
  direction?: string;
  photo?: string;
  coins?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}


// Add neon border classes for panel
const getNeonClass = (level?: string) => {
  if (level === 'beginner') return 'level-bg-beginner';
  if (level === 'intermediate') return 'level-bg-intermediate';
  if (level === 'expert') return 'level-bg-expert';
  return '';
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authFetch(API_ENDPOINTS.USER_ME, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Profil ma\'lumotlarini yuklashda xatolik');
        }

        const data: ProfileUser = await response.json();
        setProfileUser(data);
        
        // AuthContext'da ham user'ni yangilash
        if (setUser) {
          setUser(data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Profil ma\'lumotlarini yuklashda xatolik';
        setError(message);
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [setUser]);

  const getLevelColor = (level?: string) => {
    if (!level) return 'bg-gray-500';
    switch (level) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'expert':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getLevelText = (level?: string) => {
    if (!level) return 'Belgilanmagan';
    switch (level) {
      case 'beginner':
        return 'Beginner (boshlang\'ich)';
      case 'intermediate':
        return 'Intermediate (o\'rta)';
      case 'expert':
        return 'Ekspert (yuqori)';
      default:
        return level;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <Loader className="w-8 h-8 animate-spin" />
            <p className="text-gray-500">Profil ma'lumotlari yuklanmoqda...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profileUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">{error || 'Profil ma\'lumotlarini yuklashda xatolik'}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const displayUser = profileUser;

  const handleProfileUpdate = () => {
    const fetchUserProfile = async () => {
      try {
        const response = await authFetch(API_ENDPOINTS.USER_ME, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Profil ma\'lumotlarini yuklashda xatolik');
        }

        const data: ProfileUser = await response.json();
        setProfileUser(data);
        
        if (setUser) {
          setUser(data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchUserProfile();
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in-up px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Profil</h1>
          {displayUser.role === 'student' && (
            <div className="flex gap-2">
              <Button
                onClick={() => setEditDialogOpen(true)}
                size="sm"
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-2" />
                Tahrirlash
              </Button>
              <Button
                onClick={() => setPasswordDialogOpen(true)}
                size="sm"
                variant="outline"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Parolni o'zgartirish
              </Button>
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Left Side: Main Info */}
          <Card className={`glass-card-bg p-3 sm:p-4 border-none ${getNeonClass(displayUser.level)}`}>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Shaxsiy ma'lumotlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                  <AvatarImage src={displayUser.photo} alt={displayUser.first_name} />
                  <AvatarFallback className="text-base sm:text-lg">
                    {(displayUser.first_name?.[0] || '') + (displayUser.last_name?.[0] || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground break-words">
                    {displayUser.first_name || displayUser.first_name} {displayUser.last_name || displayUser.last_name}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground break-all">@{displayUser.username}</p>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      {displayUser.role === 'student' ? 'Talaba' : 'Admin'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3 mt-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href={`tel:${displayUser.phone_number}`}
                    className="text-sm sm:text-base text-blue-500 underline break-all"
                  >
                    {displayUser.phone_number}
                  </a>
                </div>
                {displayUser.tg_username && (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <a
                      href={displayUser.tg_username}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm sm:text-base text-blue-500 underline"
                    >
                      Telegram
                    </a>
                  </div>
                )}
                {displayUser.course && (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm sm:text-base text-foreground break-words">{displayUser.course}</span>
                  </div>
                )}
                {displayUser.level && (
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                    <span className="text-sm sm:text-base text-muted-foreground">Level:</span>
                    <Badge className={`${getLevelColor(displayUser.level)} text-xs sm:text-sm`}>
                      {getLevelText(displayUser.level)}
                    </Badge>
                  </div>
                )}
                {displayUser.direction && (
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                    <span className="text-sm sm:text-base text-muted-foreground">Yo'nalish:</span>
                    <span className="text-sm sm:text-base text-foreground break-words">{displayUser.direction}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Coins className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-muted-foreground">Tangalar:</span>
                  <span className="text-sm sm:text-base text-foreground font-bold">{displayUser.coins || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Right Side: QR Code and UUID */}
          <Card className={`glass-card-bg border-none ${getNeonClass(displayUser.level)}`}>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">QR Kod & UUID</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center p-3 sm:p-6">
              {displayUser.image_qrkod && (
                <img
                  src={displayUser.image_qrkod}
                  alt="QR Kod"
                  className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 object-contain mb-4 border rounded-lg"
                />
              )}
              <div className="text-center break-all px-2">
                <div className="font-mono text-sm sm:text-base md:text-lg text-foreground">
                  UUID: {displayUser.uuid}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {displayUser.role === 'student' && (
        <>
          <EditProfileDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            currentData={{
              first_name: displayUser.first_name,
              last_name: displayUser.last_name,
              username: displayUser.username,
              photo: displayUser.photo,
            }}
            onSuccess={handleProfileUpdate}
          />
          <ChangePasswordDialog
            open={passwordDialogOpen}
            onOpenChange={setPasswordDialogOpen}
            userId={displayUser.id}
          />
        </>
      )}
    </DashboardLayout>
  );
}
