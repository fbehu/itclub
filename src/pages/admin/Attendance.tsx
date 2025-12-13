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

interface AttendanceRecord {
  student_id: string;
  status: AttendanceStatus;
}

interface AttendanceResponse {
  date: string;
  group_id: number;
  is_editable: boolean;
  records: AttendanceRecord[];
}

export default function Attendance() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [attendanceDate, setAttendanceDate] = useState<string>('');
  const [hasExistingAttendance, setHasExistingAttendance] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      const group = groups.find(g => g.id.toString() === selectedGroupId);
      setSelectedGroup(group || null);
      loadGroupData();
    } else {
      setSelectedGroup(null);
      setStudents([]);
      setAttendance({});
      setHasExistingAttendance(false);
    }
  }, [selectedGroupId]);

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

  const loadGroupData = async () => {
    try {
      setLoading(true);
      
      // Load students and attendance status together
      const [studentsRes, attendanceRes] = await Promise.all([
        authFetch(API_ENDPOINTS.GROUP_STUDENTS(selectedGroupId)),
        authFetch(API_ENDPOINTS.ATTENDANCE_BY_GROUP(selectedGroupId))
      ]);
      
      const studentsData = await studentsRes.json();
      setStudents(studentsData.results || studentsData);
      
      const attendanceData: AttendanceResponse = await attendanceRes.json();
      setAttendanceDate(attendanceData.date);
      setIsEditable(attendanceData.is_editable);
      setHasExistingAttendance(attendanceData.records && attendanceData.records.length > 0);
      
      // Initialize attendance
      const attendanceMap: Record<string, AttendanceStatus> = {};
      const studentsList = studentsData.results || studentsData;
      
      if (attendanceData.records && attendanceData.records.length > 0) {
        attendanceData.records.forEach((record: AttendanceRecord) => {
          attendanceMap[record.student_id] = record.status;
        });
      } else {
        // Initialize all as absent if no existing records
        studentsList.forEach((student: Student) => {
          attendanceMap[student.id] = 'absent';
        });
      }
      
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error loading group data:', error);
      toast.error('Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedGroupId) {
      toast.error('Guruhni tanlang');
      return;
    }

    if (!isEditable) {
      toast.error('Bugungi davomat allaqachon saqlangan');
      return;
    }

    try {
      setSaving(true);
      const records = Object.entries(attendance).map(([student_id, status]) => ({
        student_id,
        status
      }));

      const response = await authFetch(API_ENDPOINTS.ATTENDANCE, {
        method: 'POST',
        body: JSON.stringify({ 
          group_id: parseInt(selectedGroupId),
          records 
        })
      });

      if (response.ok) {
        toast.success('Davomat muvaffaqiyatli saqlandi');
        setIsEditable(false);
        setHasExistingAttendance(true);
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Davomatni saqlashda xatolik');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Davomatni saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    if (!isEditable) return;
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
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
                    {attendanceDate && format(new Date(attendanceDate), "d-MMMM, yyyy", { locale: uz })}
                    {!isEditable && hasExistingAttendance && (
                      <Badge variant="secondary" className="ml-2">
                        Saqlangan
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-sm">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Keldi:</span>
                    <span className="font-semibold text-green-600">{counts.present}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">Kelmadi:</span>
                    <span className="font-semibold text-red-600">{counts.absent}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-muted-foreground">Sababli:</span>
                    <span className="font-semibold text-yellow-600">{counts.excused}</span>
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
                        <TableHead className="text-center font-semibold w-40">Davomat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => (
                        <TableRow 
                          key={student.id}
                          className={`
                            transition-colors
                            ${attendance[student.id] === 'present' ? 'bg-green-50 dark:bg-green-950/20' : ''}
                            ${attendance[student.id] === 'absent' ? 'bg-red-50 dark:bg-red-950/20' : ''}
                            ${attendance[student.id] === 'excused' ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
                          `}
                        >
                          <TableCell className="text-center font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.first_name} {student.last_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {student.username}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline">{student.course || '-'}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="secondary">{student.level || '-'}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-center">
                            <span className="font-medium text-yellow-600">
                              🪙 {student.coins || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                                className={`h-8 w-8 p-0 ${
                                  attendance[student.id] === 'present' 
                                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                                    : 'hover:bg-green-100 hover:text-green-600 hover:border-green-300'
                                } ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => setStudentStatus(student.id, 'present')}
                                disabled={!isEditable}
                                title="Keldi"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={attendance[student.id] === 'absent' ? 'default' : 'outline'}
                                className={`h-8 w-8 p-0 ${
                                  attendance[student.id] === 'absent' 
                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                    : 'hover:bg-red-100 hover:text-red-600 hover:border-red-300'
                                } ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => setStudentStatus(student.id, 'absent')}
                                disabled={!isEditable}
                                title="Kelmadi"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={attendance[student.id] === 'excused' ? 'default' : 'outline'}
                                className={`h-8 w-8 p-0 ${
                                  attendance[student.id] === 'excused' 
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                                    : 'hover:bg-yellow-100 hover:text-yellow-600 hover:border-yellow-300'
                                } ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => setStudentStatus(student.id, 'excused')}
                                disabled={!isEditable}
                                title="Sababli"
                              >
                                <Clock className="w-4 h-4" />
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
              <div className="border-t p-4 flex justify-end">
                <Button 
                  onClick={handleSaveAttendance} 
                  disabled={saving}
                  size="lg"
                  className="min-w-32"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Saqlash
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Already saved message */}
            {!isEditable && hasExistingAttendance && (
              <div className="border-t p-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Bugungi davomat allaqachon saqlangan. O'zgartirish mumkin emas.
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
