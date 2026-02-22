import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import {
  ArrowLeft,
  Search,
  TrendingUp,
  AlertCircle,
  Eye,
  Plus,
  Loader2,
} from 'lucide-react';

interface Payment {
  id: number;
  amount: number;
  payment_type: string;
  payment_type_display: string;
  note: string;
  is_confirmed: boolean;
  created_at: string;
}

interface Enrollment {
  id: number;
  user_id: string;
  user_name: string;
  course_name: string;
  course_description: string;
  course_duration: number;
  start_date: string;
  end_date: string | null;
  total_price: number;
  paid_amount: number;
  debt: number;
  monthly_payment: number;
  paid_percentage: number;
  status: string;
  payments_history: Payment[];
}

export default function MyEnrollments() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(
    null
  );

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/courses/enrollment/');
      if (response.ok) {
        const data = await response.json();
        setEnrollments(Array.isArray(data) ? data : data.results || []);
      } else {
        toast.error('Ro\'yxatlarni yuklashda xatolik');
      }
    } catch (error) {
      console.error('Error loading enrollments:', error);
      toast.error('Ro\'yxatlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter(
    (e) =>
      e.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalCourses: enrollments.length,
    totalPaid: enrollments.reduce((sum, e) => sum + e.paid_amount, 0),
    totalDebt: enrollments.reduce((sum, e) => sum + e.debt, 0),
    totalPayments: enrollments.reduce(
      (sum, e) => sum + e.payments_history.length,
      0
    ),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard/profile')}
              className="h-10 w-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Mening Kurslarim
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sizning xarid qilgan kurslar va to'lov tarixi
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/dashboard/student/course-purchase')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Yangi Kurs Sotib Olish
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jami Kurslar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalCourses}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                To'langan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {Number(stats.totalPaid).toLocaleString('uz-UZ')} so'm
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Qarz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {Number(stats.totalDebt).toLocaleString('uz-UZ')} so'm
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jami To'lovlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalPayments}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Kurs yoki o'quvchi nomini izlang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Enrollments Table */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Yuklanmoqda...</span>
            </CardContent>
          </Card>
        ) : enrollments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Hozircha hech qanday kurs sotib olmagan. 
                  <Button
                    variant="link"
                    className="ml-2 h-auto p-0"
                    onClick={() => navigate('/dashboard/student/course-purchase')}
                  >
                    Kurs sotib olishni boshlang
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : filteredEnrollments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Qidiruv natijasi topilmadi
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Ro'yxatlar ({filteredEnrollments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kurs</TableHead>
                      <TableHead>Davomiyligi</TableHead>
                      <TableHead className="text-right">Oylik Narx</TableHead>
                      <TableHead className="text-right">To'langan</TableHead>
                      <TableHead className="text-right">Qarz</TableHead>
                      <TableHead className="text-center">Progress</TableHead>
                      <TableHead className="text-center">Xolati</TableHead>
                      <TableHead className="text-center">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">
                              {enrollment.course_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Ro'yxat: #{enrollment.id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{enrollment.course_duration} oy</TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-purple-600">
                            {Number(
                              enrollment.monthly_payment
                            ).toLocaleString('uz-UZ')}{' '}
                            so'm
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-green-600">
                            {Number(
                              enrollment.paid_amount
                            ).toLocaleString('uz-UZ')}{' '}
                            so'm
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-red-600">
                            {Number(enrollment.debt).toLocaleString('uz-UZ')}{' '}
                            so'm
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(
                                    enrollment.paid_percentage,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold">
                              {enrollment.paid_percentage.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              enrollment.status === 'active'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {enrollment.status === 'active'
                              ? 'Faol'
                              : 'Tugatilgan'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEnrollment(enrollment)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detail Modal */}
        {selectedEnrollment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-muted">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Ro'yxat Detallari
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEnrollment(null)}
                >
                  ✕
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Umumiy Narx</p>
                    <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                      {Number(
                        selectedEnrollment.total_price
                      ).toLocaleString('uz-UZ')}{' '}
                      so'm
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">To'langan</p>
                    <p className="font-bold text-lg text-green-600 dark:text-green-400">
                      {Number(
                        selectedEnrollment.paid_amount
                      ).toLocaleString('uz-UZ')}{' '}
                      so'm
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Qarz</p>
                    <p className="font-bold text-lg text-red-600 dark:text-red-400">
                      {Number(selectedEnrollment.debt).toLocaleString('uz-UZ')}{' '}
                      so'm
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Oylik To'lov</p>
                    <p className="font-bold text-lg text-purple-600 dark:text-purple-400">
                      {Number(
                        selectedEnrollment.monthly_payment
                      ).toLocaleString('uz-UZ')}{' '}
                      so'm
                    </p>
                  </div>
                </div>

                {/* Payment History */}
                {selectedEnrollment.payments_history.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">To'lov Tarixi</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedEnrollment.payments_history.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {payment.payment_type_display}
                              </Badge>
                              {payment.is_confirmed && (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-xs"
                                >
                                  ✓
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(
                                payment.created_at
                              ).toLocaleDateString('uz-UZ')}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {Number(payment.amount).toLocaleString('uz-UZ')}{' '}
                            so'm
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
