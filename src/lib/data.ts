export type Cost = {
  date: string;
  totalCost: number;
  unitCost: number;
  volume: number;
};

// Simple pseudo-random number generator for deterministic results
const createSeededRandom = (seed: number) => {
    let state = seed;
    return () => {
        state = (state * 9301 + 49297) % 233280;
        return state / 233280;
    };
};

const generateHistoricalCosts = (): Cost[] => {
  const data: Cost[] = [];
  const baseFixedCost = 50000;
  const baseVariableCostPerUnit = 75;
  let volume = 1000;
  const random = createSeededRandom(12345); // Use a fixed seed

  for (let i = 23; i >= 0; i--) {
    const date = new Date(2024, 5, 1); // Use a fixed start date
    date.setMonth(date.getMonth() - i);
    
    // Introduce some seasonality and trend to volume
    const month = date.getMonth();
    const seasonalFactor = 1 + 0.2 * Math.sin((month / 12) * 2 * Math.PI);
    const trendFactor = 1 + i * 0.005;
    volume = 1000 * seasonalFactor * trendFactor + random() * 100 - 50;

    const variableCostPerUnit = baseVariableCostPerUnit + (random() - 0.5) * 5;
    const fixedCost = baseFixedCost + (random() - 0.5) * 2000;
    
    const totalVariableCost = volume * variableCostPerUnit;
    const totalCost = fixedCost + totalVariableCost;
    const unitCost = totalCost / volume;

    data.push({
      date: date.toISOString().split('T')[0],
      totalCost: Math.round(totalCost),
      unitCost: Math.round(unitCost * 100) / 100,
      volume: Math.round(volume),
    });
  }
  return data;
};

export const historicalCosts: Cost[] = generateHistoricalCosts();

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value);
};
