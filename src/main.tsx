import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { repairCorruptedLocalCachePreserveSession } from './utils/cacheRecovery';
import React, { useEffect, useState } from 'react';
import { SplashScreen } from './components/common/SplashScreen';
import './index.css';

// Synchronously repair any broken JSON cache keys before React mounts (never wipes login/session data)
repairCorruptedLocalCachePreserveSession();

const rootElement = document.getElementById('root');
if (rootElement) {
  const BootApp = () => {
    const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('ski-splash-seen'));
    useEffect(() => {
      if (!showSplash) sessionStorage.setItem('ski-splash-seen', '1');
    }, [showSplash]);
    return (
      <>
        {showSplash && <SplashScreen onFinish={() => {
          sessionStorage.setItem('ski-splash-seen', '1');
          setShowSplash(false);
        }} />}
        {!showSplash && <App />}
      </>
    );
  };
  createRoot(rootElement).render(
    <ErrorBoundary isRoot>
      <HashRouter>
        <BootApp />
      </HashRouter>
    </ErrorBoundary>
  );
}
