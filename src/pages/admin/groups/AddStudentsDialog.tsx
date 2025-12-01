import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Search } from 'lucide-react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  direction: string;
}

interface Group {
  id: string;
  name: string;
}

interface AddStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  onSuccess: () => void;
}

export function AddStudentsDialog({ open, onOpenChange, group, onSuccess }: AddStudentsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [groupStudents, setGroupStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      loadStudents();
      loadGroupStudents();
    }
  }, [open]);

  const loadStudents = async () => {
    try {
      const response = await authFetch(API_ENDPOINTS.USERS_LIST);
      const data = await response.json();
      setAllStudents(data.results || data);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('O\'quvchilarni yuklashda xatolik');
    }
  };

  const loadGroupStudents = async () => {
    try {
      const response = await authFetch(API_ENDPOINTS.GROUP_STUDENTS(group.id));
      const data = await response.json();
      setGroupStudents(data.results || data);
      setSelectedStudents((data.results || data).map((s: Student) => s.id));
    } catch (error) {
      console.error('Error loading group students:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.GROUP_STUDENTS(group.id), {
        method: 'POST',
        body: JSON.stringify({ student_ids: selectedStudents })
      });

      if (response.ok) {
        toast.success('O\'quvchilar yangilandi');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error('O\'quvchilarni yangilashda xatolik');
      }
    } catch (error) {
      console.error('Error updating students:', error);
      toast.error('O\'quvchilarni yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
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
          <DialogTitle>Guruhga o'quvchi qo'shish - {group.name}</DialogTitle>
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

          <div className="text-sm text-muted-foreground">
            Tanlangan: {selectedStudents.length} ta o'quvchi
          </div>

          <ScrollArea className="h-[400px] border rounded-md p-4">
            <div className="space-y-2">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
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
                      {student.username} - {student.direction}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Yuklanmoqda...' : 'Saqlash'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
