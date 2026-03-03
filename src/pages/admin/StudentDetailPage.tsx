import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, ArrowLeft, TrendingUp, Gift, Wallet, CheckCircle, Clock, XCircle } from 'lucide-react';

interface StudentReferralData {
  id: string;
  username: string;
  email?: string;
  phone_number?: string;
  full_name: string;
  photo?: string;
  total_referrals: number;
  available_money: number;
  total_vouchers: number;
}

interface Balance {
  total_referrals: number;
  total_money: number;
  withdrawn_money: number;
  available_money: number;
  total_vouchers: number;
  given_rewards_count: number;
}

interface Reward {
  id: number;
  student_username: string;
  referred_user_username: string;
  referred_user_full_name: string;
  reward_type: string;
  reward_type_display: string;
  amount: number | null;
  voucher_percent: number | null;
  status: string;
  status_display: string;
  is_given: boolean;
  created_at: string;
  given_at: string | null;
}

interface Withdrawal {
  id: number;
  student_username: string;
  student_full_name: string;
  amount: number;
  status: string;
  status_display: string;
  reason: string | null;
  approved_by_username: string | null;
  requested_at: string;
  approved_at: string | null;
}

interface Voucher {
  id: number;
  code: string;
  student_username: string;
  discount_percent: number;
  is_used: boolean;
  is_activated: boolean;
  created_at: string;
  activations: Array<{ id: number; course_title: string; activation_month: string; activated_at: string }>;
}

// simplified enrollment type for voucher activation dialog
interface Enrollment {
  id: number;
  course_name: string;
  payments_history?: Array<{ id: number; amount: number; created_at: string }>;
}

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount?: number;
  voucher_percent?: number;
  reward_type?: string;
  status?: string;
  approved_by?: string;
  reason?: string | null;
  requested_at?: string;
  approved_at?: string;
  created_at?: string;
  icon: string;
}

interface TransactionsResponse {
  student: {
    id: string;
    username: string;
    full_name: string;
  };
  total_transactions: number;
  transactions: Transaction[];
}

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [student, setStudent] = useState<StudentReferralData | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'rewards' | 'withdrawals' | 'vouchers' | 'transactions'>('overview');
  const [processingWithdrawal, setProcessingWithdrawal] = useState<number | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<{ [key: number]: string }>({});

  // withdrawal form state
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawingBalance, setWithdrawingBalance] = useState(false);

  // voucher activation UI state
  const [activateVoucher, setActivateVoucher] = useState<Voucher | null>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [activationMonth, setActivationMonth] = useState<string>('');
  const [activating, setActivating] = useState(false);

  // compute current and next month for activation logic
  const currentMonth = new Date().toISOString().slice(0, 7);
  const nextMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 7);
  })();

  // determine if current month has any payment recorded
  const currentPaid = studentEnrollments.some((enr) =>
    enr.payments_history?.some((p) => p.created_at.startsWith(currentMonth))
  );
  useEffect(() => {
    if (!studentId) {
      toast({
        title: 'Xato',
        description: 'Student ID topilmadi',
        variant: 'destructive',
      });
      navigate('/admin/referrals');
      return;
    }
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    setLoading(true);
    try {
      // Fetch student rewards, withdrawals, and vouchers
      const rewardsRes = await authFetch(API_ENDPOINTS.ADMIN_STUDENT_REWARDS(studentId!), { method: 'GET' });
      const withdrawalsRes = await authFetch(API_ENDPOINTS.ADMIN_WITHDRAWALS(studentId!), { method: 'GET' });
      const vouchersRes = await authFetch(API_ENDPOINTS.ADMIN_STUDENT_VOUCHERS(studentId!), { method: 'GET' });
      const transactionsRes = await authFetch(`/referrals/admin/student/${studentId}/transactions/`, { method: 'GET' });

      let rewardsData: Reward[] = [];
      let withdrawalsData: Withdrawal[] = [];
      let vouchersData: Voucher[] = [];
      let transactionsData: Transaction[] = [];

      if (rewardsRes.ok) {
        rewardsData = await rewardsRes.json();
        setRewards(rewardsData);
      }

      if (withdrawalsRes.ok) {
        const response = await withdrawalsRes.json();
        // API returns { student_id, student_name, username, count, withdrawals: [...] }
        if (response && Array.isArray(response.withdrawals)) {
          withdrawalsData = response.withdrawals;
        } else if (Array.isArray(response)) {
          // fallback: direct array
          withdrawalsData = response;
        } else {
          withdrawalsData = [];
        }
        setWithdrawals(withdrawalsData);
      }

      if (vouchersRes.ok) {
        const json = await vouchersRes.json();
        // API returns object with { student, vouchers, total, filters }
        if (json && Array.isArray(json.vouchers)) {
          vouchersData = json.vouchers;
        } else if (Array.isArray(json)) {
          // fallback in case endpoint returns plain array
          vouchersData = json;
        } else {
          vouchersData = [];
        }
        setVouchers(vouchersData);
      }

      if (transactionsRes.ok) {
        const transJson: TransactionsResponse = await transactionsRes.json();
        transactionsData = transJson.transactions || [];
        setTransactions(transactionsData);
      }

      // Calculate balance from rewards
      // balance endpoint provides aggregated data; preferred over manual computation
      try {
        const balRes = await authFetch(API_ENDPOINTS.ADMIN_STUDENT_BALANCE(studentId!), { method: 'GET' });
        if (balRes.ok) {
          const balJson: Balance = await balRes.json();
          setBalance(balJson);
        } else {
          // fallback: compute locally if balance endpoint fails
          console.warn('Balance API returned non-ok status, falling back to manual calc');
          const totalMoney = rewardsData
            ?.filter((r: Reward) => r.reward_type === 'MONEY' && r.is_given)
            .reduce((sum: number, r: Reward) => sum + (r.amount || 0), 0) || 0;

          const withdrawnMoney = withdrawalsData
            ?.filter((w: Withdrawal) => w.status === 'APPROVED' || w.status === 'COMPLETED')
            .reduce((sum: number, w: Withdrawal) => sum + w.amount, 0) || 0;

          setBalance({
            total_referrals: rewardsData?.length || 0,
            total_money: totalMoney,
            withdrawn_money: withdrawnMoney,
            available_money: totalMoney - withdrawnMoney,
            total_vouchers: vouchersData?.length || 0,
            given_rewards_count: rewardsData?.filter((r: Reward) => r.is_given).length || 0,
          });
        }
      } catch (balErr) {
        console.error('Error fetching balance:', balErr);
        // fallback to manual calculation as above
        const totalMoney = rewardsData
          ?.filter((r: Reward) => r.reward_type === 'MONEY' && r.is_given)
          .reduce((sum: number, r: Reward) => sum + (r.amount || 0), 0) || 0;

        const withdrawnMoney = withdrawalsData
          ?.filter((w: Withdrawal) => w.status === 'APPROVED' || w.status === 'COMPLETED')
          .reduce((sum: number, w: Withdrawal) => sum + w.amount, 0) || 0;

        setBalance({
          total_referrals: rewardsData?.length || 0,
          total_money: totalMoney,
          withdrawn_money: withdrawnMoney,
          available_money: totalMoney - withdrawnMoney,
          total_vouchers: vouchersData?.length || 0,
          given_rewards_count: rewardsData?.filter((r: Reward) => r.is_given).length || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching student details:', err);
      toast({
        title: 'Xato',
        description: 'Ma\'lumot yuklashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // fetch enrollments for current student to populate course dropdown
  const loadStudentEnrollments = async () => {
    if (!studentId) return;
    try {
      const res = await authFetch(`/courses/user/${studentId}/enrollments/`);
      if (res.ok) {
        const data = await res.json();
        setStudentEnrollments(Array.isArray(data) ? data : data.results || []);
      }
    } catch (e) {
      console.error('Error loading student enrollments:', e);
    }
  };

  // when dialog opens or the payment data updates compute default month
  useEffect(() => {
    if (activateVoucher) {
      // reset previous selections
      setSelectedCourseId(null);
      setActivationMonth(currentPaid ? nextMonth : currentMonth);
    }
  }, [activateVoucher, currentPaid, currentMonth, nextMonth]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500 text-white';
      case 'APPROVED':
      case 'COMPLETED':
        return 'bg-green-500 text-white';
      case 'REJECTED':
        return 'bg-red-500 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 mr-2" />;
      case 'APPROVED':
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 mr-2" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 mr-2" />;
      default:
        return null;
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: number) => {
    setProcessingWithdrawal(withdrawalId);
    try {
      const response = await authFetch(
        API_ENDPOINTS.ADMIN_APPROVE_WITHDRAWAL(withdrawalId),
        { method: 'PUT' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Tasdiqlashda xatolik');
      }

      toast({
        title: 'Muvaffaq! ✓',
        description: 'Withdrawal tasdiqlandi',
      });

      // Withdrawallarni qayta yuklash
      await fetchStudentDetails();
    } catch (err: any) {
      console.error('Error approving withdrawal:', err);
      toast({
        title: 'Xato',
        description: err.message || 'Tasdiqlashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setProcessingWithdrawal(null);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: number) => {
    const reason = rejectionReasons[withdrawalId]?.trim();
    
    if (!reason) {
      toast({
        title: 'Xato',
        description: 'Bekor qilish sababini kiriting',
        variant: 'destructive',
      });
      return;
    }

    setProcessingWithdrawal(withdrawalId);
    try {
      const response = await authFetch(
        API_ENDPOINTS.ADMIN_APPROVE_WITHDRAWAL(withdrawalId),
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bekor qilishda xatolik');
      }

      toast({
        title: 'Bekor qilindi ✓',
        description: 'Withdrawal bekor qilindi',
      });

      // Clear reason input
      setRejectionReasons({ ...rejectionReasons, [withdrawalId]: '' });

      // Withdrawallarni qayta yuklash
      await fetchStudentDetails();
    } catch (err: any) {
      console.error('Error rejecting withdrawal:', err);
      toast({
        title: 'Xato',
        description: err.message || 'Bekor qilishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setProcessingWithdrawal(null);
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!withdrawalAmount || Number(withdrawalAmount) <= 0) {
      toast({
        title: 'Xato',
        description: 'To\'lov miqdori 0 dan katta bo\'lishi kerak',
        variant: 'destructive',
      });
      return;
    }

    const amount = Number(withdrawalAmount);
    if (balance && amount > balance.available_money) {
      toast({
        title: 'Xato',
        description: 'Siz balansdan ko\'proq pulni yecha olmaysiz',
        variant: 'destructive',
      });
      return;
    }

    setWithdrawingBalance(true);
    try {
      const response = await authFetch(`${API_ENDPOINTS.ADMIN_REQUEST_WITHDRAWAL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: studentId,
          amount: amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || 'Pul yechishda xatolik');
      }

      toast({
        title: 'Muvaffaqiyat ✓',
        description: 'Pul yechish so\'rovi yuborish muvaffaqiyatli tugadi',
      });

      // Tozalash va qayta yuklash
      setWithdrawalAmount('');
      await fetchStudentDetails();
    } catch (err: any) {
      console.error('Error requesting withdrawal:', err);
      toast({
        title: 'Xato',
        description: err.message || 'Pul yechishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setWithdrawingBalance(false);
    }
  };

  return (
    <div className="w-full space-y-4 md:space-y-6 pb-8 px-3 md:px-0">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="h-9 w-9 p-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          Student Detail
        </h1>
      </div>

      {/* Student Info Card */}
      <Card className="border-2 border-purple-300 dark:border-purple-600">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4 w-full">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                {/* Student photo would go here if we have the data */}
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-lg sm:text-2xl">
                  {studentId?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white break-words">Student #{studentId}</p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Detailed Profile</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Balance Stats */}
      {balance && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-500/10 dark:to-purple-600/10 border-purple-200 dark:border-purple-500/30">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">Jami Taklif</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-200">{balance.total_referrals}</p>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 opacity-50 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-500/10 dark:to-green-600/10 border-green-200 dark:border-green-500/30">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">Hisobda qolgan</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-200">
                    {balance.available_money} so'm
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 break-words">
                    {balance.total_money.toLocaleString()} | -{balance.withdrawn_money.toLocaleString()}
                  </p>
                </div>
                <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 opacity-50 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-500/10 dark:to-amber-600/10 border-amber-200 dark:border-amber-500/30">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">Vaucherlar</p>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-900 dark:text-amber-200">{balance.total_vouchers}</p>
                </div>
                <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 opacity-50 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex gap-1 sm:gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {['overview', 'rewards', 'withdrawals', 'vouchers', 'transactions'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab as typeof activeSubTab)}
            className={`px-2 sm:px-4 py-2 font-semibold transition-all text-xs sm:text-sm whitespace-nowrap ${
              activeSubTab === tab
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
              {tab === 'overview' && '📊 Ko\'rinish'}
              {tab === 'rewards' && '🎁 Mukofot'}
              {tab === 'withdrawals' && '💳 Yechish'}
              {tab === 'vouchers' && '🎟️ Kupon'}
              {tab === 'transactions' && '📋 Tranz'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeSubTab === 'overview' && balance && (
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
                <CardTitle className="text-base sm:text-lg">Umumiy ma'lumot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Jami takliflar</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{balance.total_referrals}</p>
                </div>
                <div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Berilgan mukofotlar</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{balance.given_rewards_count}</p>
                </div>
                <div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Jami daromad</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 break-words">
                    {balance.total_money.toLocaleString()} so'm
                  </p>
                </div>
                <div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Jami yechilgan</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 break-words">
                    {balance.withdrawn_money.toLocaleString()} so'm
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rewards Tab */}
      {activeSubTab === 'rewards' && (
        <div className="space-y-3">
          {rewards.length > 0 ? (
            rewards.map((reward) => (
              <Card key={reward.id}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base break-words">
                          {reward.referred_user_full_name}
                        </p>
                        <span className="text-xs text-slate-500 dark:text-slate-400 break-all">@{reward.referred_user_username}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2 break-words">
                        {reward.reward_type_display}
                        {reward.amount && `: ${reward.amount.toLocaleString()} so'm`}
                        {reward.voucher_percent && `: ${reward.voucher_percent}% chegirma`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(reward.created_at).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                    <Badge className={`${getStatusBadgeColor(reward.status)} text-xs flex-shrink-0`}>
                      {reward.is_given ? '✓ ' : ''}{reward.status_display}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-4 sm:p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                Mukofotlar topilmadi
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeSubTab === 'withdrawals' && (
        <div className="space-y-4">
          {/* Withdrawal Request Form */}
          <Card className="border-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/30">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Pul Yechish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdrawal-amount" className="text-xs sm:text-sm">Yechib olish miqdori (so'm) *</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="withdrawal-amount"
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1000"
                    className="flex-1 px-2 sm:px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500"
                  />
                  <Button
                    onClick={handleRequestWithdrawal}
                    disabled={withdrawingBalance || !withdrawalAmount || !balance || Number(withdrawalAmount) <= 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                  >
                    {withdrawingBalance ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        <span className="hidden sm:inline">Sorov yuborilmoqda...</span>
                        <span className="sm:hidden">Yuborilmoqda...</span>
                      </>
                    ) : (
                      <>💸 Yechish</>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 break-words">
                  Maksimum: {balance ? balance.available_money.toLocaleString('uz-UZ') : 0} so'm
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3">Pul Yechish Tarixi</h3>
            {withdrawals.length > 0 ? (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <Card
                    key={withdrawal.id}
                    className={
                      withdrawal.status === 'REJECTED'
                        ? 'border-red-200 dark:border-red-500/30'
                        : withdrawal.status === 'PENDING'
                        ? 'border-yellow-200 dark:border-yellow-500/30'
                        : 'border-green-200 dark:border-green-500/30'
                    }
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
                              {withdrawal.amount.toLocaleString()} so'm
                            </p>
                            {getStatusIcon(withdrawal.status)}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2 break-words">
                            So'ralgan: {new Date(withdrawal.requested_at).toLocaleDateString('uz-UZ')}
                          </p>
                          {withdrawal.approved_at && (
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 break-words">
                              Tasdiqlovchi: {withdrawal.approved_by_username} ({new Date(withdrawal.approved_at).toLocaleDateString('uz-UZ')})
                            </p>
                          )}
                          {withdrawal.reason && (
                            <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-2 break-words">
                              Sabab: {withdrawal.reason}
                            </p>
                          )}
                        </div>

                        {/* PENDING status - Show approve/reject buttons */}
                        {withdrawal.status === 'PENDING' ? (
                          <div className="flex gap-2 flex-col w-full sm:w-auto sm:flex-col sm:min-w-max">
                            <Button
                              size="sm"
                              onClick={() => handleApproveWithdrawal(withdrawal.id)}
                              disabled={processingWithdrawal === withdrawal.id}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm w-full sm:w-auto"
                            >
                              {processingWithdrawal === withdrawal.id ? (
                                <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                              ) : (
                                <>✅ Tasdiqlash</>
                              )}
                            </Button>
                            <div className="flex gap-1 items-end w-full">
                              <input
                                type="text"
                                placeholder="Sababini kiriting..."
                                value={rejectionReasons[withdrawal.id] || ''}
                                onChange={(e) => setRejectionReasons({ ...rejectionReasons, [withdrawal.id]: e.target.value })}
                                disabled={processingWithdrawal === withdrawal.id}
                                className="text-xs px-2 py-1 border border-red-300 dark:border-red-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 flex-1 min-w-0"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectWithdrawal(withdrawal.id)}
                                disabled={processingWithdrawal === withdrawal.id || !rejectionReasons[withdrawal.id]?.trim()}
                                className="text-red-600 dark:text-red-400 whitespace-nowrap text-xs"
                              >
                                {processingWithdrawal === withdrawal.id ? (
                                  <Loader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>❌ Bekor</>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Not PENDING - Show status badge only */
                          <Badge className={`${getStatusBadgeColor(withdrawal.status)} text-xs sm:text-sm flex-shrink-0`}>
                            {withdrawal.status_display}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-4 sm:p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                  Pul yechish so'rovi topilmadi
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Vouchers Tab */}
      {activeSubTab === 'vouchers' && (
        <div className="space-y-3">
          {vouchers.length > 0 ? (
            vouchers.map((voucher) => (
              <Card
                key={voucher.id}
                className={`border-2 ${
                  voucher.is_activated
                    ? 'border-green-300 dark:border-green-600'
                    : 'border-amber-300 dark:border-amber-600'
                }`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0 w-full">
                        <code className="bg-slate-100 dark:bg-slate-800 px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm font-mono break-all">
                          {voucher.code}
                        </code>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
                          {voucher.discount_percent}% chegirma
                        </p>
                      </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={`text-xs ${
                              voucher.is_activated
                                ? 'bg-green-500 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {voucher.is_activated ? '✅ Aktivlashtirilgan' : '⏳'}
                          </Badge>
                          {!voucher.is_activated && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setActivateVoucher(voucher);
                                loadStudentEnrollments();
                              }}
                              className="text-xs"
                            >
                              Aktivlashtirish
                            </Button>
                          )}
                        </div>
                    </div>

                    {voucher.is_activated && voucher.activations.length > 0 && (
                      <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-500/10 rounded border border-green-200 dark:border-green-500/30">
                        <p className="font-semibold text-green-900 dark:text-green-100 mb-2 text-xs sm:text-sm">Aktivlashtirilgan</p>
                        {voucher.activations.map((act) => (
                          <div key={act.id} className="text-xs sm:text-sm text-green-800 dark:text-green-300 space-y-1 break-words">
                            <p>📚 {act.course_title}</p>
                            <p>📅 {new Date(act.activation_month + '-01').toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' })}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-4 sm:p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                Kuponlar topilmadi
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-4">
          <Card className="bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Jami Tranzaksiyalar: {transactions.length}</CardTitle>
            </CardHeader>
          </Card>

          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  className={`border-l-4 ${
                    transaction.type === 'WITHDRAWAL'
                      ? 'border-l-red-500 dark:border-l-red-600'
                      : transaction.type === 'REWARD_GIVEN'
                      ? 'border-l-green-500 dark:border-l-green-600'
                      : 'border-l-blue-500 dark:border-l-blue-600'
                  }`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 w-full">
                        <div className="text-xl sm:text-2xl flex-shrink-0">{transaction.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base break-words">
                            {transaction.description}
                          </p>
                          <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                            {transaction.type && (
                              <Badge variant="outline" className="text-xs">
                                {transaction.type === 'WITHDRAWAL' && '💸 Yechish'}
                                {transaction.type === 'REWARD_GIVEN' && '🎁 Mukofot'}
                                {transaction.type === 'PAYMENT' && '💳 To\'lov'}
                                {transaction.type === 'VOUCHER_USED' && '🎟️ Vaucher'}
                              </Badge>
                            )}
                            {transaction.status && (
                              <Badge
                                className={`text-xs ${
                                  transaction.status === 'APPROVED' || transaction.status === 'GIVEN'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : transaction.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}
                              >
                                {transaction.status === 'APPROVED' && '✅ Tasdiqlandi'}
                                {transaction.status === 'GIVEN' && '✅ Berildi'}
                                {transaction.status === 'PENDING' && '⏳ Kutilmoqda'}
                                {transaction.status === 'REJECTED' && '❌ Rad etildi'}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1 break-words">
                            {transaction.requested_at && (
                              <p>
                                So'ralgan: {new Date(transaction.requested_at).toLocaleDateString('uz-UZ', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            )}
                            {transaction.approved_at && (
                              <p>
                                Tasdiqlandi: {new Date(transaction.approved_at).toLocaleDateString('uz-UZ', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            )}
                            {transaction.created_at && !transaction.requested_at && (
                              <p>
                                Sana: {new Date(transaction.created_at).toLocaleDateString('uz-UZ', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            )}
                            {transaction.approved_by && (
                              <p>Tasdiqlovchi: <span className="font-semibold break-words">{transaction.approved_by}</span></p>
                            )}
                            {transaction.reason && (
                              <p className="text-red-600 dark:text-red-400 mt-1 break-words">Sabab: {transaction.reason}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                        {transaction.amount && (
                          <p className={`text-base sm:text-lg font-bold ${
                            transaction.status === 'REJECTED'
                              ? 'line-through text-slate-400 dark:text-slate-600'
                              : transaction.type === 'WITHDRAWAL'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {transaction.type === 'WITHDRAWAL' ? '-' : '+'}
                            {transaction.amount.toLocaleString('uz-UZ')} so'm
                          </p>
                        )}
                        {transaction.voucher_percent && (
                          <p className={`text-base sm:text-lg font-bold ${
                            transaction.status === 'REJECTED'
                              ? 'line-through text-slate-400 dark:text-slate-600'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {transaction.voucher_percent}%
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-4 sm:p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                Tranzaksiyalar topilmadi
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Activation dialog - outside vouchers tab so it can overlay */}
      <Dialog open={!!activateVoucher} onOpenChange={(open) => !open && setActivateVoucher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kuponni aktivlashtirish</DialogTitle>
            <DialogDescription>
              Kupon: <strong>{activateVoucher?.code}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="course">Kursni tanlang</Label>
              <Select
                value={selectedCourseId ? String(selectedCourseId) : ''}
                onValueChange={(val) => setSelectedCourseId(Number(val))}
              >
                <SelectTrigger id="course">
                  <SelectValue placeholder="Kursni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {studentEnrollments.map((enr) => (
                    <SelectItem key={enr.id} value={String(enr.id)}>
                      {enr.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="month">Oy</Label>
              <input
                id="month"
                type="month"
                className="mt-1 block w-full rounded-md border-input"
                value={activationMonth}
                onChange={(e) => setActivationMonth(e.target.value)}
                min={new Date().toISOString().slice(0, 7)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Agar hozirgi oy to'langan bo'lsa, faqat kelgusi oyni tanlash mumkin
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                if (!activateVoucher || !selectedCourseId || !activationMonth) return;
                setActivating(true);
                try {
                  const res = await authFetch(API_ENDPOINTS.ADMIN_ACTIVATE_VOUCHER(studentId!), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      voucher_id: activateVoucher.id,
                      course_id: selectedCourseId,
                      activation_month: activationMonth,
                    }),
                  });
                  if (res.ok) {
                    toast({ title: 'Muvaffaqiyat', description: 'Kupon aktivlashtirildi' });
                    fetchStudentDetails();
                    setActivateVoucher(null);
                  } else {
                    const data = await res.json();
                    toast({ title: 'Xato', description: data.error || 'Faol qilishda xatolik', variant: 'destructive' });
                  }
                } catch (err) {
                  console.error(err);
                  toast({ title: 'Xato', description: 'Faol qilishda xatolik', variant: 'destructive' });
                } finally {
                  setActivating(false);
                }
              }}
              disabled={activating || !selectedCourseId || !activationMonth}
            >
              {activating ? <Loader className="w-4 h-4 animate-spin" /> : 'Aktivlashtirish'}
            </Button>
            <DialogClose>
              <Button variant="outline">Bekor qilish</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
