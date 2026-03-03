import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Megaphone, Calendar, Loader2, Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react';
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
  photo?: string | null;
  video?: string | null;
  created_at: string;
}

export default function TeacherSystemUpdates() {
  const { toast } = useToast();
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState<SystemUpdate | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

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
      <div className="mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary" />
            Tizim yangiliklari
          </h1>
          <p className="text-muted-foreground mt-1">Yangi xususiyatlar va o'zgarishlar haqida ma'lumot</p>
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
                className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
                  update.status === 'new' ? 'border-primary/50 bg-primary/5' : ''
                }`}
                onClick={() => {
                  setSelectedUpdate(update);
                  setDetailModalOpen(true);
                }}
              >
                {/* Image Thumbnail */}
                {update.photo && (
                  <div className="w-full h-40 bg-muted overflow-hidden">
                    <img
                      src={update.photo}
                      alt={update.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg line-clamp-2">
                          {update.title}
                        </CardTitle>
                        {update.video && (
                          <div title="Video mavjud">
                            <VideoIcon className="h-4 w-4 text-purple-500 flex-shrink-0" />
                          </div>
                        )}
                      </div>
                      {update.status === 'new' && (
                        <Badge variant="destructive" className="w-fit">
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(update.created_at), 'd MMM, yyyy', { locale: uz })}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-primary hover:text-primary/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUpdate(update);
                        setDetailModalOpen(true);
                      }}
                    >
                      To'liq ma'lumot
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedUpdate && (
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <DialogTitle className="text-xl">{selectedUpdate.title}</DialogTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeBadge(selectedUpdate.type)}
                    {selectedUpdate.status === 'new' && (
                      <Badge variant="destructive">Yangi</Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Image */}
              {selectedUpdate.photo && (
                <div className="w-full h-64 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={selectedUpdate.photo}
                    alt={selectedUpdate.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-semibold">Ta'rifi</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {selectedUpdate.description}
                </p>
              </div>

              {/* Video */}
              {selectedUpdate.video && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <VideoIcon className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold">Video</h3>
                  </div>
                  <div className="w-full bg-muted rounded-lg overflow-hidden">
                    <video
                      src={selectedUpdate.video}
                      controls
                      className="w-full h-64 object-cover"
                    >
                      Sizning brauzeringiz video playback'ni qo'llab-quvvatlamaydi
                    </video>
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(selectedUpdate.created_at), 'd MMMM, yyyy (EEEE)', { locale: uz })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setDetailModalOpen(false)}
              >
                Yopish
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}