import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User } from '@/contexts/AuthContext';
import { Phone, MessageCircle, Award, Calendar, Mail } from 'lucide-react';

interface ViewUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewUserDialog({ user, open, onOpenChange }: ViewUserDialogProps) {
  if (!user) return null;

  const getLevelText = (level?: string) => {
    switch (level) {
      case 'beginner':
        return 'Boshlang\'ich';
      case 'intermediate':
        return 'O\'rta';
      case 'expert':
        return 'Ekspert';
      default:
        return level;
    }
  };

  const getLevelColor = (level?: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Foydalanuvchi ma'lumotlari</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Photo and QR Code Section */}
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* User Photo */}
            {user.photo && (
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-border">
                  <img 
                    src={user.photo} 
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">Foydalanuvchi rasmi</p>
              </div>
            )}

            {/* QR Code */}
            {user.image_qrkod && (
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-border bg-white p-2">
                  <img 
                    src={user.image_qrkod} 
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">QR Kod</p>
              </div>
            )}

            {/* Basic Info */}
            <div className="flex-1 space-y-3">
              <h3 className="text-2xl font-bold text-foreground">
                {user.first_name} {user.last_name}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge className={getLevelColor(user.level)}>
                  {getLevelText(user.level)}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <span className="text-yellow-500">⭐</span>
                  {user.coins || 0} Tanga
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Aloqa ma'lumotlari
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium text-foreground">@{user.username}</p>
              </div>

              <div className="space-y-1">
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
                <div className="space-y-1">
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

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">UUID</p>
                <p className="font-medium text-foreground font-mono">{user.uuid || user.id}</p>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Ta'lim ma'lumotlari
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Kurs</p>
                <p className="font-medium text-foreground">{user.course || 'Belgilanmagan'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Yo'nalish</p>
                <p className="font-medium text-foreground">{user.direction || 'Belgilanmagan'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Daraja</p>
                <Badge className={getLevelColor(user.level)}>
                  {getLevelText(user.level)}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tangalar</p>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500 text-lg">⭐</span>
                  <span className="font-semibold text-foreground">{user.coins || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          {(user.created_at || user.updated_at) && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tizim ma'lumotlari
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.created_at && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Ro'yxatdan o'tgan</p>
                    <p className="font-medium text-foreground">
                      {new Date(user.created_at).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                )}

                {user.updated_at && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Oxirgi yangilanish</p>
                    <p className="font-medium text-foreground">
                      {new Date(user.updated_at).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
