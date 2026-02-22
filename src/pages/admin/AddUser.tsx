import { useState, useEffect } from 'react';
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
import { ArrowLeft, Check, X, Loader } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';

const studentSchema = z.object({
  first_name: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak').max(50),
  last_name: z.string().min(2, 'Familya kamida 2 ta belgidan iborat bo\'lishi kerak').max(50),
  username: z.string().min(3, 'Username kamida 3 ta belgidan iborat bo\'lishi kerak').max(30),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak').max(100),
  phone_number: z.string().min(6, 'Telefon raqam kiriting'),
  tg_username: z.string().max(50).optional(),
  role: z.literal('student'),
  level: z.enum(['beginner', 'intermediate', 'expert'], { required_error: 'Level tanlang' }),
  group: z.string().optional(),
  social: z.enum(['instagram', 'telegram', 'facebook', 'friend', 'other'], { required_error: 'Social tanlang' }),
  invite_code: z.string().max(30).optional(),
  father: z.string().max(50).optional(),
  mother: z.string().max(50).optional(),
}).refine(
  (data) => data.father || data.mother,
  {
    message: 'Kamida bitta ota-ona telefon raqami kerak',
    path: ['father'],
  }
);

const teacherSchema = z.object({
  first_name: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak').max(50),
  last_name: z.string().min(2, 'Familya kamida 2 ta belgidan iborat bo\'lishi kerak').max(50),
  username: z.string().min(3, 'Username kamida 3 ta belgidan iborat bo\'lishi kerak').max(30),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak').max(100),
  phone_number: z.string().min(6, 'Telefon raqam kiriting'),
  tg_username: z.string().max(50).optional(),
  role: z.literal('teacher'),
  level: z.enum(['beginner', 'intermediate', 'expert']).optional(),
  group: z.string().optional(),
  social: z.string().optional(),
  invite_code: z.string().optional(),
  parent_type: z.string().optional(),
  parent_phone_number: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;
type TeacherFormData = z.infer<typeof teacherSchema>;
type UserFormData = StudentFormData | TeacherFormData;

interface Group {
  id: number;
  name: string;
  smena: string;
  start_time: string;
}

interface ReferrerInfo {
  id: string;
  username: string;
  full_name: string;
  photo: string | null;
}

export default function AddUser() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | undefined>(undefined);
  const [inviteCode, setInviteCode] = useState('');
  const [codeValidation, setCodeValidation] = useState<{ valid: boolean; message: string } | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo | null>(null);

  const form = useForm<UserFormData>({
    resolver: selectedRole === 'student' ? zodResolver(studentSchema) : selectedRole === 'teacher' ? zodResolver(teacherSchema) : zodResolver(studentSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      password: '',
      phone_number: '',
      tg_username: '',
      role: selectedRole,
      level: undefined,
      group: '',
      social: undefined,
      invite_code: '',
      parent_type: undefined,
      parent_phone_number: '',
    },
  });

  // Fetch groups on component mount
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
        } else {
          toast({
            title: 'Xato',
            description: 'Guruhlarni yuklashda xatolik',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Guruhlarni yuklash xatosi:', error);
        toast({
          title: 'Xato',
          description: 'Guruhlarni yuklashda xatolik',
          variant: 'destructive',
        });
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, [toast]);

  const validateInviteCode = async () => {
    if (!inviteCode.trim()) {
      setCodeValidation(null);
      setReferrerInfo(null);
      form.setValue('invite_code', '');
      return;
    }

    setValidatingCode(true);
    try {
      const response = await authFetch(API_ENDPOINTS.REFERRAL_VALIDATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: inviteCode.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code_valid && data.referrer) {
          setCodeValidation({ valid: true, message: '✅ Promokod to\'g\'ri!' });
          setReferrerInfo(data.referrer);
          form.setValue('invite_code', inviteCode.trim());
        } else {
          setCodeValidation({ valid: false, message: data.error || 'Promokod topilmadi' });
          setReferrerInfo(null);
          form.setValue('invite_code', '');
        }
      } else {
        const error = await response.json().catch(() => ({}));
        setCodeValidation({ 
          valid: false, 
          message: error.error || error.detail || 'Promokod topilmadi yoki xato' 
        });
        setReferrerInfo(null);
        form.setValue('invite_code', '');
      }
    } catch (error) {
      console.error('Promokodni tekshirishda xatolik:', error);
      setCodeValidation({ 
        valid: false, 
        message: 'Tekshirishda xatolik yuz berdi' 
      });
      setReferrerInfo(null);
      form.setValue('invite_code', '');
    } finally {
      setValidatingCode(false);
    }
  };

  const handleInviteCodeChange = (value: string) => {
    setInviteCode(value);
    setCodeValidation(null);
  };

  const handleInviteCodeClear = () => {
    setInviteCode('');
    setCodeValidation(null);
    setReferrerInfo(null);
    form.setValue('invite_code', '');
  };

  const handleRoleChange = (value: 'student' | 'teacher') => {
    setSelectedRole(value);
    form.setValue('role', value as any);
    // Reset conditional fields when role changes
    if (value === 'teacher') {
      form.setValue('level', undefined);
      form.setValue('group', '');
      form.setValue('social', undefined);
      form.setValue('invite_code', '');
      form.setValue('parent_type', undefined);
      form.setValue('parent_phone_number', '');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      toast({
        title: 'Muvaffaqiyatli',
        description: `Fayl tanlandi: ${file.name}`,
      });
    }
  };

  const onSubmit = async (data: UserFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('username', data.username);
      formData.append('first_name', data.first_name);
      formData.append('last_name', data.last_name);
      formData.append('phone_number', data.phone_number);
      formData.append('tg_username', data.tg_username || '');
      formData.append('role', data.role);
      formData.append('password', data.password);
      
      if (data.level) {
        formData.append('level', data.level);
      }

      // Only add conditional fields for students
      if (data.role === 'student') {
        formData.append('group', (data as StudentFormData).group);
        formData.append('social', (data as StudentFormData).social);
        
        // Only add invite_code if validated
        if (codeValidation?.valid && inviteCode.trim()) {
          formData.append('invite_code', inviteCode.trim());
        }
        
        const parentPhoneData: Record<string, string> = {};
        if ((data as StudentFormData).father) {
          parentPhoneData['father'] = (data as StudentFormData).father;
        }
        if ((data as StudentFormData).mother) {
          parentPhoneData['mother'] = (data as StudentFormData).mother;
        }
        
        formData.append('parent_phone_number', JSON.stringify(parentPhoneData));
      }
      
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
        setIsSubmitting(false);
        return;
      }

      toast({
        title: 'Muvaffaqiyatli',
        description: 'Foydalanuvchi qo\'shildi',
      });

      // Reset form va promokod qismini
      setInviteCode('');
      setCodeValidation(null);
      navigate('/dashboard/admin/users');
    } catch (error) {
      toast({
        title: 'Xato',
        description: error instanceof Error ? error.message : 'Foydalanuvchi qo\'shishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  const selectedCourseId = form.watch('group');
  const selectedGroup = groups.find(g => g.id.toString() === selectedCourseId);

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
          <h1 className="text-2xl font-bold text-foreground">Foydalanuvchi qo'shish</h1>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol *</Label>
                  <Select
                    value={selectedRole || ''}
                    onValueChange={(value) => handleRoleChange(value as 'student' | 'teacher')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rolni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">O'quvchi (Student)</SelectItem>
                      <SelectItem value="teacher">O'qituvchi (Teacher)</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.role && (
                    <p className="text-sm text-destructive">{form.formState.errors.role?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level *</Label>
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
                    <p className="text-sm text-destructive">{form.formState.errors.level?.message}</p>
                  )}
                </div>

                {/* Student only fields */}
                {selectedRole === 'student' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="group">Guruh *</Label>
                      <Select
                        value={selectedCourseId || ''}
                        onValueChange={(value) => {
                          form.setValue('group', value, { shouldValidate: true });
                        }}
                        disabled={loadingGroups}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingGroups ? "Guruhlar yuklanmoqda..." : "Guruhni tanlang"} />
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
                          ✓ Tanlangan: {selectedGroup.name} ({selectedGroup.smena}, {selectedGroup.start_time})
                        </p>
                      )}
                      {form.formState.errors.group && (
                        <p className="text-sm text-destructive">{form.formState.errors.group?.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="social">Social *</Label>
                      <Select
                        value={form.watch('social') || ''}
                        onValueChange={(value) => form.setValue('social', value as any)}
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
                      {form.formState.errors.social && (
                        <p className="text-sm text-destructive">{form.formState.errors.social?.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invite_code">Promokod (ixtiyoriy)</Label>
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              id="invite_code"
                              placeholder='PROMO30'
                              value={inviteCode}
                              onChange={(e) => handleInviteCodeChange(e.target.value)}
                              className={codeValidation ? (codeValidation.valid ? 'border-green-500' : 'border-red-500') : ''}
                            />
                            <Button
                              type="button"
                              disabled={!inviteCode.trim() || validatingCode}
                              onClick={validateInviteCode}
                              className="px-4"
                            >
                              {validatingCode ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                'Tekshir'
                              )}
                            </Button>
                            {inviteCode && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleInviteCodeClear}
                                className="px-3"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          {codeValidation && (
                            <div className={`text-sm flex items-center gap-1 ${codeValidation.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {codeValidation.valid ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                              {codeValidation.message}
                            </div>
                          )}
                          {referrerInfo && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-semibold">👤 Promokod Egasi:</p>
                              <div className="flex items-center gap-3">
                                {referrerInfo.photo ? (
                                  <img 
                                    src={referrerInfo.photo} 
                                    alt={referrerInfo.full_name}
                                    className="w-10 h-10 rounded-full object-cover border border-blue-300"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                    {referrerInfo.full_name.charAt(0)}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{referrerInfo.full_name}</p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">@{referrerInfo.username}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label>Ota-Ona telefon raqamlari *</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg border-2 border-dashed">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <Label htmlFor="father_phone" className="text-sm font-normal">
                              Otasining telefoni
                            </Label>
                          </div>
                          <Input 
                            id="father" 
                            placeholder="+998901234567"
                            {...form.register('father')} 
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                            <Label htmlFor="mother_phone" className="text-sm font-normal">
                              Onasining telefoni
                            </Label>
                          </div>
                          <Input 
                            id="mother" 
                            placeholder="+998901234567"
                            {...form.register('mother')} 
                          />
                        </div>
                      </div>
                      {selectedRole === 'student' && (form.formState.errors as any).father && (
                        <p className="text-sm text-destructive">{((form.formState.errors as any).father?.message)}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        💡 Kamida bitta telefon raqam kiritilishi shart
                      </p>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="photo">Rasm qo'shish</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  {photoFile && (
                    <p className="text-sm text-green-600">✓ Fayl tanlandi: {photoFile.name}</p>
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
                <Button type="submit" disabled={isSubmitting || !selectedRole || (inviteCode.trim() && !codeValidation?.valid)}>
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