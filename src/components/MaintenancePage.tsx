import { useSystemStatus } from '@/contexts/SystemStatusContext';
import { Wrench, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export function MaintenancePage() {
  const { systemStatus, isThrottled, throttleMessage, refetchStatus } = useSystemStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [throttleCountdown, setThrottleCountdown] = useState(20);

  useEffect(() => {
    if (!isThrottled) return;

    const timer = setInterval(() => {
      setThrottleCountdown(prev => {
        if (prev <= 1) {
          setThrottleCountdown(20);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isThrottled]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchStatus();
    setIsRefreshing(false);
  };

  if (!systemStatus && !isThrottled) return null;

  // Rate Limiting - 429 Too Many Requests
  if (isThrottled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-500/20 rounded-full p-8 backdrop-blur">
                <Clock className="h-24 w-24 text-blue-500 animate-pulse" />
              </div>
            </div>

            <h1 className="text-5xl font-bold text-white mb-4">
              ⏳ Bir Moment Kutin
            </h1>

            <p className="text-xl text-blue-200 mb-6">
              {throttleMessage || 'Juda ko\'m so\'rov. Iltimos, biroz vaqt kutin.'}
            </p>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-8 mb-8">
              <div className="text-6xl font-bold text-blue-400 mb-4 font-mono">
                {throttleCountdown}
              </div>
              <p className="text-blue-100 font-semibold">
                soniya kutuv qoldi
              </p>
            </div>

            {/* Retry Button */}
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || throttleCountdown > 0}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-6"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Tekshirilmoqda...
                </>
              ) : throttleCountdown > 0 ? (
                <>
                  <Clock className="h-5 w-5 mr-2" />
                  {throttleCountdown} sekundadan so'ng
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Qayta tekshirish
                </>
              )}
            </Button>
          </div>

          {/* Footer Info */}
          <div className="text-center">
            <p className="text-slate-500 text-xs mt-2">
              © 2026 Universe Campus • Cyberrs.uz
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!systemStatus) return null;

  const isMaintenanceMode = systemStatus.status === 'maintenance';
  const isDegradedMode = systemStatus.status === 'degraded';

  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-red-500/20 rounded-full p-8 backdrop-blur">
                <Wrench className="h-24 w-24 text-red-500 animate-spin" />
              </div>
            </div>

            <h1 className="text-5xl font-bold text-white mb-4">
              🔧 Tizim Tamirlash Jarayonida
            </h1>

            <p className="text-xl text-red-200 mb-6">
              {systemStatus.message}
            </p>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-8">
              <p className="text-red-100 font-semibold">
                ⏳ Iltimos, biroz vaqt kutin...
              </p>
              <p className="text-red-200 text-sm mt-2">
                Tamir ishlari bitirilgach, saytga avtomatik qayta kirish imkonyatlari paydo bo'ladi.
              </p>
            </div>

            {/* Status Info */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <p className="text-white font-bold text-lg">
                    {systemStatus.status_display}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Yangilandi</p>
                  <p className="text-white font-bold text-lg">
                    {new Date(systemStatus.updated_at).toLocaleString('uz-UZ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-6"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Tekshirilmoqda...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Tekshirish
                </>
              )}
            </Button>
          </div>

          {/* Footer Info */}
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Tizimning holati har 60 sekundda avtomatik tekshiriladi.
            </p>
            <p className="text-slate-500 text-xs mt-2">
              © 2026 Universe Campus • Cyberrs.uz
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isDegradedMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-yellow-500/20 rounded-full p-8 backdrop-blur">
                <AlertCircle className="h-24 w-24 text-yellow-500" />
              </div>
            </div>

            <h1 className="text-5xl font-bold text-white mb-4">
              ⚠️ Ba'zi Xizmatlar Ishlamayapti
            </h1>

            <p className="text-xl text-yellow-200 mb-6">
              {systemStatus.message}
            </p>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-8">
              <p className="text-yellow-100 font-semibold">
                Biz muammoni hal qilyapmiz
              </p>
              <p className="text-yellow-200 text-sm mt-2">
                Sayt hozir qayta yuklanib turadi. Iltimos, vaqtinchalik sabrli bo'ling.
              </p>
            </div>

            {/* Status Info */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <p className="text-white font-bold text-lg">
                    {systemStatus.status_display}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Yangilandi</p>
                  <p className="text-white font-bold text-lg">
                    {new Date(systemStatus.updated_at).toLocaleString('uz-UZ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold px-8 py-6"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Tekshirilmoqda...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Tekshirish
                </>
              )}
            </Button>
          </div>

          {/* Footer Info */}
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Tizimning holati har 60 sekundda avtomatik tekshiriladi.
            </p>
            <p className="text-slate-500 text-xs mt-2">
              © 2026 Universe Campus • Cyberrs.uz
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
