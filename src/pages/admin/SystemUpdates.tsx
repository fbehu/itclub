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
import { Megaphone, Plus, Edit, Trash2, Calendar, Tag, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from '@/hooks/use-toast';
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
    description: 'Endi o\'quvchilar va o\'qituvchilar uchun davomat tizimi ishga tushdi. Guruh bo\'yicha davomat qilish imkoniyati.',
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
  }
];

export default function SystemUpdates() {
  const [updates, setUpdates] = useState<SystemUpdate[]>(mockUpdates);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<SystemUpdate | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'feature' as UpdateType
  });

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

  const openCreateDialog = () => {
    setEditingUpdate(null);
    setFormData({ title: '', description: '', type: 'feature' });
    setDialogOpen(true);
  };

  const openEditDialog = (update: SystemUpdate) => {
    setEditingUpdate(update);
    setFormData({
      title: update.title,
      description: update.description,
      type: update.type
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Xatolik",
        description: "Barcha maydonlarni to'ldiring",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (editingUpdate) {
      // Update existing
      setUpdates(prev => prev.map(u => 
        u.id === editingUpdate.id 
          ? { ...u, ...formData }
          : u
      ));
      toast({
        title: "Muvaffaqiyat",
        description: "Yangilik tahrirlandi"
      });
    } else {
      // Create new
      const newUpdate: SystemUpdate = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        is_active: true
      };
      setUpdates(prev => [newUpdate, ...prev]);
      toast({
        title: "Muvaffaqiyat",
        description: "Yangilik qo'shildi"
      });
    }
    
    setLoading(false);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Rostdan ham bu yangilikni o\'chirmoqchimisiz?')) return;
    
    setUpdates(prev => prev.filter(u => u.id !== id));
    toast({
      title: "Muvaffaqiyat",
      description: "Yangilik o'chirildi"
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
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
                            <p className="font-medium">{update.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {update.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(update.type)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(update.created_at), "d MMM, yyyy", { locale: uz })}
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
        <DialogContent className="sm:max-w-md">
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
