// SaveLoadModal - Save and load game UI
// Displays save slots with metadata and handles save/load/delete operations

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { saveGame, loadGame, deleteSave, listSaves } from '../../store';
import { getStorageEstimate } from '../../db/database';
import type { SaveSlotInfo, SaveSlotNumber } from '../../store';

interface SaveLoadModalProps {
  mode: 'save' | 'load';
  onClose: () => void;
}

function formatPlaytime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatSaveDate(isoString: string): string {
  return format(new Date(isoString), 'MMM dd, yyyy HH:mm');
}

export function SaveLoadModal({ mode, onClose }: SaveLoadModalProps) {
  const [slots, setSlots] = useState<SaveSlotInfo[]>([]);
  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null);
  const [operating, setOperating] = useState<SaveSlotNumber | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SaveSlotNumber | null>(null);

  const refreshSlots = useCallback(async () => {
    const [s, storage] = await Promise.all([
      listSaves(),
      getStorageEstimate(),
    ]);
    setSlots(s);
    setStorageInfo(storage);
  }, []);

  useEffect(() => {
    refreshSlots();
  }, [refreshSlots]);

  const handleSave = async (slot: SaveSlotNumber) => {
    setOperating(slot);
    setMessage(null);
    const result = await saveGame(slot);
    if (result.success) {
      setMessage({ text: `Saved to slot ${slot === 0 ? 'Auto' : slot}.`, type: 'success' });
      await refreshSlots();
    } else {
      setMessage({ text: result.error ?? 'Save failed.', type: 'error' });
    }
    setOperating(null);
  };

  const handleLoad = async (slot: SaveSlotNumber) => {
    setOperating(slot);
    setMessage(null);
    const result = await loadGame(slot);
    if (result.success) {
      setMessage({ text: 'Game loaded successfully.', type: 'success' });
      setTimeout(() => onClose(), 800);
    } else if (result.compatibility === 'incompatible') {
      setMessage({
        text: 'This save is from an incompatible version and cannot be loaded. Please start a new game.',
        type: 'warning',
      });
    } else {
      setMessage({ text: result.error ?? 'Load failed.', type: 'error' });
    }
    setOperating(null);
  };

  const handleDelete = async (slot: SaveSlotNumber) => {
    if (confirmDelete !== slot) {
      setConfirmDelete(slot);
      return;
    }
    setConfirmDelete(null);
    setOperating(slot);
    const result = await deleteSave(slot);
    if (result.success) {
      setMessage({ text: `Slot ${slot === 0 ? 'Auto' : slot} deleted.`, type: 'success' });
      await refreshSlots();
    } else {
      setMessage({ text: result.error ?? 'Delete failed.', type: 'error' });
    }
    setOperating(null);
  };

  const slotLabel = (slot: SaveSlotNumber) => slot === 0 ? 'Auto-Save' : `Slot ${slot}`;

  const manualSlots = slots.filter((s) => s.slot !== 0);
  const autoSlot = slots.find((s) => s.slot === 0);
  const displaySlots = mode === 'save' ? manualSlots : slots;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-vct-darker border border-vct-gray/30 rounded-lg w-full max-w-lg p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-vct-light">
            {mode === 'save' ? 'Save Game' : 'Load Game'}
          </h2>
          <button
            onClick={onClose}
            className="text-vct-gray hover:text-vct-light transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Message banner */}
        {message && (
          <div
            className={`mb-4 px-3 py-2 rounded text-sm ${
              message.type === 'success'
                ? 'bg-green-900/40 text-green-300 border border-green-700/40'
                : message.type === 'warning'
                ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/40'
                : 'bg-red-900/40 text-red-300 border border-red-700/40'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Save slots */}
        <div className="space-y-2">
          {displaySlots.map(({ slot, isEmpty, metadata }) => {
            const label = slotLabel(slot as SaveSlotNumber);
            const isAuto = slot === 0;
            const isOperating = operating === slot;
            const needsConfirm = confirmDelete === slot;

            return (
              <div
                key={slot}
                className={`border rounded-lg p-3 ${
                  isAuto
                    ? 'border-vct-gray/20 bg-vct-dark/30'
                    : 'border-vct-gray/20 bg-vct-dark/20'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-vct-light">{label}</span>
                      {isAuto && (
                        <span className="text-xs text-vct-gray bg-vct-gray/10 px-1.5 py-0.5 rounded">
                          weekly
                        </span>
                      )}
                    </div>
                    {isEmpty ? (
                      <p className="text-xs text-vct-gray mt-0.5">Empty</p>
                    ) : metadata ? (
                      <div className="text-xs text-vct-gray mt-0.5 space-y-0.5">
                        <p>
                          <span className="text-vct-light">{metadata.teamName}</span>
                          {' · '}Season {metadata.season}
                        </p>
                        <p>
                          {formatSaveDate(metadata.lastModified)}
                          {' · '}
                          {formatPlaytime(metadata.playtime)} played
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {mode === 'save' && !isAuto && (
                      <button
                        onClick={() => handleSave(slot as SaveSlotNumber)}
                        disabled={isOperating}
                        className="px-3 py-1.5 text-xs bg-vct-red hover:bg-vct-red/80 text-white rounded transition-colors disabled:opacity-50"
                      >
                        {isOperating ? '...' : 'Save'}
                      </button>
                    )}
                    {mode === 'load' && !isEmpty && (
                      <button
                        onClick={() => handleLoad(slot as SaveSlotNumber)}
                        disabled={isOperating}
                        className="px-3 py-1.5 text-xs bg-vct-blue hover:bg-vct-blue/80 text-white rounded transition-colors disabled:opacity-50"
                      >
                        {isOperating ? '...' : 'Load'}
                      </button>
                    )}
                    {!isEmpty && !isAuto && (
                      <button
                        onClick={() => handleDelete(slot as SaveSlotNumber)}
                        disabled={isOperating}
                        className={`px-2 py-1.5 text-xs rounded transition-colors disabled:opacity-50 ${
                          needsConfirm
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'text-vct-gray hover:text-red-400 hover:bg-red-900/20'
                        }`}
                      >
                        {needsConfirm ? 'Confirm?' : '✕'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Auto-save info (only in load mode, shown separately) */}
        {mode === 'save' && autoSlot && !autoSlot.isEmpty && autoSlot.metadata && (
          <p className="mt-3 text-xs text-vct-gray">
            Auto-save: {autoSlot.metadata.teamName} · Season {autoSlot.metadata.season} ·{' '}
            {formatSaveDate(autoSlot.metadata.lastModified)}
          </p>
        )}

        {/* Storage estimate */}
        {storageInfo && storageInfo.usage > 0 && (
          <p className="mt-3 text-xs text-vct-gray/60">
            Storage: {(storageInfo.usage / 1024 / 1024).toFixed(1)} MB used
          </p>
        )}
      </div>
    </div>
  );
}
