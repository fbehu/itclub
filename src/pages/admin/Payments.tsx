import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Loader2,
  Plus,
  Eye,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreateEnrollmentDialog } from './enrollments/CreateEnrollmentDialog';


interface Payment {
  id: number;
  amount: string | number;
  payment_type: string;
  payment_type_code?: string;
  is_confirmed: boolean;
  date: string;
  note?: string;
}

interface ReceiptResponse {
  student_id?: string;
  student_name: string;
  student_phone: string | null;
  student_email: string;
  course_id?: string;
  course_name: string;
  course_duration_months?: number;
  course_monthly_price?: string;
  course_monthly_discount_price?: string;
  enrollment_id?: string | number;
  start_date?: string;
  end_date?: string | null;
  enrollment_status?: string;
  total_price: string | number;
  paid_amount: string | number;
  remaining_debt: string | number;
  payments: Payment[];
}

interface Enrollment {
  id: number;
  user_id: string;
  user_name: string;
  course_name: string;
  total_price: string | number;
  paid_amount: string | number;
  debt: string | number;
  remaining_debt: string | number;
  paid_percentage: number;
  monthly_payment: string | number;
  status: string;
  payments_history?: PaymentHistory[];
}

interface PaymentHistory {
  id: number;
  amount: number;
  payment_type: string;
  payment_type_display: string;
  note: string;
  is_confirmed: boolean;
  created_at: string;
}

interface AddPaymentData {
  enrollment_id: number;
  amount: string;
  payment_type: 'card' | 'cash';
}

type SortBy = 'name' | 'debt-high' | 'paid-high' | 'status';

export default function Payments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptResponse | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState<AddPaymentData>({
    enrollment_id: 0,
    amount: '',
    payment_type: 'card',
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  // computed info for when user types an amount
  const [paymentInfo, setPaymentInfo] = useState({ months: 0, remainder: 0 });

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/courses/enrollments-all/');
      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.results || []);
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

  const handleAddPayment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setPaymentFormData({
      enrollment_id: enrollment.id,
      amount: '',
      payment_type: 'card',
    });
    setPaymentInfo({ months: 0, remainder: 0 });
    setIsPaymentDialogOpen(true);
  };

  const handleViewReceipt = async (enrollmentId: number) => {
    try {
      setReceiptLoading(true);
      const response = await authFetch(`/payments/receipt/${enrollmentId}/`, {
        method: 'GET',
      });

      if (response.ok) {
        const data: ReceiptResponse = await response.json();
        setReceiptData(data);
        setIsReceiptDialogOpen(true);
      } else {
        toast.error('Chekni yuklashda xatolik');
      }
    } catch (error) {
      console.error('Error fetching receipt:', error);
      toast.error('Chekni yuklashda xatolik');
    } finally {
      setReceiptLoading(false);
    }
  };

  const submitPayment = async () => {
    if (!paymentFormData.amount || Number(paymentFormData.amount) <= 0) {
      toast.error('To\'lov miqdori 0 dan katta bo\'lishi kerak');
      return;
    }

    const monthly = Number(selectedEnrollment?.monthly_payment || 0);
    const amountNum = Number(paymentFormData.amount);

    // enforce at least monthly payment
    if (monthly > 0 && amountNum < monthly) {
      toast.error(`To'lov miqdori kamida oylik narx (${monthly.toLocaleString('uz-UZ')}) bo'lishi kerak`);
      return;
    }

    // don't allow paying more than remaining debt
    if (selectedEnrollment && amountNum > Number(selectedEnrollment.debt)) {
      toast.error('To\'lov miqdori qarzdan oshmasligi kerak');
      return;
    }

    try {
      setPaymentLoading(true);
      const response = await authFetch('/payments/receipt/' + paymentFormData.enrollment_id + '/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_amount: Number(paymentFormData.amount),
          payment_method: paymentFormData.payment_type,
        }),
      });

      if (response.ok) {
        const receiptData: ReceiptResponse = await response.json();
        toast.success('To\'lov saqlandi');
        setIsPaymentDialogOpen(false);
        // Update selected enrollment with new data from receipt
        setSelectedEnrollment({
          id: paymentFormData.enrollment_id,
          user_id: receiptData.student_id || '',
          user_name: receiptData.student_name,
          course_name: receiptData.course_name,
          total_price: receiptData.total_price,
          paid_amount: receiptData.paid_amount,
          debt: receiptData.remaining_debt,
          remaining_debt: receiptData.remaining_debt,
          paid_percentage: (Number(receiptData.paid_amount) / Number(receiptData.total_price)) * 100,
          monthly_payment: receiptData.course_monthly_price || '',
          status: receiptData.enrollment_status || 'active',
          payments_history: receiptData.payments?.map((p) => ({
            id: p.id,
            amount: Number(p.amount),
            payment_type: p.payment_type.toLowerCase().includes('card') ? 'card' : 'cash',
            payment_type_display: p.payment_type,
            note: p.note || '',
            is_confirmed: p.is_confirmed,
            created_at: p.date,
          })) || [],
        });
        loadEnrollments();
      } else {
        const error = await response.json();
        toast.error(error.detail || error.message || 'To\'lovni saqlashda xatolik');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('To\'lovni saqlashda xatolik');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Filter and sort
  const filteredEnrollments = enrollments
    .filter(
      (e) =>
        e.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.course_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'debt-high':
          return Number(b.debt) - Number(a.debt);
        case 'paid-high':
          return Number(b.paid_amount) - Number(a.paid_amount);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'name':
        default:
          return a.user_name.localeCompare(b.user_name);
      }
    });

  // Statistics
  const statistics = {
    totalEnrollments: enrollments.length,
    totalDebt: enrollments.reduce((sum, e) => sum + Number(e.debt), 0),
    totalPaid: enrollments.reduce((sum, e) => sum + Number(e.paid_amount), 0),
    activeEnrollments: enrollments.filter((e) => e.status === 'active').length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Yuklanmoqda...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">💳 To'lovlar</h1>
            <p className="text-sm text-muted-foreground mt-1">
              O'quvchilar to'lovlarini boshqarish
            </p>
          </div>
          <Button onClick={() => setIsEnrollmentDialogOpen(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Yangi Ro'yxat
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jami Ro'yxat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{statistics.totalEnrollments}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {statistics.activeEnrollments} ta faol
                </p>
              </CardContent>
            </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jami To'langan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {(statistics.totalPaid / 1000000).toFixed(2)}M
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Number(statistics.totalPaid).toLocaleString('uz-UZ')} so'm
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jami Qarz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {(statistics.totalDebt / 1000000).toFixed(2)}M
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Number(statistics.totalDebt).toLocaleString('uz-UZ')} so'm
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                To'lov Foizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {statistics.totalPaid + statistics.totalDebt > 0
                  ? (
                      (statistics.totalPaid /
                        (statistics.totalPaid + statistics.totalDebt)) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Umumiy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="O'quvchi yoki kurs nomini izlang..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nomi bo'yicha</SelectItem>
                  <SelectItem value="debt-high">Katta qarz</SelectItem>
                  <SelectItem value="paid-high">Katta to'lov</SelectItem>
                  <SelectItem value="status">Holati</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enrollments Table */}
        {filteredEnrollments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {enrollments.length === 0
                    ? "Hozircha ro'yxatlar yo'q"
                    : 'Qidirish natijasi topilmadi'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>O'quvchi</TableHead>
                      <TableHead>Kurs</TableHead>
                      <TableHead className="text-right">Umumiy</TableHead>
                      <TableHead className="text-right">To'langan</TableHead>
                      <TableHead className="text-right">Qarz</TableHead>
                      <TableHead className="text-center">Foiz</TableHead>
                      <TableHead className="text-center">Holati</TableHead>
                      <TableHead className="text-center">Harakat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">
                                {enrollment.user_name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {enrollment.user_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ID: {enrollment.user_id}
                              </span>
                            </div>
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
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {enrollment.paid_percentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              enrollment.status === 'active' ? 'default' : 'secondary'
                            }
                          >
                            {enrollment.status === 'active'
                              ? '🟢 Faol'
                              : '🔴 Tugagan'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewReceipt(enrollment.id)}
                              disabled={receiptLoading}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {Number(enrollment.debt) > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleAddPayment(enrollment)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                To'lov
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>To'lov Qo'shish</DialogTitle>
          </DialogHeader>

          {selectedEnrollment && (
            <div className="space-y-4">
              {/* Enrollment Info */}
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">O'quvchi</p>
                  <p className="font-semibold">{selectedEnrollment.user_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kurs</p>
                  <p className="font-semibold">{selectedEnrollment.course_name}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Umumiy</p>
                    <p className="font-bold text-sm">
                      {(Number(selectedEnrollment.total_price) / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">To'langan</p>
                    <p className="font-bold text-sm text-green-600">
                      {(Number(selectedEnrollment.paid_amount) / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Qarz</p>
                    <p className="font-bold text-sm text-red-600">
                      {(Number(selectedEnrollment.debt) / 1000000).toFixed(2)}M
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>To'lov Usuli *</Label>
                <RadioGroup
                  value={paymentFormData.payment_type}
                  onValueChange={(value) =>
                    setPaymentFormData((prev) => ({
                      ...prev,
                      payment_type: value as 'card' | 'cash',
                    }))
                  }
                >
                  <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted cursor-pointer">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">
                      💳 Karta
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted cursor-pointer">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex-1 cursor-pointer">
                      💵 Naqd Pul
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">To'lov Miqdori *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentFormData.amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPaymentFormData((prev) => ({
                        ...prev,
                        amount: val,
                      }));
                      // update distribution info
                      const m = Number(selectedEnrollment?.monthly_payment || 0);
                      const n = Number(val);
                      if (m > 0 && !isNaN(n)) {
                        const months = Math.floor(n / m);
                        const remainder = n - months * m;
                        setPaymentInfo({ months, remainder });
                      } else {
                        setPaymentInfo({ months: 0, remainder: 0 });
                      }
                    }}
                    placeholder="0"
                    min={selectedEnrollment ? String(selectedEnrollment.monthly_payment || 0) : '0'}
                    step="1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Oylik to'lov: {Number(selectedEnrollment?.monthly_payment || 0).toLocaleString('uz-UZ')} so'm.
                    {paymentInfo.months > 0 && (
                      <> Bu to'lov {paymentInfo.months} oy uchun.</>
                    )}
                    {paymentInfo.remainder > 0 && (
                      <>
                        {' '}Qoldiq {paymentInfo.remainder.toLocaleString('uz-UZ')} so'm keyingi oyga o'tadi.
                      </>
                    )}
                  </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button onClick={submitPayment} disabled={paymentLoading}>
              {paymentLoading ? 'Saqlanmoqda...' : 'Qo\'shish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Enrollment Details */}
      {selectedEnrollment && !isPaymentDialogOpen && (
        <Dialog
          open={selectedEnrollment !== null && !isPaymentDialogOpen}
          onOpenChange={(open) => {
            if (!open) setSelectedEnrollment(null);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Ro'yxat Detallari - {selectedEnrollment.user_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">O'quvchi</p>
                  <p className="font-bold">{selectedEnrollment.user_name}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">Kurs</p>
                  <p className="font-bold">{selectedEnrollment.course_name}</p>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Umumiy</p>
                  <p className="font-bold">
                    {(Number(selectedEnrollment.total_price) / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">To'langan</p>
                  <p className="font-bold text-green-600">
                    {(Number(selectedEnrollment.paid_amount) / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Qarz</p>
                  <p className="font-bold text-red-600">
                    {(Number(selectedEnrollment.debt) / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Foiz</p>
                  <p className="font-bold text-blue-600">
                    {selectedEnrollment.paid_percentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Payment History */}
              {selectedEnrollment.payments_history &&
                selectedEnrollment.payments_history.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">To'lov Tarixi</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                            {selectedEnrollment.payments_history?.map((payment) => (
                              <div
                                key={payment.id}
                                className="border rounded-lg p-3 flex justify-between items-start"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {payment.payment_type_display || payment.payment_type}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(payment.created_at).toLocaleDateString('uz-UZ', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                  {payment.note && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {payment.note}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-green-600">
                                    +{Number(payment.amount).toLocaleString('uz-UZ')} so'm
                                  </p>
                                  <Badge
                                    variant={payment.is_confirmed ? 'default' : 'secondary'}
                                    className="mt-1"
                                  >
                                    {payment.is_confirmed ? '✓ Tasdi' : 'Kutilmoqda'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                    </div>
                  </div>
                )}
            </div>

            <DialogFooter>
              <Button onClick={() => setSelectedEnrollment(null)}>Yopish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Receipt Details Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              💳 To'lov Cheki - {receiptData?.student_name}
            </DialogTitle>
          </DialogHeader>

          {receiptLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Yuklanmoqda...</span>
            </div>
          ) : receiptData ? (
            <div className="space-y-4">
              {/* Student & Course Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">👤 O'quvchi</p>
                  <p className="font-bold text-sm">{receiptData.student_name}</p>
                  {receiptData.student_phone && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {receiptData.student_phone}
                    </p>
                  )}
                  {receiptData.student_email && (
                    <p className="text-xs text-muted-foreground">
                      {receiptData.student_email}
                    </p>
                  )}
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">📚 Kurs</p>
                  <p className="font-bold text-sm">{receiptData.course_name}</p>
                  {receiptData.course_duration_months && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {receiptData.course_duration_months} oylik
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Summary Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Umumiy</p>
                  <p className="font-bold text-lg">
                    {(Number(receiptData.total_price) / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Number(receiptData.total_price).toLocaleString('uz-UZ')} so'm
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">To'langan</p>
                  <p className="font-bold text-lg text-green-600">
                    {(Number(receiptData.paid_amount) / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Number(receiptData.paid_amount).toLocaleString('uz-UZ')} so'm
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Qolgan Qarz</p>
                  <p className="font-bold text-lg text-red-600">
                    {(Number(receiptData.remaining_debt) / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Number(receiptData.remaining_debt).toLocaleString('uz-UZ')} so'm
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Foiz</p>
                  <p className="font-bold text-lg text-blue-600">
                    {receiptData.total_price
                      ? (
                          (Number(receiptData.paid_amount) /
                            Number(receiptData.total_price)) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>

              {/* Payment History */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  To'lov Tarixi ({receiptData.payments.length})
                </h3>
                {receiptData.payments.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {receiptData.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="border rounded-lg p-3 flex justify-between items-start hover:bg-muted/50 transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                payment.payment_type.toLowerCase().includes('card')
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {payment.payment_type}
                            </Badge>
                            <Badge
                              variant={
                                payment.is_confirmed ? 'default' : 'secondary'
                              }
                            >
                              {payment.is_confirmed ? '✓ Tasdi' : '⏳ Kutilmoqda'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(payment.date).toLocaleDateString('uz-UZ', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {payment.note && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📝 {payment.note}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            +{Number(payment.amount).toLocaleString('uz-UZ')} so'm
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      To'lov tarixı yo'q
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setIsReceiptDialogOpen(false)}>Yopish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Enrollment Dialog */}
      <CreateEnrollmentDialog
        open={isEnrollmentDialogOpen}
        onOpenChange={setIsEnrollmentDialogOpen}
        onSuccess={() => {
          setIsEnrollmentDialogOpen(false);
          loadEnrollments();
        }}
      />
    </DashboardLayout>
  );
}
