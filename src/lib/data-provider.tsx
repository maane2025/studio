"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Cost } from './data';
import { historicalCosts as initialHistoricalCosts } from './data';

interface DataContextType {
  historicalCosts: Cost[];
  setHistoricalCosts: (data: Cost[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [historicalCosts, setHistoricalCosts] = useState<Cost[]>(initialHistoricalCosts);

  return (
    <DataContext.Provider value={{ historicalCosts, setHistoricalCosts }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};
