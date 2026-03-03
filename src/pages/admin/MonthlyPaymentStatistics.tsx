import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import {
  AlertCircle,
  Loader2,
  Calendar,
  TrendingUp,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Month {
  year: number;
  month: number;
  month_name: string;
  display_label: string;
  is_current: boolean;
}

interface DailyPayment {
  date: string;
  day_of_week: string;
  student_id: string;
  student_name: string;
  student_phone: string | null;
  student_email: string;
  course_name: string;
  amount: string | number;
  payment_type: string;
  payment_type_code: string;
}

interface MonthlyStatistics {
  year: number;
  month: number;
  month_name: string;
  month_days: number;
  total_amount: string | number;
  total_payments_count: number;
  daily_payments: DailyPayment[];
}

export default function MonthlyPaymentStatistics() {
  const [months, setMonths] = useState<Month[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Month | null>(null);
  const [statistics, setStatistics] = useState<MonthlyStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'amount'>('date');

  // Load available months on mount
  useEffect(() => {
    loadAvailableMonths();
  }, []);

  // Load statistics when month is selected
  useEffect(() => {
    if (selectedMonth) {
      loadStatistics(selectedMonth.year, selectedMonth.month);
    }
  }, [selectedMonth]);

  const loadAvailableMonths = async () => {
    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.PAYMENTS_AVAILABLE_MONTHS);
      
      if (response.ok) {
        const data = await response.json();
        setMonths(data.months || []);
        
        // Auto-select current month
        const currentMonth = data.months?.find((m: Month) => m.is_current);
        if (currentMonth) {
          setSelectedMonth(currentMonth);
        }
      } else {
        toast.error('Oylarni yuklashda xatolik');
      }
    } catch (error) {
      console.error('Error loading months:', error);
      toast.error('Oylarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async (year: number, month: number) => {
    try {
      setStatisticsLoading(true);
      const response = await authFetch(
        API_ENDPOINTS.PAYMENTS_MONTHLY_STATISTICS(year, month)
      );
      
      if (response.ok) {
        const data: MonthlyStatistics = await response.json();
        setStatistics(data);
      } else {
        toast.error('Statistikani yuklashda xatolik');
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast.error('Statistikani yuklashda xatolik');
    } finally {
      setStatisticsLoading(false);
    }
  };

  const getPaymentTypeColor = (type: string) => {
    if (type.toLowerCase().includes('card')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  const getSortedPayments = () => {
    if (!statistics?.daily_payments) return [];
    
    const payments = [...statistics.daily_payments];
    
    switch (sortBy) {
      case 'date':
        return payments.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      case 'name':
        return payments.sort((a, b) => 
          a.student_name.localeCompare(b.student_name)
        );
      case 'amount':
        return payments.sort((a, b) => 
          Number(b.amount) - Number(a.amount)
        );
      default:
        return payments;
    }
  };

  const exportToExcel = () => {
    if (!statistics) {
      toast.error('Statistika mavjud emas');
      return;
    }

    try {
      // Prepare data for export
      const exportData = getSortedPayments().map((payment) => ({
        'O\'quvchi': payment.student_name,
        'Email': payment.student_email,
        'Telefon': payment.student_phone || '—',
        'Sana': new Date(payment.date).toLocaleDateString('uz-UZ', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        'Haftaning Kuni': payment.day_of_week,
        'Kurs': payment.course_name,
        'Summa': Number(payment.amount),
        'Turi': payment.payment_type === 'Card' ? 'Karta' : 'Naqd',
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'To\'lovlar');

      // Set column widths
      ws['!cols'] = [
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 20 },
        { wch: 12 },
        { wch: 10 },
      ];

      // Add summary sheet
      const summaryData = [
        ['OYLIK TO\'LOV STATISTIKASI'],
        [],
        ['Oy:', statistics.month_name],
        ['Yil:', statistics.year],
        ['Oyning kunlari:', statistics.month_days],
        ['Umumiy to\'lovlar:', Number(statistics.total_amount)],
        ['To\'lovlar soni:', statistics.total_payments_count],
      ];

      const sumWs = XLSX.utils.aoa_to_sheet(summaryData);
      sumWs['!cols'] = [{ wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, sumWs, 'Statistika');

      // Generate filename with month and year
      const filename = `Oylik_Tolovlar_${statistics.month_name}_${statistics.year}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
      toast.success(`${filename} yuklandi`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Excel-ga export qilishda xatolik');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">📅 Oylik To'lovlar Statistikasi</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Kunlik bo'yicha tartiblangan oylik to'lov ma'lumotlari
        </p>
      </div>

      {/* Month Tabs */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-border overflow-x-auto">
        {months.map((month) => (
          <button
            key={`${month.year}-${month.month}`}
            onClick={() => setSelectedMonth(month)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
              selectedMonth?.year === month.year && selectedMonth?.month === month.month
                ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                : 'bg-muted text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {month.display_label}
          </button>
        ))}
      </div>

      {/* Statistics Summary */}
      {statisticsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Statistika yuklanmoqda...</span>
        </div>
      ) : statistics ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Oy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{statistics.month_name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {statistics.year} yil
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Umumiy To'lovlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {(Number(statistics.total_amount).toLocaleString('uz-UZ'))} so'm
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Number(statistics.total_amount).toLocaleString('uz-UZ')} so'm
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  To'lovlar Soni
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {statistics.total_payments_count}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ta to'lov
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Oyning Kunlari
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600">
                  {statistics.month_days}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  kun
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Payments */}
          {statistics.daily_payments.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Kunlik To'lovlar
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToExcel}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Excel
                    </Button>
                  </div>
                  {/* Desktop: Buttons */}
                  <div className="hidden sm:flex gap-2">
                    <Button
                      variant={sortBy === 'date' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy('date')}
                    >
                      📅 Sana
                    </Button>
                    <Button
                      variant={sortBy === 'name' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy('name')}
                    >
                      👤 Nom
                    </Button>
                    <Button
                      variant={sortBy === 'amount' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy('amount')}
                    >
                      💰 Summa
                    </Button>
                  </div>
                  {/* Mobile: Select */}
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'name' | 'amount')}>
                    <SelectTrigger className="sm:hidden w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">📅 Sana</SelectItem>
                      <SelectItem value="name">👤 Nom</SelectItem>
                      <SelectItem value="amount">💰 Summa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>O'quvchi</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Sana</TableHead>
                        <TableHead>Haftaning Kuni</TableHead>
                        <TableHead>Kurs</TableHead>
                        <TableHead className="text-right">Summa</TableHead>
                        <TableHead className="text-center">Turi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSortedPayments().map((payment, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                  {payment.student_name
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {payment.student_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {payment.student_email}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.student_phone || '—'}
                          </TableCell>
                                                    
                          <TableCell className="font-medium">
                            {new Date(payment.date).toLocaleDateString('uz-UZ', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.day_of_week}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {payment.course_name}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {Number(payment.amount).toLocaleString('uz-UZ')} so'm
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={getPaymentTypeColor(payment.payment_type)}>
                              {payment.payment_type === 'Card'
                                ? '💳 Karta'
                                : '💵 Naqd'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Shu oyda to'lov tarixı yo'q
              </AlertDescription>
            </Alert>
          )}
        </>
      ) : null}
    </div>
  );
}
