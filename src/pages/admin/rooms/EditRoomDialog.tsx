import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';

interface Room {
  id: string;
  name: string;
  room_number?: string;
  floor?: number;
  capacity?: number;
  is_active?: boolean;
}

interface EditRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room;
  onSuccess: () => void;
}

export function EditRoomDialog({ open, onOpenChange, room, onSuccess }: EditRoomDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    room_number: '',
    floor: '',
    capacity: '',
    is_active: true,
  });

  useEffect(() => {
    if (room && open) {
      setFormData({
        name: room.name || '',
        room_number: room.room_number || '',
        floor: room.floor ? String(room.floor) : '',
        capacity: room.capacity ? String(room.capacity) : '',
        is_active: room.is_active ?? true,
      });
    }
  }, [room, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Xato',
        description: 'Xona nomini kiriting',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authFetch(API_ENDPOINTS.ROOM_DETAIL(room.id), {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          room_number: formData.room_number || null,
          floor: formData.floor ? parseInt(formData.floor) : null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('Xonani tahrirlashda xatolik');
      }

      toast({
        title: 'Muvaffaqiyatli',
        description: 'Xona ma\'lumotlari yangilandi',
      });

      onSuccess();
    } catch (error) {
      toast({
        title: 'Xato',
        description: error instanceof Error ? error.message : 'Xonani tahrirlashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xonani tahrirlash</DialogTitle>
          <DialogDescription>
            Xona ma'lumotlarini o'zgartiring
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Xona nomi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Masalan: A xona, B xona"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Qavat</Label>
            <Input
              id="floor"
              type="number"
              placeholder="Masalan: 1"
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              disabled={loading}
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Sig'imi (bolalar soni)</Label>
            <Input
              id="capacity"
              type="number"
              placeholder="Masalan: 25"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              disabled={loading}
              min="1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: Boolean(checked) })}
              disabled={loading}
            />
            <Label htmlFor="is_active" className="font-normal cursor-pointer">
              Xona faol (darslar uchun mavjud)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
