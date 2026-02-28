import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Award, BarChart3, TrendingUp, Users, CheckCircle2, AlertCircle, Loader2, DollarSign, Award as AwardIcon, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/authFetch';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StudentStatistics {
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  total_paid: string;
  total_remaining: string;
  payment_history_count: number;
  courses_detail: Array<{
    course_id: number;
    course_name: string;
    status: string;
    total_price: string;
    paid_amount: string;
    remaining: string;
    start_date: string;
    end_date: string | null;
    payment_count: number;
  }>;
}

interface AdminStatistics {
  users: {
    total: number;
    students: number;
    teachers: number;
    admins: number;
  };
  courses: {
    total: number;
    current_month: number;
    last_month: number;
    growth_percent: number;
    detail: Array<{
      id: number;
      name: string;
      price: string;
      groups_count: number;
      enrollments_count: number;
    }>;
  };
  groups: {
    total: number;
  };
  attendance: {
    top_active_groups: Array<{
      group_id: number;
      group_name: string;
      total_records: number;
      present_count: number;
      absent_count: number;
      excuse_count: number;
      attendance_percent: number;
    }>;
  };
  top_students: {
    top_10_by_grades: Array<{
      student_id: string;
      student_name: string;
      student_email: string;
      student_phone: string | null;
      coins: number;
      courses: Array<{
        course_name: string;
        group_name: string;
      }>;
    }>;
  };
  growth: {
    current_month: {
      added: number;
      previous_month: number;
      change: number;
      growth_percent: number;
    };
    trend_6_months: Array<{
      month: string;
      students_added: number;
    }>;
  };
  user_sources: Array<{
    source: string;
    count: number;
    percent: number;
  }>;
  certificates: {
    total: number;
    this_month: number;
    students_with_certificates: number;
    certificate_percent: number;
  };
  payments: {
    total_enrollments: number;
    total_payments: number;
    confirmed: number;
    pending: number;
    total_revenue: string;
  };
}

interface TeacherStatistics {
  total_students: number;
  total_groups: number;
  total_courses: number;
  total_classes: number;
  groups: Array<{
    group_id: number;
    group_name: string;
    students_count: number;
    course_name: string;
    course_id: number;
    start_date: string | null;
    end_date: string | null;
  }>;
}

export default function Statistics() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState<StudentStatistics | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStatistics | null>(null);
  const [teacherStats, setTeacherStats] = useState<TeacherStatistics | null>(null);

  useEffect(() => {
    loadStatistics();
  }, [user?.role]);

  const loadStatistics = async () => {
    if (!user?.role) return;

    try {
      setLoading(true);
      let endpoint = '';

      if (user.role === 'student') {
        endpoint = '/statistic/student/';
      } else if (user.role === 'admin' || user.role === 'manager') {
        endpoint = '/statistic/admin/';
      } else if (user.role === 'teacher') {
        endpoint = '/statistic/teacher/';
      }

      if (!endpoint) {
        toast.error('Rol aniqlanmadi');
        return;
      }

      const response = await authFetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (user.role === 'student') {
          setStudentStats(data);
        } else if (user.role === 'admin' || user.role === 'manager') {
          setAdminStats(data);
        } else if (user.role === 'teacher') {
          setTeacherStats(data);
        }
      } else {
        toast.error('Statistikani yuklashda xatolik');
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast.error('Statistikani yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };
  // Key Statistics
  const keyStats = [
    {
      title: "O'rtacha ball",
      value: "4.5",
      icon: Award,
      color: "from-emerald-500 to-teal-500",
      textColor: "text-emerald-400",
      description: "Bugun: +0.2",
    },
    {
      title: "Davomat %",
      value: "92%",
      icon: CheckCircle2,
      color: "from-blue-500 to-cyan-500",
      textColor: "text-blue-400",
      description: "Jami: 35/42 dars",
    },
    {
      title: "Bajarilgan topshiriqlar",
      value: "87%",
      icon: BookOpen,
      color: "from-purple-500 to-violet-500",
      textColor: "text-purple-400",
      description: "28/32 ta",
    },
    {
      title: "O'sish tendentsiyasi",
      value: "+8.3%",
      icon: TrendingUp,
      color: "from-orange-500 to-amber-500",
      textColor: "text-orange-400",
      description: "Oxirgi 2 hafta",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
            <p className="text-muted-foreground">Statistika yuklanmoqda...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render Student Statistics
  if (user?.role === 'student' && studentStats) {
    return (
      <DashboardLayout>
        <div className="space-y-8 pb-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
              Statistika
            </h1>
            <p className="text-muted-foreground">O'quv ko'rsatkichlarini ko'ring va taraqqiyotingizni monitoring qiling</p>
          </div>

          {/* Key Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase`}>Jami Kurslar</p>
                  <p className="text-3xl font-bold text-blue-500">{studentStats.total_courses}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {studentStats.completed_courses} tugatildi
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase`}>O'tib yurgan</p>
                  <p className="text-3xl font-bold text-purple-500">{studentStats.in_progress_courses}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Faol kurslar</p>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase`}>To'langan</p>
                  <p className="text-3xl font-bold text-green-500">{Number(studentStats.total_paid).toLocaleString('uz-UZ')} so'm</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Jami to'lov</p>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase`}>Qolgan Qarz</p>
                  <p className="text-3xl font-bold text-red-500">{Number(studentStats.total_remaining).toLocaleString('uz-UZ')} so'm</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>To'lash kerak</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Courses Detail */}
          <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-slate-900'}>Kurslar bo'yicha tafsilot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Courses Bar Chart */}
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={studentStats.courses_detail.map(course => ({
                      name: course.course_name.substring(0, 15) + (course.course_name.length > 15 ? '...' : ''),
                      'To\'langan': Number(course.paid_amount),
                      'Qarz': Number(course.remaining),
                      fullName: course.course_name,
                      status: course.status
                    }))}
                  >
                    <defs>
                      <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.7}/>
                      </linearGradient>
                      <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                    <XAxis 
                      dataKey="name" 
                      stroke={isDark ? '#94a3b8' : '#64748b'}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke={isDark ? '#94a3b8' : '#64748b'}
                      style={{ fontSize: '12px' }}
                      label={{ value: "So'm", angle: -90, position: 'insideLeft', offset: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        color: isDark ? '#f1f5f9' : '#1e293b'
                      }}
                      formatter={(value: any) => Number(value).toLocaleString('uz-UZ') + ' so\'m'}
                      labelFormatter={(label) => {
                        const course = studentStats.courses_detail[label];
                        return course?.course_name || label;
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '16px' }} />
                    <Bar dataKey="To'langan" fill="url(#colorPaid)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Qarz" fill="url(#colorDebt)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Course Cards */}
              <div className="space-y-4">
                {studentStats.courses_detail.map((course) => (
                  <div key={course.course_id} className={`border ${isDark ? 'border-slate-700/50' : 'border-slate-200'} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{course.course_name}</h4>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
                          {course.start_date && new Date(course.start_date).toLocaleDateString('uz-UZ')}
                          {course.end_date && ` - ${new Date(course.end_date).toLocaleDateString('uz-UZ')}`}
                        </p>
                      </div>
                      <Badge variant={course.status === 'finished' ? 'default' : 'secondary'} className="flex-shrink-0">
                        {course.status === 'finished' ? '✓ Tugatildi' : '🔄 O\'tib yurgan'}
                      </Badge>
                    </div>

                    <div className={`grid grid-cols-3 gap-3 p-3 rounded-lg ${isDark ? 'bg-slate-800/30' : 'bg-slate-50'} mb-3`}>
                      <div>
                        <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'} uppercase mb-1`}>Umumiy</p>
                        <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {(Number(course.total_price) / 1000).toFixed(0)}K
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{Number(course.total_price).toLocaleString('uz-UZ')} so'm</p>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold text-green-600 uppercase mb-1`}>✓ To'langan</p>
                        <p className="text-lg font-bold text-green-600">
                          {(Number(course.paid_amount) / 1000).toFixed(0)}K
                        </p>
                        <p className={`text-xs text-green-600`}>{Number(course.paid_amount).toLocaleString('uz-UZ')} so'm</p>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold text-red-600 uppercase mb-1`}>Qarz</p>
                        <p className="text-lg font-bold text-red-600">
                          {(Number(course.remaining) / 1000).toFixed(0)}K
                        </p>
                        <p className={`text-xs text-red-600`}>{Number(course.remaining).toLocaleString('uz-UZ')} so'm</p>
                      </div>
                    </div>

                    <div className={`space-y-2`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>To'lash Progress</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {((Number(course.paid_amount) / Number(course.total_price)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className={`h-3 ${isDark ? 'bg-slate-700/50' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: `${((Number(course.paid_amount) / Number(course.total_price)) * 100)}%` }}
                        />
                      </div>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        {course.payment_count} to'lov qilindi
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Render Teacher Statistics
  if (user?.role === 'teacher' && teacherStats) {
    return (
      <DashboardLayout>
        <div className="space-y-8 pb-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
              O'qituvchi Statistikasi
            </h1>
            <p className="text-muted-foreground">O'qitayotgan kurslar va talabalar haqida ma'lumot</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase`}>Jami Talabalar</p>
                  <p className="text-3xl font-bold text-blue-500">{teacherStats.total_students}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>O'qitayotgan</p>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase`}>Guruhlar</p>
                  <p className="text-3xl font-bold text-purple-500">{teacherStats.total_groups}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Jami guruhlar</p>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase`}>Kurslar</p>
                  <p className="text-3xl font-bold text-orange-500">{teacherStats.total_courses}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Aktiv kurslar</p>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase`}>Sinf/Ro'yxat</p>
                  <p className="text-3xl font-bold text-green-500">{teacherStats.total_classes}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Jami Enrollment</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Groups Detail */}
          <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-slate-900'}>Guruhlar bo'yicha tafsilot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teacherStats.groups.map((group) => (
                <div key={group.group_id} className={`border ${isDark ? 'border-slate-700/50' : 'border-slate-200'} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{group.group_name}</h4>
                      <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'} font-semibold mt-1`}>📚 {group.course_name}</p>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-600 border-0 flex-shrink-0">👥 {group.students_count}</Badge>
                  </div>
                  
                  <div className={`grid grid-cols-2 gap-4 text-sm pt-3 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase mb-1`}>Boshlanishi</p>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {group.start_date ? new Date(group.start_date).toLocaleDateString('uz-UZ') : '📅 Belgilanmagan'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase mb-1`}>Tugashi</p>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {group.end_date ? new Date(group.end_date).toLocaleDateString('uz-UZ') : '🔄 Davom'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Render Admin Statistics
  if ((user?.role === 'admin' || user?.role === 'manager') && adminStats) {
    return (
      <DashboardLayout>
        <div className="space-y-8 pb-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
              Admin Statistikasi
            </h1>
            <p className="text-muted-foreground">Butun tizim bo'yicha umumiy ko'rsatkichlar</p>
          </div>

          {/* Top Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase`}>Jami Userlar</p>
                  <p className="text-3xl font-bold text-blue-500">{adminStats.users.total}</p>
                  <div className="text-xs space-y-1 mt-2">
                    <p>👤 Talabalar: {adminStats.users.students}</p>
                    <p>👨‍🏫 O'qituvchilar: {adminStats.users.teachers}</p>
                    <p>⚙️ Adminlar: {adminStats.users.admins}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase`}>Kurslar</p>
                  <p className="text-3xl font-bold text-purple-500">{adminStats.courses.total}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-2`}>
                    Bu oy: {adminStats.courses.current_month} | O'tgan oy: {adminStats.courses.last_month}
                  </p>
                  <Badge className="mt-2 bg-green-500/20 text-green-600">+{adminStats.courses.growth_percent.toFixed(1)}%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase`}>Guruhlar</p>
                  <p className="text-3xl font-bold text-orange-500">{adminStats.groups.total}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-2`}>Jami guruhlar</p>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase`}>Sertifikatlar</p>
                  <p className="text-3xl font-bold text-teal-500">{adminStats.certificates.total}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-2`}>
                    Bu oy: {adminStats.certificates.this_month}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold uppercase`}>Daromad</p>
                  <p className="text-2xl font-bold text-green-500">{Number(adminStats.payments.total_revenue).toLocaleString('uz-UZ')} so'm </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-2`}>
                    {Number(adminStats.payments.total_revenue).toLocaleString('uz-UZ')} so'm
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Growth Section */}
            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-white' : 'text-slate-900'}>O'sish Tendensiyasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`border ${isDark ? 'border-slate-700/50' : 'border-slate-200'} rounded-lg p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10`}>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Bu oyda qo'shilgan</p>
                  <p className="text-3xl font-bold text-blue-500 mt-1">{adminStats.growth.current_month.added}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-500 font-semibold">+{adminStats.growth.current_month.growth_percent.toFixed(1)}%</span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
                    O'tgan oy: {adminStats.growth.current_month.previous_month}
                  </p>
                </div>

                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={adminStats.growth.trend_6_months}>
                      <defs>
                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis 
                        dataKey="month" 
                        stroke={isDark ? '#94a3b8' : '#64748b'}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke={isDark ? '#94a3b8' : '#64748b'}
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                          borderRadius: '8px',
                          color: isDark ? '#f1f5f9' : '#1e293b'
                        }}
                        cursor={{ stroke: isDark ? '#64748b' : '#cbd5e1' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '16px' }}
                        formatter={() => 'Qo\'shilgan O\'quvchilar'}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="students_added" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', r: 5 }}
                        activeDot={{ r: 7 }}
                        fillOpacity={1} 
                        fill="url(#colorStudents)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Students */}
            <Card className={`lg:col-span-2 border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-white' : 'text-slate-900'}>Top 10 O'quvchilar (Ballari bo'yicha)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {adminStats.top_students.top_10_by_grades.map((student, idx) => (
                  <div key={student.student_id} className={`border ${isDark ? 'border-slate-700/50' : 'border-slate-200'} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`flex-shrink-0 font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full ${isDark ? 'bg-slate-700/50 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                          #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.student_name}</p>
                          <div className="flex flex-col gap-1 mt-1 text-xs">
                            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>📧 {student.student_email}</p>
                            {student.student_phone && (
                              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>📱 {student.student_phone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 flex-shrink-0">⭐ {student.coins}</Badge>
                    </div>
                    
                    {student.courses && student.courses.length > 0 && (
                      <div className={`mt-3 pt-3 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                        <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-2 uppercase`}>Kurslar</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {student.courses.map((course, cIdx) => (
                            <div 
                              key={`${student.student_id}-${cIdx}`}
                              className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded p-2 text-xs`}
                            >
                              <p className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>📚 {course.course_name}</p>
                              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>👥 {course.group_name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Payment & Source Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Statistics */}
            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-white' : 'text-slate-900'}>To'lovlar Statistikasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`${isDark ? 'bg-slate-800/50' : 'bg-blue-50'} rounded-lg p-4`}>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Jami Ro'yxat</p>
                    <p className="text-2xl font-bold text-blue-500 mt-1">{adminStats.payments.total_enrollments}</p>
                  </div>
                  <div className={`${isDark ? 'bg-slate-800/50' : 'bg-purple-50'} rounded-lg p-4`}>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Jami To'lovlar</p>
                    <p className="text-2xl font-bold text-purple-500 mt-1">{adminStats.payments.total_payments}</p>
                  </div>
                  <div className={`${isDark ? 'bg-slate-800/50' : 'bg-green-50'} rounded-lg p-4`}>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tasdiqlangan</p>
                    <p className="text-2xl font-bold text-green-500 mt-1">{adminStats.payments.confirmed}</p>
                  </div>
                  <div className={`${isDark ? 'bg-slate-800/50' : 'bg-orange-50'} rounded-lg p-4`}>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Kutilayotgan</p>
                    <p className="text-2xl font-bold text-orange-500 mt-1">{adminStats.payments.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Sources */}
            <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-white' : 'text-slate-900'}>Userlar Manba (Ijtimoiy Tarmoqlar)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={adminStats.user_sources}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ source, percent }) => `${source}: ${(percent).toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percent"
                      >
                        {adminStats.user_sources.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'][index % 6]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                          borderRadius: '8px',
                          color: isDark ? '#f1f5f9' : '#1e293b'
                        }}
                        formatter={(value: any) => `${Number(value).toFixed(1)}%`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {adminStats.user_sources.map((source, idx) => (
                    <div key={source.source} className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-100'} rounded-lg p-3 border ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'][idx % 6] }}
                        />
                        <span className={`text-xs font-semibold capitalize ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{source.source}</span>
                      </div>
                      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{source.count}</p>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{source.percent.toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Courses Detail */}
          <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-slate-900'}>Kurslar bo'yicha Tafsilot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adminStats.courses.detail.map((course) => (
                  <div key={course.id} className={`flex items-center justify-between p-4 border ${isDark ? 'border-slate-700/50' : 'border-slate-200'} rounded-lg`}>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{course.name}</h4>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        💰 {Number(course.price).toLocaleString('uz-UZ')} so'm • 👥 {course.enrollments_count} o'quvchi • 👨‍🏫 {course.groups_count} guruh
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Active Groups */}
          <Card className={`border-none bg-gradient-to-br ${isDark ? 'from-slate-900/90 to-slate-800/90' : 'from-white to-slate-50'} backdrop-blur-sm`}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : 'text-slate-900'}>Eng Faol Guruhlar (Davomat %)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminStats.attendance.top_active_groups.map((group) => (
                <div key={group.group_id} className={`border ${isDark ? 'border-slate-700/50' : 'border-slate-200'} rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{group.group_name}</h4>
                    <Badge className="bg-blue-500/20 text-blue-600 border-0">{group.attendance_percent.toFixed(1)}%</Badge>
                  </div>
                  <div className={`h-2 ${isDark ? 'bg-slate-700/50' : 'bg-slate-200'} rounded-full overflow-hidden mb-2`}>
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      style={{ width: `${group.attendance_percent}%` }}
                    />
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Jami: {group.total_records} • ✓ {group.present_count} • ✗ {group.absent_count} • ~ {group.excuse_count}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="text-center py-12">
        <p className="text-muted-foreground">Statistika topilmadi</p>
      </div>
    </DashboardLayout>
  );
}
