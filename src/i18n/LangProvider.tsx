'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { dict, type Dict, type Lang } from './dict';

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
};

const LangContext = createContext<LangContextValue | null>(null);

const STORAGE_KEY = 'hh-lang';

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ja');

  // Restore saved language on mount. Reading localStorage must happen after
  // hydration (it's unavailable during SSR), so a one-shot effect is the right
  // place to sync this external value back into React state.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing persisted value from an external store on mount
    if (saved === 'ja' || saved === 'en') setLangState(saved);
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t: dict[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within a LangProvider');
  return ctx;
}
