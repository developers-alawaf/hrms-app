import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PendingRequestsProvider } from './context/PendingRequestsContext';
import { router } from './routes';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <PendingRequestsProvider>
          <RouterProvider router={router} />
        </PendingRequestsProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);