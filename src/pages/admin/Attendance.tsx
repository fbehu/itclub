import { useState, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, Calendar, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import DashboardLayout from '@/components/DashboardLayout';

interface Group {
  id: number;
  name: string;
  smena?: string;
  start_time?: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone_number?: string;
  level?: string;
  coins?: number;
  photo?: string;
  attendance_status?: 'present' | 'absent' | 'excuse' | null;
  attendance_reason?: string | null;
  attendance_coins?: number | null;
}

interface AttendanceResponse {
  count: number;
  date: string;
  is_locked: boolean;
  can_edit: boolean;
  students: Student[];
}

interface BatchAttendanceResponse {
  success: Array<{
    student_id: string;
    username: string;
    status: string;
    coins_added: number;
    attendance_id: number;
  }>;
  errors: Array<{
    student_id: string;
    error: string;
  }>;
  total_coins_added: number;
}

type AttendanceStatus = 'present' | 'absent' | 'excuse' | null;

export default function AdminAttendance() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [dailyCoins, setDailyCoins] = useState<Record<string, number>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      const group = groups.find(g => g.id.toString() === selectedGroupId);
      setSelectedGroup(group || null);
      loadAttendanceData(selectedGroupId, selectedDate);
    } else {
      setSelectedGroup(null);
      setStudents([]);
      setAttendance({});
      setDailyCoins({});
      setReasons({});
    }
  }, [selectedGroupId, selectedDate, groups]);

  const loadGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await authFetch(API_ENDPOINTS.GROUPS);
      const data = await response.json();
      setGroups(data.results || data);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Guruhlarni yuklashda xatolik');
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadAttendanceData = async (groupId: string, date: string) => {
    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.ATTENDANCE_BY_GROUP(groupId, date));
      
      if (response.ok) {
        const data: AttendanceResponse = await response.json();
        setStudents(data.students);
        setIsLocked(data.is_locked);
        setCanEdit(data.can_edit);
        
        // Populate attendance from response
        const attendanceMap: Record<string, AttendanceStatus | null> = {};
        const coinsMap: Record<string, number> = {};
        const reasonsMap: Record<string, string> = {};
        data.students.forEach(student => {
          if (student.attendance_status) {
            attendanceMap[student.id] = student.attendance_status;
          } else {
            // Agar davomat qilinmagan bo'lsa null saqla
            attendanceMap[student.id] = null;
          }
          // O'sha kungi olgan ballni ko'rsatish (response dan keladi)
          coinsMap[student.id] = student.attendance_coins || 0;
          // Sababli bo'lgan o'quvchining sababini ko'rsatish
          reasonsMap[student.id] = student.attendance_reason || '';
        });
        setAttendance(attendanceMap);
        setDailyCoins(coinsMap);
        setReasons(reasonsMap);
      } else {
        const error = await response.json();
        
        // Agar orqa sana bo'yicha davomat qilish mumkin bo'lmasa
        if (error.non_field_errors && error.non_field_errors.length > 0) {
          toast.error(error.non_field_errors[0]);
          setIsLocked(true);
          setCanEdit(false);
        } else {
          toast.error(error.detail || 'Davomatni yuklashda xatolik');
        }
        
        setStudents([]);
        setAttendance({});
        setDailyCoins({});
        setReasons({});
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast.error('Davomatni yuklashda xatolik');
      setStudents([]);
      setAttendance({});
      setDailyCoins({});
      setReasons({});
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedGroupId) {
      toast.error('Guruhni tanlang');
      return;
    }

    try {
      setSaving(true);
      
      // Batch request format - barcha studentlarni bir vaqtada yuborish
      const batchPayload = {
        group_id: parseInt(selectedGroupId),
        date: selectedDate,
        students: Object.entries(attendance).map(([userId, status]) => ({
          id: userId,
          status: status,
          reason: status === 'excuse' ? reasons[userId] || null : null,
          coins: dailyCoins[userId] || 0  // O'sha kuni kiritilgan ballni yuborish
        }))
      };

      const response = await authFetch(API_ENDPOINTS.ATTENDANCE, {
        method: 'POST',
        body: JSON.stringify(batchPayload)
      });

      if (!response.ok) {
        const error = await response.json();
        
        // API xatosi - orqa sana bo'yicha davomat qilish mumkin emas
        if (error.non_field_errors && error.non_field_errors.length > 0) {
          throw new Error(error.non_field_errors[0]);
        }
        
        throw new Error(error.detail || 'Davomatni saqlashda xatolik');
      }

      const result: BatchAttendanceResponse = await response.json();
      
      // Agar xatolar bo'lsa, ularni ko'rsatish
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
          toast.error(`${error.student_id}: ${error.error}`);
        });
      }
      
      // Muvaffaqiyatli saqlangan recordlarni ko'rsatish
      if (result.success && result.success.length > 0) {
        toast.success(
          `${result.success.length} ta o'quvchi saqlandi. Jami ${result.total_coins_added} ball qo'shildi 🪙`
        );
      }

      // Reload attendance data to update is_locked and can_edit
      loadAttendanceData(selectedGroupId, selectedDate);
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error(error instanceof Error ? error.message : 'Davomatni saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    if (isLocked || !canEdit) return;
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
    
    // Agar "Kelmadi" (absent) bo'lsa, ball avtomatik 0 bo'lsin
    if (status === 'absent') {
      setDailyCoins(prev => ({
        ...prev,
        [studentId]: 0
      }));
    }
  };

  // Mark all students as present
  const markAllPresent = () => {
    if (isLocked || !canEdit) return;
    const newAttendance: Record<string, AttendanceStatus> = {};
    students.forEach(student => {
      newAttendance[student.id] = 'present';
    });
    setAttendance(newAttendance);
    toast.success('Barcha o\'quvchilar "Keldi" deb belgilandi');
  };

  const getLevelColor = (level?: string) => {
    if (!level) return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    
    const levelLower = level.toLowerCase();
    if (levelLower.includes('beginner')) {
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    } else if (levelLower.includes('intermediate')) {
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    } else if (levelLower.includes('expert') || levelLower.includes('advanced')) {
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, excused: 0 };
    Object.values(attendance).forEach(status => {
      if (status === 'present') counts.present++;
      else if (status === 'absent') counts.absent++;
      else if (status === 'excuse') counts.excused++;
    });
    return counts;
  };

  // Barcha o'quvchilar uchun davomat qilinganini tekshirish
  const isAllStudentsMarked = () => {
    if (students.length === 0) return false;
    return students.every(student => attendance[student.id] !== null && attendance[student.id] !== undefined);
  };

  // Bugungi kunni tekshirish
  const isToday = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return selectedDate === today;
  };

  const counts = getStatusCounts();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Davomat</h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), "d-MMMM, yyyy (EEEE)", { locale: uz })}
          </p>
        </div>

        {/* Group Selection and Date Card */}
        <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Guruh va sana tanlang
            </CardTitle>
            <CardDescription>
              Davomat qilish uchun avval guruh va sanani tanlang
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingGroups ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Guruhlar yuklanmoqda...
              </div>
            ) : groups.length === 0 ? (
              <p className="text-muted-foreground">Guruhlar topilmadi. Avval guruh yarating.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Guruhni tanlang</label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Guruhni tanlang..." />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(group => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{group.name}</span>
                            {group.smena && (
                              <Badge variant="secondary" className="text-xs">
                                {group.smena}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sanani tanlang</label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    disabled={!selectedGroupId}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Section */}
        {selectedGroupId && (
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {selectedGroup?.name} - Davomat
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {selectedDate && format(new Date(selectedDate + 'T00:00:00'), "d-MMMM, yyyy (EEEE)", { locale: uz })}
                    {isLocked && (
                      <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">
                        🔒 Qulflangan
                      </Badge>
                    )}
                    {!isLocked && canEdit && (
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                        ✏️ Tahrir mumkin
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    onClick={markAllPresent}
                    disabled={isLocked || !canEdit || students.length === 0 || !isToday()}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30"
                    title="Barcha o'quvchilarni 'Keldi' deb belgilash"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Hammasini belgilash
                  </Button>
                  
                  <div className="flex items-center gap-1.5 text-sm bg-green-50 dark:bg-green-950/30 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Keldi:</span>
                    <span className="font-bold text-green-600">{counts.present}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-full">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-muted-foreground">Kelmadi:</span>
                    <span className="font-bold text-red-600">{counts.absent}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm bg-yellow-50 dark:bg-yellow-950/30 px-3 py-1.5 rounded-full">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-muted-foreground">Sababli:</span>
                    <span className="font-bold text-yellow-600">{counts.excused}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Bu guruhda o'quvchilar yo'q
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-14 text-center font-semibold">#</TableHead>
                        <TableHead className="font-semibold">Ism Familya</TableHead>
                        <TableHead className="font-semibold hidden">Username</TableHead>
                        <TableHead className="font-semibold hidden sm:table-cell">Telefon raqam</TableHead>
                        <TableHead className="font-semibold hidden lg:table-cell">Daraja</TableHead>
                        <TableHead className="font-semibold text-center">Ballar</TableHead>
                        <TableHead className="text-center font-semibold w-44">Davomat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => (
                        <Fragment key={student.id}>
                          <TableRow 
                            className={`
                              transition-all duration-200
                              ${attendance[student.id] === 'present' ? 'bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500' : ''}
                              ${attendance[student.id] === 'absent' ? 'bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500' : ''}
                              ${attendance[student.id] === 'excuse' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500' : ''}
                            `}
                          >
                            <TableCell className="text-center font-medium text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={student.photo || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {(student.first_name || '')[0]}{(student.last_name || '')[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="font-medium">
                                  {student.first_name} {student.last_name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden">
                              @{student.username}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline">{student.phone_number || '-'}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <Badge className={getLevelColor(student.level)}>
                                {student.level === 'beginner' ? 'Boshlang\'ich' : 
                                 student.level === 'intermediate' ? 'O\'rta' : 
                                 student.level === 'expert' ? 'Yuqori' : student.level || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={dailyCoins[student.id] || 0}
                                onChange={(e) => {
                                  const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                  setDailyCoins(prev => ({
                                    ...prev,
                                    [student.id]: value
                                  }));
                                }}
                                disabled={isLocked || !canEdit || attendance[student.id] === 'absent' || !attendance[student.id]}
                                className="w-20 text-center text-sm font-medium"
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell>
                              {(attendance[student.id] === null || attendance[student.id] === undefined) && !isToday() ? (
                                <div className="flex items-center justify-center">
                                  <span className="text-2xl" title="Davomat qilinmagan">🔒</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                                    className={`h-9 w-9 p-0 transition-all ${
                                      attendance[student.id] === 'present' 
                                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30' 
                                        : 'hover:bg-green-100 hover:text-green-600 hover:border-green-300 dark:hover:bg-green-950'
                                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => setStudentStatus(student.id, 'present')}
                                    disabled={isLocked}
                                    title="Keldi"
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={attendance[student.id] === 'absent' ? 'default' : 'outline'}
                                    className={`h-9 w-9 p-0 transition-all ${
                                      attendance[student.id] === 'absent' 
                                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' 
                                        : 'hover:bg-red-100 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950'
                                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => setStudentStatus(student.id, 'absent')}
                                    disabled={isLocked}
                                    title="Kelmadi"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={attendance[student.id] === 'excuse' ? 'default' : 'outline'}
                                    className={`h-9 w-9 p-0 transition-all ${
                                      attendance[student.id] === 'excuse' 
                                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/30' 
                                        : 'hover:bg-yellow-100 hover:text-yellow-600 hover:border-yellow-300 dark:hover:bg-yellow-950'
                                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => setStudentStatus(student.id, 'excuse')}
                                    disabled={isLocked}
                                    title="Sababli"
                                  >
                                    <Clock className="w-5 h-5" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                          
                          {/* Reason input row for excuse status */}
                          {attendance[student.id] === 'excuse' && (
                            <TableRow className="bg-yellow-50/50 dark:bg-yellow-950/10">
                              <TableCell colSpan={7}>
                                <div className="py-3 px-4">
                                  <Input
                                    type="text"
                                    value={reasons[student.id] || ''}
                                    onChange={(e) => {
                                      setReasons(prev => ({
                                        ...prev,
                                        [student.id]: e.target.value
                                      }));
                                    }}
                                    disabled={isLocked || !canEdit}
                                    placeholder="Sababni yozing..."
                                    className="text-sm"
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>

            {/* Save Button */}
            {students.length > 0 && !isLocked && (
              <div className="border-t p-4 flex justify-between items-center bg-muted/30">
                <div className="text-sm text-muted-foreground">
                  💡 O'quvchilar uchun kunlik ballni kiritishingiz mumkin (max 100 ball)
                </div>
                <Button 
                  onClick={handleSaveAttendance} 
                  disabled={saving || isLocked || !isAllStudentsMarked() || !isToday()}
                  size="lg"
                  className="min-w-40 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Davomatni saqlash
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Locked message */}
            {/* {isLocked && (
              <div className="border-t p-4">
                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 text-center border border-red-200 dark:border-red-900">
                  <span className="text-2xl mr-2">🔒</span>
                  <p className="font-medium text-red-700 dark:text-red-400">
                    Bugungi kundan keyin sana qulflab qo'yilgan!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    O'zgartirish mumkin emas.
                  </p>
                </div>
              </div>
            )} */}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
