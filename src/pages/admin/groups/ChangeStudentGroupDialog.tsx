import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Loader2, ArrowRight } from 'lucide-react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
}

interface Group {
  id: string;
  name: string;
  smena: string;
  start_time: string;
}

interface ChangeStudentGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  currentGroupId: string;
  onSuccess: () => void;
}

export function ChangeStudentGroupDialog({ 
  open, 
  onOpenChange, 
  student, 
  currentGroupId,
  onSuccess 
}: ChangeStudentGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (open) {
      loadGroups();
      setSelectedGroupId('');
    }
  }, [open]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.GROUPS);
      const data = await response.json();
      const allGroups = data.results || data;
      
      // Find current group
      const current = allGroups.find((g: Group) => g.id === currentGroupId);
      setCurrentGroup(current || null);
      
      // Filter out current group
      const otherGroups = allGroups.filter((g: Group) => g.id !== currentGroupId);
      setGroups(otherGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Guruhlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedGroupId) {
      toast.error('Guruhni tanlang');
      return;
    }

    try {
      setSaving(true);
      
      // First, get students of new group
      const newGroupStudentsRes = await authFetch(API_ENDPOINTS.GROUP_STUDENTS(selectedGroupId));
      const newGroupStudentsData = await newGroupStudentsRes.json();
      const newGroupStudents = newGroupStudentsData.results || newGroupStudentsData;
      const newGroupStudentIds = newGroupStudents.map((s: Student) => s.id);
      
      // Add student to new group
      const addResponse = await authFetch(API_ENDPOINTS.GROUP_STUDENTS(selectedGroupId), {
        method: 'POST',
        body: JSON.stringify({ student_ids: [...newGroupStudentIds, student.id] })
      });

      if (!addResponse.ok) {
        toast.error('O\'quvchini yangi guruhga qo\'shishda xatolik');
        return;
      }

      // Get current group students and remove this student
      const currentGroupStudentsRes = await authFetch(API_ENDPOINTS.GROUP_STUDENTS(currentGroupId));
      const currentGroupStudentsData = await currentGroupStudentsRes.json();
      const currentGroupStudents = currentGroupStudentsData.results || currentGroupStudentsData;
      const updatedCurrentGroupIds = currentGroupStudents
        .map((s: Student) => s.id)
        .filter((id: string) => id !== student.id);
      
      const removeResponse = await authFetch(API_ENDPOINTS.GROUP_STUDENTS(currentGroupId), {
        method: 'POST',
        body: JSON.stringify({ student_ids: updatedCurrentGroupIds })
      });

      if (removeResponse.ok) {
        const newGroup = groups.find(g => g.id === selectedGroupId);
        toast.success(`O'quvchi "${newGroup?.name}" guruhiga ko'chirildi`);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error('O\'quvchini eski guruhdan o\'chirishda xatolik');
      }
    } catch (error) {
      console.error('Error changing group:', error);
      toast.error('Guruhni o\'zgartirishda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Guruhni o'zgartirish</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">O'quvchi</p>
            <p className="font-semibold">{student.first_name} {student.last_name}</p>
            <p className="text-sm text-muted-foreground">@{student.username}</p>
          </div>

          {currentGroup && (
            <div className="flex items-center gap-4">
              <div className="flex-1 p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">Hozirgi guruh</p>
                <p className="font-medium">{currentGroup.name}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 p-3 border rounded-lg border-primary">
                <p className="text-xs text-muted-foreground">Yangi guruh</p>
                <p className="font-medium">{selectedGroup?.name || 'Tanlang'}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Yangi guruhni tanlang</Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Guruhni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div>
                        <span className="font-medium">{group.name}</span>
                        <span className="text-muted-foreground ml-2">
                          ({group.smena}, {group.start_time})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {groups.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">Boshqa guruhlar mavjud emas</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSave} disabled={saving || !selectedGroupId}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Yuklanmoqda...
              </>
            ) : (
              'Ko\'chirish'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
