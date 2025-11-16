import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import QRScanner from '@/components/QRScanner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';

const userSchema = z.object({
  first_name: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak').max(50, 'Ism 50 ta belgidan oshmasligi kerak'),
  last_name: z.string().min(2, 'Familya kamida 2 ta belgidan iborat bo\'lishi kerak').max(50, 'Familya 50 ta belgidan oshmasligi kerak'),
  username: z.string().min(3, 'Username kamida 3 ta belgidan iborat bo\'lishi kerak').max(30, 'Username 30 ta belgidan oshmasligi kerak'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak').max(100),
  phone_number: z.string().min(6, 'Telefon raqam kiriting'),
  tg_username: z.string().max(50).optional(),
  level: z.enum(['beginner', 'intermediate', 'expert'], { required_error: 'Level tanlang' }),
  course: z.string().min(1, 'Kurs tanlang'),
  direction: z.string().min(2, 'Yo\'nalish kamida 2 ta belgidan iborat bo\'lishi kerak').max(100),
  uuid: z.string().regex(/^ITC\d{3}$/, 'UUID Topilmadi)'),
});

type UserFormData = z.infer<typeof userSchema>;

export default function AddUser() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      password: '',
      phone_number: '',
      tg_username: '',
      level: undefined,
      course: '',
      direction: '',
      uuid: '',
    },
  });

  const handleQRScan = (decodedText: string) => {
    form.setValue('uuid', decodedText);
    toast({
      title: 'QR kod muvaffaqiyatli skanerlandi',
      description: `UUID: ${decodedText}`,
    });
  };

  const onSubmit = async (data: UserFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('username', data.username);
      formData.append('first_name', data.first_name);
      formData.append('last_name', data.last_name);
      formData.append('uuid', data.uuid);
      formData.append('phone_number', data.phone_number);
      formData.append('tg_username', data.tg_username || '');
      formData.append('level', data.level);
      formData.append('course', data.course);
      formData.append('direction', data.direction);
      formData.append('password', data.password);
      
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const response = await authFetch(API_ENDPOINTS.ADD_USER, {
        method: 'POST',
        headers: {},
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Field-level xatoliklarni toast qilamiz
        Object.entries(errorData).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            messages.forEach((msg) => {
              toast({
                title: `Xatolik: ${field}`,
                description: msg as string,
                variant: 'destructive',
              });
            });
          }
        });

        // Xatolikdan keyin isSubmitting = false qilinadi
        setIsSubmitting(false);
        return; // throw qilmaymiz, shunda form yana ishlaydi
      }

      toast({
        title: 'Muvaffaqiyatli',
        description: 'Yangi foydalanuvchi qo\'shildi',
      });

      navigate('/dashboard/admin/users');

    } catch (error) {
      toast({
        title: 'Xato',
        description: error instanceof Error ? error.message : 'Foydalanuvchi qo\'shishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false); // Xatolik bo‘lsa ham tugmani tiklaymiz
    }
  };


  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/admin/users')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Yangi foydalanuvchi qo'shish</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Foydalanuvchi ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Ism *</Label>
                  <Input
                    id="first_name"
                    {...form.register('first_name')}
                  />
                  {form.formState.errors.first_name && (
                    <p className="text-sm text-destructive">{form.formState.errors.first_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Familya *</Label>
                  <Input
                    id="last_name"
                    {...form.register('last_name')}
                  />
                  {form.formState.errors.last_name && (
                    <p className="text-sm text-destructive">{form.formState.errors.last_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    {...form.register('username')}
                  />
                  {form.formState.errors.username && (
                    <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Parol *</Label>
                  <Input
                    id="password"
                    type="password"
                    {...form.register('password')}
                    placeholder="Kamida 6 ta belgi"
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Telefon raqami *</Label>
                  <Input
                    id="phone_number"
                    placeholder="+998901234567"
                    {...form.register('phone_number')}
                  />
                  {form.formState.errors.phone_number && (
                    <p className="text-sm text-destructive">{form.formState.errors.phone_number.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tg_username">Telegram username</Label>
                  <Input
                    id="tg_username"
                    placeholder="@username"
                    {...form.register('tg_username')}
                  />
                  {form.formState.errors.tg_username && (
                    <p className="text-sm text-destructive">{form.formState.errors.tg_username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level *</Label>
                  <Select
                    value={form.watch('level')}
                    onValueChange={(value) => form.setValue('level', value as 'beginner' | 'intermediate' | 'expert')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Level tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Boshlang'ich (Yashil)</SelectItem>
                      <SelectItem value="intermediate">O'rta (Sariq)</SelectItem>
                      <SelectItem value="expert">Yuksak (Qizil)</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.level && (
                    <p className="text-sm text-destructive">{form.formState.errors.level.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">Kurs *</Label>
                  <Select
                    value={form.watch('course')}
                    onValueChange={(value) => form.setValue('course', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kurs tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kurs-1">Kurs 1</SelectItem>
                      <SelectItem value="kurs-2">Kurs 2</SelectItem>
                      <SelectItem value="kurs-3">Kurs 3</SelectItem>
                      <SelectItem value="kurs-4">Kurs 4</SelectItem>
                      <SelectItem value="kurs-5">Kurs 5</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.course && (
                    <p className="text-sm text-destructive">{form.formState.errors.course.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direction">Yo'nalish *</Label>
                  <Input
                    id="direction"
                    placeholder="Masalan: Dasturiy injinering"
                    {...form.register('direction')}
                  />
                  {form.formState.errors.direction && (
                    <p className="text-sm text-destructive">{form.formState.errors.direction.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uuid">UUID (QR kod orqali) *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="uuid"
                      {...form.register('uuid')}
                      placeholder="QR kod skanerlang"
                      readOnly
                    />
                    <QRScanner onScanSuccess={handleQRScan} />
                  </div>
                  {form.formState.errors.uuid && (
                    <p className="text-sm text-destructive">{form.formState.errors.uuid.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Foydalanuvchi rasmi</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhotoFile(file);
                      }
                    }}
                  />
                  {photoFile && (
                    <p className="text-sm text-muted-foreground">
                      Tanlangan: {photoFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/admin/users')}
                >
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
