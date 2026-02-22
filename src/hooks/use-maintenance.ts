import { useSystemStatus } from '@/contexts/SystemStatusContext';
import { toast } from 'sonner';

export function useMaintenanceAwareAPI() {
  const { isMaintenanceActive, systemStatus } = useSystemStatus();

  const checkMaintenance = () => {
    if (isMaintenanceActive) {
      toast.error(
        systemStatus?.message || 'Tizim ta\'mirlash jarayonida. Iltimos, biroz vaqt kutin.',
        { duration: 5000 }
      );
      return true;
    }
    return false;
  };

  return {
    isMaintenanceActive,
    checkMaintenance,
  };
}
