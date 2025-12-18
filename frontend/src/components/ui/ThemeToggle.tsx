import { MoonStar, SunMedium } from 'lucide-react';
import { useEffect, useState } from 'react';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem('district_theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('district-light', 'district-dark', 'district-theme');
    root.classList.add('district-theme', theme === 'light' ? 'district-light' : 'district-dark');
    localStorage.setItem('district_theme', theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition-all text-sm font-semibold"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <SunMedium className="w-4 h-4" /> : <MoonStar className="w-4 h-4" />}
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
};

