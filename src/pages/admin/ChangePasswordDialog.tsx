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
  new_password_confirm: z.string(),
}).refine((data) => data.new_password === data.new_password_confirm, {
  message: 'Parollar bir xil bo\'lishi kerak',
  path: ['new_password_confirm'],
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
      new_password_confirm: '',
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    try {
      const response = await authFetch(`/users/${userId}/change-password/`, {
        method: 'POST',
        body: JSON.stringify({
          new_password: data.new_password,
          new_confirm_password: data.new_password_confirm,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        
        // Xato response dan spesifik xabar olish
        let errorMessage = 'Parolni o\'zgartirishda xatolik';
        
        if (errorData.new_password) {
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
          Object.entries(errorData).forEach(([, value]) => {
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
        description: 'Parol o\'zgartirildi',
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Parolni o\'zgartirishda xatolik';
      console.error('Catch Error:', errorMsg);
      
      toast({
        title: 'Xato',
        description: errorMsg,
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
            <Label htmlFor="new_password_confirm">Parolni tasdiqlang *</Label>
            <Input
              id="new_password_confirm"
              type="password"
              {...form.register('new_password_confirm')}
            />
            {form.formState.errors.new_password_confirm && (
              <p className="text-sm text-destructive">{form.formState.errors.new_password_confirm.message}</p>
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
