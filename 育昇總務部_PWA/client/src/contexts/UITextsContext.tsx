import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type UITexts, getUITexts, saveUITexts, resetUITexts as resetTexts } from '@/lib/i18n';

interface UITextsContextType {
  texts: UITexts;
  updateTexts: (newTexts: Partial<UITexts>) => void;
  resetUITexts: () => void;
}

const UITextsContext = createContext<UITextsContextType | undefined>(undefined);

export function UITextsProvider({ children }: { children: ReactNode }) {
  const [texts, setTexts] = useState<UITexts>(getUITexts());

  const updateTexts = (newTexts: Partial<UITexts>) => {
    saveUITexts(newTexts);
    setTexts(getUITexts());
  };

  const resetUITexts = () => {
    resetTexts();
    setTexts(getUITexts());
  };

  return (
    <UITextsContext.Provider value={{ texts, updateTexts, resetUITexts }}>
      {children}
    </UITextsContext.Provider>
  );
}

export function useUITexts() {
  const context = useContext(UITextsContext);
  if (!context) {
    throw new Error('useUITexts must be used within UITextsProvider');
  }
  return context;
}
