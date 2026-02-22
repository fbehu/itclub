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
  new_password_confirm: z.string().min(6, 'Parolni tasdiqlang'),
}).refine((data) => data.new_password === data.new_password_confirm, {
  message: 'Parollar mos kelmaydi',
  path: ['new_password_confirm'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordDialog({
  open,
  onOpenChange,
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
      const response = await authFetch('/profile/change-password/', {
        method: 'POST',
        body: JSON.stringify({
          old_password: data.old_password,
          new_password: data.new_password,
          new_password_confirm: data.new_password_confirm,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        
        // Xato response dan spesifik xabar olish
        let errorMessage = 'Parolni o\'zgartirishda xatolik';
        
        if (errorData.old_password) {
          errorMessage = Array.isArray(errorData.old_password) 
            ? errorData.old_password[0] 
            : errorData.old_password;
        } else if (errorData.new_password) {
          errorMessage = Array.isArray(errorData.new_password) 
            ? errorData.new_password[0] 
            : errorData.new_password;
        } else if (errorData.new_password_confirm) {
          errorMessage = Array.isArray(errorData.new_password_confirm) 
            ? errorData.new_password_confirm[0] 
            : errorData.new_password_confirm;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
          // Barcha error fieldlarni birlashtirib xabar yasash
          const errors: string[] = [];
          Object.entries(errorData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              errors.push(value.join(', '));
            } else if (typeof value === 'string') {
              errors.push(value);
            }
          });
          if (errors.length > 0) {
            errorMessage = errors.join(' | ');
          }
        }
        
        console.error('Final Error Message:', errorMessage);
        throw new Error(errorMessage);
      }

      toast({
        title: 'Muvaffaqiyatli',
        description: 'Parol muvaffaqiyatli o\'zgartirildi',
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Parolni o\'zgartirishda xatolik';
      console.error('Catch Error:', errorMsg);
      
      toast({
        title: 'Xatolik',
        description: errorMsg,
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
            <Label htmlFor="new_password_confirm">Parolni tasdiqlang</Label>
            <PasswordInput
              id="new_password_confirm"
              {...register('new_password_confirm')}
              placeholder="Yangi parolni qayta kiriting"
            />
            {errors.new_password_confirm && (
              <p className="text-sm text-destructive">{errors.new_password_confirm.message}</p>
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
