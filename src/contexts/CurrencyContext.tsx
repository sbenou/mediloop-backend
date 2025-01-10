import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Currency = {
  code: string;
  name: string;
  symbol: string;
  rate?: number;
};

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  currencies: Currency[];
  convertPrice: (price: number) => number;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencies, setCurrencies] = useState<Currency[]>([
    { code: 'usd', name: 'US Dollar', symbol: '$', rate: 1 },
  ]);
  const [currency, setCurrency] = useState<Currency>(currencies[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-currencies');
        
        if (error) {
          console.error('Error fetching currencies:', error);
          return;
        }

        if (data.currencies) {
          setCurrencies(data.currencies);
          // Try to load saved currency preference
          const savedCurrency = localStorage.getItem('preferredCurrency');
          if (savedCurrency) {
            const parsed = JSON.parse(savedCurrency);
            const found = data.currencies.find(c => c.code === parsed.code);
            if (found) {
              setCurrency(found);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch currencies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferredCurrency', JSON.stringify(newCurrency));
  };

  const convertPrice = (priceInUSD: number): number => {
    if (!currency.rate) return priceInUSD;
    return Number((priceInUSD * currency.rate).toFixed(2));
  };

  return (
    <CurrencyContext.Provider 
      value={{ 
        currency, 
        setCurrency: handleSetCurrency, 
        currencies,
        convertPrice
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