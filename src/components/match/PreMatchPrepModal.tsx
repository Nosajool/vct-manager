// PreMatchPrepModal - 3-phase pre-match preparation
// Phase 1: Map veto (BO3, 7-phase alternating ban/pick)
// Phase 2: Agent selection per map
// Phase 3: Confirmation summary

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Team, Player, PlayerAgentPreferences, MapPoolStrength } from '../../types';
import type { AgentRole } from '../../types/strategy';
import type { PreMatchConfig, VetoAction } from '../../types/prematch';
import { MAPS, AGENTS } from '../../utils/constants';
import { COMPOSITION_CONSTANTS } from '../../engine/match/constants';

// ============================================================
// Types
// ============================================================

type ModalPhase = 'veto' | 'agents' | 'confirm';

interface VetoSequenceEntry {
  action: 'ban' | 'pick' | 'decider';
  team: 'player' | 'opponent' | 'auto';
  label: string;
}

// BO3 veto sequence
const VETO_SEQUENCE: VetoSequenceEntry[] = [
  { action: 'ban', team: 'player', label: 'You ban' },
  { action: 'ban', team: 'opponent', label: 'Opponent bans' },
  { action: 'pick', team: 'player', label: 'You pick Map 1' },
  { action: 'pick', team: 'opponent', label: 'Opponent picks Map 2' },
  { action: 'ban', team: 'player', label: 'You ban' },
  { action: 'ban', team: 'opponent', label: 'Opponent bans' },
  { action: 'decider', team: 'auto', label: 'Decider (last remaining)' },
];

// Agent role colors
const ROLE_COLORS: Record<AgentRole, string> = {
  Duelist: 'text-red-400 bg-red-400/10',
  Initiator: 'text-yellow-400 bg-yellow-400/10',
  Controller: 'text-blue-400 bg-blue-400/10',
  Sentinel: 'text-green-400 bg-green-400/10',
};

// Flat agent -> role lookup
const AGENT_ROLE_MAP: Record<string, AgentRole> = COMPOSITION_CONSTANTS.AGENT_ROLES as Record<string, AgentRole>;

function getAgentRole(agent: string): AgentRole | undefined {
  return AGENT_ROLE_MAP[agent];
}

function getMapOverallStrength(mapPool: MapPoolStrength | undefined, mapName: string): number {
  if (!mapPool?.maps[mapName]) return 50;
  const attrs = mapPool.maps[mapName].attributes;
  return (
    attrs.executes + attrs.retakes + attrs.utility +
    attrs.communication + attrs.mapControl + attrs.antiStrat
  ) / 6;
}

function strengthToStars(strength: number): number {
  if (strength >= 80) return 5;
  if (strength >= 60) return 4;
  if (strength >= 40) return 3;
  if (strength >= 20) return 2;
  return 1;
}

// ============================================================
// Props
// ============================================================

interface PreMatchPrepModalProps {
  isOpen: boolean;
  playerTeam: Team;
  playerTeamPlayers: Player[];
  opponentTeam: Team;
  playerAgentPrefs: Record<string, PlayerAgentPreferences>;
  onConfirm: (config: PreMatchConfig) => void;
  onCancel: () => void;
}

// ============================================================
// Helper: Run full auto-prep silently
// ============================================================

function runAutoPrepVeto(
  playerTeamId: string,
  opponentTeamId: string,
  playerMapPool: MapPoolStrength | undefined,
  opponentMapPool: MapPoolStrength | undefined
): { selectedMaps: string[]; vetoLog: VetoAction[] } {
  let available = [...MAPS];
  const selectedMaps: string[] = [];
  const vetoLog: VetoAction[] = [];

  const playerBanPriority = playerMapPool?.banPriority ?? [];
  const playerStrongest = playerMapPool?.strongestMaps ?? [];
  const opponentBanPriority = opponentMapPool?.banPriority ?? [];
  const opponentStrongest = opponentMapPool?.strongestMaps ?? [];

  const pickFromList = (list: string[], avail: string[]): string => {
    const found = list.find((m) => avail.includes(m));
    return found ?? avail[Math.floor(Math.random() * avail.length)];
  };

  for (let phase = 0; phase < 7; phase++) {
    const entry = VETO_SEQUENCE[phase];

    if (entry.action === 'decider') {
      const deciderMap = available[0];
      selectedMaps.push(deciderMap);
      vetoLog.push({ phase, action: 'decider', teamId: 'auto', mapName: deciderMap });
      available = available.filter((m) => m !== deciderMap);
      break;
    }

    let chosenMap: string;
    let teamId: string;

    if (entry.team === 'player') {
      if (entry.action === 'ban') {
        chosenMap = pickFromList(playerBanPriority, available);
        teamId = playerTeamId;
        available = available.filter((m) => m !== chosenMap);
      } else {
        chosenMap = pickFromList(playerStrongest, available);
        teamId = playerTeamId;
        selectedMaps.push(chosenMap);
        available = available.filter((m) => m !== chosenMap);
      }
    } else {
      if (entry.action === 'ban') {
        chosenMap = pickFromList(opponentBanPriority, available);
        teamId = opponentTeamId;
        available = available.filter((m) => m !== chosenMap);
      } else {
        chosenMap = pickFromList(opponentStrongest, available);
        teamId = opponentTeamId;
        selectedMaps.push(chosenMap);
        available = available.filter((m) => m !== chosenMap);
      }
    }

    vetoLog.push({ phase, action: entry.action, teamId, mapName: chosenMap });
  }

  return { selectedMaps, vetoLog };
}

function runAutoAgentSelection(
  maps: string[],
  players: Player[],
  prefs: Record<string, PlayerAgentPreferences>
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const mapName of maps) {
    const assignment: Record<string, string> = {};
    for (const player of players) {
      const playerPrefs = prefs[player.id] ?? player.agentPreferences;
      assignment[player.id] = playerPrefs?.preferredAgents?.[0] ?? 'Jett';
    }
    result[mapName] = assignment;
  }
  return result;
}

// ============================================================
// Sub-components
// ============================================================

function StarRating({ stars }: { stars: number }) {
  return (
    <span className="text-xs">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < stars ? 'text-yellow-400' : 'text-vct-gray/30'}>★</span>
      ))}
    </span>
  );
}

// ============================================================
// Map Veto Phase
// ============================================================

interface MapVetoPhaseProps {
  playerTeam: Team;
  opponentTeam: Team;
  playerMapPool: MapPoolStrength | undefined;
  onVetoComplete: (selectedMaps: string[], vetoLog: VetoAction[]) => void;
  onAutoPrep: () => void;
}

function MapVetoPhase({ playerTeam, opponentTeam, playerMapPool, onVetoComplete, onAutoPrep }: MapVetoPhaseProps) {
  const [availableMaps, setAvailableMaps] = useState<string[]>(MAPS);
  const [bannedMaps, setBannedMaps] = useState<string[]>([]);
  const [pickedMaps, setPickedMaps] = useState<{ mapName: string; byTeam: 'player' | 'opponent' | 'auto' }[]>([]);
  const [vetoPhase, setVetoPhase] = useState(0);
  const [vetoLog, setVetoLog] = useState<VetoAction[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const currentEntry = vetoPhase < 7 ? VETO_SEQUENCE[vetoPhase] : null;
  const isPlayerTurn = currentEntry?.team === 'player';
  const isComplete = vetoPhase >= 7;

  // Suggestion: weakest to ban, strongest to pick
  const suggestBan = playerMapPool?.banPriority?.[0] ?? null;
  const suggestPick = playerMapPool?.strongestMaps?.[0] ?? null;

  const resolvePhase = useCallback((mapName: string, phase: number) => {
    const entry = VETO_SEQUENCE[phase];
    const teamId = entry.team === 'player' ? playerTeam.id : entry.team === 'opponent' ? opponentTeam.id : 'auto';
    const action = entry.action;

    const newLog = [...vetoLog, { phase, action, teamId, mapName }];
    setVetoLog(newLog);

    if (action === 'ban') {
      setBannedMaps((prev) => [...prev, mapName]);
      setAvailableMaps((prev) => prev.filter((m) => m !== mapName));
    } else {
      // pick or decider
      setPickedMaps((prev) => [...prev, { mapName, byTeam: entry.team }]);
      setAvailableMaps((prev) => prev.filter((m) => m !== mapName));
    }

    const nextPhase = phase + 1;
    setVetoPhase(nextPhase);

    if (nextPhase >= 7) {
      // Build selected maps in order from the completed log
      const picked: string[] = [];
      for (const logEntry of newLog) {
        if (logEntry.action === 'pick' || logEntry.action === 'decider') {
          picked.push(logEntry.mapName);
        }
      }
      onVetoComplete(picked, newLog);
    }
  }, [vetoLog, pickedMaps, playerTeam.id, opponentTeam.id, onVetoComplete]);

  // Handle decider auto-resolve after phase 5 (AI ban) completes
  useEffect(() => {
    if (vetoPhase === 6 && !isComplete) {
      // Phase 6 is decider: auto-pick last remaining
      const lastMap = availableMaps[0];
      if (lastMap) {
        setTimeout(() => {
          resolvePhase(lastMap, 6);
        }, 400);
      }
    }
  }, [vetoPhase, availableMaps, isComplete, resolvePhase]);

  // AI takes its turn after a delay
  useEffect(() => {
    if (!currentEntry || isComplete) return;
    if (currentEntry.team !== 'opponent') return;
    if (isAiThinking) return;

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      const opponentPool = opponentTeam.mapPool;
      let chosen: string;

      if (currentEntry.action === 'ban') {
        const priority = opponentPool?.banPriority ?? [];
        chosen = priority.find((m) => availableMaps.includes(m)) ?? availableMaps[Math.floor(Math.random() * availableMaps.length)];
      } else {
        const strongest = opponentPool?.strongestMaps ?? [];
        chosen = strongest.find((m) => availableMaps.includes(m)) ?? availableMaps[Math.floor(Math.random() * availableMaps.length)];
      }

      setIsAiThinking(false);
      resolvePhase(chosen, vetoPhase);
    }, 500);

    return () => clearTimeout(timer);
  }, [vetoPhase, currentEntry, isAiThinking, availableMaps, opponentTeam, resolvePhase]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-vct-light font-semibold">Map Veto</p>
          {currentEntry && (
            <p className="text-sm text-vct-gray">
              Phase {vetoPhase + 1}/7 —{' '}
              <span className={isPlayerTurn ? 'text-vct-red' : 'text-vct-gray'}>
                {isAiThinking ? 'Opponent thinking...' : currentEntry.label}
              </span>
            </p>
          )}
          {!isComplete && isPlayerTurn && currentEntry?.action === 'ban' && suggestBan && availableMaps.includes(suggestBan) && (
            <p className="text-xs text-vct-gray mt-0.5">Tip: consider banning <span className="text-yellow-400">{suggestBan}</span></p>
          )}
          {!isComplete && isPlayerTurn && currentEntry?.action === 'pick' && suggestPick && availableMaps.includes(suggestPick) && (
            <p className="text-xs text-vct-gray mt-0.5">Tip: consider picking <span className="text-green-400">{suggestPick}</span></p>
          )}
        </div>
        <button
          onClick={onAutoPrep}
          className="px-3 py-1 text-xs font-medium bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-gray rounded"
        >
          Auto Prep
        </button>
      </div>

      {/* Veto sequence pills */}
      <div className="flex flex-wrap gap-1.5">
        {VETO_SEQUENCE.map((entry, i) => {
          const logEntry = vetoLog[i];
          const isCurrentPhase = i === vetoPhase;
          let pillStyle = 'bg-vct-gray/10 text-vct-gray border border-vct-gray/20';
          if (logEntry) {
            if (logEntry.action === 'ban') pillStyle = 'bg-red-900/30 text-red-400 border border-red-400/20';
            else pillStyle = 'bg-green-900/30 text-green-400 border border-green-400/20';
          } else if (isCurrentPhase) {
            pillStyle = 'bg-vct-red/20 text-vct-red border border-vct-red/40 animate-pulse';
          }
          return (
            <div key={i} className={`px-2 py-0.5 rounded text-xs font-medium ${pillStyle}`}>
              {logEntry ? (
                <span>{logEntry.action === 'ban' ? '✕' : '✓'} {logEntry.mapName}</span>
              ) : (
                <span>{entry.label}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Map grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {MAPS.map((mapName) => {
          const isBanned = bannedMaps.includes(mapName);
          const pickEntry = pickedMaps.find((p) => p.mapName === mapName);
          const isPicked = !!pickEntry;
          const isAvailable = availableMaps.includes(mapName);
          const stars = strengthToStars(getMapOverallStrength(playerMapPool, mapName));
          const canClick = isAvailable && isPlayerTurn && !isAiThinking && !isComplete;

          return (
            <button
              key={mapName}
              disabled={!canClick}
              onClick={() => canClick && resolvePhase(mapName, vetoPhase)}
              className={`
                relative p-2 rounded border text-left transition-all
                ${isBanned ? 'opacity-30 bg-vct-gray/5 border-vct-gray/20 cursor-default' : ''}
                ${isPicked ? 'bg-green-900/20 border-green-400/30 cursor-default' : ''}
                ${isAvailable && !isBanned && !isPicked
                  ? canClick
                    ? 'bg-vct-gray/10 border-vct-gray/30 hover:bg-vct-red/10 hover:border-vct-red/50 cursor-pointer'
                    : 'bg-vct-gray/10 border-vct-gray/20 cursor-default opacity-60'
                  : ''}
              `}
            >
              <p className="text-xs font-semibold text-vct-light leading-tight">{mapName}</p>
              <div className="mt-0.5">
                <StarRating stars={stars} />
              </div>
              {isBanned && (
                <span className="absolute top-1 right-1 text-red-500 text-xs font-bold">✕</span>
              )}
              {isPicked && (
                <span className="absolute top-1 right-1 text-green-400 text-xs font-bold">
                  {pickEntry.byTeam === 'player' ? 'P1' : pickEntry.byTeam === 'opponent' ? 'P2' : 'D'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Action label when it's AI thinking */}
      {isAiThinking && (
        <p className="text-center text-sm text-vct-gray animate-pulse">
          {opponentTeam.name} is thinking...
        </p>
      )}
    </div>
  );
}

// ============================================================
// Agent Selection Phase
// ============================================================

interface AgentSelectionPhaseProps {
  mapName: string;
  mapIndex: number;
  totalMaps: number;
  players: Player[];
  playerAgentPrefs: Record<string, PlayerAgentPreferences>;
  assignments: Record<string, string>;
  onChange: (playerId: string, agentName: string) => void;
  onNext: () => void;
  onAutoPrep: () => void;
}

function AgentSelectionPhase({
  mapName, mapIndex, totalMaps, players, playerAgentPrefs, assignments, onChange, onNext, onAutoPrep,
}: AgentSelectionPhaseProps) {
  // Role counts from current assignments
  const roleCounts = useMemo(() => {
    const counts: Record<AgentRole, number> = { Duelist: 0, Initiator: 0, Controller: 0, Sentinel: 0 };
    for (const agentName of Object.values(assignments)) {
      const role = getAgentRole(agentName);
      if (role) counts[role]++;
    }
    return counts;
  }, [assignments]);

  const duplicateRoles = useMemo(() => {
    return (Object.entries(roleCounts) as [AgentRole, number][])
      .filter(([, count]) => count >= 2)
      .map(([role]) => role);
  }, [roleCounts]);

  const getStatusHint = (playerId: string, agentName: string) => {
    const prefs = playerAgentPrefs[playerId] ?? players.find((p) => p.id === playerId)?.agentPreferences;
    if (prefs?.preferredAgents?.[0] === agentName) return { text: '← preferred', cls: 'text-green-400' };
    const role = getAgentRole(agentName);
    if (role && roleCounts[role] >= 2) return { text: `⚠ 2x ${role}`, cls: 'text-yellow-400' };
    return null;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-vct-light font-semibold">Agent Selection</p>
          <p className="text-sm text-vct-gray">
            Map {mapIndex + 1} of {totalMaps}: <span className="text-vct-light">{mapName}</span>
          </p>
        </div>
        <button
          onClick={onAutoPrep}
          className="px-3 py-1 text-xs font-medium bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-gray rounded"
        >
          Auto Prep
        </button>
      </div>

      {/* Player rows */}
      <div className="flex flex-col gap-2">
        {players.map((player) => {
          const prefs = playerAgentPrefs[player.id] ?? player.agentPreferences;
          const currentAgent = assignments[player.id] ?? prefs?.preferredAgents?.[0] ?? 'Jett';
          const role = getAgentRole(currentAgent);
          const hint = getStatusHint(player.id, currentAgent);

          return (
            <div key={player.id} className="flex items-center gap-3 bg-vct-gray/5 rounded px-3 py-2">
              {/* Player name */}
              <span className="text-sm font-medium text-vct-light w-24 shrink-0 truncate">
                {player.name}
              </span>

              {/* Agent dropdown */}
              <select
                value={currentAgent}
                onChange={(e) => onChange(player.id, e.target.value)}
                className="flex-1 bg-vct-dark border border-vct-gray/30 text-vct-light text-sm rounded px-2 py-1"
              >
                {(Object.entries(AGENTS) as [AgentRole, string[]][]).map(([roleName, agents]) => (
                  <optgroup key={roleName} label={roleName}>
                    {agents.map((agent) => (
                      <option key={agent} value={agent}>{agent}</option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Role badge */}
              {role && (
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${ROLE_COLORS[role]}`}>
                  {role}
                </span>
              )}

              {/* Status hint */}
              {hint && (
                <span className={`text-xs shrink-0 ${hint.cls}`}>{hint.text}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Composition summary */}
      <div className="bg-vct-gray/5 rounded p-3">
        <p className="text-xs text-vct-gray mb-2 font-medium">Composition</p>
        <div className="flex gap-3 flex-wrap">
          {(Object.entries(roleCounts) as [AgentRole, number][]).map(([role, count]) => (
            <div key={role} className="flex items-center gap-1">
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[role]}`}>{role}</span>
              <span className={`text-xs font-bold ${count === 0 ? 'text-red-400' : count >= 2 ? 'text-yellow-400' : 'text-vct-light'}`}>
                ×{count}
              </span>
            </div>
          ))}
        </div>
        {duplicateRoles.length > 0 && (
          <p className="text-xs text-yellow-400 mt-1.5">⚠ Multiple {duplicateRoles.join(', ')} — may affect composition balance</p>
        )}
        {roleCounts.Controller === 0 && (
          <p className="text-xs text-red-400 mt-1.5">✕ No Controller — smokes coverage missing</p>
        )}
      </div>

      {/* Next button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="px-4 py-1.5 text-sm font-medium bg-vct-red hover:bg-vct-red/80 text-white rounded"
        >
          {mapIndex + 1 < totalMaps ? `Next: Map ${mapIndex + 2}` : 'Review'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Confirmation Phase
// ============================================================

interface ConfirmPhaseProps {
  selectedMaps: string[];
  agentAssignments: Record<string, Record<string, string>>;
  players: Player[];
  onConfirm: () => void;
  onBack: () => void;
  onAutoPrep: () => void;
}

function ConfirmPhase({ selectedMaps, agentAssignments, players, onConfirm, onBack, onAutoPrep }: ConfirmPhaseProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-vct-light font-semibold">Match Preparation Summary</p>
        <button
          onClick={onAutoPrep}
          className="px-3 py-1 text-xs font-medium bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-gray rounded"
        >
          Auto Prep
        </button>
      </div>

      {/* Per-map summary */}
      <div className="flex flex-col gap-3">
        {selectedMaps.map((mapName, i) => {
          const assignments = agentAssignments[mapName] ?? {};
          const mapLabel = i === 0 ? 'Map 1 (Your Pick)' : i === 1 ? 'Map 2 (Opponent Pick)' : 'Map 3 (Decider)';

          return (
            <div key={mapName} className="bg-vct-gray/5 rounded p-3">
              <p className="text-xs text-vct-gray font-medium mb-2">{mapLabel}</p>
              <p className="text-sm font-bold text-vct-light mb-2">{mapName}</p>
              <div className="grid grid-cols-2 gap-1">
                {players.map((player) => {
                  const agentName = assignments[player.id] ?? '—';
                  const role = getAgentRole(agentName);
                  return (
                    <div key={player.id} className="flex items-center gap-2">
                      <span className="text-xs text-vct-gray truncate w-20">{player.name}</span>
                      <span className="text-xs text-vct-light font-medium">{agentName}</span>
                      {role && (
                        <span className={`text-xs px-1 rounded ${ROLE_COLORS[role]}`}>{role[0]}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="px-4 py-1.5 text-sm font-medium bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-2 text-sm font-bold bg-vct-red hover:bg-vct-red/80 text-white rounded"
        >
          Start Match
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Main Modal
// ============================================================

export function PreMatchPrepModal({
  isOpen,
  playerTeam,
  playerTeamPlayers,
  opponentTeam,
  playerAgentPrefs,
  onConfirm,
  onCancel,
}: PreMatchPrepModalProps) {
  const [phase, setPhase] = useState<ModalPhase>('veto');
  const [agentMapIndex, setAgentMapIndex] = useState(0);
  const [selectedMaps, setSelectedMaps] = useState<string[]>([]);
  const [vetoLog, setVetoLog] = useState<VetoAction[]>([]);
  const [agentAssignments, setAgentAssignments] = useState<Record<string, Record<string, string>>>({});

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setPhase('veto');
      setAgentMapIndex(0);
      setSelectedMaps([]);
      setVetoLog([]);
      setAgentAssignments({});
    }
  }, [isOpen]);

  // Pre-fill agent assignments for a map with player preferences
  const prefillMapAgents = useCallback(
    (maps: string[]) => {
      const assignments: Record<string, Record<string, string>> = {};
      for (const mapName of maps) {
        const mapAssignment: Record<string, string> = {};
        for (const player of playerTeamPlayers) {
          const prefs = playerAgentPrefs[player.id] ?? player.agentPreferences;
          mapAssignment[player.id] = prefs?.preferredAgents?.[0] ?? 'Jett';
        }
        assignments[mapName] = mapAssignment;
      }
      return assignments;
    },
    [playerTeamPlayers, playerAgentPrefs]
  );

  const handleVetoComplete = (maps: string[], log: VetoAction[]) => {
    setSelectedMaps(maps);
    setVetoLog(log);
    const prefilled = prefillMapAgents(maps);
    setAgentAssignments(prefilled);
    setAgentMapIndex(0);
    setPhase('agents');
  };

  const handleAgentChange = (mapName: string, playerId: string, agentName: string) => {
    setAgentAssignments((prev) => ({
      ...prev,
      [mapName]: {
        ...prev[mapName],
        [playerId]: agentName,
      },
    }));
  };

  const handleAgentNext = () => {
    if (agentMapIndex + 1 < selectedMaps.length) {
      setAgentMapIndex((i) => i + 1);
    } else {
      setPhase('confirm');
    }
  };

  const handleConfirmBack = () => {
    // Go back to last map's agent selection
    setAgentMapIndex(selectedMaps.length - 1);
    setPhase('agents');
  };

  const handleAutoPrep = () => {
    const { selectedMaps: autoMaps, vetoLog: autoLog } = runAutoPrepVeto(
      playerTeam.id,
      opponentTeam.id,
      playerTeam.mapPool,
      opponentTeam.mapPool
    );
    const autoAgents = runAutoAgentSelection(autoMaps, playerTeamPlayers, playerAgentPrefs);
    setSelectedMaps(autoMaps);
    setVetoLog(autoLog);
    setAgentAssignments(autoAgents);
    setPhase('confirm');
  };

  const handleFinalConfirm = () => {
    onConfirm({
      selectedMaps,
      agentAssignments,
      vetoLog,
    });
  };

  if (!isOpen) return null;

  const currentMap = selectedMaps[agentMapIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-vct-dark border border-vct-gray/20 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-vct-gray/20">
          <div className="flex items-center gap-3">
            <span className="text-vct-red font-bold text-sm uppercase tracking-wide">Pre-Match</span>
            <span className="text-vct-gray text-sm">
              {phase === 'veto' && 'Step 1: Map Veto'}
              {phase === 'agents' && `Step 2: Agent Selection`}
              {phase === 'confirm' && 'Step 3: Confirm'}
            </span>
          </div>
          <button
            onClick={onCancel}
            className="text-vct-gray hover:text-vct-light text-lg"
          >
            ✕
          </button>
        </div>

        {/* Phase content */}
        <div className="px-5 py-4">
          {phase === 'veto' && (
            <MapVetoPhase
              playerTeam={playerTeam}
              opponentTeam={opponentTeam}
              playerMapPool={playerTeam.mapPool}
              onVetoComplete={handleVetoComplete}
              onAutoPrep={handleAutoPrep}
            />
          )}

          {phase === 'agents' && currentMap && (
            <AgentSelectionPhase
              key={currentMap}
              mapName={currentMap}
              mapIndex={agentMapIndex}
              totalMaps={selectedMaps.length}
              players={playerTeamPlayers}
              playerAgentPrefs={playerAgentPrefs}
              assignments={agentAssignments[currentMap] ?? {}}
              onChange={(playerId, agentName) => handleAgentChange(currentMap, playerId, agentName)}
              onNext={handleAgentNext}
              onAutoPrep={handleAutoPrep}
            />
          )}

          {phase === 'confirm' && (
            <ConfirmPhase
              selectedMaps={selectedMaps}
              agentAssignments={agentAssignments}
              players={playerTeamPlayers}
              onConfirm={handleFinalConfirm}
              onBack={handleConfirmBack}
              onAutoPrep={handleAutoPrep}
            />
          )}
        </div>
      </div>
    </div>
  );
}
