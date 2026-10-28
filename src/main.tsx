import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { GlassToastContainer } from './components/common/GlassToastContainer.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
      <GlassToastContainer />
    </ToastProvider>
  </StrictMode>
);
