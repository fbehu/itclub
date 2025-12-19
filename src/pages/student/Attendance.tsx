import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, parseISO } from 'date-fns';
import { uz } from 'date-fns/locale';
import DashboardLayout from '@/components/DashboardLayout';

type AttendanceStatus = 'present' | 'absent' | 'excused';

interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
  group_name: string;
}

interface AttendanceStats {
  total_days: number;
  present: number;
  absent: number;
  excused: number;
  percentage: number;
}

// Mock data for demonstration
const generateMockAttendance = (month: Date): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month)
  });
  
  const statuses: AttendanceStatus[] = ['present', 'absent', 'excused'];
  const today = new Date();
  
  days.forEach((day) => {
    // Skip weekends and future dates
    const dayOfWeek = day.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6 || day > today) return;
    
    // Random attendance with higher chance of present
    const random = Math.random();
    let status: AttendanceStatus;
    if (random < 0.75) status = 'present';
    else if (random < 0.9) status = 'absent';
    else status = 'excused';
    
    records.push({
      date: format(day, 'yyyy-MM-dd'),
      status,
      group_name: 'IT Club - Web Development'
    });
  });
  
  return records;
};

const calculateStats = (records: AttendanceRecord[]): AttendanceStats => {
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const excused = records.filter(r => r.status === 'excused').length;
  const total = records.length;
  
  return {
    total_days: total,
    present,
    absent,
    excused,
    percentage: total > 0 ? Math.round((present / total) * 100) : 0
  };
};

export default function StudentAttendance() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);

  useEffect(() => {
    // Load mock attendance data
    const mockData = generateMockAttendance(currentMonth);
    setAttendance(mockData);
    setStats(calculateStats(mockData));
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (nextMonth <= new Date()) {
      setCurrentMonth(nextMonth);
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'excused':
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500 hover:bg-green-600">Keldi</Badge>;
      case 'absent':
        return <Badge className="bg-red-500 hover:bg-red-600">Kelmadi</Badge>;
      case 'excused':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Sababli</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mening davomatim</h1>
          <p className="text-muted-foreground mt-1">O'qish davomatingizni kuzating</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-200 dark:border-green-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kelgan</p>
                    <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-200 dark:border-red-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kelmagan</p>
                    <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-200 dark:border-yellow-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sababli</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.excused}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Davomat %</p>
                    <p className="text-2xl font-bold text-primary">{stats.percentage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Month Navigation */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {format(currentMonth, "MMMM yyyy", { locale: uz })}
              </CardTitle>
              
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                disabled={addMonths(currentMonth, 1) > new Date()}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {attendance.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Bu oyda davomat ma'lumotlari yo'q</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-14 text-center font-semibold">#</TableHead>
                      <TableHead className="font-semibold">Sana</TableHead>
                      <TableHead className="font-semibold">Kun</TableHead>
                      <TableHead className="font-semibold">Guruh</TableHead>
                      <TableHead className="text-center font-semibold">Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record, index) => {
                      const date = parseISO(record.date);
                      return (
                        <TableRow 
                          key={record.date}
                          className={`
                            transition-colors
                            ${record.status === 'present' ? 'bg-green-50 dark:bg-green-950/20' : ''}
                            ${record.status === 'absent' ? 'bg-red-50 dark:bg-red-950/20' : ''}
                            ${record.status === 'excused' ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
                          `}
                        >
                          <TableCell className="text-center font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {format(date, "d-MMMM", { locale: uz })}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(date, "EEEE", { locale: uz })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.group_name}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {getStatusIcon(record.status)}
                              {getStatusBadge(record.status)}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Keldi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-sm text-muted-foreground">Kelmadi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500" />
                <span className="text-sm text-muted-foreground">Sababli</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
