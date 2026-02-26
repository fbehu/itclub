import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  photo?: string;
  role?: string; // ✅ Added role field
}

interface Room {
  id: number;
  name: string;
  room_number?: string;
  floor?: number;
  capacity?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Course {
  id: number;
  name: string;
  description: string;
  duration_months: number;
  monthly_price: string | number;
  monthly_discount_price: string | number;
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateGroupDialog({ open, onOpenChange, onSuccess }: CreateGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    class_days: [] as string[],
    teacher_id: '',
    sub_teacher_ids: [] as string[], // ✅ Added sub_teachers
    room: '',
    course: '',
    telegram_link: ''
  });

  useEffect(() => {
    if (open) {
      loadTeachers();
      loadRooms();
      loadCourses();
    }
  }, [open]);

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      // Load both teacher and sub_teacher roles separately
      const [teachersRes, subTeachersRes] = await Promise.all([
        authFetch(`${API_ENDPOINTS.USERS_LIST}?role=teacher`),
        authFetch(`${API_ENDPOINTS.USERS_LIST}?role=sub_teacher`)
      ]);

      const teachersData: Teacher[] = [];
      
      if (teachersRes.ok) {
        const data = await teachersRes.json();
        const teachers = data.results || data;
        teachersData.push(...(Array.isArray(teachers) ? teachers : []));
      }
      
      if (subTeachersRes.ok) {
        const data = await subTeachersRes.json();
        const subTeachers = data.results || data;
        teachersData.push(...(Array.isArray(subTeachers) ? subTeachers : []));
      }
      
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error('O\'qituvchilarni yuklashda xatolik');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await authFetch(API_ENDPOINTS.ROOMS);
      if (response.ok) {
        const data = await response.json();
        const roomsList = data.results || data;
        console.log('Loaded rooms:', roomsList); // Debug
        setRooms(roomsList);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      toast.error('Xonalarni yuklashda xatolik');
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await authFetch('/courses/');
      if (response.ok) {
        const data = await response.json();
        const coursesList = Array.isArray(data) ? data : data.results || [];
        console.log('Loaded courses:', coursesList); // Debug
        setCourses(coursesList);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Kurslarni yuklashda xatolik');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.start_time || !formData.teacher_id || formData.class_days.length === 0 || !formData.course) {
      toast.error('Barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    try {
      setLoading(true);
      // normalize telegram link so backend URL validation passes
      let link: string | undefined = formData.telegram_link.trim();
      if (link) {
        if (!/^https?:\/\//i.test(link)) {
          // if user supplied @username or just the handle, prefix with t.me
          if (link.startsWith('@')) {
            link = `https://t.me/${link.slice(1)}`;
          } else if (/^t\.me\//i.test(link)) {
            link = `https://${link}`;
          } else {
            link = `https://t.me/${link}`;
          }
        }
      }

      const response = await authFetch(API_ENDPOINTS.GROUPS, {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          start_time: formData.start_time,
          end_time: formData.end_time,
          class_days: formData.class_days,
          teacher: formData.teacher_id,
          sub_teachers: formData.sub_teacher_ids, // ✅ Added sub_teachers
          room: formData.room ? Number(formData.room) : undefined,
          course: Number(formData.course),
          telegram_link: link || undefined
        })
      });

      if (response.ok) {
        toast.success('Guruh yaratildi');
        setFormData({ name: '', start_time: '', end_time: '', class_days: [], teacher_id: '', sub_teacher_ids: [], room: '', course: '', telegram_link: '' });
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

  const selectedTeacher = teachers.find(t => t.id === formData.teacher_id);
  const selectedRoom = rooms.find(r => r.id.toString() === formData.room);
  const selectedCourse = courses.find(c => c.id.toString() === formData.course);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
            <Label htmlFor="course">Kurs *</Label>
            <Select 
              value={formData.course} 
              onValueChange={(value) => {
                console.log('Selected course ID:', value); // Debug
                setFormData(prev => ({ ...prev, course: value }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCourses ? "Yuklanmoqda..." : "Kursni tanlang"}>
                  {selectedCourse ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedCourse.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Kursni tanlang</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{course.name}</span>
                      {course.description && (
                        <span className="text-xs text-muted-foreground">
                          {course.description.substring(0, 40)}...
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">O'qituvchi *</Label>
            <Select 
              value={formData.teacher_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, teacher_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTeachers ? "Yuklanmoqda..." : "O'qituvchini tanlang"}>
                  {selectedTeacher ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={selectedTeacher.photo || undefined} />
                        <AvatarFallback className="text-xs">
                          {(selectedTeacher.first_name || '')[0]}{(selectedTeacher.last_name || '')[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{selectedTeacher.first_name || ''} {selectedTeacher.last_name || ''}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">O'qituvchini tanlang</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {teachers.filter(teacher => teacher.role === 'teacher').map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={teacher.photo || undefined} />
                        <AvatarFallback className="text-xs">
                          {(teacher.first_name || '')[0]}{(teacher.last_name || '')[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span>{teacher.first_name || ''} {teacher.last_name || ''}</span>
                        <span className="text-xs text-muted-foreground">{teacher.username}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room">Xona</Label>
            <Select 
              value={formData.room || "none"} 
              onValueChange={(value) => {
                console.log('Selected room ID:', value); // Debug
                setFormData(prev => ({ ...prev, room: value === "none" ? "" : value }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingRooms ? "Yuklanmoqda..." : "Xonani tanlang"}>
                  {selectedRoom ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedRoom.name}</span>
                      {selectedRoom.floor && (
                        <span className="text-xs text-muted-foreground">
                          ({selectedRoom.floor}-qavat)
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Xonani tanlang</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Belgilanmagan</span>
                </SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{room.name}</span>
                      {room.floor && (
                        <span className="text-xs text-muted-foreground">
                          ({room.floor}-qavat, {room.capacity} o'rin)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Yordamchi O'qituvchilar</Label>
            <div className="space-y-2 border rounded-lg p-3 max-h-48 overflow-y-auto">
              {teachers.filter(teacher => teacher.role === 'sub_teacher').length === 0 ? (
                <p className="text-xs text-muted-foreground">Yordamchi o'qituvchilar topilmadi</p>
              ) : (
                teachers.filter(teacher => teacher.role === 'sub_teacher').map((teacher) => (
                  <div key={teacher.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`sub_teacher_${teacher.id}`}
                      checked={formData.sub_teacher_ids.includes(teacher.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            sub_teacher_ids: [...prev.sub_teacher_ids, teacher.id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            sub_teacher_ids: prev.sub_teacher_ids.filter(id => id !== teacher.id)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`sub_teacher_${teacher.id}`} className="font-normal cursor-pointer flex items-center gap-2 flex-1">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={teacher.photo || undefined} />
                        <AvatarFallback className="text-xs">
                          {(teacher.first_name || '')[0]}{(teacher.last_name || '')[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{teacher.first_name} {teacher.last_name}</span>
                    </Label>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tanlangan: {formData.sub_teacher_ids.length}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Dars kunlari *</Label>
            <div className="space-y-2 border rounded-lg p-3">
              {[
                { value: 'Du', label: 'Dushanba' },
                { value: 'Se', label: 'Seshanba' },
                { value: 'Chor', label: 'Chorshanba' },
                { value: 'Pa', label: 'Payshanba' },
                { value: 'Ju', label: 'Juma' },
                { value: 'Sha', label: 'Shanba' }
              ].map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={day.value}
                    checked={formData.class_days.includes(day.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData(prev => ({
                          ...prev,
                          class_days: [...prev.class_days, day.value]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          class_days: prev.class_days.filter(d => d !== day.value)
                        }));
                      }
                    }}
                  />
                  <Label htmlFor={day.value} className="font-normal cursor-pointer">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start_time">Boshlanish vaqti *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, start_time: value }));
                }}
              />
              <p className="text-xs text-muted-foreground">24 soatlik format</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Tugash vaqti</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, end_time: value }));
                }}
              />
              <p className="text-xs text-muted-foreground">24 soatlik format</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telegram_link">Telegram Guruh Havolasi</Label>
              <Input
                id="telegram_link"
                type="text"
                placeholder="https://t.me/yourgroup yoki @yourgroup"
                value={formData.telegram_link}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, telegram_link: value }));
                }}
              />
            </div>
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