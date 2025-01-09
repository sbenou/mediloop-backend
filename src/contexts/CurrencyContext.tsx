import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Currency = {
  code: string;
  name: string;
  symbol: string;
};

const currencies: Currency[] = [
  { code: 'eur', name: 'Euro', symbol: '€' },
  { code: 'usd', name: 'US Dollar', symbol: '$' },
  { code: 'gbp', name: 'British Pound', symbol: '£' },
  // Add more currencies as needed
];

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  currencies: Currency[];
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(currencies[0]); // Default to EUR

  useEffect(() => {
    // Load saved currency preference from localStorage
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency) {
      const parsed = JSON.parse(savedCurrency);
      setCurrency(parsed);
    }
  }, []);

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferredCurrency', JSON.stringify(newCurrency));
  };

  return (
    <CurrencyContext.Provider 
      value={{ 
        currency, 
        setCurrency: handleSetCurrency,
        currencies 
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}