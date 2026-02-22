import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader, Copy, Check, Share2, UserPlus, Award, Gift, Zap, Lock, Unlock } from 'lucide-react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ReferralUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  photo?: string;
  role: string;
  created_at: string;
  level?: string;
  code_used?: string;
}

interface ReferralData {
  code: string;
  total_referrals: number;
  created_at: string;
  referred_users: ReferralUser[];
}

interface RewardStatus {
  eligible: boolean;
  total_referrals: number;
  required: number;
  all_rewards_count: number;
  claimed_count: number;
  unclaimed_count: number;
  money_rewards_count: number;
  money_total: number;
  voucher_rewards_count: number;
  total_vouchers: number;
}

interface Voucher {
  id: number;
  code: string;
  discount_percent: number;
  is_used: boolean;
  is_activated: boolean;
  activated_at: string | null;
  activated_by_username: string | null;
  created_at: string;
  usages: Array<{
    id: number;
    course_title: string;
    used_at: string;
  }>;
}

export default function Referral() {
  const { toast } = useToast();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [rewardStatus, setRewardStatus] = useState<RewardStatus | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loadingReferral, setLoadingReferral] = useState(true);
  const [loadingReward, setLoadingReward] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [claimingReward, setClaimingReward] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'referrals' | 'rewards' | 'vouchers'>('referrals');

  useEffect(() => {
    fetchReferralData();
    fetchRewardStatus();
    fetchVouchers();
  }, []);

  const fetchReferralData = async () => {
    setLoadingReferral(true);
    try {
      const response = await authFetch(API_ENDPOINTS.REFERRAL_ME, {
        method: 'GET',
      });

      if (!response.ok) {
        console.error('Failed to fetch referral data');
        setLoadingReferral(false);
        return;
      }

      const data: ReferralData = await response.json();
      setReferralData(data);
    } catch (err) {
      console.error('Error fetching referral data:', err);
      // Mock data for development/testing - comment out when backend is ready
      setReferralData({
        code: 'BTTU0Y30P4',
        total_referrals: 5,
        created_at: new Date().toISOString(),
        referred_users: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            username: 'john_doe',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone_number: '+998901234567',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john_doe',
            role: 'STUDENT',
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            level: 'intermediate'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            username: 'jane_smith',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            phone_number: '+998901234568',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane_smith',
            role: 'STUDENT',
            created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            level: 'expert'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            username: 'alex_admin',
            first_name: 'Alex',
            last_name: 'Admin',
            email: 'alex@example.com',
            phone_number: '+998901234569',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex_admin',
            role: 'ADMIN',
            created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            level: 'beginner'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440004',
            username: 'bob_johnson',
            first_name: 'Bob',
            last_name: 'Johnson',
            email: 'bob@example.com',
            phone_number: '+998901234570',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob_johnson',
            role: 'STUDENT',
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            level: 'beginner'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440005',
            username: 'sara_williams',
            first_name: 'Sara',
            last_name: 'Williams',
            email: 'sara@example.com',
            phone_number: '+998901234571',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sara_williams',
            role: 'STUDENT',
            created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            level: 'intermediate'
          },
        ]
      });
    } finally {
      setLoadingReferral(false);
    }
  };

  const handleCopyPromoCode = async () => {
    if (referralData?.code) {
      try {
        await navigator.clipboard.writeText(referralData.code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'd MMMM, yyyy', { locale: uz });
    } catch {
      return dateString;
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 pb-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Taklif Qilish Dasturi
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Do'stingizni taklif qiling va bonus yoqing</p>
          </div>
          <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
            <Share2 className="w-8 h-8 text-white" />
          </div>
        </div>

        {loadingReferral ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative flex flex-col items-center space-y-4 p-8">
                <Loader className="w-12 h-12 animate-spin text-purple-500" />
                <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                  Ma'lumotlar yuklanmoqda...
                </p>
              </div>
            </div>
          </div>
        ) : referralData ? (
          <div className="space-y-6">
            {/* Promo Code Section */}
            <Card className="border-none bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    📌 Sizning Promo Kodingiz
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Bu kodni do'stingizga yuboring. Admin panelida yangi user yaratishda shu kodni kiritish kerak.
                  </p>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 bg-slate-900 dark:bg-slate-950 text-white px-4 sm:px-6 py-4 rounded-lg font-mono text-lg sm:text-xl font-bold tracking-widest">
                      {referralData.code}
                    </code>
                    <Button
                      onClick={handleCopyPromoCode}
                      className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-16 px-4"
                      size="lg"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-5 h-5 mr-2 text-green-400" />
                          <span className="hidden sm:inline">Nusxalandi!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5 mr-2" />
                          <span className="hidden sm:inline">Nusxalash</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Total Referrals */}
              <Card className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold uppercase mb-2">
                        Taklif Qilgan Jami
                      </p>
                      <p className="text-4xl sm:text-5xl font-bold text-purple-600 dark:text-purple-400">
                        {referralData.total_referrals}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">kishi ro'yxatdan o'tgan</p>
                    </div>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Earnings */}
              {referralData.earnings !== undefined && (
                <Card className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold uppercase mb-2">
                          Bonusi
                        </p>
                        <p className="text-4xl sm:text-5xl font-bold text-amber-600 dark:text-amber-400">
                          {referralData.earnings}%
                        </p>
                        <p className="text-xs text-slate-500 mt-2">Chegirma va bonus</p>
                      </div>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Referral List */}
            <Card className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700/50">
                <CardTitle className="text-lg sm:text-xl">
                  👥 Taklif Qilgan Odamlar ({referralData.referred_users.length})
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Sizning promo kod orqali ro'yxatdan o'tgan foydalanuvchilar
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {referralData.referred_users.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {referralData.referred_users.map((referral, index) => (
                      <div
                        key={referral.id}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50 dark:to-transparent rounded-lg border border-slate-200 dark:border-slate-700/50 hover:border-purple-500/30 dark:hover:border-purple-500/30 transition-all hover:shadow-md"
                        style={{
                          animation: `slideIn 0.5s ease-out ${index * 0.05}s both`
                        }}
                      >
                        <Avatar className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 border-2 border-purple-200 dark:border-purple-900/30">
                          <AvatarImage src={referral.photo} alt={referral.username} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold text-sm">
                            {(referral.first_name?.[0] || '') + (referral.last_name?.[0] || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {referral.first_name} {referral.last_name}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate mb-1">
                            @{referral.username}
                          </p>
                          <p className="text-xs text-slate-500">
                            📅 {formatDate(referral.created_at)}
                          </p>
                        </div>
                        <Badge className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                          {referral.role === 'student' ? '🎓 Talaba' : referral.role === 'teacher' ? '👨‍🏫 O\'qituvchi' : '👑 Admin'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UserPlus className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      Hali hech kim taklif qilinmagan
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 max-w-sm mx-auto">
                      Promo kodingizni do'stlaringiz bilan ulashing va ular yangi user bo'lganda ushbu ro'yxatda ko'rinib turadi.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="border-2 border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-500/5">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-400 mb-3">
                  💡 Maslahatlar
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                  <li className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">✓</span>
                    <span>Promo kodingizni do'stlaringiz, xanimyoplaringiz va oilangiz bilan ulashing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">✓</span>
                    <span>Admin orqali yangi user ro'yxatdan o'tkazganda shu kodni kiritishni unutmang</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">✓</span>
                    <span>Har bir taklif uchun siz bonus va chegirma olasiz</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-red-200/50 dark:border-red-900/30 bg-red-50/50 dark:bg-red-500/5">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 dark:text-red-400 font-medium">
                Referral ma'lumotlarini yuklashda xatolik yuz berdi
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </DashboardLayout>
  );
}
