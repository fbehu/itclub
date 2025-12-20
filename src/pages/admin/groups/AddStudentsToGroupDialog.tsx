import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      loadStudents();
      setSelectedStudents([]);
      setSearchQuery('');
    }
  }, [open]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.USERS_LIST);
      const data = await response.json();
      const students = data.results || data;
      
      // Filter out students already in the group
      const availableStudents = students.filter(
        (student: Student) => !existingStudentIds.includes(student.id)
      );
      
      setAllStudents(availableStudents);
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
      
      // Combine existing and new student IDs
      const allStudentIds = [...existingStudentIds, ...selectedStudents];
      
      const response = await authFetch(API_ENDPOINTS.GROUP_STUDENTS(groupId), {
        method: 'POST',
        body: JSON.stringify({ student_ids: allStudentIds })
      });

      if (response.ok) {
        toast.success(`${selectedStudents.length} ta o'quvchi qo'shildi`);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error('O\'quvchilarni qo\'shishda xatolik');
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
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const filteredStudents = allStudents.filter(student =>
    student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              placeholder="O'quvchi qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Tanlangan: {selectedStudents.length} ta o'quvchi
            </div>
            {filteredStudents.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedStudents.length === filteredStudents.length ? 'Barchasini bekor qilish' : 'Barchasini tanlash'}
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {allStudents.length === 0 
                  ? 'Qo\'shish uchun o\'quvchi topilmadi' 
                  : 'Qidiruv natijasi topilmadi'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] border rounded-md p-4">
              <div className="space-y-2">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => toggleStudent(student.id)}
                  >
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{student.username} {student.direction && `• ${student.direction}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
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
