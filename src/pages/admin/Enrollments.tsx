import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CreditCard, 
  Search, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Eye,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateEnrollmentDialog } from './enrollments/CreateEnrollmentDialog';

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
  course_description?: string;
  course_duration: number;
  start_date: string;
  end_date: string | null;
  total_price: string | number;
  paid_amount: string | number;
  debt: string | number;
  remaining_debt?: string | number;
  monthly_payment: string | number;
  paid_percentage: number;
  status: string;
  payments_history?: Payment[];
  monthly_breakdown?: Record<string, any>[];
}

export default function Enrollments() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/courses/enrollments-all/');
      if (response.ok) {
        const data = await response.json();
        setEnrollments(Array.isArray(data) ? data : data.results || []);
      } else {
        toast.error('Enrollmentlarni yuklashda xatolik');
      }
    } catch (error) {
      console.error('Error loading enrollments:', error);
      toast.error('Enrollmentlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-muted-foreground">Yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">O'quvchi Ro'yxatlari</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kursga yozilgan o'quvchilar va ularning to'lovlari
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yangi Ro'yxat Qo'shish
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">Jami Ro'yxat</p>
                <p className="text-2xl font-bold mt-1">{enrollments.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground">Jami To'langan</p>
                <p className="text-2xl font-bold mt-1">
                  {(
                    enrollments.reduce((sum, e) => sum + Number(e.paid_amount), 0) / 1000000
                  ).toFixed(2)}
                  M
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <p className="text-sm text-muted-foreground">Jami Qarz</p>
                <p className="text-2xl font-bold mt-1">
                  {(
                    enrollments.reduce((sum, e) => sum + Number(e.debt), 0) / 1000000
                  ).toFixed(2)}
                  M
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-muted-foreground">Jami Cheklar</p>
                <p className="text-2xl font-bold mt-1">
                  {enrollments.reduce((sum, e) => sum + (e.payments_history?.length || 0), 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="O'quvchi nomi yoki kurs nomini qidiring..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Enrollments Table */}
        <Card>
          <CardHeader>
            <CardTitle>O'quvchi Ro'yxatlari</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEnrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>O'quvchi</TableHead>
                      <TableHead>Kurs</TableHead>
                      <TableHead className="text-right">Jami Narx</TableHead>
                      <TableHead className="text-right">To'langan</TableHead>
                      <TableHead className="text-right">Qarz</TableHead>
                      <TableHead className="text-center">Foiz</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Cheklar</TableHead>
                      <TableHead className="text-center">Amal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {enrollment.user_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{enrollment.user_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {enrollment.course_name}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {Number(enrollment.total_price).toLocaleString('uz-UZ')} so'm
                        </TableCell>
                        <TableCell className="text-right text-green-600 dark:text-green-400 font-semibold">
                          {Number(enrollment.paid_amount).toLocaleString('uz-UZ')} so'm
                        </TableCell>
                        <TableCell className="text-right text-red-600 dark:text-red-400 font-semibold">
                          {Number(enrollment.debt).toLocaleString('uz-UZ')} so'm
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600"
                                style={{ width: `${enrollment.paid_percentage}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {enrollment.paid_percentage.toFixed(1)}%
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              enrollment.status === 'active'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {enrollment.status === 'active'
                              ? '🟢 Faol'
                              : '🔴 Tugagan'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {(enrollment.payments_history?.length || 0)} chek
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
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Qidiruv natijasi topilmadi" : "Hali ro'yxat yo'q"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enrollment Detail Modal */}
        {selectedEnrollment && (
          <EnrollmentDetailCard
            enrollment={selectedEnrollment}
            onClose={() => setSelectedEnrollment(null)}
            onPaymentAdded={() => loadEnrollments()}
          />
        )}

        {/* Create Enrollment Dialog */}
        <CreateEnrollmentDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => {
            loadEnrollments();
            setCreateDialogOpen(false);
          }}
        />
      </div>
    </DashboardLayout>
  );
}

// Enrollment Detail Card Component
function EnrollmentDetailCard({
  enrollment,
  onClose,
  onPaymentAdded,
}: {
  enrollment: Enrollment;
  onClose: () => void;
  onPaymentAdded: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{enrollment.user_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {enrollment.course_name}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Jami Narx</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {Number(enrollment.total_price).toLocaleString('uz-UZ')}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">To'langan</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {Number(enrollment.paid_amount).toLocaleString('uz-UZ')}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Qarz</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {Number(enrollment.debt).toLocaleString('uz-UZ')}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Oylik</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {Number(enrollment.monthly_payment).toLocaleString('uz-UZ')}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <p className="text-sm font-semibold mb-2">To'lov Murabbuasi</p>
            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-600"
                style={{ width: `${enrollment.paid_percentage}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {enrollment.paid_percentage.toFixed(2)}% to'langan
            </p>
          </div>

          {/* Payment History */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              To'lov Cheklari ({(enrollment.payments_history?.length || 0)})
            </h3>

            {(enrollment.payments_history?.length || 0) > 0 ? (
              <div className="space-y-3">
                {enrollment.payments_history?.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="mb-1">
                          {payment.payment_type_display}
                        </Badge>
                        {payment.is_confirmed && (
                          <Badge className="bg-green-600 mb-1">✓ Tasdiqlangan</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{payment.note}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(payment.created_at).toLocaleDateString('uz-UZ', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      +{Number(payment.amount).toLocaleString('uz-UZ')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Hali to'lov qo'linmagan
              </p>
            )}
          </div>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full">
            Yopish
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
