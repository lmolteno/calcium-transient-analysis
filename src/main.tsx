import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' 
import { NextUIProvider } from "@nextui-org/react";
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <NextUIProvider>
        <main className="text-foreground bg-background h-screen">
          <App />
        </main>
      </NextUIProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
