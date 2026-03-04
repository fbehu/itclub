import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GlassThemeContextType {
  glassEnabled: boolean;
  setGlassEnabled: (enabled: boolean) => void;
}

const GlassThemeContext = createContext<GlassThemeContextType>({
  glassEnabled: false,
  setGlassEnabled: () => {},
});

export const useGlassTheme = () => useContext(GlassThemeContext);

export function GlassThemeProvider({ children }: { children: ReactNode }) {
  const [glassEnabled, setGlassEnabled] = useState(() => {
    return localStorage.getItem('glass-theme') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('glass-theme', String(glassEnabled));
    if (glassEnabled) {
      document.documentElement.classList.add('glass-theme');
    } else {
      document.documentElement.classList.remove('glass-theme');
    }
  }, [glassEnabled]);

  return (
    <GlassThemeContext.Provider value={{ glassEnabled, setGlassEnabled }}>
      {children}
    </GlassThemeContext.Provider>
  );
}
