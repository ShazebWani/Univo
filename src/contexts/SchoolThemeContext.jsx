import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { SCHOOL_CONFIGS } from '@/utils/schoolUtils';

// Helper function to convert hex to HSL for Tailwind
const hexToHSL = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const SchoolThemeContext = createContext({});

export const useSchoolTheme = () => {
  return useContext(SchoolThemeContext);
};

export const SchoolThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentTheme, setCurrentTheme] = useState(SCHOOL_CONFIGS.default);
  const [schoolDomain, setSchoolDomain] = useState(null);

  const applyTheme = (schoolConfig, domain = null) => {
    console.log('🎨 Applying theme:', schoolConfig.name);
    console.log('🎨 Primary Color (hex):', schoolConfig.primaryColor);
    console.log('🎨 Secondary Color (hex):', schoolConfig.secondaryColor);
    
    const root = document.documentElement;
    
    // Apply school-specific CSS variables
    root.style.setProperty('--school-primary', schoolConfig.primaryColor);
    root.style.setProperty('--school-secondary', schoolConfig.secondaryColor);
    root.style.setProperty('--school-accent', schoolConfig.accentColor);
    root.style.setProperty('--school-text-on-primary', schoolConfig.textOnPrimary);
    root.style.setProperty('--school-text-on-secondary', schoolConfig.textOnSecondary);
    
    // Also update Tailwind primary colors
    root.style.setProperty('--primary-hex', schoolConfig.primaryColor);
    root.style.setProperty('--secondary-hex', schoolConfig.secondaryColor);
    
    // Convert hex to HSL for Tailwind compatibility and apply immediately
    const primaryHSL = hexToHSL(schoolConfig.primaryColor);
    const secondaryHSL = hexToHSL(schoolConfig.secondaryColor);
    console.log('🎨 Primary HSL:', primaryHSL);
    console.log('🎨 Secondary HSL:', secondaryHSL);
    root.style.setProperty('--primary', primaryHSL);
    root.style.setProperty('--secondary', secondaryHSL);
    
    // Force immediate style recalculation
    root.style.display = 'none';
    root.offsetHeight; // Trigger reflow
    root.style.display = '';
    
    // Also trigger a repaint by briefly changing a harmless property
    document.body.style.transform = 'translateZ(0)';
    setTimeout(() => {
      document.body.style.transform = '';
    }, 0);
    
    // Update state
    setCurrentTheme(schoolConfig);
    setSchoolDomain(domain);
  };

  useEffect(() => {
    if (user?.email) {
      const domain = user.email.split('@')[1]?.toLowerCase();
      console.log('User email domain:', domain);
      
      // Find matching school config
      const schoolConfig = SCHOOL_CONFIGS[domain] || SCHOOL_CONFIGS.default;
      console.log('Selected school config:', schoolConfig);
      
      applyTheme(schoolConfig, domain);
    } else {
      console.log('No user, applying default theme');
      applyTheme(SCHOOL_CONFIGS.default, null);
    }
  }, [user]);

  // Also apply theme when component mounts to ensure it's set
  useEffect(() => {
    const initialTheme = user?.email ? 
      SCHOOL_CONFIGS[user.email.split('@')[1]?.toLowerCase()] || SCHOOL_CONFIGS.default :
      SCHOOL_CONFIGS.default;
    applyTheme(initialTheme, user?.email?.split('@')[1]?.toLowerCase() || null);
  }, []);

  const value = {
    currentTheme,
    schoolDomain,
    isSchoolRecognized: schoolDomain && SCHOOL_CONFIGS[schoolDomain],
    availableSchools: Object.keys(SCHOOL_CONFIGS).filter(key => key !== 'default'),
    refreshTheme: () => {
      if (user?.email) {
        const domain = user.email.split('@')[1]?.toLowerCase();
        const schoolConfig = SCHOOL_CONFIGS[domain] || SCHOOL_CONFIGS.default;
        applyTheme(schoolConfig, domain);
      }
    }
  };

  return (
    <SchoolThemeContext.Provider value={value}>
      {children}
    </SchoolThemeContext.Provider>
  );
};

// These functions are now in @/utils/schoolUtils to avoid circular imports