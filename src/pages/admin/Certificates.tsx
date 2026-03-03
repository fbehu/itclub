import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Award, Plus, Edit, Trash2, Calendar, Loader2, Image as ImageIcon, Search, X, Eye } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
}

interface Certificate {
  id: number;
  name: string;
  description: string;
  issued_date: string;
  owner_id?: string;
  photo?: string | null;
  created_at?: string;
}

export default function AdminCertificates() {
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudentData, setSelectedStudentData] = useState<Student | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState<Certificate | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingCertificate, setDeletingCertificate] = useState<Certificate | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    issued_date: format(new Date(), 'yyyy-MM-dd'),
    owner_id: '',
    photo: null as File | null,
    existingPhoto: null as string | null
  });

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchUserById = async (id: string) => {
    if (!id) return;
    try {
      const response = await authFetch(`${API_ENDPOINTS.USERS_LIST}${id}/`);
      if (response.ok) {
        const data = await response.json();
        setSelectedStudentData(data);
      } else {
        setSelectedStudentData(null);
      }
    } catch (error) {
      console.error('Error fetching user by id:', error);
      setSelectedStudentData(null);
    }
  };

  const searchStudents = async (query: string) => {
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await authFetch(`${API_ENDPOINTS.USERS_LIST}?page=1&search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        const studentList = Array.isArray(data) ? data : data.results || [];
        setSearchResults(studentList);
      }
    } catch (error) {
      console.error('Error searching students:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchCertificates = async () => {
    setIsLoadingData(true);
    try {
      const response = await authFetch(API_ENDPOINTS.CERTIFICATES);
      if (response.ok) {
        const data = await response.json();
        setCertificates(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast({
        title: 'Xatolik',
        description: 'Sertifikatlarni yuklashda xatolik',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const openCreateDialog = () => {
    setEditingCertificate(null);
    setFormData({ 
      name: '', 
      description: '',
      issued_date: format(new Date(), 'yyyy-MM-dd'),
      owner_id: '',
      photo: null,
      existingPhoto: null
    });
    setStudentSearchQuery('');
    setSelectedStudentData(null);
    setDialogOpen(true);
  };

  const openEditDialog = (cert: Certificate) => {
    setEditingCertificate(cert);
    setFormData({
      name: cert.name,
      description: cert.description,
      issued_date: cert.issued_date,
      owner_id: cert.owner_id || '',
      photo: null,
      existingPhoto: cert.photo || null
    });
    setStudentSearchQuery('');
    // Load owner info so it displays in the selection
    if (cert.owner_id) {
      fetchUserById(cert.owner_id);
    } else {
      setSelectedStudentData(null);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.issued_date || !formData.owner_id) {
      toast({
        title: "Xatolik",
        description: "Barcha maydonlarni to'ldiring",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const body = new FormData();
      body.append('name', formData.name);
      body.append('description', formData.description);
      body.append('issued_date', formData.issued_date);
      body.append('owner_id', formData.owner_id);
      
      // Rasm qo'shish yoki o'chirish
      if (formData.photo) {
        body.append('photo', formData.photo);
      } else if (editingCertificate && formData.existingPhoto === null && editingCertificate.photo) {
        // Eski rasmni o'chirish uchun signal
        body.append('photo', 'null');
      }

      let response;
      if (editingCertificate) {
        response = await authFetch(`${API_ENDPOINTS.CERTIFICATES}${editingCertificate.id}/`, {
          method: 'PUT',
          body
        });
      } else {
        response = await authFetch(API_ENDPOINTS.CERTIFICATES, {
          method: 'POST',
          body
        });
      }

      if (!response.ok) {
        let errorMessage = editingCertificate ? 'Sertifikatni tahrirlashda xatolik' : 'Sertifikat qo\'shishda xatolik';
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Agar JSON parse qilsa bo'lmasa, default message'ni ishlatamiz
        }
        throw new Error(errorMessage);
      }

      const updatedCert = await response.json();

      if (editingCertificate) {
        setCertificates(prev => prev.map(c => 
          c.id === editingCertificate.id 
            ? updatedCert
            : c
        ));
        toast({
          title: "Muvaffaqiyat",
          description: "Sertifikat tahrirlandi"
        });
      } else {
        setCertificates(prev => [updatedCert, ...prev]);
        toast({
          title: "Muvaffaqiyat",
          description: "Sertifikat qo'shildi"
        });
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving certificate:', error);
      toast({
        title: 'Xatolik',
        description: error instanceof Error ? error.message : 'Xatolik yuz berdi',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cert: Certificate) => {
    setDeletingCertificate(cert);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCertificate) return;

    setDeleting(true);
    try {
      const response = await authFetch(`${API_ENDPOINTS.CERTIFICATES}${deletingCertificate.id}/`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        let errorMessage = 'Sertifikatni o\'chirishda xatolik';
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Agar JSON parse qilsa bo'lmasa, default message'ni ishlatamiz
        }
        throw new Error(errorMessage);
      }

      setCertificates(prev => prev.filter(c => c.id !== deletingCertificate.id));
      toast({
        title: "Muvaffaqiyat",
        description: "Sertifikat o'chirildi"
      });
      setDeleteConfirmOpen(false);
      setDeletingCertificate(null);
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast({
        title: 'Xatolik',
        description: error instanceof Error ? error.message : 'Sertifikatni o\'chirishda xatolik',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  // O'quvchilarni qidirish
  const handleStudentSearch = (query: string) => {
    setStudentSearchQuery(query);
    searchStudents(query);
  };

  // Tanlangan o'quvchini topish
  const selectedStudent = selectedStudentData || searchResults.find(s => s.id === formData.owner_id);

  const openViewModal = (cert: Certificate) => {
    setViewingCertificate(cert);
    setViewModalOpen(true);
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
      <div className="mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Award className="h-7 w-7 text-yellow-500" />
              Sertifikatlar
            </h1>
            <p className="text-muted-foreground mt-1">Sertifikatlarni boshqarish</p>
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
                      <TableHead className="font-semibold">Tavsif</TableHead>
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
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{cert.name}</p>
                            {cert.photo && (
                              <div title="Rasm mavjud">
                                <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm line-clamp-2">
                          {cert.description}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(cert.issued_date), "d MMM, yyyy", { locale: uz })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Ko'rish"
                              onClick={() => openViewModal(cert)}
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
                              onClick={() => handleDelete(cert)}
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

      {/* View Certificate Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sertifikat</DialogTitle>
          </DialogHeader>
          
          {viewingCertificate && (
            <div className="space-y-4 py-4">
              {/* Photo */}
              {viewingCertificate.photo && (
                <div className="bg-muted rounded-lg p-4 flex items-center justify-center">
                  <img
                    src={viewingCertificate.photo}
                    alt={viewingCertificate.name}
                    className="max-h-64 max-w-full object-contain rounded"
                  />
                </div>
              )}
              
              {/* Name */}
              <div>
                <Label className="text-muted-foreground text-xs">Nomi</Label>
                <p className="text-base font-semibold mt-1">{viewingCertificate.name}</p>
              </div>
              
              {/* Description */}
              <div>
                <Label className="text-muted-foreground text-xs">Tavsif</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{viewingCertificate.description}</p>
              </div>
              
              {/* Issued Date */}
              <div>
                <Label className="text-muted-foreground text-xs">Tugash sanasi</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{format(new Date(viewingCertificate.issued_date), "d MMM, yyyy", { locale: uz })}</p>
                </div>
              </div>
              
              {/* Owner */}
              {viewingCertificate.owner_id && (
                <div>
                  <Label className="text-muted-foreground text-xs">O'quvchi</Label>
                  <Badge variant="secondary" className="mt-1">{viewingCertificate.owner_id}</Badge>
                </div>
              )}
              
              {/* Created Date */}
              {viewingCertificate.created_at && (
                <div>
                  <Label className="text-muted-foreground text-xs">Qo'shilgan sana</Label>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(viewingCertificate.created_at), "d MMM, yyyy HH:mm", { locale: uz })}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                placeholder="Masalan: Python Expert"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="owner">O'quvchi</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStudentSearchOpen(!studentSearchOpen)}
                  className="w-full justify-start text-left"
                >
                  {selectedStudent ? (
                    <span>{selectedStudent.first_name} {selectedStudent.last_name}</span>
                  ) : (
                    <span className="text-muted-foreground">O'quvchini tanlang...</span>
                  )}
                </Button>
                
                {studentSearchOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-background shadow-lg z-50">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Ism, Familya yoki Username..."
                          value={studentSearchQuery}
                          onChange={(e) => handleStudentSearch(e.target.value)}
                          className="pl-8 h-8 text-sm"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {searchLoading ? (
                        <div className="p-3 text-sm text-center text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                          Qidirilmoqda...
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          {studentSearchQuery === '' ? 'Qidirish uchun yozing...' : 'O\'quvchi topilmadi'}
                        </div>
                      ) : (
                        searchResults.map(student => (
                          <Button
                            key={student.id}
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, owner_id: student.id }));
                              setSelectedStudentData(student);
                              setStudentSearchOpen(false);
                              setStudentSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="w-full justify-start px-3 py-2 h-auto rounded-none text-left"
                          >
                            <div>
                              <p className="font-medium text-sm">{student.first_name} {student.last_name}</p>
                              <p className="text-xs text-muted-foreground">@{student.username}</p>
                            </div>
                          </Button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Tavsif</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Sertifikat haqida tavsif"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="issued_date">Tugash sanasi</Label>
              <Input
                id="issued_date"
                type="date"
                value={formData.issued_date}
                onChange={(e) => setFormData(prev => ({ ...prev, issued_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="photo">Sertifikat rasmi</Label>
              
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
                        alt="Current certificate"
                        className="mt-2 h-24 w-auto object-cover rounded-md border border-blue-300 dark:border-blue-700"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sertifikatni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{deletingCertificate?.name}" sertifikatini o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
