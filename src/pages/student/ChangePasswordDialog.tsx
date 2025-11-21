import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const passwordSchema = z.object({
  old_password: z.string().min(1, 'Eski parolni kiriting'),
  new_password: z.string().min(6, 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  confirm_password: z.string().min(6, 'Parolni tasdiqlang'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Parollar mos kelmaydi',
  path: ['confirm_password'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export default function ChangePasswordDialog({
  open,
  onOpenChange,
  userId,
}: ChangePasswordDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    try {
      const response = await authFetch(API_ENDPOINTS.CHANGE_PASSWORD(userId), {
        method: 'POST',
        body: JSON.stringify({
          old_password: data.old_password,
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
        description: 'Parol muvaffaqiyatli o\'zgartirildi',
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Xatolik',
        description: error instanceof Error ? error.message : 'Parolni o\'zgartirishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Parolni o'zgartirish</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="old_password">Eski parol</Label>
            <PasswordInput
              id="old_password"
              {...register('old_password')}
              placeholder="Eski parolingizni kiriting"
            />
            {errors.old_password && (
              <p className="text-sm text-destructive">{errors.old_password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">Yangi parol</Label>
            <PasswordInput
              id="new_password"
              {...register('new_password')}
              placeholder="Yangi parolni kiriting"
            />
            {errors.new_password && (
              <p className="text-sm text-destructive">{errors.new_password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Parolni tasdiqlang</Label>
            <PasswordInput
              id="confirm_password"
              {...register('confirm_password')}
              placeholder="Yangi parolni qayta kiriting"
            />
            {errors.confirm_password && (
              <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              O'zgartirish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
