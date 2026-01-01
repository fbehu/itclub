import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, Plus, Edit, Trash2, Calendar, Loader2, Move, Eye } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

interface Certificate {
  id: string;
  name: string;
  direction: string;
  name_position: { x: number; y: number };
  template_image?: string;
  created_at: string;
  is_active: boolean;
}

// Mock data
const mockCertificates: Certificate[] = [
  {
    id: '1',
    name: 'Web Development Fundamentals',
    direction: 'Frontend Development',
    name_position: { x: 50, y: 60 },
    created_at: '2024-12-15T10:00:00Z',
    is_active: true
  },
  {
    id: '2',
    name: 'Python Programming',
    direction: 'Backend Development',
    name_position: { x: 50, y: 55 },
    created_at: '2024-12-10T14:30:00Z',
    is_active: true
  },
  {
    id: '3',
    name: 'Cybersecurity Basics',
    direction: 'Axborot xavfsizligi',
    name_position: { x: 45, y: 65 },
    created_at: '2024-12-05T09:00:00Z',
    is_active: true
  }
];

const directions = [
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Axborot xavfsizligi',
  'Mobile Development',
  'Data Science',
  'DevOps'
];

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>(mockCertificates);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    direction: '',
    name_position: { x: 50, y: 60 }
  });

  const openCreateDialog = () => {
    setEditingCertificate(null);
    setFormData({ name: '', direction: '', name_position: { x: 50, y: 60 } });
    setDialogOpen(true);
  };

  const openEditDialog = (cert: Certificate) => {
    setEditingCertificate(cert);
    setFormData({
      name: cert.name,
      direction: cert.direction,
      name_position: cert.name_position
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.direction) {
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
    
    if (editingCertificate) {
      setCertificates(prev => prev.map(c => 
        c.id === editingCertificate.id 
          ? { ...c, ...formData }
          : c
      ));
      toast({
        title: "Muvaffaqiyat",
        description: "Sertifikat tahrirlandi"
      });
    } else {
      const newCert: Certificate = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        is_active: true
      };
      setCertificates(prev => [newCert, ...prev]);
      toast({
        title: "Muvaffaqiyat",
        description: "Sertifikat qo'shildi"
      });
    }
    
    setLoading(false);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Rostdan ham bu sertifikatni o'chirmoqchimisiz?")) return;
    
    setCertificates(prev => prev.filter(c => c.id !== id));
    toast({
      title: "Muvaffaqiyat",
      description: "Sertifikat o'chirildi"
    });
  };

  const handlePreviewMouseDown = () => {
    setIsDragging(true);
  };

  const handlePreviewMouseUp = () => {
    setIsDragging(false);
  };

  const handlePreviewMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    
    setFormData(prev => ({
      ...prev,
      name_position: { x: Math.round(x), y: Math.round(y) }
    }));
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Award className="h-7 w-7 text-yellow-500" />
              Sertifikatlar
            </h1>
            <p className="text-muted-foreground mt-1">Sertifikat shablonlarini boshqarish</p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Sertifikat qo'shish
          </Button>
        </div>

        {/* Certificates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Barcha sertifikatlar</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {certificates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Hozircha sertifikatlar yo'q</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">#</TableHead>
                      <TableHead className="font-semibold">Nomi</TableHead>
                      <TableHead className="font-semibold">Yo'nalish</TableHead>
                      <TableHead className="font-semibold">Ism pozitsiyasi</TableHead>
                      <TableHead className="font-semibold">Sana</TableHead>
                      <TableHead className="text-center font-semibold">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert, index) => (
                      <TableRow key={cert.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{cert.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{cert.direction}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            X: {cert.name_position.x}%, Y: {cert.name_position.y}%
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(cert.created_at), "d MMM, yyyy", { locale: uz })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingCertificate(cert);
                                setFormData({
                                  name: cert.name,
                                  direction: cert.direction,
                                  name_position: cert.name_position
                                });
                                setPreviewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(cert)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(cert.id)}
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCertificate ? "Sertifikatni tahrirlash" : "Yangi sertifikat qo'shish"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sertifikat nomi</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Masalan: Web Development"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="direction">Yo'nalish</Label>
              <Select 
                value={formData.direction} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, direction: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Yo'nalishni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {directions.map(dir => (
                    <SelectItem key={dir} value={dir}>{dir}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Position Preview */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Move className="h-4 w-4" />
                Ism pozitsiyasi (sertifikatda)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Sertifikatda ismni qayerda ko'rsatishni tanlash uchun quyidagi maydonda bosing yoki suring
              </p>
              <div 
                ref={previewRef}
                className="relative border-2 border-dashed border-primary/30 rounded-lg aspect-[1.4/1] bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 cursor-crosshair"
                onMouseDown={handlePreviewMouseDown}
                onMouseUp={handlePreviewMouseUp}
                onMouseLeave={handlePreviewMouseUp}
                onMouseMove={handlePreviewMouseMove}
                onClick={(e) => {
                  if (!previewRef.current) return;
                  const rect = previewRef.current.getBoundingClientRect();
                  const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
                  const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
                  setFormData(prev => ({
                    ...prev,
                    name_position: { x: Math.round(x), y: Math.round(y) }
                  }));
                }}
              >
                {/* Certificate template preview */}
                <div className="absolute inset-4 border border-yellow-600/30 rounded flex flex-col items-center justify-center">
                  <Award className="h-8 w-8 text-yellow-600/50 mb-2" />
                  <p className="text-xs text-yellow-700/50 font-semibold">SERTIFIKAT</p>
                </div>
                
                {/* Name position indicator */}
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `${formData.name_position.x}%`,
                    top: `${formData.name_position.y}%`
                  }}
                >
                  <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium shadow-lg whitespace-nowrap">
                    Ism shu yerda
                  </div>
                  <div className="absolute left-1/2 -bottom-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary transform -translate-x-1/2" />
                </div>
              </div>
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <span>X: {formData.name_position.x}%</span>
                <span>Y: {formData.name_position.y}%</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCertificate ? 'Saqlash' : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sertifikat ko'rinishi</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="relative border-2 border-yellow-600/30 rounded-lg aspect-[1.4/1] bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 overflow-hidden">
              {/* Certificate design */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                  <Award className="h-10 w-10 text-yellow-600" />
                  <div className="text-right">
                    <p className="text-xs text-yellow-700/70">IT Club Academy</p>
                  </div>
                </div>
                
                <div className="text-center mt-8">
                  <p className="text-xs text-yellow-700/50 tracking-[0.3em] uppercase">Certificate of Completion</p>
                  <h2 className="text-2xl font-bold text-yellow-800 mt-2">SERTIFIKAT</h2>
                </div>
                
                <div className="mt-auto text-center">
                  <p className="text-xs text-yellow-700/70">{formData.direction}</p>
                  <p className="text-sm font-medium text-yellow-800 mt-1">{formData.name}</p>
                </div>
              </div>
              
              {/* Name position */}
              <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${formData.name_position.x}%`,
                  top: `${formData.name_position.y}%`
                }}
              >
                <p className="text-xl font-bold text-primary">Ism Familiya</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
