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

function hasSeenSplash(): boolean {
  try {
    return sessionStorage.getItem('ski-splash-seen') === '1';
  } catch {
    return false;
  }
}

function markSplashSeen(): void {
  try {
    sessionStorage.setItem('ski-splash-seen', '1');
  } catch {
    // The animation remains one-shot for this mounted app even when storage is disabled.
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const BootApp = () => {
    const [showSplash, setShowSplash] = useState(() => !hasSeenSplash());
    useEffect(() => {
      if (!showSplash) markSplashSeen();
    }, [showSplash]);
    return (
      <>
        {showSplash && <SplashScreen onFinish={() => {
          markSplashSeen();
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
