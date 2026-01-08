// SaveLoadModal Component - Save and load game interface

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  listSaves,
  saveGame,
  loadGame,
  deleteSave,
  type SaveSlotInfo,
  type SaveSlotNumber,
} from '../../store';

interface SaveLoadModalProps {
  mode: 'save' | 'load';
  onClose: () => void;
}

export function SaveLoadModal({ mode, onClose }: SaveLoadModalProps) {
  const [saves, setSaves] = useState<SaveSlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load save slots on mount
  useEffect(() => {
    loadSaveSlots();
  }, []);

  const loadSaveSlots = async () => {
    setLoading(true);
    const slots = await listSaves();
    setSaves(slots);
    setLoading(false);
  };

  const handleSave = async (slot: SaveSlotNumber) => {
    if (slot === 0) return; // Can't manually save to auto-save slot

    setActionInProgress(slot);
    setError(null);
    setSuccess(null);

    const result = await saveGame(slot);

    if (result.success) {
      setSuccess(`Game saved to Slot ${slot}`);
      await loadSaveSlots();
    } else {
      setError(result.error || 'Save failed');
    }

    setActionInProgress(null);
  };

  const handleLoad = async (slot: SaveSlotNumber) => {
    setActionInProgress(slot);
    setError(null);
    setSuccess(null);

    const result = await loadGame(slot);

    if (result.success) {
      setSuccess('Game loaded successfully');
      setTimeout(() => onClose(), 1000);
    } else {
      setError(result.error || 'Load failed');
    }

    setActionInProgress(null);
  };

  const handleDelete = async (slot: SaveSlotNumber) => {
    if (slot === 0) return; // Can't delete auto-save

    const confirmed = window.confirm(
      `Are you sure you want to delete Slot ${slot}?`
    );
    if (!confirmed) return;

    setActionInProgress(slot);
    setError(null);

    const result = await deleteSave(slot);

    if (result.success) {
      setSuccess(`Slot ${slot} deleted`);
      await loadSaveSlots();
    } else {
      setError(result.error || 'Delete failed');
    }

    setActionInProgress(null);
  };

  const formatPlaytime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-vct-darker border border-vct-gray/30 rounded-lg w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-vct-gray/20">
          <h2 className="text-xl font-bold text-vct-light">
            {mode === 'save' ? 'Save Game' : 'Load Game'}
          </h2>
          <button
            onClick={onClose}
            className="text-vct-gray hover:text-vct-light transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded text-green-300 text-sm">
              {success}
            </div>
          )}

          {/* Save Slots */}
          {loading ? (
            <div className="text-center text-vct-gray py-8">Loading...</div>
          ) : (
            <div className="space-y-3">
              {saves.map((slot) => (
                <SaveSlotCard
                  key={slot.slot}
                  slot={slot}
                  mode={mode}
                  isLoading={actionInProgress === slot.slot}
                  onSave={() => handleSave(slot.slot)}
                  onLoad={() => handleLoad(slot.slot)}
                  onDelete={() => handleDelete(slot.slot)}
                  formatPlaytime={formatPlaytime}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SaveSlotCardProps {
  slot: SaveSlotInfo;
  mode: 'save' | 'load';
  isLoading: boolean;
  onSave: () => void;
  onLoad: () => void;
  onDelete: () => void;
  formatPlaytime: (minutes: number) => string;
}

function SaveSlotCard({
  slot,
  mode,
  isLoading,
  onSave,
  onLoad,
  onDelete,
  formatPlaytime,
}: SaveSlotCardProps) {
  const isAutoSave = slot.slot === 0;
  const slotLabel = isAutoSave ? 'Auto-Save' : `Slot ${slot.slot}`;

  return (
    <div
      className={`
        p-4 rounded border transition-colors
        ${
          slot.isEmpty
            ? 'bg-vct-dark/50 border-vct-gray/20'
            : 'bg-vct-dark border-vct-gray/30'
        }
      `}
    >
      <div className="flex items-start justify-between">
        {/* Slot Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-vct-light">{slotLabel}</span>
            {isAutoSave && (
              <span className="text-xs px-2 py-0.5 bg-vct-gray/20 rounded text-vct-gray">
                Auto
              </span>
            )}
          </div>

          {slot.isEmpty ? (
            <p className="text-sm text-vct-gray">Empty slot</p>
          ) : slot.metadata ? (
            <div className="text-sm text-vct-gray space-y-0.5">
              <p>
                <span className="text-vct-light">{slot.metadata.teamName}</span>
                {' • '}
                Season {slot.metadata.season}
              </p>
              <p>
                {format(new Date(slot.metadata.currentDate), 'MMM dd, yyyy')}
                {' • '}
                {formatPlaytime(slot.metadata.playtime)} played
              </p>
              <p className="text-xs text-vct-gray/70">
                Last saved:{' '}
                {format(new Date(slot.metadata.lastModified), 'MMM dd, HH:mm')}
              </p>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          {mode === 'save' && !isAutoSave && (
            <button
              onClick={onSave}
              disabled={isLoading}
              className="px-3 py-1.5 bg-vct-red text-white text-sm font-medium rounded
                         hover:bg-vct-red/80 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {isLoading ? '...' : slot.isEmpty ? 'Save' : 'Overwrite'}
            </button>
          )}

          {mode === 'load' && !slot.isEmpty && (
            <button
              onClick={onLoad}
              disabled={isLoading}
              className="px-3 py-1.5 bg-vct-red text-white text-sm font-medium rounded
                         hover:bg-vct-red/80 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {isLoading ? '...' : 'Load'}
            </button>
          )}

          {!isAutoSave && !slot.isEmpty && (
            <button
              onClick={onDelete}
              disabled={isLoading}
              className="px-3 py-1.5 bg-vct-dark border border-vct-gray/30 text-vct-gray
                         text-sm rounded hover:text-red-400 hover:border-red-400/50
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
