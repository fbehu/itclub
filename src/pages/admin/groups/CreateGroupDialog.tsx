import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateGroupDialog({ open, onOpenChange, onSuccess }: CreateGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    smena: '',
    start_time: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.smena || !formData.start_time) {
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
        setFormData({ name: '', smena: '', start_time: '' });
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
              {loading ? 'Yuklanmoqda...' : 'Yaratish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
