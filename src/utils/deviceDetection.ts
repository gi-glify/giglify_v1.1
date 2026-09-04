import { DeviceInfo } from '../types';

export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  const cpuCores = navigator.hardwareConcurrency || 1;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  const ua = navigator.userAgent;
  let os = 'Unknown';
  let browser = 'Unknown';

  if (ua.indexOf('Win') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'macOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('iOS') > -1) os = 'iOS';

  if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') > -1) browser = 'Safari';
  else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (ua.indexOf('Edge') > -1) browser = 'Edge';

  // Simple connection speed estimation
  let connectionSpeed: 'slow' | 'moderate' | 'fast' = 'moderate';
  if ((navigator as any).connection) {
    const effectiveType = (navigator as any).connection.effectiveType;
    if (effectiveType === '4g') connectionSpeed = 'fast';
    else if (effectiveType === '3g') connectionSpeed = 'moderate';
    else connectionSpeed = 'slow';
  }

  return {
    cpuCores,
    screenWidth,
    screenHeight,
    os,
    browser,
    connectionSpeed,
  };
};

export const isDesktopEligible = (device: DeviceInfo): boolean => {
  return device.cpuCores >= 4 && device.screenWidth >= 1024;
};

export const isMobileOptimized = (device: DeviceInfo): boolean => {
  return device.screenWidth < 768;
};
