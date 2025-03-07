
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'EUR',
  setCurrency: () => {},
  formatCurrency: () => '',
  convertCurrency: () => 0,
});

export const useCurrency = () => useContext(CurrencyContext);

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrency] = useState('EUR');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, use hardcoded exchange rates
    // In a real app, you would fetch these from an API
    setExchangeRates({
      EUR: 1,
      USD: 1.09,
      GBP: 0.85,
    });
    setIsLoading(false);
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (isLoading || !exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
      return amount;
    }

    // Convert to base currency (EUR) first, then to target currency
    const amountInEUR = amount / exchangeRates[fromCurrency];
    return amountInEUR * exchangeRates[toCurrency];
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatCurrency,
        convertCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};
