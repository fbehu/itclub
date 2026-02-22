import { AlertCircle, Wrench } from 'lucide-react';
import { useSystemStatus } from '@/contexts/SystemStatusContext';

export function MaintenanceBanner() {
  const { systemStatus, isMaintenanceActive, isDegraded } = useSystemStatus();

  if (!systemStatus || (!isMaintenanceActive && !isDegraded)) {
    return null;
  }

  if (isMaintenanceActive) {
    return (
      <div className="w-full bg-gradient-to-r from-red-500 via-red-500 to-orange-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex items-center gap-4">
          <div className="flex-shrink-0">
            <Wrench className="h-6 w-6 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg">🔧 Sayt Tamirlash Jarayonida</h3>
            <p className="text-sm opacity-90">{systemStatus.message}</p>
            <p className="text-xs opacity-75 mt-1">
              Tizim: {new Date(systemStatus.updated_at).toLocaleString('uz-UZ')}
            </p>
          </div>
          <div className="flex-shrink-0 text-center">
            <p className="text-2xl font-bold">⏱️</p>
            <p className="text-xs font-semibold">Biroz kutin...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isDegraded) {
    return (
      <div className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex items-center gap-4">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg">⚠️ Ba'zi Xizmatlar Qisqa Vaqtga Ishlamayapti</h3>
            <p className="text-sm opacity-90">{systemStatus.message}</p>
            <p className="text-xs opacity-75 mt-1">
              Yangilandi: {new Date(systemStatus.updated_at).toLocaleString('uz-UZ')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
