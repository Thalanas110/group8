import React, { useMemo } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { createAppRouter } from './routes';
import { AppProvider } from './context/AppContext';

export default function App() {
  const router = useMemo(() => createAppRouter(), []);

  return (
    <div className="app-shell">
      <AppProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton />
      </AppProvider>
    </div>
  );
}
