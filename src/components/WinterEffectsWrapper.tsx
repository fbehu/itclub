import { useSeason } from '@/contexts/SeasonContext';
import { SnowEffect, FireworksEffect, SnowmanDecoration } from './WinterEffects';
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
    }
  } catch (error) {
    // SeasonProvider konteksti yo'q bo'lsa, default winter effektlarni ko'rsatamiz
    return (
      <>
        <SnowEffect />
        <FireworksEffect />
        <SnowmanDecoration />
      </>
    );
  }
}

