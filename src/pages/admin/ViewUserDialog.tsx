import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User } from '@/contexts/AuthContext';
import { Phone, MessageCircle, Award, Calendar, Users, Tag, Gift, UserCircle } from 'lucide-react';

interface ViewUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewUserDialog({ user, open, onOpenChange }: ViewUserDialogProps) {
  if (!user) return null;

  const formatDateInUzbek = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    
    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year} yil ${day}-${month}, ${hours}:${minutes}`;
  };

  const getLevelText = (level?: string) => {
    switch (level) {
      case 'beginner':
        return 'Boshlang\'ich (Yashil)';
      case 'intermediate':
        return 'O\'rta (Sariq)';
      case 'expert':
        return 'Yuksak (Qizil)';
      default:
        return 'Belgilanmagan';
    }
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500 hover:bg-green-600';
      case 'intermediate':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'expert':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getRoleText = (role?: string) => {
    switch (role) {
      case 'student':
        return 'O\'quvchi';
      case 'teacher':
        return 'O\'qituvchi';
      case 'admin':
        return 'Administrator';
      default:
        return 'Noma\'lum';
    }
  };

  const getSocialText = (social?: string) => {
    switch (social) {
      case 'instagram':
        return 'Instagram';
      case 'telegram':
        return 'Telegram';
      case 'facebook':
        return 'Facebook';
      case 'friend':
        return 'Do\'st orqali';
      case 'other':
        return 'Boshqa';
      default:
        return 'Belgilanmagan';
    }
  };

  const getParentType = (parentPhone: any) => {
    if (!parentPhone || typeof parentPhone !== 'object') return null;
    
    if (parentPhone.father) return { type: 'Otasi', phone: parentPhone.father };
    if (parentPhone.mother) return { type: 'Onasi', phone: parentPhone.mother };
    return null;
  };

  const parentInfo = getParentType(user.parent_phone_number);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Foydalanuvchi ma'lumotlari</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Section with Photo and Main Info */}
          <div className="flex flex-col md:flex-row gap-6 items-start bg-muted/30 p-6 rounded-lg">
            {/* User Photo */}
            <div className="flex-shrink-0">
              {user.photo ? (
                <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-border shadow-md">
                  <img 
                    src={user.photo} 
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center border-2 border-border">
                  <UserCircle className="w-20 h-20 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Main Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-2xl font-bold text-foreground">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-muted-foreground">@{user.username}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-sm">
                  {getRoleText(user.role)}
                </Badge>
                <Badge className={getLevelColor(user.level)}>
                  {getLevelText(user.level)}
                </Badge>
                <Badge variant="secondary" className="gap-1.5">
                  {user.coins || 0} Ball
                </Badge>
                <Badge variant={user.is_active ? "default" : "secondary"}>
                  {user.is_active ? '✓ Faol' : '✗ Nofaol'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-foreground flex items-center gap-2 border-b pb-2">
              <Phone className="h-5 w-5 text-primary" />
              Aloqa ma'lumotlari
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 p-3 bg-muted/20 rounded-md">
                <p className="text-sm text-muted-foreground">Telefon raqami</p>
                <a 
                  href={`tel:${user.phone_number}`}
                  className="font-medium text-primary hover:underline flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  {user.phone_number}
                </a>
              </div>

              {user.tg_username && (
                <div className="space-y-1 p-3 bg-muted/20 rounded-md">
                  <p className="text-sm text-muted-foreground">Telegram</p>
                  <a 
                    href={`https://t.me/${user.tg_username.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {user.tg_username}
                  </a>
                </div>
              )}

              {parentInfo && (
                <div className="space-y-1 p-3 bg-muted/20 rounded-md">
                  <p className="text-sm text-muted-foreground">{parentInfo.type} telefoni</p>
                  <a 
                    href={`tel:${parentInfo.phone}`}
                    className="font-medium text-primary hover:underline flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    {parentInfo.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Student Specific Information */}
          {user.role === 'student' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-foreground flex items-center gap-2 border-b pb-2">
                <Award className="h-5 w-5 text-primary" />
                O'quvchi ma'lumotlari
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.student_groups && user.student_groups.length > 0 && (
                  <div className="space-y-1 p-3 bg-muted/20 rounded-md md:col-span-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Guruhlar
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user.student_groups.map((group) => (
                        <Badge key={group.id} variant="outline" className="bg-primary/20 text-primary border-primary/30">
                          {group.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {user.social && (
                  <div className="space-y-1 p-3 bg-muted/20 rounded-md">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      Qayerdan eshitgan
                    </p>
                    <p className="font-medium text-foreground">{getSocialText(user.social)}</p>
                  </div>
                )}

                {user.invite_code && (
                  <div className="space-y-1 p-3 bg-muted/20 rounded-md">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Gift className="h-4 w-4" />
                      Promokod
                    </p>
                    <p className="font-medium text-foreground font-mono">{user.invite_code}</p>
                  </div>
                )}

                <div className="space-y-1 p-3 bg-muted/20 rounded-md">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <span className="text-yellow-500 text-lg">🎗</span>
                    Ballar
                  </p>
                  <p className="font-semibold text-foreground text-xl">{user.coins || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Specific Information */}
          {user.role === 'teacher' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-foreground flex items-center gap-2 border-b pb-2">
                <Users className="h-5 w-5 text-primary" />
                O'qituvchi ma'lumotlari
              </h4>
              
              {user.teaching_groups && user.teaching_groups.length > 0 ? (
                <div className="space-y-1 p-3 bg-muted/20 rounded-md md:col-span-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                    <Users className="h-4 w-4" />
                    O'qitadigan guruhlar
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.teaching_groups.map((group) => (
                      <Badge key={group.id} variant="outline" className="bg-blue-500/20 text-blue-700 border-blue-300">
                        {group.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-md">Hech qanday guruh topilmadi</p>
              )}
            </div>
          )}

          {/* System Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-foreground flex items-center gap-2 border-b pb-2">
              <Calendar className="h-5 w-5 text-primary" />
              Tizim ma'lumotlari
            </h4>
              
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.created_at && (
                <div className="space-y-1 p-3 bg-muted/20 rounded-md">
                  <p className="text-sm text-muted-foreground">Ro'yxatdan o'tgan</p>
                  <p className="font-medium text-foreground">
                    {formatDateInUzbek(user.created_at)}
                  </p>
                </div>
              )}

              {user.updated_at && (
                <div className="space-y-1 p-3 bg-muted/20 rounded-md">
                  <p className="text-sm text-muted-foreground">Oxirgi yangilanish</p>
                  <p className="font-medium text-foreground">
                    {formatDateInUzbek(user.updated_at)}
                  </p>
                </div>
              )}

              <div className="space-y-1 p-3 bg-muted/20 rounded-md col-span-full">
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-medium text-foreground font-mono text-xs break-all">
                  {user.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}