import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

export interface StatData {
  total_students?: number;
  active_students?: number;
  total_referrals?: number;
  total_earnings?: number;
  monthly_growth?: number;
  week_stats?: Array<{
    day: string;
    count: number;
    earnings: number;
  }>;
  top_10_referrals?: Array<{
    username: string;
    referral_count: number;
    earning: number;
  }>;
}

export default function ManagerStatistics() {
  const [stats, setStats] = useState<StatData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authFetch('/api/accounts/user/stats/', {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Statistika yuklashda xatolik:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl font-bold">Statistika</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Jami Talabalar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.total_students || 0}
              </div>
              {stats.monthly_growth && (
                <p className="text-xs text-green-600 mt-1">
                  +{stats.monthly_growth}% bu oy
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Faol Talabalar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active_students || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Takliflar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.total_referrals || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Jami Daromad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {(stats.total_earnings || 0).toLocaleString()} so'm
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Referrals Table */}
        {stats.top_10_referrals && stats.top_10_referrals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Taklif Qiluvchilar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Foydalanuvchi</th>
                      <th className="text-right py-2 px-4">Takliflar soni</th>
                      <th className="text-right py-2 px-4">Daromad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_10_referrals.map((referral, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-2 px-4">{referral.username}</td>
                        <td className="text-right py-2 px-4 font-semibold">
                          {referral.referral_count}
                        </td>
                        <td className="text-right py-2 px-4 text-green-600 font-semibold">
                          {referral.earning?.toLocaleString()} so'm
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
