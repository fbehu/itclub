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
import { useAuth } from '@/contexts/AuthContext';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  photo?: string;
  direction?: string;
}

interface Room {
  id: number;
  name: string;
  room_number?: string;
  floor?: number;
  capacity?: number;
  is_active?: boolean;
}

interface Course {
  id: number;
  name: string;
  description: string;
  duration_months: number;
  monthly_price: string | number;
  monthly_discount_price: string | number;
}

interface Group {
  id: string;
  name: string;
  start_time: string;
  end_time?: string;
  class_days?: string[] | string;
  teacher?: string | Teacher;
  room?: { id: number; name: string; room_number?: string; floor?: number; };
  course?: { id: number; name: string; description: string; };
  telegram_link?: string;
}

interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  onSuccess: () => void;
}

export function EditGroupDialog({ open, onOpenChange, group, onSuccess }: EditGroupDialogProps) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
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

  // Set form data when group changes
  useEffect(() => {
    if (group && open) {
      console.log('Group data:', group); // Debug
      
      // Extract teacher ID
      let teacherId = '';
      if (typeof group.teacher === 'string') {
        teacherId = group.teacher;
      } else if (group.teacher?.id) {
        teacherId = group.teacher.id;
      }
      
      // Extract room ID
      let roomId = '';
      if (group.room?.id) {
        roomId = group.room.id.toString();
      }
      
      // Extract course ID
      let courseId = '';
      if (group.course?.id) {
        courseId = group.course.id.toString();
      }
      
      // Parse class days
      const classDays = Array.isArray(group.class_days) 
        ? group.class_days 
        : typeof group.class_days === 'string' 
          ? group.class_days.split(',').map(d => d.trim())
          : [];
      
      console.log('Setting form data:', {
        teacher_id: teacherId,
        room: roomId,
        course: courseId,
        class_days: classDays
      }); // Debug
      
      setFormData({
        name: group.name,
        start_time: group.start_time,
        end_time: group.end_time || '',
        class_days: classDays,
        teacher_id: teacherId,
        room: roomId,
        course: courseId,
        telegram_link: group.telegram_link || ''
      });
    }
  }, [group, open]);

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const response = await authFetch(`${API_ENDPOINTS.USERS_LIST}?role=teacher`);
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.results || data);
      }
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

    // Teacher role'da teacher_id required emas, admin uchun kerak
    if (!formData.name || !formData.start_time || formData.class_days.length === 0 || !formData.course) {
      toast.error('Barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    if (!isTeacher && !formData.teacher_id) {
      toast.error('O\'qituvchini tanlang');
      return;
    }

    try {
      setLoading(true);
      // normalize telegram link similar to creation to satisfy backend URLField
      let link: string | undefined = formData.telegram_link.trim();
      if (link) {
        if (!/^https?:\/\//i.test(link)) {
          if (link.startsWith('@')) {
            link = `https://t.me/${link.slice(1)}`;
          } else if (/^t\.me\//i.test(link)) {
            link = `https://${link}`;
          } else {
            link = `https://t.me/${link}`;
          }
        }
      }

      const response = await authFetch(API_ENDPOINTS.GROUP_DETAIL(group.id), {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          start_time: formData.start_time,
          end_time: formData.end_time,
          class_days: formData.class_days,
          ...(formData.teacher_id && { teacher: formData.teacher_id }),
          room: formData.room ? Number(formData.room) : null,
          course: Number(formData.course),
          telegram_link: link || undefined
        })
      });

      if (response.ok) {
        toast.success('Guruh tahrirlandi');
        onOpenChange(false);
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Guruhni tahrirlashda xatolik');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Guruhni tahrirlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // Find selected items from loaded lists OR use group data as fallback
  const selectedTeacher = teachers.find(t => t.id === formData.teacher_id) || 
    (typeof group.teacher === 'object' ? group.teacher : undefined);
  
  const selectedRoom = rooms.find(r => r.id.toString() === formData.room) || group.room;
  
  const selectedCourse = courses.find(c => c.id.toString() === formData.course) || group.course;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guruhni tahrirlash</DialogTitle>
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

          {!isTeacher && (
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
                  {teachers.map((teacher) => (
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
                          <span className="text-xs text-muted-foreground">{teacher.direction || teacher.username}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
              {loading ? 'Yuklanmoqda...' : 'Saqlash'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}