// utils/dateFormatter.js
import { format, isValid, parseISO } from 'date-fns';

 const safeFormat = (date, formatStr = 'MMM d, yyyy') => {
  if (!date) return 'N/A';
  
  let dateObj;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    return 'N/A';
  }
  
  return isValid(dateObj) ? format(dateObj, formatStr) : 'N/A';
};
export default safeFormat;