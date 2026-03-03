import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader, Search, Users, Gift, TrendingUp, Check, ChevronDown } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ReferralLeaderboard from '@/pages/admin/components/ReferralLeaderboard';

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

interface TopReferral {
  rank: number;
  student: string;
  referral_count: number;
  total_earnings: number;
}

interface Voucher {
  id: number;
  code: string;
  student_username: string;
  discount_percent: number;
  is_activated: boolean;
  activated_course: string | null;
  activated_month: string | null;
  created_at: string;
}

interface WithdrawalRequest {
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

export default function ReferralMeneger() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'students' | 'vouchers' | 'leaderboard'>('leaderboard');
  
  // Student Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentReferralData[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentReferralData | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Withdrawal Confirmation Modal
  const [pendingWithdrawal, setPendingWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [approveRejectLoading, setApproveRejectLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Vouchers
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [activatingVoucher, setActivatingVoucher] = useState<number | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [voucherCourse, setVoucherCourse] = useState('');
  const [voucherMonth, setVoucherMonth] = useState('');

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<TopReferral[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'vouchers') fetchVouchers();
    if (activeTab === 'leaderboard') fetchLeaderboard();
  }, [activeTab]);

  // ============ STUDENT SEARCH TAB ============
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Xato',
        description: 'Student nomi kiriting',
        variant: 'destructive',
      });
      return;
    }

    setSearching(true);
    try {
      const response = await authFetch(
        `${API_ENDPOINTS.ADMIN_STUDENT_SEARCH}?search=${encodeURIComponent(searchQuery)}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error('Student topilmadi');
      }

      const data: StudentReferralData[] = await response.json();
      setSearchResults(data);
      
      if (data.length === 0) {
        toast({
          title: 'Amal',
          description: 'Student topilmadi',
        });
      }
    } catch (err: any) {
      console.error('Error searching students:', err);
      toast({
        title: 'Xato',
        description: err.message || 'Qidirashda xatolik yuz berdi',
        variant: 'destructive',
      });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleWithdrawMoney = async () => {
    if (!selectedStudent) return;
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: 'Xato',
        description: 'Miqdor kiriting',
        variant: 'destructive',
      });
      return;
    }

    setWithdrawing(true);
    try {
      // Admin REQUEST_WITHDRAWAL endpoint ga so'rov yuboradi
      const response = await authFetch(API_ENDPOINTS.ADMIN_REQUEST_WITHDRAWAL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedStudent.id,
          amount: parseFloat(withdrawAmount),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Pul yechish so\'rovida xatolik');
      }

      const withdrawalData = await response.json();
      
      // Modal oynamasini ochish
      setPendingWithdrawal(withdrawalData);

      setWithdrawAmount('');
    } catch (err: any) {
      console.error('Error requesting withdrawal:', err);
      toast({
        title: 'Xato',
        description: err.message || 'Pul yechish so\'rovida xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleApproveWithdrawal = async () => {
    if (!pendingWithdrawal) return;
    
    setApproveRejectLoading(true);
    try {
      const response = await authFetch(
        API_ENDPOINTS.ADMIN_APPROVE_WITHDRAWAL(pendingWithdrawal.id),
        { method: 'PUT' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Tasdiqlashda xatolik');
      }

      toast({
        title: 'Muvaffaq! ✓',
        description: `${pendingWithdrawal.amount.toLocaleString()} so'm tasdiqlandi`,
      });

      setPendingWithdrawal(null);
      await handleSearch();
    } catch (err: any) {
      console.error('Error approving withdrawal:', err);
      toast({
        title: 'Xato',
        description: err.message || 'Tasdiqlashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setApproveRejectLoading(false);
    }
  };

  const handleRejectWithdrawal = async () => {
    if (!pendingWithdrawal) return;
    
    if (!rejectionReason.trim()) {
      toast({
        title: 'Xato',
        description: 'Bekor qilish sababini kiriting',
        variant: 'destructive',
      });
      return;
    }

    setApproveRejectLoading(true);
    try {
      const response = await authFetch(
        API_ENDPOINTS.ADMIN_APPROVE_WITHDRAWAL(pendingWithdrawal.id),
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bekor qilishda xatolik');
      }

      toast({
        title: 'Bekor qilindi ✓',
        description: `${pendingWithdrawal.amount.toLocaleString()} so'm so'rovi bekor qilindi`,
      });

      setPendingWithdrawal(null);
      setRejectionReason('');
      await handleSearch();
    } catch (err: any) {
      console.error('Error rejecting withdrawal:', err);
      toast({
        title: 'Xato',
        description: err.message || 'Bekor qilishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setApproveRejectLoading(false);
    }
  };

  // ============ VOUCHERS TAB ============
  const fetchVouchers = async () => {
    setVouchersLoading(true);
    try {
      // Note: Admin doesn't have direct vouchers list endpoint
      // Vouchers can be managed per-student through detail page
      setVouchers([]);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
      toast({
        title: 'Xato',
        description: 'Vaucherlar yuklashda xatolik',
        variant: 'destructive',
      });
      setVouchers([]);
    } finally {
      setVouchersLoading(false);
    }
  };

  const handleActivateVoucher = async (voucher: Voucher) => {
    // Note: Admin vouchers activation moved to StudentDetailPage
    // Admin cannot activate vouchers from here - use student detail page instead
    toast({
      title: 'Malumot',
      description: 'Vaucherlarni talaffuz qilish uchun talabaning detail sahifasidan o\'ting',
    });
  };

  // ============ LEADERBOARD TAB ============
  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const response = await authFetch(API_ENDPOINTS.ADMIN_LEADERBOARD, {
        method: 'GET',
      });

      if (response.ok) {
        const data: TopReferral[] = await response.json();
        setLeaderboard(data);
      } else {
        toast({
          title: 'Xato',
          description: 'Leaderboard yuklashda xatolik yuz berdi',
          variant: 'destructive',
        });
        setLeaderboard([]);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      toast({
        title: 'Xato',
        description: 'Backend bilan bog\'lanishda muammo',
        variant: 'destructive',
      });
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Referral Admin Panel
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Referral tizimini boshqarish</p>
          </div>
          <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
            <Gift className="w-8 h-8 text-white" />
          </div>
        </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'students'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Students
        </button>
        
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Top 10
        </button>
      </div>

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Search */}
          <Card className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90">
            <CardHeader>
              <CardTitle>🔍 Student Qidirish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Username yoki email kiriting..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  disabled={searching}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {searching ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              {searchResults.map((student) => (
                <div key={student.id}>
                  <Card
                    className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedStudent(student)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          {student.photo ? (
                            <AvatarImage src={student.photo} alt={student.full_name} />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                            {student.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{student.full_name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">@{student.username}</p>
                          {student.phone_number && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">{student.phone_number}</p>
                          )}
                          {student.email && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">{student.email}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle: agar bu student ochildi, yopadi; agar yopilgan bo'lsa, ochadi
                          if (selectedStudent?.id === student.id) {
                            setSelectedStudent(null);
                          } else {
                            setSelectedStudent(student);
                          }
                        }}
                        variant="ghost"
                        size="sm"
                        className={`transition-transform ${selectedStudent?.id === student.id ? 'rotate-180' : ''}`}
                      >
                        <ChevronDown className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Inline Student Details */}
                {selectedStudent?.id === student.id && (
                  <Card className="mt-2 border-2 border-purple-300 dark:border-purple-600 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90 animate-in fade-in slide-in-from-top-2 duration-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          {student.photo ? (
                            <AvatarImage src={student.photo} alt={student.full_name} />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs">
                            {student.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-lg font-semibold">{student.full_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">@{student.username}</p>
                        </div>
                      </CardTitle>

                      {/* Action buttons: View vouchers, detail page, and quick withdraw */}
                      <div className="mt-5 flex gap-4">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/manager/student-detail/${student.id}`, {
                              state: { studentData: student }
                            });
                          }}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        >
                          Batafsil
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-200 dark:border-purple-500/30">
                          <p className="text-sm text-slate-600 dark:text-slate-400">Jami Taklif</p>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {student.total_referrals}
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/30">
                          <p className="text-sm text-slate-600 dark:text-slate-400">Pul Hisob</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {student.available_money.toLocaleString()} so'm
                          </p>
                        </div>
                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/30">
                          <p className="text-sm text-slate-600 dark:text-slate-400">Vaucherlar</p>
                          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {student.total_vouchers}
                          </p>
                        </div>
                      </div>

                      {/* Withdraw */}
                      {student.available_money > 0 && (
                        <div className="space-y-3 p-4 bg-yellow-50 dark:bg-yellow-500/5 rounded-lg border border-yellow-200 dark:border-yellow-500/30">
                          <h4 className="font-semibold text-slate-900 dark:text-white">💰 Pul Yechish</h4>
                          <div className="flex gap-2">
                            <Input
                              id={`withdraw-input-${student.id}`}
                              type="number"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              placeholder="Miqdor kiriting..."
                              max={student.available_money}
                            />
                            <Button
                              onClick={handleWithdrawMoney}
                              disabled={withdrawing || !withdrawAmount}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {withdrawing ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Max: {student.available_money.toLocaleString()} so'm
                          </p>
                        </div>
                      )}

                      {/* Quick Info */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">📋 Umumiy Ma'lumot</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Ism:</span>
                            <span className="font-medium text-slate-900 dark:text-white">{student.full_name}</span>
                          </div>
                          {student.phone_number && (
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Telefon:</span>
                              <span className="text-slate-700 dark:text-slate-300">{student.phone_number}</span>
                            </div>
                          )}
                          {student.email && (
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Email:</span>
                              <span className="text-slate-700 dark:text-slate-300">{student.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* VOUCHERS TAB */}
      {activeTab === 'vouchers' && (
        vouchersLoading ? (
          <div className="flex justify-center py-12">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-200 dark:border-purple-500/30">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Jami Taklif</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedStudent.total_referrals}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/30">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Pul Hisob</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedStudent.available_money.toLocaleString()} so'm
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/30">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Vaucherlar</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {selectedStudent.total_vouchers}
                    </p>
                  </div>
                </div>

                {/* Withdraw */}
                {selectedStudent.available_money > 0 && (
                  <div className="space-y-3 p-4 bg-yellow-50 dark:bg-yellow-500/5 rounded-lg border border-yellow-200 dark:border-yellow-500/30">
                    <h4 className="font-semibold text-slate-900 dark:text-white">💰 Pul Yechish</h4>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Miqdor kiriting..."
                        max={selectedStudent.available_money}
                      />
                      <Button
                        onClick={handleWithdrawMoney}
                        disabled={withdrawing || !withdrawAmount}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {withdrawing ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Max: {selectedStudent.available_money.toLocaleString()} so'm
                    </p>
                  </div>
                )}

                {/* Quick Info */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">� Umumiy Ma'lumot</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Ism:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selectedStudent.full_name}</span>
                    </div>
                    {selectedStudent.phone_number && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Telefon:</span>
                        <span className="text-slate-700 dark:text-slate-300">{selectedStudent.phone_number}</span>
                      </div>
                    )}
                    {selectedStudent.email && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Email:</span>
                        <span className="text-slate-700 dark:text-slate-300">{selectedStudent.email}</span>
                      </div>
                    )}
                  </div>
                </div>
          </div>
        ) : (
          <div className="space-y-6">
            {vouchers.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {vouchers.map((voucher) => (
                  <Card
                    key={voucher.id}
                    className={`border-2 transition-all cursor-pointer ${
                      selectedVoucher?.id === voucher.id
                        ? 'border-purple-500 shadow-lg'
                        : voucher.is_activated
                        ? 'border-green-300 dark:border-green-600'
                        : 'border-amber-300 dark:border-amber-600'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <code className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded text-sm font-mono">
                              {voucher.code}
                            </code>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                @{voucher.student_username}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">{voucher.discount_percent}% chegirma</p>
                            </div>
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

                        {/* Activation Info */}
                        {voucher.is_activated && (
                          <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded border border-green-200 dark:border-green-500/30">
                            <p className="text-sm text-green-800 dark:text-green-300">
                              <strong>Kurs:</strong> {voucher.activated_course}
                            </p>
                            <p className="text-sm text-green-800 dark:text-green-300">
                              <strong>Oy:</strong> {voucher.activated_month}
                            </p>
                          </div>
                        )}

                        {/* Activation Form */}
                        {!voucher.is_activated && (
                          <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-500/5 rounded border border-blue-200 dark:border-blue-500/30">
                            <h4 className="font-semibold text-slate-900 dark:text-white">Vaucherni Aktivlashtirish</h4>
                            <Input
                              placeholder="Kurs nomi (masalan: Python Basics)"
                              value={selectedVoucher?.id === voucher.id ? voucherCourse : ''}
                              onChange={(e) => {
                                setSelectedVoucher(voucher);
                                setVoucherCourse(e.target.value);
                              }}
                            />
                            <Input
                              type="month"
                              value={selectedVoucher?.id === voucher.id ? voucherMonth : ''}
                              onChange={(e) => {
                                setSelectedVoucher(voucher);
                                setVoucherMonth(e.target.value);
                              }}
                            />
                            <Button
                              onClick={() => handleActivateVoucher(voucher)}
                              disabled={activatingVoucher === voucher.id || !voucherCourse || !voucherMonth}
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                              {activatingVoucher === voucher.id ? (
                                <>
                                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                                  Aktivlashtirilmoqda...
                                </>
                              ) : (
                                'Aktivlashtirish'
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-none bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90">
                <CardContent className="p-12 text-center">
                  <Gift className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                    Vaucherlar yo'q
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )
      )}

      {/* LEADERBOARD TAB */}
      {activeTab === 'leaderboard' && (
        <ReferralLeaderboard data={leaderboard} loading={leaderboardLoading} />
      )}

      {/* WITHDRAWAL CONFIRMATION MODAL */}
      <Dialog 
        open={!!pendingWithdrawal} 
        onOpenChange={(open) => {
          if (!open) {
            setPendingWithdrawal(null);
            setRejectionReason('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>💰 Pul Yechishni Tasdiqlash</DialogTitle>
            <DialogDescription>
              Ushbu so'rovni tasdiqlash yoki bekor qilishni tanlang
            </DialogDescription>
          </DialogHeader>

          {pendingWithdrawal && (
            <div className="space-y-4 py-4">
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Student:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{pendingWithdrawal.student_full_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Foydalanuvchi nomi:</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">@{pendingWithdrawal.student_username}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Miqdor:</span>
                  <span className="font-bold text-lg text-green-600 dark:text-green-400">{pendingWithdrawal.amount.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">So'rov sanasi:</span>
                  <span className="text-xs text-slate-500">{new Date(pendingWithdrawal.requested_at).toLocaleString('uz-UZ')}</span>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-900 dark:text-yellow-200">
                  ⚠️ Bu so'rovni tasdiqlasangiz, {pendingWithdrawal.amount.toLocaleString()} so'm {pendingWithdrawal.student_full_name}ning hisobidan yechiladi.
                </p>
              </div>

              {/* Rejection Reason Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Bekor qilish sababini kiriting (agar bekor qilinsa):
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Masalan: Hujjatlar topilmadi, yo'q qismat..."
                  className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  rows={2}
                  disabled={approveRejectLoading}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleRejectWithdrawal()}
              disabled={approveRejectLoading || !rejectionReason.trim()}
            >
              {approveRejectLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
              ❌ Bekor qilish
            </Button>
            <Button
              onClick={() => handleApproveWithdrawal()}
              disabled={approveRejectLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveRejectLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
              ✅ Tasdiqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
