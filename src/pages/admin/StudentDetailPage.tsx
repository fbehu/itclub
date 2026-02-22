import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [student, setStudent] = useState<StudentReferralData | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'rewards' | 'withdrawals' | 'vouchers'>('overview');
  const [processingWithdrawal, setProcessingWithdrawal] = useState<number | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<{ [key: number]: string }>({});

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
      const withdrawalsRes = await authFetch(`${API_ENDPOINTS.ADMIN_WITHDRAWALS}`, { method: 'GET' });
      const vouchersRes = await authFetch(API_ENDPOINTS.ADMIN_STUDENT_VOUCHERS(studentId!), { method: 'GET' });

      let rewardsData: Reward[] = [];
      let withdrawalsData: Withdrawal[] = [];
      let vouchersData: Voucher[] = [];

      if (rewardsRes.ok) {
        rewardsData = await rewardsRes.json();
        setRewards(rewardsData);
      }

      if (withdrawalsRes.ok) {
        const allWithdrawals = await withdrawalsRes.json();
        // Filter by current student
        withdrawalsData = Array.isArray(allWithdrawals) ? allWithdrawals : [];
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

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          Student Detail
        </h1>
      </div>

      {/* Student Info Card */}
      <Card className="border-2 border-purple-300 dark:border-purple-600">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20">
                {/* Student photo would go here if we have the data */}
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-2xl">
                  {studentId?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">Student #{studentId}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Detailed Profile</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Balance Stats */}
      {balance && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-500/10 dark:to-purple-600/10 border-purple-200 dark:border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Jami Taklif</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-200">{balance.total_referrals}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-500/10 dark:to-green-600/10 border-green-200 dark:border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">Available Money</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-200">
                    {balance.available_money.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Total: {balance.total_money.toLocaleString()} | Withdrawn: {balance.withdrawn_money.toLocaleString()}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-500/10 dark:to-amber-600/10 border-amber-200 dark:border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Vouchers</p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-200">{balance.total_vouchers}</p>
                </div>
                <Gift className="w-8 h-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {['overview', 'rewards', 'withdrawals', 'vouchers'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab as typeof activeSubTab)}
            className={`px-4 py-2 font-semibold transition-all ${
              activeSubTab === tab
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
              {tab === 'overview' && '📊 Ko\'rinish'}
              {tab === 'rewards' && '🎁 Mukofotlar'}
              {tab === 'withdrawals' && '💳 Pul yechish'}
              {tab === 'vouchers' && '🎟️ Kuponlar'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeSubTab === 'overview' && balance && (
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
                <CardTitle>Umumiy ma'lumot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Jami takliflar</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{balance.total_referrals}</p>
                </div>
                <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Berilgan mukofotlar</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{balance.given_rewards_count}</p>
                </div>
                <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Jami daromad</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {balance.total_money.toLocaleString()} so'm
                  </p>
                </div>
                <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Jami yechilgan</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
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
        <div className="space-y-4">
          {rewards.length > 0 ? (
            rewards.map((reward) => (
              <Card key={reward.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {reward.referred_user_full_name}
                        </p>
                        <span className="text-xs text-slate-500 dark:text-slate-400">@{reward.referred_user_username}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {reward.reward_type_display}
                        {reward.amount && `: ${reward.amount.toLocaleString()} so'm`}
                        {reward.voucher_percent && `: ${reward.voucher_percent}% chegirma`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(reward.created_at).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                    <Badge className={getStatusBadgeColor(reward.status)}>
                      {reward.is_given ? '✓ ' : ''}{reward.status_display}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-slate-500 dark:text-slate-400">
                Mukofotlar topilmadi
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeSubTab === 'withdrawals' && (
        <div className="space-y-4">
          {withdrawals.length > 0 ? (
            withdrawals.map((withdrawal) => (
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
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {withdrawal.amount.toLocaleString()} so'm
                        </p>
                        {getStatusIcon(withdrawal.status)}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        So'ralgan: {new Date(withdrawal.requested_at).toLocaleDateString('uz-UZ')}
                      </p>
                      {withdrawal.approved_at && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Tasdiqlovchi: {withdrawal.approved_by_username} ({new Date(withdrawal.approved_at).toLocaleDateString('uz-UZ')})
                        </p>
                      )}
                      {withdrawal.reason && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                          Sabab: {withdrawal.reason}
                        </p>
                      )}
                    </div>

                    {/* PENDING status - Show approve/reject buttons */}
                    {withdrawal.status === 'PENDING' ? (
                      <div className="flex gap-2 flex-col ml-4 min-w-max">
                        <Button
                          size="sm"
                          onClick={() => handleApproveWithdrawal(withdrawal.id)}
                          disabled={processingWithdrawal === withdrawal.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {processingWithdrawal === withdrawal.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <>✅ Tasdiqlash</>
                          )}
                        </Button>
                        <div className="flex gap-1 items-end">
                          <input
                            type="text"
                            placeholder="Sababini kiriting..."
                            value={rejectionReasons[withdrawal.id] || ''}
                            onChange={(e) => setRejectionReasons({ ...rejectionReasons, [withdrawal.id]: e.target.value })}
                            disabled={processingWithdrawal === withdrawal.id}
                            className="text-xs px-2 py-1 border border-red-300 dark:border-red-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectWithdrawal(withdrawal.id)}
                            disabled={processingWithdrawal === withdrawal.id || !rejectionReasons[withdrawal.id]?.trim()}
                            className="text-red-600 dark:text-red-400 whitespace-nowrap"
                          >
                            {processingWithdrawal === withdrawal.id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <>❌ Bekor</>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Not PENDING - Show status badge only */
                      <Badge className={getStatusBadgeColor(withdrawal.status)}>
                        {withdrawal.status_display}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-slate-500 dark:text-slate-400">
                Pul yechish topilmadi
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Vouchers Tab */}
      {activeSubTab === 'vouchers' && (
        <div className="space-y-4">
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
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <code className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded text-sm font-mono">
                          {voucher.code}
                        </code>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                          {voucher.discount_percent}% chegirma
                        </p>
                      </div>
                      <Badge
                        className={
                          voucher.is_activated
                            ? 'bg-green-500 text-white'
                            : 'bg-amber-500 text-white'
                        }
                      >
                        {voucher.is_activated ? '✅ Aktivlashtirilgan' : '⏳ Odin'}
                      </Badge>
                    </div>

                    {voucher.is_activated && voucher.activations.length > 0 && (
                      <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded border border-green-200 dark:border-green-500/30">
                        <p className="font-semibold text-green-900 dark:text-green-100 mb-2">Aktivlashtirilgan</p>
                        {voucher.activations.map((act) => (
                          <div key={act.id} className="text-sm text-green-800 dark:text-green-300">
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
              <CardContent className="p-6 text-center text-slate-500 dark:text-slate-400">
                Kuponlar topilmadi
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
