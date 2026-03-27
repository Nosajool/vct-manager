// Layout Component - Main app layout with header, nav, and content

import { type ReactNode } from 'react';
import { Header } from './Header';
import { TimeBar } from './TimeBar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-vct-dark flex flex-col">
      <Header />
      <TimeBar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-32">
        {children}
      </main>
    </div>
  );
}
