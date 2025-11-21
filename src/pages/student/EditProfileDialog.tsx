import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  first_name: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak'),
  last_name: z.string().min(2, 'Familiya kamida 2 ta belgidan iborat bo\'lishi kerak'),
  username: z.string().min(3, 'Username kamida 3 ta belgidan iborat bo\'lishi kerak'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentData: {
    first_name: string;
    last_name: string;
    username: string;
    photo?: string;
  };
  onSuccess: () => void;
}

export default function EditProfileDialog({
  open,
  onOpenChange,
  currentData,
  onSuccess,
}: EditProfileDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentData.photo || null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: currentData,
  });

  useEffect(() => {
    if (open) {
      reset(currentData);
      setPhotoPreview(currentData.photo || null);
      setSelectedPhoto(null);
    }
  }, [open, currentData, reset]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('first_name', data.first_name);
      formData.append('last_name', data.last_name);
      formData.append('username', data.username);

      if (selectedPhoto) {
        formData.append('photo', selectedPhoto);
      }

      const response = await authFetch(API_ENDPOINTS.USER_PROFILE, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profilni yangilashda xatolik');
      }

      toast({
        title: 'Muvaffaqiyatli',
        description: 'Profil ma\'lumotlari yangilandi',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Xatolik',
        description: error instanceof Error ? error.message : 'Profilni yangilashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Profilni tahrirlash</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Ism</Label>
            <Input
              id="first_name"
              {...register('first_name')}
              placeholder="Ismingizni kiriting"
            />
            {errors.first_name && (
              <p className="text-sm text-destructive">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Familiya</Label>
            <Input
              id="last_name"
              {...register('last_name')}
              placeholder="Familiyangizni kiriting"
            />
            {errors.last_name && (
              <p className="text-sm text-destructive">{errors.last_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              {...register('username')}
              placeholder="Username kiriting"
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Profil rasmi</Label>
            {photoPreview && (
              <div className="mb-2">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
            )}
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />
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
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
