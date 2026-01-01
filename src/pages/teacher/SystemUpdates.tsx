import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Calendar, Sparkles, Wrench, Bug, Bell } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

type UpdateType = 'feature' | 'improvement' | 'bugfix' | 'announcement';

interface SystemUpdate {
  id: string;
  title: string;
  description: string;
  type: UpdateType;
  created_at: string;
  is_active: boolean;
}

// Mock data for demonstration
const mockUpdates: SystemUpdate[] = [
  {
    id: '1',
    title: 'Yangi davomat tizimi',
    description: 'Endi o\'quvchilar va o\'qituvchilar uchun davomat tizimi ishga tushdi. Guruh bo\'yicha davomat qilish imkoniyati mavjud.',
    type: 'feature',
    created_at: '2024-12-18T10:00:00Z',
    is_active: true
  },
  {
    id: '2',
    title: 'Xabarlar bo\'limiga yangiliklar',
    description: 'Yangi xabar kelganda ovozli bildirishnoma va real-time yangilanish qo\'shildi.',
    type: 'improvement',
    created_at: '2024-12-17T14:30:00Z',
    is_active: true
  },
  {
    id: '3',
    title: 'Profil sahifasida sertifikatlar',
    description: 'O\'quvchilar endi o\'z profilida olgan sertifikatlarini ko\'rishlari mumkin.',
    type: 'feature',
    created_at: '2024-12-16T09:00:00Z',
    is_active: true
  },
  {
    id: '4',
    title: 'Chat xatosi tuzatildi',
    description: 'Ba\'zi foydalanuvchilarda xabar yuborishda kuzatilgan xatolik tuzatildi.',
    type: 'bugfix',
    created_at: '2024-12-15T16:00:00Z',
    is_active: true
  }
];

export default function TeacherSystemUpdates() {
  const [updates] = useState<SystemUpdate[]>(mockUpdates);

  const getTypeIcon = (type: UpdateType) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="h-5 w-5 text-green-500" />;
      case 'improvement':
        return <Wrench className="h-5 w-5 text-blue-500" />;
      case 'bugfix':
        return <Bug className="h-5 w-5 text-orange-500" />;
      case 'announcement':
        return <Bell className="h-5 w-5 text-purple-500" />;
    }
  };

  const getTypeBadge = (type: UpdateType) => {
    switch (type) {
      case 'feature':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200">Yangi funksiya</Badge>;
      case 'improvement':
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200">Yaxshilash</Badge>;
      case 'bugfix':
        return <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200">Xato tuzatish</Badge>;
      case 'announcement':
        return <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-200">E'lon</Badge>;
    }
  };

  const getCardBg = (type: UpdateType) => {
    switch (type) {
      case 'feature':
        return 'bg-gradient-to-br from-green-500/5 to-green-500/0 border-green-200/50 dark:border-green-900/50';
      case 'improvement':
        return 'bg-gradient-to-br from-blue-500/5 to-blue-500/0 border-blue-200/50 dark:border-blue-900/50';
      case 'bugfix':
        return 'bg-gradient-to-br from-orange-500/5 to-orange-500/0 border-orange-200/50 dark:border-orange-900/50';
      case 'announcement':
        return 'bg-gradient-to-br from-purple-500/5 to-purple-500/0 border-purple-200/50 dark:border-purple-900/50';
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary" />
            Tizim yangiliklari
          </h1>
          <p className="text-muted-foreground mt-1">Tizimga qo'shilgan yangiliklar va o'zgarishlar</p>
        </div>

        {/* Updates Timeline */}
        <div className="space-y-4">
          {updates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Hozircha yangiliklar yo'q</p>
              </CardContent>
            </Card>
          ) : (
            updates.map((update, index) => (
              <Card 
                key={update.id} 
                className={`transition-all hover:shadow-md ${getCardBg(update.type)}`}
                style={{
                  animation: `slideUpFade 0.4s ease-out ${index * 0.1}s both`
                }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-background rounded-lg shadow-sm flex-shrink-0">
                      {getTypeIcon(update.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {update.title}
                        </h3>
                        {getTypeBadge(update.type)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {update.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(update.created_at), "d MMMM, yyyy", { locale: uz })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
