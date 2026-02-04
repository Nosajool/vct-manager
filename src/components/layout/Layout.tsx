// Layout Component - Main app layout with header, nav, and content

import { useState, type ReactNode } from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { TimeBar } from './TimeBar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-vct-dark flex flex-col">
      <Header />
      <Navigation />
      <TimeBar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="bg-vct-darker border-t border-vct-gray/20 py-3">
        <div className="max-w-7xl mx-auto px-4 text-center text-vct-gray text-xs">
          VCT Manager - Fan-made game, not affiliated with Riot Games. Not for profit.
        </div>
      </footer>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'save' | 'load'>('save');

  const handleSaveClick = () => {
    setModalMode('save');
    setIsModalOpen(true);
  };

  const handleLoadClick = () => {
    setModalMode('load');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-vct-dark flex flex-col">
      <Header onSaveClick={handleSaveClick} onLoadClick={handleLoadClick} />
      <Navigation />
      <TimeBar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="bg-vct-darker border-t border-vct-gray/20 py-3">
        <div className="max-w-7xl mx-auto px-4 text-center text-vct-gray text-xs">
          VCT Manager - Fan-made game, not affiliated with Riot Games. Not for profit.
        </div>
      </footer>

      {isModalOpen && (
        <SaveLoadModal mode={modalMode} onClose={handleCloseModal} />
      )}
    </div>
  );
}
