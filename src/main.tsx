import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { repairCorruptedLocalCachePreserveSession } from './utils/cacheRecovery';
import { completeEmailLinkSignInIfPresent } from './services/firebase';
import './index.css';

// Synchronously repair any broken JSON cache keys before React mounts (never wipes login/session data)
repairCorruptedLocalCachePreserveSession();

// If the app was opened from a Firebase verification / sign-in email link, finish it here.
void completeEmailLinkSignInIfPresent();

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary isRoot>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  );
}
