// Developer Debug Overlay
// Toggled by backtick key — shows drama engine state for development

import { useState, useEffect } from 'react';
import { DebugSection_Flags } from './DebugSection_Flags';
import { DebugSection_DramaEvents } from './DebugSection_DramaEvents';
import { DebugSection_Conditions } from './DebugSection_Conditions';
import { DebugSection_Interviews } from './DebugSection_Interviews';

type Tab = 'flags' | 'events' | 'conditions' | 'interviews';

const TABS: { id: Tab; label: string }[] = [
  { id: 'flags', label: 'Flags' },
  { id: 'events', label: 'Drama Events' },
  { id: 'conditions', label: 'Conditions' },
  { id: 'interviews', label: 'Interviews' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugOverlay({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('flags');

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-vct-gray/30 bg-vct-darker flex-shrink-0">
        <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-600 text-white tracking-wider">DEV</span>
        <span className="text-white font-semibold">Drama &amp; Interview Debug</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-vct-gray/50 text-xs">Press <kbd className="bg-vct-gray/20 px-1 rounded">ESC</kbd> or <kbd className="bg-vct-gray/20 px-1 rounded">`</kbd> to close</span>
          <button
            onClick={onClose}
            className="text-vct-gray hover:text-white text-lg leading-none px-1"
            aria-label="Close debug overlay"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-vct-gray/30 bg-vct-darker flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-vct-red'
                : 'text-vct-gray hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {activeTab === 'flags' && <DebugSection_Flags />}
          {activeTab === 'events' && <DebugSection_DramaEvents />}
          {activeTab === 'conditions' && <DebugSection_Conditions />}
          {activeTab === 'interviews' && <DebugSection_Interviews />}
        </div>
      </div>
    </div>
  );
}
