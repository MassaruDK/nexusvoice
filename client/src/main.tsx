import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import { AuthProvider } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';
import { VoiceProvider } from './context/VoiceContext.js';
import { ToastProvider } from './context/ToastContext.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <VoiceProvider>
            <App />
          </VoiceProvider>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);
