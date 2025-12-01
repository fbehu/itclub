import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Save } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Group {
  id: string;
  name: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
}

interface AttendanceRecord {
  student_id: string;
  present: boolean;
}

export default function Attendance() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupStudents();
      loadAttendance();
    }
  }, [selectedGroupId, date]);

  const loadGroups = async () => {
    try {
      const response = await authFetch(API_ENDPOINTS.GROUPS);
      const data = await response.json();
      setGroups(data.results || data);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Guruhlarni yuklashda xatolik');
    }
  };

  const loadGroupStudents = async () => {
    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.GROUP_STUDENTS(selectedGroupId));
      const data = await response.json();
      setStudents(data.results || data);
      
      // Initialize all students as absent by default
      const initialAttendance: Record<string, boolean> = {};
      (data.results || data).forEach((student: Student) => {
        initialAttendance[student.id] = false;
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('O\'quvchilarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await authFetch(
        `${API_ENDPOINTS.ATTENDANCE_BY_GROUP(selectedGroupId)}&date=${formattedDate}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const attendanceMap: Record<string, boolean> = {};
        data.results.forEach((record: AttendanceRecord) => {
          attendanceMap[record.student_id] = record.present;
        });
        setAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedGroupId) {
      toast.error('Guruhni tanlang');
      return;
    }

    try {
      setSaving(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      const records = Object.entries(attendance).map(([student_id, present]) => ({
        student_id,
        present,
        group_id: selectedGroupId,
        date: formattedDate
      }));

      const response = await authFetch(API_ENDPOINTS.ATTENDANCE, {
        method: 'POST',
        body: JSON.stringify({ records })
      });

      if (response.ok) {
        toast.success('Davomat saqlandi');
      } else {
        toast.error('Davomatni saqlashda xatolik');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Davomatni saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const toggleAll = () => {
    const allPresent = Object.values(attendance).every(v => v);
    const newAttendance: Record<string, boolean> = {};
    students.forEach(student => {
      newAttendance[student.id] = !allPresent;
    });
    setAttendance(newAttendance);
  };

  const presentCount = Object.values(attendance).filter(v => v).length;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Davomat</h1>
        <p className="text-muted-foreground mt-1">O'quvchilar davomatini boshqarish</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Davomat belgilash</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Guruh</label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Guruhni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sana</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Sanani tanlang</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedGroupId && students.length > 0 && (
            <>
              <div className="flex items-center justify-between py-2">
                <div className="text-sm text-muted-foreground">
                  Kelgan: {presentCount} / {students.length}
                </div>
                <Button size="sm" variant="outline" onClick={toggleAll}>
                  Hammasini {Object.values(attendance).every(v => v) ? 'bekor qilish' : 'belgilash'}
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Ism</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead className="text-center w-24">Keldi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          Yuklanmoqda...
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student, index) => (
                        <TableRow key={student.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {student.first_name} {student.last_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {student.username}
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={attendance[student.id] || false}
                              onCheckedChange={() => toggleAttendance(student.id)}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveAttendance} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
