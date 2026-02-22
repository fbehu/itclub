import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Search, Loader2 } from 'lucide-react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  direction: string;
  photo?: string;
  level?: string;
}

interface AddStudentsToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  existingStudentIds: string[];
  onSuccess: () => void;
}

export function AddStudentsToGroupDialog({ 
  open, 
  onOpenChange, 
  groupId, 
  groupName,
  existingStudentIds,
  onSuccess 
}: AddStudentsToGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const itemsPerPage = 50;

  useEffect(() => {
    if (open) {
      loadStudents(1);
      setSelectedStudents([]);
      setSearchQuery('');
      setCurrentPage(1);
    }
  }, [open]);

  const loadStudents = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      let url = `${API_ENDPOINTS.GROUP_AVAILABLE_STUDENTS(groupId)}`;
      
      // Only add query parameters if they have values
      const params = new URLSearchParams();
      
      if (search) {
        params.append('search', search);
      } else if (page > 1) {
        // Only add page parameter if search is empty
        params.append('page', String(page));
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await authFetch(url);
      const data = await response.json();
      
      const studentsData = data.results || data;
      const studentsList = Array.isArray(studentsData) ? studentsData : (studentsData.results || []);
      
      // Filter out students already in the group
      const availableStudents = studentsList.filter(
        (student: Student) => !existingStudentIds.includes(student.id)
      );
      
      setStudents(availableStudents);
      setTotalPages(data.total_pages || Math.ceil(availableStudents.length / itemsPerPage) || 1);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('O\'quvchilarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Kamida bitta o\'quvchi tanlang');
      return;
    }

    try {
      setSaving(true);
      
      // Send only newly selected students, not existing ones
      const response = await authFetch(API_ENDPOINTS.GROUP_STUDENTS(groupId), {
        method: 'POST',
        body: JSON.stringify({ student_ids: selectedStudents })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Agar ba'zi o'quvchilar qo'shilmagan bo'lsa, xato ko'rsatish
        if (data.added_count && data.added_count > 0 && data.missing_ids && data.missing_ids.length > 0) {
          const missingCount = data.missing_ids.length;
          toast.warning(
            `${data.added_count} ta o'quvchi qo'shildi, lekin ${missingCount} ta o'quvchi ushbu Guruhdagi kursni sotib olmagan. Ular kurs sotib olishlari kerak.`,
            { duration: 5000 }
          );
        } else if (data.added_count && data.added_count > 0) {
          toast.success(`${data.added_count} ta o'quvchi qo'shildi`);
        } else if (data.added_count === 0) {
          // Hech kim qo'shilmadi - kurs sotib olishlari kerak
          toast.error(
            data.detail || data.message || 'Tanlangan o\'quvchilarning hech biri ushbu Guruhdagi kursni sotib olmagan. Ular kurs sotib olishlari kerak.',
            { duration: 5000 }
          );
          setSaving(false);
          return;
        }
        
        onOpenChange(false);
        onSuccess();
      } else if (response.status === 503) {
        // Maintenance mode
        const error = await response.json();
        toast.error(
          error.message || error.error || 'Tizim ta\'mirlash jarayonida. Iltimos, biroz vaqt kutin.',
          { duration: 5000 }
        );
      } else {
        const error = await response.json();
        
        // API xatosi ko'rsatish
        const errorMessage = error.detail || 
                            error.message || 
                            error.non_field_errors?.[0] ||
                            'O\'quvchilarni qo\'shishda xatolik';
        
        toast.error(errorMessage, { duration: 5000 });
      }
    } catch (error) {
      console.error('Error adding students:', error);
      toast.error('O\'quvchilarni qo\'shishda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const getLevelBadgeColor = (level?: string) => {
    if (!level) return 'bg-gray-100 text-gray-800';
    
    const levelLower = level.toLowerCase();
    if (levelLower.includes('boshlang') || levelLower === 'a1') {
      return 'bg-green-100 text-green-800';
    } else if (levelLower.includes('o\'rta') || levelLower === 'a2') {
      return 'bg-blue-100 text-blue-800';
    } else if (levelLower.includes('yuqori') || levelLower === 'b1') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>O'quvchi qo'shish - {groupName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="O'quvchi qidirish (Ism, Familya, Telefon)..."
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                setCurrentPage(1);
                
                // Clear previous timeout
                if (searchTimeout) {
                  clearTimeout(searchTimeout);
                }
                
                // Set new timeout for search
                if (value.trim().length > 0) {
                  const timeout = setTimeout(() => {
                    loadStudents(1, value);
                  }, 500); // 500ms delay
                  setSearchTimeout(timeout);
                } else {
                  // Load without search if empty
                  loadStudents(1, '');
                }
              }}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Tanlangan: {selectedStudents.length} ta o'quvchi
            </div>
            {students.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedStudents.length === students.length ? 'Barchasini bekor qilish' : 'Barchasini tanlash'}
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery.length > 0
                  ? 'Qidiruv natijasi topilmadi'
                  : 'Qo\'shish uchun o\'quvchi topilmadi'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] border rounded-md p-4">
              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => toggleStudent(student.id)}
                  >
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      {student.photo && <AvatarImage src={student.photo} />}
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(student.first_name || '')[0]}{(student.last_name || '')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{student.username} {student.direction && `• ${student.direction}`}
                      </div>
                    </div>
                    {student.level && (
                      <Badge className={`flex-shrink-0 ${getLevelBadgeColor(student.level)}`}>
                        {student.level}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Sahifa {currentPage} / {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.max(1, currentPage - 1);
                    setCurrentPage(newPage);
                    loadStudents(newPage, searchQuery);
                  }}
                  disabled={currentPage === 1}
                >
                  Oldingi
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.min(totalPages, currentPage + 1);
                    setCurrentPage(newPage);
                    loadStudents(newPage, searchQuery);
                  }}
                  disabled={currentPage === totalPages}
                >
                  Keyingi
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSave} disabled={saving || selectedStudents.length === 0}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Yuklanmoqda...
              </>
            ) : (
              `Qo'shish (${selectedStudents.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
