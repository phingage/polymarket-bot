/**
 * Safely converts a date value to ISO string
 * @param dateValue - The date value from MongoDB (can be Date, string, or undefined)
 * @returns ISO string representation of the date
 */
export function safeToISOString(dateValue: any): string {
  if (!dateValue) {
    return new Date().toISOString();
  }
  
  if (dateValue instanceof Date) {
    return dateValue.toISOString();
  }
  
  if (typeof dateValue === 'string') {
    try {
      return new Date(dateValue).toISOString();
    } catch (error) {
      console.warn('Invalid date string:', dateValue);
      return new Date().toISOString();
    }
  }
  
  if (typeof dateValue === 'number') {
    return new Date(dateValue).toISOString();
  }
  
  // If it's an object with a timestamp or similar
  if (typeof dateValue === 'object' && dateValue.toString) {
    try {
      return new Date(dateValue.toString()).toISOString();
    } catch (error) {
      console.warn('Could not convert date object:', dateValue);
      return new Date().toISOString();
    }
  }
  
  console.warn('Unknown date format:', typeof dateValue, dateValue);
  return new Date().toISOString();
}