import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { testFirestoreConnection } from './services/firebase';

// Verify Firestore connection on boot
testFirestoreConnection();

createRoot(document.getElementById('root')!).render(<App />);

