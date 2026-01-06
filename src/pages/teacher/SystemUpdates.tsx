import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Calendar, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { useToast } from '@/hooks/use-toast';

type UpdateType = 'feature' | 'improvement' | 'bugfix' | 'announcement';

interface SystemUpdate {
  id: number;
  title: string;
  description: string;
  type: UpdateType;
  status: 'new' | 'old';
  created_at: string;
}

export default function TeacherSystemUpdates() {
  const { toast } = useToast();
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    setIsLoadingData(true);
    try {
      const response = await authFetch(API_ENDPOINTS.NEWS);
      if (response.ok) {
        const data = await response.json();
        let updatesList = Array.isArray(data) ? data : data.results || [];
        // Sort by status: 'new' first, then 'old'
        updatesList = updatesList.sort((a, b) => {
          if (a.status === 'new' && b.status === 'old') return -1;
          if (a.status === 'old' && b.status === 'new') return 1;
          return 0;
        });
        setUpdates(updatesList);
      }
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast({
        title: 'Xatolik',
        description: 'Yangiliklar yuklashda xatolik',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const getTypeBadge = (type: UpdateType) => {
    switch (type) {
      case 'feature':
        return <Badge className="bg-green-500 hover:bg-green-600">Yangi funksiya</Badge>;
      case 'improvement':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Yaxshilash</Badge>;
      case 'bugfix':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Xato tuzatish</Badge>;
      case 'announcement':
        return <Badge className="bg-purple-500 hover:bg-purple-600">E'lon</Badge>;
    }
  };

  if (isLoadingData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary" />
            Tizim yangiliklari
          </h1>
          <p className="text-muted-foreground mt-1">Yangi xususiyatlar va o'zgarishlar</p>
        </div>

        {/* Updates Grid */}
        {updates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Yangiliklar topilmadi</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {updates.map((update) => (
              <Card
                key={update.id}
                className={`overflow-hidden hover:shadow-lg transition-shadow ${
                  update.status === 'new' ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {update.title}
                      </CardTitle>
                      {update.status === 'new' && (
                        <Badge variant="destructive" className="mt-2">
                          Yangi
                        </Badge>
                      )}
                    </div>
                    {getTypeBadge(update.type)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {update.description}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(update.created_at), 'd MMM, yyyy', { locale: uz })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
