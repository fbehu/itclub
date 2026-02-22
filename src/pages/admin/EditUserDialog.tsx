import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/authFetch';
import { Upload, X } from 'lucide-react';

const studentSchema = z.object({
  first_name: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak').max(50),
  last_name: z.string().min(2, 'Familya kamida 2 ta belgidan iborat bo\'lishi kerak').max(50),
  username: z.string().min(3, 'Username kamida 3 ta belgidan iborat bo\'lishi kerak').max(30),
  phone_number: z.string().min(6, 'Telefon raqam kiriting'),
  tg_username: z.string().max(50).optional(),
  level: z.enum(['beginner', 'intermediate', 'expert']),
  group: z.string().optional(),
  social: z.enum(['instagram', 'telegram', 'facebook', 'friend', 'other']),
  father: z.string().optional(),
  mother: z.string().optional(),
  parent_phone_number: z.string().optional(),
  coins: z.number().min(0, 'Ballar 0 dan kam bo\'lmasligi kerak').optional(),
}).refine((data) => data.father || data.mother, {
  message: 'Kamida bitta ota-ona telefon raqami kiritilishi kerak',
  path: ['father'],
});

const teacherSchema = z.object({
  first_name: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak').max(50),
  last_name: z.string().min(2, 'Familya kamida 2 ta belgidan iborat bo\'lishi kerak').max(50),
  username: z.string().min(3, 'Username kamida 3 ta belgidan iborat bo\'lishi kerak').max(30),
  phone_number: z.string().min(6, 'Telefon raqam kiriting'),
  tg_username: z.string().max(50).optional(),
  level: z.enum(['beginner', 'intermediate', 'expert']).optional(),
  coins: z.number().min(0, 'Ballar 0 dan kam bo\'lmasligi kerak').optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;
type TeacherFormData = z.infer<typeof teacherSchema>;
type UserFormData = StudentFormData | TeacherFormData;

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: Partial<User>) => void;
}

interface Group {
  id: number;
  name: string;
  smena: string;
  start_time: string;
}

export default function EditUserDialog({ user, open, onOpenChange, onSave }: EditUserDialogProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const { toast } = useToast();

  const isStudent = user?.role === 'student';
  const schema = isStudent ? studentSchema : teacherSchema;

  const form = useForm<UserFormData>({
    resolver: zodResolver(schema),
  });

  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        const response = await authFetch('/groups/', {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          setGroups(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Guruhlarni yuklash xatosi:', error);
      } finally {
        setLoadingGroups(false);
      }
    };

    if (open) {
      fetchGroups();
    }
  }, [open]);

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      const baseData = {
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        phone_number: user.phone_number,
        tg_username: user.tg_username || '',
        level: (user.level || 'beginner') as 'beginner' | 'intermediate' | 'expert',
        coins: user.coins || 0,
      };

      if (isStudent) {
        // Parse parent phones from API response
        let fatherPhone = '';
        let motherPhone = '';
        
        if (user.parent_phone_number) {
          if (typeof user.parent_phone_number === 'object') {
            fatherPhone = user.parent_phone_number.father || '';
            motherPhone = user.parent_phone_number.mother || '';
          } else if (typeof user.parent_phone_number === 'string') {
            try {
              const parsed = JSON.parse(user.parent_phone_number);
              fatherPhone = parsed.father || '';
              motherPhone = parsed.mother || '';
            } catch (e) {
              console.error('Failed to parse parent_phone_number:', e);
            }
          }
        }

        // Handle group - can be object or string
        let groupId = '';
        if (user.group) {
          if (typeof user.group === 'object' && user.group.id) {
            groupId = user.group.id.toString();
          } else if (typeof user.group === 'string' || typeof user.group === 'number') {
            groupId = user.group.toString();
          }
        }

        form.reset({
          ...baseData,
          group: groupId,
          social: (user.social || 'instagram') as 'instagram' | 'telegram' | 'facebook' | 'friend' | 'other',
          father: fatherPhone,
          mother: motherPhone,
        } as StudentFormData);
      } else {
        form.reset(baseData as TeacherFormData);
      }
      
      setPhotoFile(null);
    }
  }, [user, isStudent, form]);

  const photoPreviewUrl = photoFile
    ? URL.createObjectURL(photoFile)
    : user?.photo || null;

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    const input = document.getElementById('edit-photo') as HTMLInputElement;
    if (input) input.value = '';
  };

  const onSubmit = async (data: UserFormData) => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Common fields
      formData.append('first_name', data.first_name);
      formData.append('last_name', data.last_name);
      formData.append('username', data.username);
      formData.append('phone_number', data.phone_number);
      formData.append('tg_username', data.tg_username || '');
      
      if (data.level) {
        formData.append('level', data.level);
      }
      
      if (data.coins !== undefined) {
        formData.append('coins', String(data.coins));
      }

      // Student specific fields
      if (isStudent) {
        const studentData = data as StudentFormData;
        formData.append('group', studentData.group);
        formData.append('social', studentData.social);
        
        // Build parent_phone_number object
        const parentPhones: { father?: string; mother?: string } = {};
        if (studentData.father) {
          parentPhones.father = studentData.father;
        }
        if (studentData.mother) {
          parentPhones.mother = studentData.mother;
        }
        
        formData.append('parent_phone_number', JSON.stringify(parentPhones));
      }

      // Photo
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const response = await authFetch(`/users/${user.id}/`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Show field-specific errors
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
        
        throw new Error(
          errorData.message || errorData.detail || 'Foydalanuvchini yangilashda xatolik'
        );
      }

      const updatedUser = await response.json();
      onSave(user.id, updatedUser);

      toast({
        title: 'Muvaffaqiyatli',
        description: 'Foydalanuvchi ma\'lumotlari yangilandi',
      });

      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Xatolik:')) {
        toast({
          title: 'Xato',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const selectedGroupId = form.watch('group');
  const selectedGroup = groups.find(g => g.id.toString() === selectedGroupId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {user.first_name} {user.last_name} ma'lumotlarini tahrirlash
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Photo Section */}
          <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex-shrink-0">
              {photoPreviewUrl ? (
                <div className="relative">
                  <img
                    src={photoPreviewUrl}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-border"
                  />
                  {photoFile && (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={handleRemovePhoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-2">
              <Label htmlFor="edit-photo">Foydalanuvchi rasmi</Label>
              <Input
                id="edit-photo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPhotoFile(file);
                    toast({
                      title: 'Rasm tanlandi',
                      description: file.name,
                    });
                  }
                }}
              />
              {photoFile && (
                <p className="text-sm text-green-600">✓ Yangi rasm: {photoFile.name}</p>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Asosiy ma'lumotlar</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-first_name">Ism *</Label>
                <Input id="edit-first_name" {...form.register('first_name')} />
                {form.formState.errors.first_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-last_name">Familya *</Label>
                <Input id="edit-last_name" {...form.register('last_name')} />
                {form.formState.errors.last_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.last_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-username">Username *</Label>
                <Input id="edit-username" {...form.register('username')} />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefon raqami *</Label>
                <Input id="edit-phone" placeholder="+998901234567" {...form.register('phone_number')} />
                {form.formState.errors.phone_number && (
                  <p className="text-sm text-destructive">{form.formState.errors.phone_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tg">Telegram username</Label>
                <Input id="edit-tg" placeholder="@username" {...form.register('tg_username')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-level">Level *</Label>
                <Select
                  value={form.watch('level') || ''}
                  onValueChange={(value) => form.setValue('level', value as any)}
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
                <Label htmlFor="edit-coins">Ballar (Coins)</Label>
                <Input 
                  id="edit-coins" 
                  type="number" 
                  min="0"
                  placeholder="0" 
                  {...form.register('coins', { valueAsNumber: true })} 
                />
                {form.formState.errors.coins && (
                  <p className="text-sm text-destructive">{form.formState.errors.coins.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Student Specific Fields */}
          {isStudent && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">O'quvchi ma'lumotlari</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-group">Guruh *</Label>
                  <Select
                    value={selectedGroupId || ''}
                    onValueChange={(value) => {
                      form.setValue('group', value, { shouldValidate: true });
                    }}
                    disabled={loadingGroups}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingGroups ? "Yuklanmoqda..." : "Guruhni tanlang"} />
                    </SelectTrigger>
                    <SelectContent>
                      {groups && groups.length > 0 ? (
                        groups.map((group) => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name} ({group.smena}, {group.start_time})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">
                          {loadingGroups ? 'Yuklanmoqda...' : 'Guruhlar topilmadi'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedGroup && (
                    <p className="text-sm text-blue-600">
                      ✓ {selectedGroup.name} ({selectedGroup.smena}, {selectedGroup.start_time})
                    </p>
                  )}
                  {(form.formState.errors as any).group && (
                    <p className="text-sm text-destructive">{(form.formState.errors as any).group?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-social">Qayerdan eshitgan *</Label>
                  <Select
                    value={form.watch('social' as any) || ''}
                    onValueChange={(value) => form.setValue('social' as any, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Social tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="telegram">Telegram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="friend">Do'st orqali</SelectItem>
                      <SelectItem value="other">Boshqa</SelectItem>
                    </SelectContent>
                  </Select>
                  {(form.formState.errors as any).social && (
                    <p className="text-sm text-destructive">{(form.formState.errors as any).social?.message}</p>
                  )}
                </div>
              </div>

              {/* Parent Phones - New Design */}
              <div className="space-y-3">
                <Label>Ota-Ona telefon raqamlari *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg border-2 border-dashed">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <Label htmlFor="edit-father-phone" className="text-sm font-normal">
                        Otasining telefoni
                      </Label>
                    </div>
                    <Input 
                      id="edit-father-phone" 
                      placeholder="+998901234567"
                      {...form.register('father' as any)} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                      <Label htmlFor="edit-mother-phone" className="text-sm font-normal">
                        Onasining telefoni
                      </Label>
                    </div>
                    <Input 
                      id="edit-mother-phone" 
                      placeholder="+998901234567"
                      {...form.register('mother' as any)} 
                    />
                  </div>
                </div>
                {(form.formState.errors as any).father && (
                  <p className="text-sm text-destructive">{(form.formState.errors as any).father?.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  💡 Kamida bitta telefon raqam kiritilishi shart
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}