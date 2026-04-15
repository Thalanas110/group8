import React from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { AppProvider } from './context/AppContext';

export default function App() {
  return (
    <div className="app-shell">
      <AppProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton />
      </AppProvider>
    </div>
  );
}
