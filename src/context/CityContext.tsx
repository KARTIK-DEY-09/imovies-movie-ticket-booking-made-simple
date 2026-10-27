import React, { createContext, useContext, useState, useEffect } from 'react';

interface CityContextType {
  city: string;
  setCity: (city: string) => void;
  availableCities: string[];
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const AVAILABLE_CITIES = ['Mumbai', 'Delhi-NCR', 'Bengaluru', 'Hyderabad'];

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [city, setCityState] = useState<string>(() => {
    return localStorage.getItem('imovies_city') || 'Mumbai';
  });

  const setCity = (newCity: string) => {
    setCityState(newCity);
    localStorage.setItem('imovies_city', newCity);
  };

  return (
    <CityContext.Provider value={{ city, setCity, availableCities: AVAILABLE_CITIES }}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};
