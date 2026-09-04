import { useEffect, useState } from 'react';
import { getDeviceInfo, isDesktopEligible, isMobileOptimized } from '../utils/deviceDetection';
import { DeviceInfo } from '../types';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function VerifyPage() {
  const { theme } = useTheme();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [desktopEligible, setDesktopEligible] = useState(false);
  const [mobileOptimized, setMobileOptimized] = useState(false);

  useEffect(() => {
    const checkDevice = async () => {
      try {
        const info = await getDeviceInfo();
        setDeviceInfo(info);
        setDesktopEligible(isDesktopEligible(info));
        setMobileOptimized(isMobileOptimized(info));
      } finally {
        setLoading(false);
      }
    };

    checkDevice();
  }, []);

  return (
    <div className="min-h-screen transition-colors" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="container pt-8">
        <h1 className="font-display text-2xl font-bold" data-aos="fade-down">Device Verification</h1>
      </div>

      <main className="container py-8">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="spinner"></div>
          </div>
        ) : deviceInfo ? (
          <div className="max-w-2xl mx-auto">
            <div className={`card mb-8 animate-in ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : ''}`}>
              <h2 className="font-display text-2xl mb-4">System Analysis</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                    Hardware
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold">CPU Cores</p>
                      <p className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}>{deviceInfo.cpuCores}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Screen Resolution</p>
                      <p className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}>
                        {deviceInfo.screenWidth} × {deviceInfo.screenHeight}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Connection</p>
                      <p className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}>
                        {deviceInfo.connectionSpeed.charAt(0).toUpperCase() + deviceInfo.connectionSpeed.slice(1)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                    Software
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold">Operating System</p>
                      <p className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}>{deviceInfo.os}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Browser</p>
                      <p className={theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}>{deviceInfo.browser}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Eligibility Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className={`card animate-in ${desktopEligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-3">
                  {desktopEligible ? (
                    <CheckCircle2 className="text-green-600 flex-shrink-0 mt-1" size={24} />
                  ) : (
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                  )}
                  <div>
                    <h3 className="font-semibold mb-1">Desktop Tasks</h3>
                    <p className="text-sm">
                      {desktopEligible
                        ? 'Your device meets requirements for advanced desktop tasks.'
                        : 'Upgrade to unlock high-performance desktop tasks.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`card animate-in ${mobileOptimized ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-start gap-3">
                  {mobileOptimized ? (
                    <CheckCircle2 className="text-green-600 flex-shrink-0 mt-1" size={24} />
                  ) : (
                    <AlertCircle className="text-orange-600 flex-shrink-0 mt-1" size={24} />
                  )}
                  <div>
                    <h3 className="font-semibold mb-1">Mobile Tasks</h3>
                    <p className="text-sm">
                      {mobileOptimized
                        ? 'You can access mobile-optimized micro-tasks.'
                        : 'Desktop device. Mobile tasks unavailable.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
