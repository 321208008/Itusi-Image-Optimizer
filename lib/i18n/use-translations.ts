'use client';

import { create } from 'zustand';
import { translations } from './translations';

type Language = 'en' | 'zh';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationKey = NestedKeyOf<typeof translations.en>;

interface I18nStore {
  language: Language;
  t: (key: TranslationKey) => string;
  setLanguage: (lang: Language) => void;
}

export const useI18n = create<I18nStore>((set, get) => ({
  language: 'en',
  t: (key: TranslationKey) => {
    const state = get();
    const keys = key.split('.');
    let value: any = translations[state.language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    return value || key;
  },
  setLanguage: (lang: Language) => set({ language: lang }),
}));