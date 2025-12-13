import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  smena: string;
  start_time: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  course: string;
  level: string;
  coins: number;
}

type AttendanceStatus = 'present' | 'absent' | 'excused';

// Mock students data
const mockStudents: Student[] = [
  { id: '1', first_name: 'Abdulloh', last_name: 'Karimov', username: 'abdulloh_k', course: 'kurs-2', level: 'intermediate', coins: 150 },
  { id: '2', first_name: 'Dilshod', last_name: 'Rahimov', username: 'dilshod_r', course: 'kurs-2', level: 'beginner', coins: 80 },
  { id: '3', first_name: 'Jasur', last_name: 'Toshmatov', username: 'jasur_t', course: 'kurs-1', level: 'advanced', coins: 320 },
  { id: '4', first_name: 'Malika', last_name: 'Saidova', username: 'malika_s', course: 'kurs-3', level: 'intermediate', coins: 200 },
  { id: '5', first_name: 'Nodira', last_name: 'Azimova', username: 'nodira_a', course: 'kurs-2', level: 'beginner', coins: 45 },
  { id: '6', first_name: 'Sardor', last_name: 'Jumayev', username: 'sardor_j', course: 'kurs-1', level: 'intermediate', coins: 180 },
  { id: '7', first_name: 'Shaxzod', last_name: 'Mirzayev', username: 'shaxzod_m', course: 'kurs-4', level: 'advanced', coins: 450 },
  { id: '8', first_name: 'Zarina', last_name: 'Holmatova', username: 'zarina_h', course: 'kurs-2', level: 'beginner', coins: 65 },
];

export default function AdminAttendance() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [hasExistingAttendance, setHasExistingAttendance] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      const group = groups.find(g => g.id.toString() === selectedGroupId);
      setSelectedGroup(group || null);
      loadMockData();
    } else {
      setSelectedGroup(null);
      setStudents([]);
      setAttendance({});
      setHasExistingAttendance(false);
    }
  }, [selectedGroupId, groups]);

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

  const loadMockData = () => {
    setLoading(true);
    // Simulate loading delay
    setTimeout(() => {
      setStudents(mockStudents);
      // Initialize all as absent
      const attendanceMap: Record<string, AttendanceStatus> = {};
      mockStudents.forEach(student => {
        attendanceMap[student.id] = 'absent';
      });
      setAttendance(attendanceMap);
      setIsEditable(true);
      setHasExistingAttendance(false);
      setLoading(false);
    }, 500);
  };

  const handleSaveAttendance = () => {
    if (!selectedGroupId) {
      toast.error('Guruhni tanlang');
      return;
    }

    setSaving(true);
    // Simulate save
    setTimeout(() => {
      toast.success('Davomat muvaffaqiyatli saqlandi');
      setIsEditable(false);
      setHasExistingAttendance(true);
      setSaving(false);
    }, 1000);
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    if (!isEditable) return;
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, excused: 0 };
    Object.values(attendance).forEach(status => {
      counts[status]++;
    });
    return counts;
  };

  const counts = getStatusCounts();

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Davomat</h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), "d-MMMM, yyyy (EEEE)", { locale: uz })}
          </p>
        </div>

        {/* Group Selection Card */}
        <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Guruhni tanlang
            </CardTitle>
            <CardDescription>
              Davomat qilish uchun avval guruhni tanlang
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingGroups ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Guruhlar yuklanmoqda...
              </div>
            ) : groups.length === 0 ? (
              <p className="text-muted-foreground">Guruhlar topilmadi. Avval guruh yarating.</p>
            ) : (
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="w-full max-w-md">
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
                    {format(new Date(), "d-MMMM, yyyy", { locale: uz })}
                    {!isEditable && hasExistingAttendance && (
                      <Badge variant="secondary" className="ml-2">
                        Saqlangan
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-3 flex-wrap">
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
                        <TableHead className="font-semibold">Username</TableHead>
                        <TableHead className="font-semibold hidden sm:table-cell">Kurs</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Daraja</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell text-center">Tangalar</TableHead>
                        <TableHead className="text-center font-semibold w-44">Davomat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => (
                        <TableRow 
                          key={student.id}
                          className={`
                            transition-all duration-200
                            ${attendance[student.id] === 'present' ? 'bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500' : ''}
                            ${attendance[student.id] === 'absent' ? 'bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500' : ''}
                            ${attendance[student.id] === 'excused' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500' : ''}
                          `}
                        >
                          <TableCell className="text-center font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.first_name} {student.last_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            @{student.username}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline">{student.course || '-'}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge className={getLevelColor(student.level)}>
                              {student.level === 'beginner' ? 'Boshlang\'ich' : 
                               student.level === 'intermediate' ? 'O\'rta' : 
                               student.level === 'advanced' ? 'Yuqori' : student.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-center">
                            <span className="font-medium text-yellow-600 dark:text-yellow-400">
                              🪙 {student.coins || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                                className={`h-9 w-9 p-0 transition-all ${
                                  attendance[student.id] === 'present' 
                                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30' 
                                    : 'hover:bg-green-100 hover:text-green-600 hover:border-green-300 dark:hover:bg-green-950'
                                } ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => setStudentStatus(student.id, 'present')}
                                disabled={!isEditable}
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
                                } ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => setStudentStatus(student.id, 'absent')}
                                disabled={!isEditable}
                                title="Kelmadi"
                              >
                                <XCircle className="w-5 h-5" />
                              </Button>
                              <Button
                                size="sm"
                                variant={attendance[student.id] === 'excused' ? 'default' : 'outline'}
                                className={`h-9 w-9 p-0 transition-all ${
                                  attendance[student.id] === 'excused' 
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/30' 
                                    : 'hover:bg-yellow-100 hover:text-yellow-600 hover:border-yellow-300 dark:hover:bg-yellow-950'
                                } ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => setStudentStatus(student.id, 'excused')}
                                disabled={!isEditable}
                                title="Sababli"
                              >
                                <Clock className="w-5 h-5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>

            {/* Save Button */}
            {students.length > 0 && isEditable && (
              <div className="border-t p-4 flex justify-end bg-muted/30">
                <Button 
                  onClick={handleSaveAttendance} 
                  disabled={saving}
                  size="lg"
                  className="min-w-40 bg-primary hover:bg-primary/90"
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

            {/* Already saved message */}
            {!isEditable && hasExistingAttendance && (
              <div className="border-t p-4">
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center border border-green-200 dark:border-green-900">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Bugungi davomat muvaffaqiyatli saqlandi!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    O'zgartirish mumkin emas.
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
