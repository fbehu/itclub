import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  photo?: string;
  direction?: string;
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateGroupDialog({ open, onOpenChange, onSuccess }: CreateGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    smena: '',
    start_time: '',
    teacher_id: ''
  });

  useEffect(() => {
    if (open) {
      loadTeachers();
    }
  }, [open]);

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const response = await authFetch(`${API_ENDPOINTS.USERS_LIST}?role=teacher`);
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.results || data);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error('O\'qituvchilarni yuklashda xatolik');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.smena || !formData.start_time || !formData.teacher_id) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }

    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.GROUPS, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Guruh yaratildi');
        setFormData({ name: '', smena: '', start_time: '', teacher_id: '' });
        onOpenChange(false);
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Guruh yaratishda xatolik');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Guruh yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const selectedTeacher = teachers.find(t => t.id === formData.teacher_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yangi guruh yaratish</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Guruh nomi *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Masalan: Backend 1-guruh"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">O'qituvchi *</Label>
            <Select 
              value={formData.teacher_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, teacher_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTeachers ? "Yuklanmoqda..." : "O'qituvchini tanlang"}>
                  {selectedTeacher && (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={selectedTeacher.photo || undefined} />
                        <AvatarFallback className="text-xs">
                          {selectedTeacher.first_name[0]}{selectedTeacher.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{selectedTeacher.first_name} {selectedTeacher.last_name}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={teacher.photo || undefined} />
                        <AvatarFallback className="text-xs">
                          {teacher.first_name[0]}{teacher.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span>{teacher.first_name} {teacher.last_name}</span>
                        <span className="text-xs text-muted-foreground">{teacher.direction || teacher.username}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smena">Smena *</Label>
            <Select 
              value={formData.smena} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, smena: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Smenani tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tong">Tong</SelectItem>
                <SelectItem value="Kun">Kun</SelectItem>
                <SelectItem value="Kechki">Kechki</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_time">Boshlanish vaqti *</Label>
            <Input
              id="start_time"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Yuklanmoqda...' : 'Yaratish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
