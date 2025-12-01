import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';

interface Group {
  id: string;
  name: string;
  smena: string;
  start_time: string;
}

interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  onSuccess: () => void;
}

export function EditGroupDialog({ open, onOpenChange, group, onSuccess }: EditGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    smena: '',
    start_time: ''
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        smena: group.smena,
        start_time: group.start_time
      });
    }
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.smena || !formData.start_time) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }

    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.GROUP_DETAIL(group.id), {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Guruh tahrirlandi');
        onOpenChange(false);
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Guruhni tahrirlashda xatolik');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Guruhni tahrirlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Guruhni tahrirlash</DialogTitle>
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
            <Label htmlFor="smena">Smena *</Label>
            <Input
              id="smena"
              value={formData.smena}
              onChange={(e) => setFormData(prev => ({ ...prev, smena: e.target.value }))}
              placeholder="Masalan: Tong / Kechki"
            />
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
              {loading ? 'Yuklanmoqda...' : 'Saqlash'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
