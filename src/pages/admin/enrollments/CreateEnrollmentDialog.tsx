import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { Search, Loader2 } from 'lucide-react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

interface Course {
  id: number;
  name: string;
  monthly_price: string | number;
  monthly_discount_price: string | number;
}

interface Group {
  id: number;
  name: string;
  teacher: string | { first_name: string; last_name: string };
  room: string | { name: string };
  start_time: string;
  end_time: string;
  class_days: string | string[];
}

interface Payment {
  id: number;
  amount: number;
  payment_type: string;
  payment_type_display: string;
  note: string;
  is_confirmed: boolean;
  created_at: string;
}

interface EnrollmentResponse {
  id: number;
  student_id: string;
  course_id: number;
  group_id: number;
  payments_history: Payment[];
}

interface CreateEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateEnrollmentDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateEnrollmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [receipt, setReceipt] = useState<EnrollmentResponse | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    group_id: '',
    payment_method: 'card',
    payment_amount: '',
  });

  useEffect(() => {
    if (open) {
      loadCourses();
    }
  }, [open]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-student-search]')) {
        setShowStudentDropdown(false);
      }
    };

    if (showStudentDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showStudentDropdown]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadStudents = async (searchQuery: string = '') => {
    try {
      setLoadingStudents(true);
      let url = '/users/?role=student&ordering=-created_at';
      
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.results || data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error("O'quvchilarni yuklashda xatolik");
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStudentSearch = (searchTerm: string) => {
    setStudentSearchTerm(searchTerm);
    setShowStudentDropdown(true);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search - wait 500ms after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      loadStudents(searchTerm);
    }, 500);
  };

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await authFetch('/courses/');
      if (response.ok) {
        const data = await response.json();
        setCourses(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Kurslarni yuklashda xatolik');
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadGroups = async (courseId: string) => {
    if (!courseId) {
      setGroups([]);
      return;
    }

    try {
      setLoadingGroups(true);
      const response = await authFetch(`/groups/?course=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setGroups(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Guruhlarni yuklashda xatolik');
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const selectedCourse = courses.find(
    (c) => c.id.toString() === formData.course_id
  );
  const maxPaymentAmount = selectedCourse
    ? Number(selectedCourse.monthly_discount_price)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.student_id || !formData.course_id || !formData.group_id || !formData.payment_amount) {
      toast.error('Barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    const paymentAmount = Number(formData.payment_amount);

    if (paymentAmount <= 0) {
      toast.error('To\'lov miqdori 0 dan katta bo\'lishi kerak');
      return;
    }

    if (paymentAmount > maxPaymentAmount) {
      toast.error(
        `To'lov miqdori oylik narxdan (${Number(
          selectedCourse?.monthly_discount_price
        ).toLocaleString('uz-UZ')}) oshmasligi kerak`
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
          student_id: formData.student_id,
          course_id: parseInt(formData.course_id),
          group_id: parseInt(formData.group_id),
          payment_method: formData.payment_method,
          payment_amount: paymentAmount,
        }),
      });

      if (response.ok) {
        const data: EnrollmentResponse = await response.json();
        setReceipt(data);
        setFormData({
          student_id: '',
          course_id: '',
          group_id: '',
          payment_method: 'card',
          payment_amount: '',
        });
      } else {
        const error = await response.json();
        
        // Handle specific error messages
        if (error.non_field_errors && error.non_field_errors.length > 0) {
          toast.error(error.non_field_errors[0]);
        } else if (error.message) {
          toast.error(error.message);
        } else {
          toast.error('Ro\'yxatni yaratishda xatolik');
        }
      }
    } catch (error) {
      console.error('Error creating enrollment:', error);
      toast.error('Ro\'yxatni yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === formData.student_id);

  if (receipt) {
    const payment = receipt.payments_history?.[0];

    return (
      <Dialog open={open} onOpenChange={() => {
        setReceipt(null);
        onOpenChange(false);
        onSuccess();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600">✓ To'lov Cheki</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Enrollment ID */}
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Ro'yxat ID</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                #{receipt.id}
              </p>
            </div>

            {/* Payment Details */}
            {payment && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">To'lov Usuli:</span>
                  <span className="font-semibold">
                    {payment.payment_type === 'cash' ? '💵 Naqd Pul' : '💳 Karta'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Summa:</span>
                  <span className="text-lg font-bold text-green-600">
                    {Number(payment.amount).toLocaleString('uz-UZ')} so'm
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Holati:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    {payment.is_confirmed ? '✓ Tasdiqlangan' : 'Kutilmoqda'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Vaqt:</span>
                  <span className="text-sm font-medium">
                    {new Date(payment.created_at).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {payment.note && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Izoh:</p>
                    <p className="text-sm font-medium">{payment.note}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => {
                setReceipt(null);
                onOpenChange(false);
                onSuccess();
              }}
            >
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>O'quvchini Kursga Yozish</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Selection with Search */}
          <div className="space-y-2" data-student-search>
            <Label htmlFor="student">O'quvchi *</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="student"
                  placeholder="O'quvchi ismini yozing..."
                  value={
                    formData.student_id
                      ? selectedStudent
                        ? `${selectedStudent.first_name} ${selectedStudent.last_name}`
                        : studentSearchTerm
                      : studentSearchTerm
                  }
                  onChange={(e) => handleStudentSearch(e.target.value)}
                  onFocus={() => {
                    setShowStudentDropdown(true);
                    if (students.length === 0 && !studentSearchTerm) {
                      loadStudents();
                    }
                  }}
                  className="pl-10"
                />
                {loadingStudents && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Dropdown */}
              {showStudentDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-md">
                  <div className="max-h-64 overflow-y-auto">
                    {students.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {loadingStudents
                          ? "Yuklanmoqda..."
                          : "O'quvchi topilmadi"}
                      </div>
                    ) : (
                      students.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              student_id: student.id,
                            }));
                            setStudentSearchTerm(
                              `${student.first_name} ${student.last_name}`
                            );
                            setShowStudentDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-muted border-b last:border-b-0 transition flex items-center gap-3"
                        >
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {(student.first_name || '')[0]}
                              {(student.last_name || '')[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium truncate">
                              {student.first_name} {student.last_name}
                            </span>
                            {student.phone_number && (
                              <span className="text-xs text-muted-foreground truncate">
                                {student.phone_number}
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course">Kurs *</Label>
            <Select
              value={formData.course_id}
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  course_id: value,
                  group_id: '',
                  payment_amount: '',
                }));
                loadGroups(value);
              }}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingCourses ? "Yuklanmoqda..." : "Kursni tanlang"}
                >
                  {selectedCourse && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedCourse.name}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{course.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Oylik: {Number(
                          course.monthly_discount_price
                        ).toLocaleString('uz-UZ')}{' '}
                        so'm
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group Selection */}
          {formData.course_id && (
            <div className="space-y-2">
              <Label htmlFor="group">Guruh *</Label>
              <Select
                value={formData.group_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    group_id: value,
                    payment_amount: '',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingGroups ? "Yuklanmoqda..." : "Guruhni tanlang"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {groups.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Bu kurs uchun guruhlar yo'q
                    </div>
                  ) : (
                    groups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{group.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {group.start_time} - {group.end_time}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">To'lov Usuli *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, payment_method: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">💳 Karta</SelectItem>
                <SelectItem value="cash">💵 Naqd Pul</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Amount */}
          {selectedCourse && (
            <div className="space-y-2">
              <Label htmlFor="payment_amount">
                To'lov Miqdori (Maksimum: {Number(
                  selectedCourse.monthly_discount_price
                ).toLocaleString('uz-UZ')}{' '}
                so'm) *
              </Label>
              <Input
                type="number"
                id="payment_amount"
                value={formData.payment_amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    payment_amount: e.target.value,
                  }))
                }
                placeholder="0"
                min="0"
                max={maxPaymentAmount}
                step="1000"
              />
              <p className="text-xs text-muted-foreground">
                Dastlabki to'lov oylik narxdan oshmasligi kerak
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saqlanmoqda...' : 'Qo\'shish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
