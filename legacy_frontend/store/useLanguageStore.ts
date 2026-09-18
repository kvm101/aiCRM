import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'ua' | 'en';

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: 'ua',
      setLang: (lang) => set({ lang }),
      toggle: () => set({ lang: get().lang === 'ua' ? 'en' : 'ua' }),
    }),
    { name: 'crm-language' }
  )
);
