import { useSeason } from '@/contexts/SeasonContext';
import { SnowEffect } from './WinterEffects';
import { SpringEffects } from './SpringEffects';
import { SummerEffects } from './SummerEffects';
import { AutumnEffects } from './AutumnEffects';

export function WinterEffectsWrapper() {
  try {
    const { season } = useSeason();

    switch (season) {
      case 'winter':
        return <SnowEffect />;
      case 'spring':
        return <SpringEffects />;
      case 'summer':
        return <SummerEffects />;
      case 'autumn':
        return <AutumnEffects />;
      default:
        return null;
    }
  } catch {
    return null;
  }
}
