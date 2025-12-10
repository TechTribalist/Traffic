import React, { createContext, useContext, useState, useEffect } from 'react';

interface DevelopmentModeContextType {
  isDevelopmentMode: boolean;
  toggleDevelopmentMode: () => void;
  useMockData: boolean;
}

const DevelopmentModeContext = createContext<DevelopmentModeContextType | undefined>(undefined);

export const DevelopmentModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(() => {
    const saved = localStorage.getItem('developmentMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('developmentMode', JSON.stringify(isDevelopmentMode));
  }, [isDevelopmentMode]);

  const toggleDevelopmentMode = () => {
    setIsDevelopmentMode(prev => !prev);
  };

  const value = {
    isDevelopmentMode,
    toggleDevelopmentMode,
    useMockData: isDevelopmentMode,
  };

  return (
    <DevelopmentModeContext.Provider value={value}>
      {children}
    </DevelopmentModeContext.Provider>
  );
};

export const useDevelopmentMode = () => {
  const context = useContext(DevelopmentModeContext);
  if (!context) {
    throw new Error('useDevelopmentMode must be used within DevelopmentModeProvider');
  }
  return context;
};