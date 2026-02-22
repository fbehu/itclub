import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Trophy } from 'lucide-react';

interface TopReferral {
  rank: number;
  student: string;
  referral_count: number;
  total_earnings: number;
}

interface ReferralLeaderboardProps {
  data: TopReferral[];
  loading: boolean;
}

export default function ReferralLeaderboard({ data, loading }: ReferralLeaderboardProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.length > 0 ? (
        <>
          {/* Trophy Header */}
          <Card className="border-none bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-500/5 dark:to-amber-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Top 10 Referrers
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Eng ko'p taklif qilgan talabalar
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rankings */}
          {data.map((student, index) => (
            <Card
              key={`${student.rank}-${student.student}`}
              className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {/* Rank Medal */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg ${
                        student.rank === 1
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg'
                          : student.rank === 2
                          ? 'bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg'
                          : student.rank === 3
                          ? 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg'
                          : 'bg-gradient-to-br from-slate-400 to-slate-600'
                      }`}
                    >
                      {student.rank}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {student.student}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="flex-shrink-0 flex gap-2">
                    {/* Referral Count */}
                    <div className="flex flex-col items-center justify-center p-3 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-200 dark:border-purple-500/30">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Taklif
                      </p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {student.referral_count}
                      </p>
                    </div>

                    {/* Total Earnings */}
                    <div className="flex flex-col items-center justify-center p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/30">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Jami To'plagan
                      </p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {(student.total_earnings / 1000).toFixed(1)}k
                      </p>
                    </div>
                  </div>
                </div>

                {/* Achievement Badges */}
                {student.rank <= 3 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {student.rank === 1 && (
                      <Badge className="bg-yellow-500 text-white">
                        🥇 Birinchi o'rin
                      </Badge>
                    )}
                    {student.rank === 2 && (
                      <Badge className="bg-gray-500 text-white">
                        🥈 Ikkinchi o'rin
                      </Badge>
                    )}
                    {student.rank === 3 && (
                      <Badge className="bg-orange-500 text-white">
                        🥉 Uchinchi o'rin
                      </Badge>
                    )}
                    {student.total_earnings > 500000 && (
                      <Badge className="bg-green-500 text-white">
                        💰 Mega Earner
                      </Badge>
                    )}
                    {student.referral_count > 20 && (
                      <Badge className="bg-purple-500 text-white">
                        ⭐ Super Referrer
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      ) : (
        <Card className="border-none bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90">
          <CardContent className="p-12 text-center">
            <TrendingUp className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">
              Hali leaderboard ma'lumotlari yo'q
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
