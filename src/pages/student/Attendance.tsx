import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2, XCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { uz } from 'date-fns/locale';
import DashboardLayout from '@/components/DashboardLayout';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { useToast } from '@/hooks/use-toast';

type AttendanceStatus = 'present' | 'absent' | 'excuse';

interface DailyAttendance {
  date: string;
  day_name: string;
  group_name: string;
  group_id: number;
  status: AttendanceStatus;
  reason: string | null;
  coins: number;
  created_at: string;
}

interface AttendanceStats {
  total_classes: number;
  present_count: number;
  absent_count: number;
  excuse_count: number;
  attendance_percentage: number;
}

interface AttendanceResponse {
  year: number;
  month: number;
  message?: string;
  summary: AttendanceStats;
  daily_attendance: DailyAttendance[];
}

export default function StudentAttendance({ groupId, isGroupView }: { groupId?: string; isGroupView?: boolean } = {}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState<DailyAttendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendance();
  }, [currentMonth]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      
      let url = `${API_ENDPOINTS.USER_ME.replace('/me', '')}attendance/?year=${year}&month=${month}`;
      
      // Add group_id query param if provided
      if (groupId && isGroupView) {
        url += `&group_id=${groupId}`;
      }
      
      const response = await authFetch(url, { method: 'GET' });

      if (!response.ok) {
        throw new Error('Davomat ma\'lumotlarini olishda xatolik');
      }

      const data: AttendanceResponse = await response.json();
      setAttendance(data.daily_attendance || []);
      setStats(data.summary);

    } catch (error) {
      console.error('Attendance fetch error:', error);
      toast({
        title: 'Xato',
        description: error instanceof Error ? error.message : 'Davomat ma\'lumotlarini olishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
      case 'excuse':
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500 hover:bg-green-600">Keldi</Badge>;
      case 'absent':
        return <Badge className="bg-red-500 hover:bg-red-600">Kelmadi</Badge>;
      case 'excuse':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Sababli</Badge>;
    }
  };

  // Wrapper component for standalone page view
  const AttendanceContent = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Header - only show if not in group view */}
      {!isGroupView && (
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold ">
            {isGroupView ? 'Davomat' : 'Mening davomatim'}
          </h1>
          <p className=" mt-1 ">
            {isGroupView ? 'Bu guruh davomatini kuzating' : 'O\'qish davomatingizni kuzating'}
          </p>
        </div>
      )}

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
                    <p className="text-2xl font-bold text-green-600">{stats.present_count}</p>
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
                    <p className="text-2xl font-bold text-red-600">{stats.absent_count}</p>
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
                    <p className="text-2xl font-bold text-yellow-600">{stats.excuse_count}</p>
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
                    <p className="text-2xl font-bold text-primary">{stats.attendance_percentage.toFixed(1)}%</p>
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
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="animate-spin mb-3">
                  <Calendar className="w-12 h-12 mx-auto opacity-50" />
                </div>
                <p>Davomat ma'lumotlari yuklanmoqda...</p>
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
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
                      {!isGroupView && <TableHead className="font-semibold">Guruh</TableHead>}
                      <TableHead className="text-center font-semibold">Holat</TableHead>
                      <TableHead className="font-semibold">Sababli</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record, index) => (
                      <TableRow 
                        key={`${record.date}-${record.group_id}`}
                        className={`
                          transition-colors
                          ${record.status === 'present' ? 'bg-green-50 dark:bg-green-950/20' : ''}
                          ${record.status === 'absent' ? 'bg-red-50 dark:bg-red-950/20' : ''}
                          ${record.status === 'excuse' ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
                        `}
                      >
                        <TableCell className="text-center font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {format(new Date(record.date), "d-MMMM", { locale: uz })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.day_name}
                        </TableCell>
                        {!isGroupView && (
                          <TableCell>
                            <Badge variant="outline">{record.group_name}</Badge>
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(record.status)}
                            {getStatusBadge(record.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.reason ? (
                            <span className="text-yellow-600 dark:text-yellow-400">{record.reason}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
    );

  // Return wrapper or content depending on view type
  return isGroupView ? (
    <AttendanceContent />
  ) : (
    <DashboardLayout>
      <AttendanceContent />
    </DashboardLayout>
  );
}
