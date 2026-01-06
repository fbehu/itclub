import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

interface Group {
  id: string;
  name: string;
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
  onSuccess,
}: ChangeStudentGroupDialogProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (open) {
      loadGroups();
    }
  }, [open]);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const response = await authFetch(API_ENDPOINTS.GROUPS);
      if (response.ok) {
        const data = await response.json();
        const groupsList = Array.isArray(data) ? data : data.results || [];
        // Filter out current group
        const filtered = groupsList.filter((g: Group) => g.id !== currentGroupId);
        setGroups(filtered);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Guruhlarni yuklashda xatolik');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedGroupId) {
      toast.error('Yangi guruhni tanlang');
      return;
    }

    setIsTransferring(true);
    try {
      const response = await authFetch(`${API_ENDPOINTS.GROUP_DETAIL(currentGroupId)}transfer-student/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          target_group_id: selectedGroupId,
        }),
      });

      if (!response.ok) {
        throw new Error('O\'quvchini o\'tkazishda xatolik');
      }

      toast.success('O\'quvchi muvaffaqiyatli o\'tkazildi');
      onSuccess();
      onOpenChange(false);
      setSelectedGroupId('');
    } catch (error) {
      console.error('Error transferring student:', error);
      toast.error(error instanceof Error ? error.message : 'O\'quvchini o\'tkazishda xatolik');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>O'quvchini boshqa guruhga o'tkazish</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                {student.first_name} {student.last_name}
              </Label>
              <p className="text-sm text-muted-foreground">
                Bu o'quvchini yangi guruhga o'tkazmoqchisiz
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-group">Yangi guruhni tanlang</Label>
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Boshqa guruhlar topilmadi</p>
              ) : (
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger id="target-group">
                    <SelectValue placeholder="Guruhni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isTransferring}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={isTransferring || !selectedGroupId || groups.length === 0}
          >
            {isTransferring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            O'tkazish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
