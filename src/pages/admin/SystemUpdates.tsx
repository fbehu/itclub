import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Plus, Edit, Trash2, Calendar, Loader2, RefreshCw, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';

type UpdateType = 'feature' | 'improvement' | 'bugfix' | 'announcement';
type UpdateStatus = 'new' | 'old';

interface SystemUpdate {
  id: number;
  title: string;
  description: string;
  type: UpdateType;
  status: UpdateStatus;
  photo?: string | null;
  video?: string | null;
  created_at: string;
}

export default function SystemUpdates() {
  const { toast } = useToast();
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<SystemUpdate | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [togglingStatusId, setTogglingStatusId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'feature' as UpdateType,
    photo: null as File | null,
    video: null as File | null,
    existingPhoto: null as string | null,
    existingVideo: null as string | null
  });

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    setIsLoadingData(true);
    try {
      const response = await authFetch(API_ENDPOINTS.NEWS);
      if (response.ok) {
        const data = await response.json();
        setUpdates(Array.isArray(data) ? data : data.results || []);
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

  const getStatusBadge = (status: UpdateStatus) => {
    if (status === 'new') {
      return <Badge className="bg-red-500 hover:bg-red-600">Yangi</Badge>;
    }
    return <Badge variant="secondary">Eski</Badge>;
  };

  const openCreateDialog = () => {
    setEditingUpdate(null);
    setFormData({ title: '', description: '', type: 'feature', photo: null, video: null, existingPhoto: null, existingVideo: null });
    setDialogOpen(true);
  };

  const openEditDialog = (update: SystemUpdate) => {
    setEditingUpdate(update);
    setFormData({
      title: update.title,
      description: update.description,
      type: update.type,
      photo: null,
      video: null,
      existingPhoto: update.photo || null,
      existingVideo: update.video || null
    });
    setDialogOpen(true);
  };

  const handleToggleStatus = async (update: SystemUpdate) => {
    setTogglingStatusId(update.id);
    try {
      const newStatus: UpdateStatus = update.status === 'new' ? 'old' : 'new';
      
      const formData = new FormData();
      formData.append('status', newStatus);

      const response = await authFetch(`${API_ENDPOINTS.NEWS}${update.id}/update_status/`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Statusni o\'zgartirishda xatolik');
      }

      const updatedUpdate = await response.json();
      setUpdates(prev => prev.map(u => 
        u.id === update.id 
          ? updatedUpdate
          : u
      ));

      toast({
        title: 'Muvaffaqiyat',
        description: `Yangilik ${newStatus === 'new' ? 'yangi' : 'eski'} qilib belgilandi`
      });
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: 'Xatolik',
        description: error instanceof Error ? error.message : 'Statusni o\'zgartirishda xatolik',
        variant: 'destructive'
      });
    } finally {
      setTogglingStatusId(null);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Xatolik',
        description: "Barcha maydonlarni to'ldiring",
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      const body = new FormData();
      body.append('title', formData.title);
      body.append('description', formData.description);
      body.append('type', formData.type);
      
      // Rasm qo'shish yoki o'chirish
      if (formData.photo) {
        body.append('photo', formData.photo);
      } else if (editingUpdate && formData.existingPhoto === null && editingUpdate.photo) {
        // Eski rasmni o'chirish uchun signal
        body.append('photo', 'null');
      }
      
      // Video qo'shish yoki o'chirish
      if (formData.video) {
        body.append('video', formData.video);
      } else if (editingUpdate && formData.existingVideo === null && editingUpdate.video) {
        // Eski videoni o'chirish uchun signal
        body.append('video', 'null');
      }

      let response;
      if (editingUpdate) {
        response = await authFetch(`${API_ENDPOINTS.NEWS}${editingUpdate.id}/`, {
          method: 'PUT',
          body
        });
      } else {
        response = await authFetch(API_ENDPOINTS.NEWS, {
          method: 'POST',
          body
        });
      }

      if (!response.ok) {
        throw new Error(editingUpdate ? 'Yangilikni tahrirlashda xatolik' : 'Yangilik qo\'shishda xatolik');
      }

      const updatedUpdate = await response.json();

      if (editingUpdate) {
        setUpdates(prev => prev.map(u => 
          u.id === editingUpdate.id 
            ? updatedUpdate
            : u
        ));
        toast({
          title: 'Muvaffaqiyat',
          description: 'Yangilik tahrirlandi'
        });
      } else {
        setUpdates(prev => [updatedUpdate, ...prev]);
        toast({
          title: 'Muvaffaqiyat',
          description: 'Yangilik qo\'shildi'
        });
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving update:', error);
      toast({
        title: 'Xatolik',
        description: error instanceof Error ? error.message : 'Xatolik yuz berdi',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Rostdan ham bu yangilikni o\'chirmoqchimisiz?')) return;
    
    try {
      const response = await authFetch(`${API_ENDPOINTS.NEWS}${id}/`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Yangilikni o\'chirishda xatolik');
      }

      setUpdates(prev => prev.filter(u => u.id !== id));
      toast({
        title: 'Muvaffaqiyat',
        description: 'Yangilik o\'chirildi'
      });
    } catch (error) {
      console.error('Error deleting update:', error);
      toast({
        title: 'Xatolik',
        description: error instanceof Error ? error.message : 'Yangilikni o\'chirishda xatolik',
        variant: 'destructive'
      });
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
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Megaphone className="h-7 w-7 text-primary" />
              Tizim yangiliklari
            </h1>
            <p className="text-muted-foreground mt-1">Tizimga qo'shilgan yangiliklar va o'zgarishlar</p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Yangilik qo'shish
          </Button>
        </div>

        {/* Updates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Barcha yangiliklar</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {updates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Hozircha yangiliklar yo'q</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">#</TableHead>
                      <TableHead className="font-semibold">Sarlavha</TableHead>
                      <TableHead className="font-semibold">Turi</TableHead>
                      <TableHead className="font-semibold">Holati</TableHead>
                      <TableHead className="font-semibold">Sana</TableHead>
                      <TableHead className="text-center font-semibold">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {updates.map((update, index) => (
                      <TableRow key={update.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{update.title}</p>
                              {update.photo && (
                                <div title="Rasm mavjud">
                                  <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                </div>
                              )}
                              {update.video && (
                                <div title="Video mavjud">
                                  <VideoIcon className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {update.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(update.type)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={update.status === 'new' ? 'default' : 'outline'}
                            onClick={() => handleToggleStatus(update)}
                            disabled={togglingStatusId === update.id}
                            className="gap-2"
                          >
                            {togglingStatusId === update.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            {getStatusBadge(update.status)}
                          </Button>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(update.created_at), 'd MMM, yyyy', { locale: uz })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(update)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(update.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUpdate ? 'Yangilikni tahrirlash' : 'Yangi yangilik qo\'shish'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Sarlavha</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Yangilik sarlavhasi"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Turi</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: UpdateType) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Yangi funksiya</SelectItem>
                  <SelectItem value="improvement">Yaxshilash</SelectItem>
                  <SelectItem value="bugfix">Xato tuzatish</SelectItem>
                  <SelectItem value="announcement">E'lon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Tavsif</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Yangilik haqida to'liqroq ma'lumot"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="photo">Rasm (ixtiyoriy)</Label>
              
              {/* Existing photo */}
              {formData.existingPhoto && !formData.photo && (
                <div className="relative p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        ✓ Eski rasm
                      </p>
                      <img
                        src={formData.existingPhoto}
                        alt="Current photo"
                        className="mt-2 h-24 w-24 object-cover rounded-md border border-blue-300 dark:border-blue-700"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => setFormData(prev => ({ ...prev, existingPhoto: null }))}
                      className="mt-1"
                    >
                      O'chirish
                    </Button>
                  </div>
                </div>
              )}
              
              {/* New photo selected */}
              {formData.photo && (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    ✓ Yangi rasm tanlandi: {formData.photo.name}
                  </p>
                </div>
              )}
              
              {/* File input - only show if no existing photo or if we're replacing */}
              {!formData.existingPhoto || formData.photo ? (
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.files?.[0] || null }))}
                />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById('photo-replace') as HTMLInputElement;
                    input?.click();
                  }}
                  className="w-full"
                >
                  Rasmni almashtirish
                </Button>
              )}
              <Input
                id="photo-replace"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, photo: e.target.files?.[0] || null }));
                }}
                className="hidden"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="video">Video (ixtiyoriy)</Label>
              
              {/* Existing video */}
              {formData.existingVideo && !formData.video && (
                <div className="relative p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        ✓ Eski video
                      </p>
                      <video
                        src={formData.existingVideo}
                        controls
                        className="mt-2 h-24 w-24 object-cover rounded-md border border-purple-300 dark:border-purple-700"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => setFormData(prev => ({ ...prev, existingVideo: null }))}
                      className="mt-1"
                    >
                      O'chirish
                    </Button>
                  </div>
                </div>
              )}
              
              {/* New video selected */}
              {formData.video && (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    ✓ Yangi video tanlandi: {formData.video.name}
                  </p>
                </div>
              )}
              
              {/* File input - only show if no existing video or if we're replacing */}
              {!formData.existingVideo || formData.video ? (
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFormData(prev => ({ ...prev, video: e.target.files?.[0] || null }))}
                />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById('video-replace') as HTMLInputElement;
                    input?.click();
                  }}
                  className="w-full"
                >
                  Videoni almashtirish
                </Button>
              )}
              <Input
                id="video-replace"
                type="file"
                accept="video/*"
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, video: e.target.files?.[0] || null }));
                }}
                className="hidden"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingUpdate ? 'Saqlash' : 'Qo\'shish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
