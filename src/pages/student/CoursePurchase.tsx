import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  ShoppingCart,
  Clock,
  Users,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CreditCard,
} from 'lucide-react';

interface Course {
  id: number;
  name: string;
  description?: string;
  monthly_price: string | number;
  monthly_discount_price: string | number;
  course_duration: number;
  groups_list: number[];
}

interface Group {
  id: number;
  name: string;
  teacher: User | string;
  room: Room | string;
  class_days: string | string[];
  start_time: string;
  end_time: string;
  student_count?: number;
}

interface Room {
  id: number;
  name: string;
  floor?: number;
  capacity?: number;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  phone_number?: string;
  photo?: string;
  level?: string;
  role: string;
}

interface EnrollmentResponse {
  id: number;
  user_id?: string | number;
  user?: User | string;
  user_name?: string;
  course_name: string;
  total_price: number;
  paid_amount: number;
  debt: number;
  payments_history?: Array<{
    id: number;
    amount: number;
    payment_type: string;
    payment_type_display: string;
    note: string;
    is_confirmed: boolean;
    created_at: string;
  }>;
}

type Step = 'select-course' | 'select-group' | 'payment' | 'success';

export default function CoursePurchase() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // States
  const [step, setStep] = useState<Step>('select-course');
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Form states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [paymentAmount, setPaymentAmount] = useState('');

  // Enrollment result
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Load groups when course is selected
  useEffect(() => {
    if (selectedCourse) {
      loadGroups();
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await authFetch('/courses/');
      if (response.ok) {
        const data = await response.json();
        setCourses(Array.isArray(data) ? data : data.results || []);
      } else {
        toast.error('Kurslarni yuklashda xatolik');
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Kurslarni yuklashda xatolik');
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadGroups = async () => {
    if (!selectedCourse) return;

    try {
      setLoadingGroups(true);
      const response = await authFetch(
        `/groups/?course=${selectedCourse.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setGroups(Array.isArray(data) ? data : data.results || []);
        setSelectedGroup(null); // Reset selected group
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Guruhlarni yuklashda xatolik');
    } finally {
      setLoadingGroups(false);
    }
  };

  const monthlyPrice = selectedCourse
    ? Number(selectedCourse.monthly_discount_price)
    : 0;
  const totalPrice = selectedCourse
    ? monthlyPrice * selectedCourse.course_duration
    : 0;

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setStep('select-group');
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setStep('payment');
    setPaymentAmount('');
  };

  const handleConfirmPurchase = async () => {
    if (!selectedCourse || !selectedGroup || !paymentAmount) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }

    const amount = Number(paymentAmount);

    if (amount <= 0) {
      toast.error('To\'lov miqdori 0 dan katta bo\'lishi kerak');
      return;
    }

    if (amount > monthlyPrice) {
      toast.error(
        `To'lov oylik narxdan (${monthlyPrice.toLocaleString('uz-UZ')}) oshmasligi kerak`
      );
      return;
    }

    try {
      setLoading(true);
      const response = await authFetch('/courses/enrollment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: user?.id,
          course_id: selectedCourse.id,
          group_id: selectedGroup.id,
          payment_method: paymentMethod,
          payment_amount: amount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEnrollment(data);
        setStep('success');
        toast.success('Kurs muvaffaqiyatli sotib olindi!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Xatolik yuz berdi');
      }
    } catch (error) {
      console.error('Error creating enrollment:', error);
      toast.error('Xatolik yuz berdi');
    } finally {
      setLoading(false);
      setConfirmDialog(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
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
              Kurs Sotib Olish
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Siz istalgan kurs va guruhni tanlang
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {(['select-course', 'select-group', 'payment', 'success'] as const).map(
            (s, index) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step === s
                      ? 'bg-primary text-primary-foreground'
                      : (['select-course', 'select-group', 'payment'].includes(s) &&
                          step === 'success') ||
                          (s === 'select-group' && step !== 'select-course') ||
                          (s === 'payment' && step === 'payment')
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step === 'success'
                        ? 'bg-green-500'
                        : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            )
          )}
        </div>

        {/* Step 1: Select Course */}
        {step === 'select-course' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                1. Kurs Tanlash
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCourses ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">
                    Yuklanmoqda...
                  </span>
                </div>
              ) : courses.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Hozircha yangi kurslar yo'q
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {courses.map((course) => (
                    <Card
                      key={course.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">
                              {course.name}
                            </h3>
                            {course.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {course.description}
                              </p>
                            )}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  Oylik narx:
                                </span>
                                <p className="font-semibold text-green-600">
                                  {Number(
                                    course.monthly_discount_price
                                  ).toLocaleString('uz-UZ')}{' '}
                                  so'm
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Davomiyligi:
                                </span>
                                <p className="font-semibold">
                                  {course.course_duration} oy
                                </p>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground">
                                  Umumiy narx:
                                </span>
                                <p className="font-semibold text-blue-600">
                                  {(
                                    Number(
                                      course.monthly_discount_price
                                    ) * course.course_duration
                                  ).toLocaleString('uz-UZ')}{' '}
                                  so'm
                                </p>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleCourseSelect(course)}
                            className="w-full sm:w-auto"
                          >
                            Tanlash
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Group */}
        {step === 'select-group' && selectedCourse && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  2. Guruh Tanlash
                </CardTitle>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Tanlangan kurs:</p>
                  <p className="font-semibold">{selectedCourse.name}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingGroups ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">
                    Yuklanmoqda...
                  </span>
                </div>
              ) : groups.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Bu kurs uchun hozircha guruhlar yo'q
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {groups.map((group) => (
                    <Card
                      key={group.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex-1 space-y-3">
                            <h3 className="font-semibold text-lg">
                              {group.name}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-start gap-2">
                                <span className="text-muted-foreground">
                                  👨‍🏫 O'qituvchi:
                                </span>
                                <p className="font-medium">
                                  {typeof group.teacher === 'object' && group.teacher !== null
                                    ? `${group.teacher.first_name} ${group.teacher.last_name}`
                                    : String(group.teacher)}
                                </p>
                              </div>
                              <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">
                                    {Array.isArray(group.class_days)
                                      ? group.class_days.join(', ')
                                      : group.class_days}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {group.start_time} - {group.end_time}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Building2 className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                <p className="font-medium">
                                  {typeof group.room === 'object' && group.room !== null
                                    ? group.room.name
                                    : String(group.room)}
                                </p>
                              </div>
                              {group.student_count !== undefined && (
                                <div className="flex items-start gap-2">
                                  <Users className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                  <p className="font-medium">
                                    {group.student_count} ta o'quvchi
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleGroupSelect(group)}
                            className="w-full sm:w-auto"
                          >
                            Tanlash
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => {
                  setSelectedCourse(null);
                  setStep('select-course');
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ortga
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment */}
        {step === 'payment' && selectedCourse && selectedGroup && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                3. To'lov
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Tanlangan kurs</p>
                  <p className="font-semibold text-lg">{selectedCourse.name}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Tanlangan guruh</p>
                  <p className="font-semibold text-lg">{selectedGroup.name}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Oylik narx</p>
                  <p className="font-semibold text-lg text-purple-600 dark:text-purple-400">
                    {monthlyPrice.toLocaleString('uz-UZ')} so'm
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Umumiy narx</p>
                  <p className="font-semibold text-lg text-orange-600 dark:text-orange-400">
                    {totalPrice.toLocaleString('uz-UZ')} so'm
                  </p>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <Label className="text-base">To'lov Usuli</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) =>
                    setPaymentMethod(value as 'card' | 'cash')
                  }
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">
                      <div className="font-semibold">💳 Karta orqali</div>
                      <div className="text-xs text-muted-foreground">
                        Debit yoki kredit karta
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex-1 cursor-pointer">
                      <div className="font-semibold">💵 Naqd Pul</div>
                      <div className="text-xs text-muted-foreground">
                        Qasos pul bilan to'lash
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Payment Amount */}
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-base">
                  Dastlabki To'lov Miqdori *
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    max={monthlyPrice}
                    step="1000"
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    so'm
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Maksimum: {monthlyPrice.toLocaleString('uz-UZ')} so'm (oylik
                  narx)
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedGroup(null);
                    setStep('select-group');
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Ortga
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setConfirmDialog(true)}
                  disabled={!paymentAmount || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Jarayonda...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Sotib Olish
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 'success' && enrollment && (
          <Card>
            <CardHeader className="bg-green-50 dark:bg-green-950 border-b">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="w-6 h-6" />
                Muvaffaqiyatli Sotib Olindi!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">
                  Ro'yxatlanish Ma'lumotlari
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Ro'yxat ID:</span>
                    <p className="font-semibold"># {enrollment.id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">O'quvchi:</span>
                    <p className="font-semibold">
                      {typeof enrollment.user === 'object' && enrollment.user
                        ? `${enrollment.user.first_name} ${enrollment.user.last_name}`
                        : enrollment.user_name || (typeof enrollment.user === 'string' ? enrollment.user : 'N/A')}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kurs:</span>
                    <p className="font-semibold">{enrollment.course_name}</p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">To'lov Xulasasi</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Umumiy Narx
                    </p>
                    <p className="font-bold text-lg">
                      {Number(
                        enrollment.total_price
                      ).toLocaleString('uz-UZ')}{' '}
                      so'm
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      To'langan
                    </p>
                    <p className="font-bold text-lg text-green-600 dark:text-green-400">
                      {Number(
                        enrollment.paid_amount
                      ).toLocaleString('uz-UZ')}{' '}
                      so'm
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Qarz</p>
                    <p className="font-bold text-lg text-red-600 dark:text-red-400">
                      {Number(enrollment.debt).toLocaleString('uz-UZ')} so'm
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Oylik To'lov
                    </p>
                    <p className="font-bold text-lg text-purple-600 dark:text-purple-400">
                      {(monthlyPrice).toLocaleString('uz-UZ')} so'm
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {enrollment.payments_history && enrollment.payments_history.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">To'lov Cheki</h3>
                  {enrollment.payments_history.map((payment) => (
                    <Card key={payment.id} className="border">
                      <CardContent className="pt-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant={
                                  payment.payment_type === 'card'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {payment.payment_type_display}
                              </Badge>
                              {payment.is_confirmed && (
                                <Badge variant="outline" className="bg-green-50">
                                  ✓ Tasdiqlangan
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {payment.note}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {Number(payment.amount).toLocaleString('uz-UZ')}{' '}
                              so'm
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                payment.created_at
                              ).toLocaleDateString('uz-UZ', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/dashboard/profile')}
                >
                  Mening Kurslarim
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setStep('select-course');
                    setSelectedCourse(null);
                    setSelectedGroup(null);
                    setPaymentAmount('');
                    setEnrollment(null);
                  }}
                >
                  Boshqa Kurs Sotib Olish
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sotib Olishni Tasdiqlang</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3 mt-4">
                <p>Tanlangan kurs va guruh:</p>
                <div className="bg-muted rounded-lg p-3 space-y-2">
                  <p>
                    <strong>Kurs:</strong> {selectedCourse?.name}
                  </p>
                  <p>
                    <strong>Guruh:</strong> {selectedGroup?.name}
                  </p>
                  <p>
                    <strong>To'lov usuli:</strong>{' '}
                    {paymentMethod === 'card' ? '💳 Karta' : '💵 Naqd pul'}
                  </p>
                  <p>
                    <strong>To'lov miqdori:</strong>{' '}
                    {Number(paymentAmount).toLocaleString('uz-UZ')} so'm
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPurchase}
              disabled={loading}
              className="bg-primary"
            >
              {loading ? 'Jarayonda...' : 'Sotib Olishni Tasdiqlash'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
