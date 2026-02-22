import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader, Copy, Check, Share2, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface RewardsSummary {
  total_rewards: number;
  given_rewards: number;
  pending_rewards: number;
}

interface Money {
  total_earned: number;
  total_spent: number;
  available: number;
}

interface Vouchers {
  total_earned: number;
  used: number;
  unused: number;
}

interface DashboardData {
  referral_code: string;
  total_referrals: number;
  money: Money;
  vouchers: Vouchers;
  rewards_summary: RewardsSummary;
  my_rank: number;
}

interface ReferredUser {
  id: number;
  username: string;
  phone_number: string;
  full_name: string;
  code_used: string;
  created_at: string;
}

interface ReferralData {
  code: string;
  student_username: string;
  total_referrals: number;
  referred_users: ReferredUser[];
  created_at: string;
  is_new: boolean;
}

interface Reward {
  id: number;
  student_username: string;
  referred_user_username: string;
  referred_user_full_name: string;
  reward_type: string;
  reward_type_display: string;
  amount: number;
  voucher_percent: number;
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

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount?: number;
  voucher_percent?: number;
  status: string;
  created_at?: string;
  requested_at?: string;
  icon: string;
}

export default function Referral() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'referrals' | 'rewards' | 'withdrawals' | 'transactions'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [referralsLoading, setReferralsLoading] = useState(true);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectingReward, setSelectingReward] = useState<number | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchReferralData(),
      fetchRewards(),
      fetchWithdrawals(),
      fetchTransactions(),
    ]);
  };

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const response = await authFetch(API_ENDPOINTS.MY_DASHBOARD, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchReferralData = async () => {
    setReferralsLoading(true);
    try {
      const response = await authFetch(API_ENDPOINTS.MY_REFERRAL, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
      }
    } catch (err) {
      console.error('Error fetching referrals:', err);
    } finally {
      setReferralsLoading(false);
    }
  };

  const fetchRewards = async () => {
    setRewardsLoading(true);
    try {
      const response = await authFetch(API_ENDPOINTS.MY_REWARDS, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setRewards(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching rewards:', err);
    } finally {
      setRewardsLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    setWithdrawalsLoading(true);
    try {
      const response = await authFetch(API_ENDPOINTS.MY_WITHDRAWALS, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const response = await authFetch(API_ENDPOINTS.TRANSACTIONS, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    const code = dashboardData?.referral_code || referralData?.code;
    if (code) {
      try {
        await navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
        toast({ title: 'Nusxalandi! ✓', description: `"${code}" promokod nusxalandi` });
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleChooseReward = async (rewardId: number, choice: 'MONEY' | 'VOUCHER') => {
    setSelectingReward(rewardId);
    try {
      const response = await authFetch(API_ENDPOINTS.CHOOSE_REWARD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward_id: rewardId, choice }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: `✅ ${choice === 'MONEY' ? 'Pul' : 'Vaucher'} tanlandi!`,
          description: data.message || 'Reward yangilandi',
        });
        // Refresh rewards list
        await fetchRewards();
      } else {
        const error = await response.json().catch(() => ({}));
        toast({
          title: 'Xatolik',
          description: error.error || 'Reward tanlashda xatolik yuz berdi',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error choosing reward:', err);
      toast({
        title: 'Xatolik',
        description: 'Reward tanlashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setSelectingReward(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'd MMMM, yyyy HH:mm', { locale: uz });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase();
    if (['PENDING', 'KUTILMOQDA'].includes(s)) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (['COMPLETED', 'APPROVED', 'GIVEN', 'BERILGAN'].includes(s)) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (['REJECTED', 'RAD_ETILDI'].includes(s)) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Taklif Qilish Dasturi
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Do'stingizni taklif qiling va bonus yoqing</p>
          </div>
          <Share2 className="w-16 h-16 text-purple-500/20" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {['dashboard', 'referrals', 'rewards', 'withdrawals', 'transactions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400'
              }`}
            >
              {tab === 'dashboard' && '📊 Dashboard'}
              {tab === 'referrals' && `👥 Referallar (${referralData?.total_referrals || 0})`}
              {tab === 'rewards' && `🎁 Mukofotlar (${rewards.length})`}
              {tab === 'withdrawals' && `💰 Pul yechish (${withdrawals.length})`}
              {tab === 'transactions' && `📝 Tranzaksiyalar (${transactions.length})`}
            </button>
          ))}
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          dashboardLoading ? (
            <div className="flex items-center justify-center min-h-96">
              <Loader className="w-12 h-12 animate-spin text-purple-500" />
            </div>
          ) : dashboardData ? (
            <div className="space-y-6">
              <Card className="border-none bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-900/90 dark:to-slate-800/90">
                <CardContent className="p-8">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">📌 Promo Kodingiz</h2>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 rounded-lg font-mono text-2xl font-bold tracking-widest">
                      {dashboardData.referral_code}
                    </code>
                    <Button onClick={handleCopyCode} size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600">
                      {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Top 3 Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Taklif qilingan */}
                <Card className="border-none bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/20">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">👥 Jami Taklif</p>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{dashboardData.total_referrals}</p>
                  </CardContent>
                </Card>

                {/* Balans */}
                <Card className="border-none bg-gradient-to-br from-green-50 to-transparent dark:from-green-900/20">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">💰 Balans</p>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400">{dashboardData.money.available.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-2">So'm</p>
                  </CardContent>
                </Card>

                {/* Reyting */}
                <Card className="border-none bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-900/20">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">🏆 Reyting</p>
                    <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">Top {dashboardData.my_rank}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Sovg'alar */}
              <Card className="border-none bg-gradient-to-br from-yellow-50 to-transparent dark:from-yellow-900/20">
                <CardHeader>
                  <CardTitle className="text-lg">🎁 Sovg'alar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white dark:bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Jami Sovg'a</p>
                      <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{dashboardData.rewards_summary.total_rewards}</p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Ishlatilgan</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">{dashboardData.rewards_summary.given_rewards}</p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Ochilmagan</p>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{dashboardData.rewards_summary.pending_rewards}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pul */}
              <Card className="border-none bg-gradient-to-br from-green-50 to-transparent dark:from-green-900/20">
                <CardHeader>
                  <CardTitle className="text-lg">💵 Pul</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white dark:bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Umumiy Yig'ilgan</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{dashboardData.money.total_earned.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Yechib Olingan</p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">{dashboardData.money.total_spent.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Qolgan Pul</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">{dashboardData.money.available.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vaucher */}
              <Card className="border-none bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-900/20">
                <CardHeader>
                  <CardTitle className="text-lg">🎟️ Vaucher</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white dark:bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Umumiy Soni</p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{dashboardData.vouchers.total_earned}</p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Ishlatilgan</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">{dashboardData.vouchers.used}</p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Ishlatilmagan</p>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{dashboardData.vouchers.unused}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-red-200 bg-red-50 dark:bg-red-500/5"><CardContent className="p-6 text-center text-red-600 dark:text-red-400">Dashboard yuklashda xatolik yuz berdi</CardContent></Card>
          )
        )}

        {/* REFERRALS TAB */}
        {activeTab === 'referrals' && (
          referralsLoading ? (
            <div className="flex items-center justify-center min-h-96"><Loader className="w-12 h-12 animate-spin text-purple-500" /></div>
          ) : referralData && referralData.referred_users.length > 0 ? (
            <div className="space-y-4">
              <div className="mb-4">
                <Input
                  placeholder="🔍 Foydalanuvchi qidirish (ismi, usernamei yoki email)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Card><CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-100 dark:bg-slate-800">
                      <TableRow>
                        <TableHead className="text-slate-900 dark:text-white font-semibold">№</TableHead>
                        <TableHead className="text-slate-900 dark:text-white font-semibold">F.I.SH</TableHead>
                        <TableHead className="text-slate-900 dark:text-white font-semibold">Foydalanuvchi nomi</TableHead>
                        <TableHead className="text-slate-900 dark:text-white font-semibold">Telefon raqami</TableHead>
                        <TableHead className="text-slate-900 dark:text-white font-semibold">Taklif qilingan sana</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referralData.referred_users
                        .filter((user) =>
                          user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.phone_number.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((user, index) => (
                          <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <TableCell className="font-bold text-blue-600 dark:text-blue-400">#{index + 1}</TableCell>
                            <TableCell className="font-semibold text-slate-900 dark:text-white">{user.full_name}</TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400">@{user.username}</TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400">{user.phone_number}</TableCell>
                            <TableCell className="text-slate-500 dark:text-slate-400 text-sm">{formatDate(user.created_at)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent></Card>
            </div>
          ) : (
            <Card><CardContent className="p-8 text-center"><p className="text-slate-600 dark:text-slate-400">Hali hech kim taklif qilinmagan</p></CardContent></Card>
          )
        )}

        {/* REWARDS TAB */}
        {activeTab === 'rewards' && (
          rewardsLoading ? (
            <div className="flex items-center justify-center min-h-96"><Loader className="w-12 h-12 animate-spin text-purple-500" /></div>
          ) : rewards.length > 0 ? (
            <div className="space-y-4">
              {rewards.map((reward) => (
                <Card key={reward.id} className="border-none bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-3xl">{reward.reward_type === 'VOUCHER' ? '🎟️' : reward.reward_type === 'ANY' ? '❓' : '💵'}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">{reward.referred_user_full_name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">@{reward.referred_user_username}</p>
                          <p className="text-xs text-slate-500 mt-1">{reward.reward_type_display}</p>
                        </div>
                      </div>

                      {/* PENDING - Show Selection Buttons */}
                      {reward.status === 'PENDING' ? (
                        <div className="flex gap-2 flex-wrap justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChooseReward(reward.id, 'MONEY')}
                            disabled={selectingReward === reward.id}
                            className="whitespace-nowrap"
                          >
                            {selectingReward === reward.id ? (
                              <Loader className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              <span>💵 Pul ({reward.amount.toLocaleString()} so'm)</span>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChooseReward(reward.id, 'VOUCHER')}
                            disabled={selectingReward === reward.id}
                            className="whitespace-nowrap"
                          >
                            {selectingReward === reward.id ? (
                              <Loader className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              <span>🎟️ Vaucher ({reward.voucher_percent}%)</span>
                            )}
                          </Button>
                        </div>
                      ) : (
                        /* GIVEN - Show Status */
                        <div className="text-right">
                          <p className="font-bold text-lg">{reward.amount || `${reward.voucher_percent}%`}</p>
                          <Badge className={getStatusColor(reward.status)}>{reward.status_display}</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="p-8 text-center"><p className="text-slate-600 dark:text-slate-400">Hali hech qanday reward yo'q</p></CardContent></Card>
          )
        )}

        {/* WITHDRAWALS TAB */}
        {activeTab === 'withdrawals' && (
          withdrawalsLoading ? (
            <div className="flex items-center justify-center min-h-96"><Loader className="w-12 h-12 animate-spin text-purple-500" /></div>
          ) : withdrawals.length > 0 ? (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <Card key={withdrawal.id} className="border-none bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900/50"><CardContent className="p-4 flex items-center gap-4">
                  <Wallet className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  <div className="flex-1"><p className="font-semibold text-slate-900 dark:text-white">{withdrawal.amount.toLocaleString()} so'm</p><p className="text-xs text-slate-500 mt-1">{formatDate(withdrawal.requested_at)}</p>{withdrawal.reason && <p className="text-sm text-red-600 dark:text-red-400">Sababi: {withdrawal.reason}</p>}</div>
                  <Badge className={getStatusColor(withdrawal.status)}>{withdrawal.status_display}</Badge>
                </CardContent></Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="p-8 text-center"><p className="text-slate-600 dark:text-slate-400">Hali hech qanday pul yechilmagan</p></CardContent></Card>
          )
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          transactionsLoading ? (
            <div className="flex items-center justify-center min-h-96"><Loader className="w-12 h-12 animate-spin text-purple-500" /></div>
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <Card key={tx.id} className="border-none bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900/50"><CardContent className="p-4 flex items-center gap-4">
                  <div className="text-2xl">{tx.icon}</div>
                  <div className="flex-1"><p className="font-semibold text-slate-900 dark:text-white">{tx.description}</p><p className="text-xs text-slate-500 mt-1">{formatDate(tx.requested_at || tx.created_at || '')}</p></div>
                  <div className="text-right"><p className="font-bold text-lg">{tx.amount ? tx.amount.toLocaleString() : `${tx.voucher_percent}%`}</p><Badge className={getStatusColor(tx.status)}>{tx.status}</Badge></div>
                </CardContent></Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="p-8 text-center"><p className="text-slate-600 dark:text-slate-400">Hali hech qanday tranzaksiya yo'q</p></CardContent></Card>
          )
        )}
      </div>
    </DashboardLayout>
  );
}
