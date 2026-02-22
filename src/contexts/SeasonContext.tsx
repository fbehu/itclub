import React, { createContext, useContext, useState, useEffect } from 'react';

export type Season = 'winter' | 'spring' | 'summer' | 'autumn' | 'default';

interface SeasonContextType {
  season: Season;
  setSeason: (season: Season) => void;
  resetToDefault: () => void;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

const SEASON_STORAGE_KEY = 'itclub_season';
const DEFAULT_SEASON: Season = 'default';

const SEASON_CLASSES = ['season-winter', 'season-spring', 'season-summer', 'season-autumn'];

export const SeasonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [season, setSeasonState] = useState<Season>(DEFAULT_SEASON);
  const [isLoaded, setIsLoaded] = useState(false);

  const applySeasonClass = (s: Season) => {
    const root = document.documentElement;
    SEASON_CLASSES.forEach(cls => root.classList.remove(cls));
    if (s !== 'default') {
      root.classList.add(`season-${s}`);
    }
  };

  useEffect(() => {
    const storedSeason = localStorage.getItem(SEASON_STORAGE_KEY);
    if (storedSeason && ['winter', 'spring', 'summer', 'autumn', 'default'].includes(storedSeason)) {
      setSeasonState(storedSeason as Season);
      applySeasonClass(storedSeason as Season);
    } else {
      setSeasonState(DEFAULT_SEASON);
      applySeasonClass(DEFAULT_SEASON);
    }
    setIsLoaded(true);
  }, []);

  const setSeason = (newSeason: Season) => {
    setSeasonState(newSeason);
    localStorage.setItem(SEASON_STORAGE_KEY, newSeason);
    applySeasonClass(newSeason);
  };

  const resetToDefault = () => {
    setSeason(DEFAULT_SEASON);
  };

  if (!isLoaded) {
    return <>{children}</>;
  }

  return (
    <SeasonContext.Provider value={{ season, setSeason, resetToDefault }}>
      {children}
    </SeasonContext.Provider>
  );
};

export const useSeason = () => {
  const context = useContext(SeasonContext);
  if (!context) {
    throw new Error('useSeason must be used within SeasonProvider');
  }
  return context;
};
