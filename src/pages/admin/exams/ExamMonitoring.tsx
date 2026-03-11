import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Search, Eye, Monitor, Smartphone, Tablet, Wifi, WifiOff,
  ShieldAlert, ShieldCheck, Clock, Users, AlertTriangle, CheckCircle2,
  XCircle, Activity, RefreshCw, ChevronRight, GraduationCap
} from 'lucide-react';

// ── Mock Types ──
interface ExamGroup {
  id: number;
  name: string;
  studentCount: number;
  activeCount: number;
  completedCount: number;
}

interface StudentLog {
  id: number;
  timestamp: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  message: string;
}

interface MonitoredStudent {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  level: string;
  status: 'active' | 'online_not_started' | 'completed' | 'terminated' | 'offline';
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  violations: number;
  startedAt: string | null;
  lastActivity: string;
  logs: StudentLog[];
}

interface ActiveExam {
  id: number;
  title: string;
  duration: number;
  startTime: string;
  endTime: string;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  groups: ExamGroup[];
}

// ── Mock Data ──
const mockActiveExam: ActiveExam = {
  id: 1,
  title: 'Python Asoslari — Yakuniy Imtihon',
  duration: 60,
  startTime: '2026-03-11T10:00:00',
  endTime: '2026-03-11T11:00:00',
  totalStudents: 32,
  activeStudents: 24,
  completedStudents: 5,
  groups: [
    { id: 1, name: 'Python-101', studentCount: 16, activeCount: 12, completedCount: 3 },
    { id: 2, name: 'Python-102', studentCount: 16, activeCount: 12, completedCount: 2 },
  ],
};

const generateMockStudents = (groupId: number): MonitoredStudent[] => {
  const names = [
    { firstName: 'Jasur', lastName: 'Karimov', username: 'jasur_k', phone: '+998901234567', level: 'Intermediate' },
    { firstName: 'Nilufar', lastName: 'Aliyeva', username: 'nilufar_a', phone: '+998901234568', level: 'Beginner' },
    { firstName: 'Sardor', lastName: 'Toshmatov', username: 'sardor_t', phone: '+998901234569', level: 'Advanced' },
    { firstName: 'Madina', lastName: 'Rustamova', username: 'madina_r', phone: '+998901234570', level: 'Intermediate' },
    { firstName: 'Bekzod', lastName: 'Xolmatov', username: 'bekzod_x', phone: '+998901234571', level: 'Beginner' },
    { firstName: 'Ozoda', lastName: 'Nazarova', username: 'ozoda_n', phone: '+998901234572', level: 'Advanced' },
    { firstName: 'Alisher', lastName: 'Mirzayev', username: 'alisher_m', phone: '+998901234573', level: 'Intermediate' },
    { firstName: 'Dilnoza', lastName: 'Qodirova', username: 'dilnoza_q', phone: '+998901234574', level: 'Beginner' },
  ];

  const statuses: MonitoredStudent['status'][] = ['active', 'active', 'active', 'online_not_started', 'completed', 'terminated', 'active', 'offline'];
  const devices = ['Windows 11 — Chrome 120', 'macOS — Safari 17', 'iPhone 15 — Safari', 'Samsung Galaxy S24 — Chrome', 'Windows 10 — Firefox 121', 'iPad Pro — Safari', 'Linux — Chrome 120', 'Android — Chrome 120'];
  const deviceTypes: MonitoredStudent['deviceType'][] = ['desktop', 'desktop', 'mobile', 'mobile', 'desktop', 'tablet', 'desktop', 'mobile'];

  return names.map((n, i) => ({
    id: groupId * 100 + i + 1,
    ...n,
    status: statuses[i],
    device: devices[i],
    deviceType: deviceTypes[i],
    violations: statuses[i] === 'terminated' ? 3 : statuses[i] === 'active' && i === 6 ? 1 : 0,
    startedAt: statuses[i] !== 'online_not_started' && statuses[i] !== 'offline' ? '2026-03-11T10:02:15' : null,
    lastActivity: '2026-03-11T10:45:32',
    logs: generateMockLogs(statuses[i], i),
  }));
};

const generateMockLogs = (status: string, seed: number): StudentLog[] => {
  const logs: StudentLog[] = [
    { id: 1, timestamp: '10:02:15', type: 'success', message: 'Imtihonga kirdi' },
    { id: 2, timestamp: '10:02:16', type: 'info', message: 'To\'liq ekran rejimi yoqildi' },
  ];

  if (status === 'terminated') {
    logs.push(
      { id: 3, timestamp: '10:15:22', type: 'warning', message: '⚠️ Alt+Tab bosildi — 1-ogohlantirish' },
      { id: 4, timestamp: '10:22:45', type: 'warning', message: '⚠️ Ilovadan chiqib ketdi — 2-ogohlantirish' },
      { id: 5, timestamp: '10:30:10', type: 'danger', message: '🚫 Screenshot olishga urinish — 3-ogohlantirish. Sessiya bekor qilindi!' },
    );
  } else if (seed === 6) {
    logs.push(
      { id: 3, timestamp: '10:20:05', type: 'warning', message: '⚠️ Tab almashtirildi — 1-ogohlantirish' },
      { id: 4, timestamp: '10:20:08', type: 'info', message: 'Qaytib kirdi — davom etmoqda' },
    );
  } else {
    logs.push(
      { id: 3, timestamp: '10:10:00', type: 'info', message: '5-savolga javob berdi' },
      { id: 4, timestamp: '10:25:00', type: 'info', message: '12-savolga javob berdi' },
    );
  }

  return logs;
};

// ── Status helpers ──
const getStatusBadge = (status: MonitoredStudent['status']) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 gap-1"><Activity className="w-3 h-3" /> Imtihonda</Badge>;
    case 'online_not_started':
      return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 gap-1"><Clock className="w-3 h-3" /> Kutmoqda</Badge>;
    case 'completed':
      return <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30 gap-1"><CheckCircle2 className="w-3 h-3" /> Yakunladi</Badge>;
    case 'terminated':
      return <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1"><XCircle className="w-3 h-3" /> Bekor qilindi</Badge>;
    case 'offline':
      return <Badge className="bg-muted text-muted-foreground border-border gap-1"><WifiOff className="w-3 h-3" /> Offline</Badge>;
  }
};

const getDeviceIcon = (type: MonitoredStudent['deviceType']) => {
  switch (type) {
    case 'desktop': return <Monitor className="w-4 h-4 text-muted-foreground" />;
    case 'mobile': return <Smartphone className="w-4 h-4 text-muted-foreground" />;
    case 'tablet': return <Tablet className="w-4 h-4 text-muted-foreground" />;
  }
};

const getLogIcon = (type: StudentLog['type']) => {
  switch (type) {
    case 'info': return <Activity className="w-3.5 h-3.5 text-blue-400" />;
    case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    case 'danger': return <ShieldAlert className="w-3.5 h-3.5 text-destructive" />;
    case 'success': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  }
};

// ── Component ──
export default function ExamMonitoring() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam] = useState<ActiveExam>(mockActiveExam);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [students, setStudents] = useState<MonitoredStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<MonitoredStudent | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (selectedGroupId) {
      setStudents(generateMockStudents(selectedGroupId));
    }
  }, [selectedGroupId]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      if (selectedGroupId) setStudents(generateMockStudents(selectedGroupId));
      setIsRefreshing(false);
    }, 800);
  }, [selectedGroupId]);

  const filteredStudents = students.filter(s =>
    `${s.firstName} ${s.lastName} ${s.username} ${s.phone}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const backPath = location.pathname.includes('/admin/') ? '/dashboard/admin/exams' :
    location.pathname.includes('/manager/') ? '/dashboard/manager/exams' : '/dashboard/teacher/exams';

  // ── Group selection view ──
  if (!selectedGroupId) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-bold">Kuzatuv rejimi</h1>
              </div>
              <p className="text-muted-foreground text-sm mt-1">{exam.title}</p>
            </div>
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Jonli
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{exam.activeStudents}</p>
                  <p className="text-xs text-muted-foreground">Faol qatnashchilar</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{exam.completedStudents}</p>
                  <p className="text-xs text-muted-foreground">Yakunlaganlar</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{exam.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Jami o'quvchilar</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Groups */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Guruhlar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exam.groups.map(group => (
                <Card
                  key={group.id}
                  className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {group.studentCount} o'quvchi
                        </span>
                        <span className="flex items-center gap-1 text-emerald-500">
                          <Activity className="w-3.5 h-3.5" /> {group.activeCount} faol
                        </span>
                        <span className="flex items-center gap-1 text-blue-500">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {group.completedCount} yakunlagan
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedGroup = exam.groups.find(g => g.id === selectedGroupId);

  // ── Student table view ──
  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedGroupId(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold truncate">{selectedGroup?.name} — Kuzatuv</h1>
            </div>
            <p className="text-muted-foreground text-sm">{exam.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Jonli
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Yangilash
            </Button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" className="px-3 py-1.5 gap-1.5 bg-emerald-500/5 border-emerald-500/20 text-emerald-600">
            <Activity className="w-3.5 h-3.5" />
            {filteredStudents.filter(s => s.status === 'active').length} faol
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5 gap-1.5 bg-amber-500/5 border-amber-500/20 text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            {filteredStudents.filter(s => s.status === 'online_not_started').length} kutmoqda
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5 gap-1.5 bg-blue-500/5 border-blue-500/20 text-blue-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {filteredStudents.filter(s => s.status === 'completed').length} yakunlagan
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5 gap-1.5 bg-destructive/5 border-destructive/20 text-destructive">
            <ShieldAlert className="w-3.5 h-3.5" />
            {filteredStudents.filter(s => s.status === 'terminated').length} bekor qilingan
          </Badge>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ism, username yoki telefon..."
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>O'quvchi</TableHead>
                  <TableHead className="hidden md:table-cell">Username</TableHead>
                  <TableHead className="hidden lg:table-cell">Telefon</TableHead>
                  <TableHead className="hidden lg:table-cell">Daraja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Qurilma</TableHead>
                  <TableHead className="hidden sm:table-cell">Xavfsizlik</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, idx) => {
                  const hasViolations = student.violations > 0;
                  return (
                    <TableRow
                      key={student.id}
                      className={`cursor-pointer transition-colors ${
                        student.status === 'terminated' ? 'bg-destructive/5' :
                        hasViolations ? 'bg-amber-500/5' : ''
                      }`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{student.firstName} {student.lastName}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">@{student.username}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{student.phone}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="text-xs">{student.level}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          {getDeviceIcon(student.deviceType)}
                          <span className="text-xs text-muted-foreground truncate max-w-[140px]">{student.device}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {hasViolations ? (
                          <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            {student.violations} ogohlantirish
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Toza
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              {selectedStudent?.firstName} {selectedStudent?.lastName}
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4">
              {/* Student info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Username</p>
                  <p className="font-medium">@{selectedStudent.username}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Telefon</p>
                  <p className="font-medium">{selectedStudent.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Daraja</p>
                  <p className="font-medium">{selectedStudent.level}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedStudent.status)}
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-muted-foreground">Qurilma</p>
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(selectedStudent.deviceType)}
                    <p className="font-medium">{selectedStudent.device}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Logs */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Real vaqt loglari
                </h3>
                <ScrollArea className="h-[240px]">
                  <div className="space-y-2">
                    {selectedStudent.logs.map(log => (
                      <div
                        key={log.id}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border text-sm ${
                          log.type === 'danger' ? 'bg-destructive/5 border-destructive/20' :
                          log.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                          log.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                          'bg-muted/50 border-border'
                        }`}
                      >
                        <div className="mt-0.5">{getLogIcon(log.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{log.message}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{log.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
