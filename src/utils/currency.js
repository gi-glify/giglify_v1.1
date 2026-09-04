// Mock exchange rates - replace with real API in production
export const fetchExchangeRate = async () => {
    // In production, use real API like Open Exchange Rates, Alpha Vantage, or Finnhub
    try {
        // Simulated rate - typically 1 USD = ~150 KES
        return {
            usd: 1,
            kes: 150,
            rate: 150,
            updatedAt: new Date().toISOString(),
        };
    }
    catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        return {
            usd: 1,
            kes: 150,
            rate: 150,
            updatedAt: new Date().toISOString(),
        };
    }
};
export const convertUSDtoKES = (usd, rate) => {
    return parseFloat((usd * rate).toFixed(2));
};
export const convertKEStoUSD = (kes, rate) => {
    return parseFloat((kes / rate).toFixed(2));
};
export const formatCurrency = (amount, currency) => {
    if (currency === 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    }
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
    }).format(amount);
};
//# sourceMappingURL=currency.js.map