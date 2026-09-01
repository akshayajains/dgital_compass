import { useContext } from 'react';
import { SunTimesContext } from '@/contexts/SunTimesContext';

export const useSunTimes = () => {
  const context = useContext(SunTimesContext);
  if (!context) {
    throw new Error('useSunTimes must be used within a SunTimesProvider');
  }
  return context;
};
