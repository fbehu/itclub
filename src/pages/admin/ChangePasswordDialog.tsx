import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/authFetch';

const passwordSchema = z.object({
  new_password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak').max(100),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Parollar bir xil bo\'lishi kerak',
  path: ['confirm_password'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface ChangePasswordDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordDialog({ userId, userName, open, onOpenChange }: ChangePasswordDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      new_password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    try {
      const response = await authFetch(`/users/users/${userId}/change-password/`, {
        method: 'POST',
        body: JSON.stringify({
          new_password: data.new_password,
          confirm_password: data.confirm_password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Parolni o\'zgartirishda xatolik');
      }

      toast({
        title: 'Muvaffaqiyatli',
        description: 'Parol o\'zgartirildi',
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Xato',
        description: error instanceof Error ? error.message : 'Parolni o\'zgartirishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Parolni o'zgartirish - {userName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_password">Yangi parol *</Label>
            <Input
              id="new_password"
              type="password"
              {...form.register('new_password')}
            />
            {form.formState.errors.new_password && (
              <p className="text-sm text-destructive">{form.formState.errors.new_password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Parolni tasdiqlang *</Label>
            <Input
              id="confirm_password"
              type="password"
              {...form.register('confirm_password')}
            />
            {form.formState.errors.confirm_password && (
              <p className="text-sm text-destructive">{form.formState.errors.confirm_password.message}</p>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onOpenChange(false);
              }}
              className="flex-1"
              disabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saqlanmoqda...' : 'O\'zgartirish'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
