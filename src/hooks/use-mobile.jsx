import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Check if it's a mobile device
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      if (width <= 768 || isMobileDevice) {
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width <= 1024) {
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else {
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }
    };

    // Check on mount
    checkDevice();

    // Add resize listener
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return { isMobile, isTablet, isDesktop };
}

// Hook to detect if device supports touch
export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouchScreen);
    };

    checkTouchDevice();
  }, []);

  return isTouchDevice;
}

// Hook to get device orientation
export function useOrientation() {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const checkOrientation = () => {
      if (window.innerHeight > window.innerWidth) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  return orientation;
}
