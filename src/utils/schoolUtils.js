// Hardcoded school configurations
export const SCHOOL_CONFIGS = {
  'gatech.edu': {
    name: 'Georgia Tech',
    shortName: 'GT',
    primaryColor: '#B3A369', // Gold
    secondaryColor: '#003057', // Navy Blue
    accentColor: '#EAAA00', // Bright Gold
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF'
  },
  'rice.edu': {
    name: 'Rice University',
    shortName: 'Rice',
    primaryColor: '#003366', // Rice Blue
    secondaryColor: '#7C7C7C', // Gray
    accentColor: '#0066CC', // Bright Blue
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF'
  },
  // Default theme for unknown schools
  'default': {
    name: 'University',
    shortName: 'U',
    primaryColor: '#3B82F6', // Blue
    secondaryColor: '#6B7280', // Gray
    accentColor: '#1D4ED8', // Dark Blue
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF'
  }
};

// Utility function to get school info from email
export const getSchoolFromEmail = (email) => {
  if (!email) return null;
  const domain = email.split('@')[1]?.toLowerCase();
  return SCHOOL_CONFIGS[domain] || null;
};

// Utility function to validate .edu email
export const validateEduEmail = (email) => {
  if (!email) return { isValid: false, error: 'Email is required' };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  if (!email.toLowerCase().endsWith('.edu')) {
    return { isValid: false, error: 'Please use your school email address (.edu)' };
  }
  
  return { isValid: true, error: null };
};