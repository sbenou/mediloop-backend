
import React, { createContext, useContext, useState, useEffect } from 'react';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

export interface CurrencyContextType {
  currency: Currency;
  currencies: Currency[];
  setCurrency: (currencyCode: string) => void;
  formatCurrency: (amount: number) => string;
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => number;
  convertPrice: (price: number) => number;
}

const defaultCurrency: Currency = {
  code: 'EUR',
  name: 'Euro',
  symbol: '€',
  rate: 1
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: defaultCurrency,
  currencies: [defaultCurrency],
  setCurrency: () => {},
  formatCurrency: () => '',
  convertCurrency: () => 0,
  convertPrice: () => 0
});

export const useCurrency = () => useContext(CurrencyContext);

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(defaultCurrency);
  const [currencies, setCurrencies] = useState<Currency[]>([defaultCurrency]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, use hardcoded exchange rates and currencies
    // In a real app, you would fetch these from an API
    const hardcodedCurrencies = [
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 1 },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.09 },
      { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.85 },
    ];
    
    setCurrencies(hardcodedCurrencies);
    
    setExchangeRates({
      EUR: 1,
      USD: 1.09,
      GBP: 0.85,
    });
    
    setIsLoading(false);
  }, []);

  const setCurrency = (currencyCode: string) => {
    const newCurrency = currencies.find(c => c.code === currencyCode) || defaultCurrency;
    setCurrencyState(newCurrency);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
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
  
  // Helper function to convert prices to the current currency
  const convertPrice = (price: number): number => {
    if (currency.code === 'EUR') return price; // Base currency
    return price * currency.rate;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencies,
        setCurrency,
        formatCurrency,
        convertCurrency,
        convertPrice
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};
