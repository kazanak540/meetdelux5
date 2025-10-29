import { useState, useEffect, useContext, createContext } from 'react';

// Currency Context
const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('TRY');
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  // Detect user's currency and fetch rates
  useEffect(() => {
    const fetchCurrencyInfo = async () => {
      try {
        setLoading(true);
        
        // Detect currency based on IP
        const detectResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/currency/detect`);
        const detectData = await detectResponse.json();
        setCurrency(detectData.currency);

        // Fetch exchange rates
        const ratesResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/currency/rates`);
        const ratesData = await ratesResponse.json();
        setRates(ratesData.rates);
        
      } catch (error) {
        console.error('Failed to fetch currency info:', error);
        // Fallback to TRY
        setCurrency('TRY');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencyInfo();
  }, []);

  const formatPrice = (price, baseCurrency = 'EUR') => {
    if (!price) return '0';

    let displayPrice = price;
    let displayCurrency = currency;

    // If we have pricing info from backend, use it
    if (typeof price === 'object' && price.pricing_info) {
      displayPrice = price.pricing_info.display_price;
      displayCurrency = price.pricing_info.display_currency;
    } else {
      // Convert price if needed
      if (baseCurrency !== currency && rates[`${baseCurrency}_to_${currency}`]) {
        displayPrice = price * rates[`${baseCurrency}_to_${currency}`];
      }
    }

    const currencySymbols = {
      'TRY': '₺',
      'EUR': '€',
      'USD': '$'
    };

    const symbol = currencySymbols[displayCurrency] || displayCurrency;
    
    // Format with thousands separator
    const formattedPrice = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(displayPrice));

    return `${formattedPrice} ${symbol}`;
  };

  const getCurrencySymbol = () => {
    const symbols = {
      'TRY': '₺',
      'EUR': '€', 
      'USD': '$'
    };
    return symbols[currency] || currency;
  };

  const value = {
    currency,
    rates,
    loading,
    formatPrice,
    getCurrencySymbol,
    setCurrency
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Hook to use currency context
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export default useCurrency;