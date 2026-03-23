// PreMatchPrepModal - 3-phase pre-match preparation
// Phase 1: Map veto (BO3, 7-phase alternating ban/pick)
// Phase 2: Agent selection per map
// Phase 3: Confirmation summary

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Team, Player, PlayerAgentPreferences, MapPoolStrength } from '../../types';
import type { AgentRole } from '../../types/strategy';
import type { PreMatchConfig, VetoAction } from '../../types/prematch';
import type { MetaPatch } from '../../types/meta';
import { MAPS, AGENTS } from '../../utils/constants';
import { COMPOSITION_CONSTANTS } from '../../engine/match/constants';
import { getMetaAgentRankings, getAgentMetaTier } from '../../engine/match/CompositionEngine';
import { GameImage } from '../shared/GameImage';
import { getAgentImageUrl, getMapImageUrl, getTeamLogoUrl, getPlayerImageUrl } from '../../utils/imageAssets';
import { PreMatchHeader } from './PreMatchHeader';

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

// ============================================================
// Props
// ============================================================

interface PreMatchPrepModalProps {
  isOpen: boolean;
  playerTeam: Team;
  playerTeamPlayers: Player[];
  opponentTeam: Team;
  playerAgentPrefs: Record<string, PlayerAgentPreferences>;
  currentPatch?: MetaPatch | null;
  onConfirm: (config: PreMatchConfig) => void;
  onCancel: () => void;
  matchId?: string;
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
        // Counter-ban: target opponent's strongest maps first, fall back to own weakest
        const counterBanTarget = opponentStrongest.find((m) => available.includes(m));
        chosenMap = counterBanTarget ?? pickFromList(playerBanPriority, available);
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
  prefs: Record<string, PlayerAgentPreferences>,
  currentPatch: MetaPatch | null = null
): Record<string, Record<string, string>> {
  const allAgents = Object.values(COMPOSITION_CONSTANTS.AGENTS_BY_ROLE).flat();
  const result: Record<string, Record<string, string>> = {};

  for (const mapName of maps) {
    const assignment: Record<string, string> = {};
    const taken = new Set<string>();
    const metaRankings = getMetaAgentRankings(mapName, currentPatch);

    // Sort: players with fewer preferred agents go first (less flexible = higher priority)
    const sorted = [...players].sort((a, b) => {
      const aPrefs = (prefs[a.id] ?? a.agentPreferences)?.preferredAgents ?? [];
      const bPrefs = (prefs[b.id] ?? b.agentPreferences)?.preferredAgents ?? [];
      return aPrefs.length - bPrefs.length;
    });

    for (const player of sorted) {
      const playerPrefs = prefs[player.id] ?? player.agentPreferences;
      const preferred = playerPrefs?.preferredAgents ?? [];

      // Try preferred agents in order
      const preferredPick = preferred.find((a) => !taken.has(a));

      // Fallback: best meta agent in their primary role
      const roleAgents = playerPrefs?.primaryRole
        ? [...(COMPOSITION_CONSTANTS.AGENTS_BY_ROLE[playerPrefs.primaryRole] ?? [])]
            .sort((a, b) => metaRankings.indexOf(a) - metaRankings.indexOf(b))
        : [];
      const rolePick = roleAgents.find((a) => !taken.has(a));

      // Last resort: best meta agent from all agents
      const metaSortedAll = [...allAgents].sort(
        (a, b) => metaRankings.indexOf(a) - metaRankings.indexOf(b)
      );
      const anyPick = metaSortedAll.find((a) => !taken.has(a));

      const pick = preferredPick ?? rolePick ?? anyPick ?? 'Jett';

      assignment[player.id] = pick;
      taken.add(pick);
    }

    result[mapName] = assignment;
  }
  return result;
}

// ============================================================
// Sub-components
// ============================================================

function getMastery(prefs: PlayerAgentPreferences | undefined, agentName: string): number {
  if (prefs?.agentMastery?.[agentName] !== undefined) return prefs.agentMastery[agentName];
  // Fallback: infer from preferred position
  const idx = prefs?.preferredAgents?.indexOf(agentName) ?? -1;
  if (idx === 0) return 80;
  if (idx === 1) return 60;
  if (idx === 2) return 40;
  return 15;
}

function masteryBarColor(mastery: number): string {
  if (mastery >= 80) return 'bg-green-400';
  if (mastery >= 60) return 'bg-yellow-400';
  if (mastery >= 40) return 'bg-amber-500';
  return 'bg-red-400/60';
}

// ============================================================
// Map Veto Phase
// ============================================================

interface MapVetoPhaseProps {
  playerTeam: Team;
  opponentTeam: Team;
  playerMapPool: MapPoolStrength | undefined;
  opponentMapPool: MapPoolStrength | undefined;
  onVetoComplete: (selectedMaps: string[], vetoLog: VetoAction[]) => void;
  onAutoPrep: () => void;
}

function MapVetoPhase({ playerTeam, opponentTeam, playerMapPool, opponentMapPool, onVetoComplete, onAutoPrep }: MapVetoPhaseProps) {
  const [availableMaps, setAvailableMaps] = useState<string[]>(MAPS);
  const [bannedMaps, setBannedMaps] = useState<string[]>([]);
  const [pickedMaps, setPickedMaps] = useState<{ mapName: string; byTeam: 'player' | 'opponent' | 'auto' }[]>([]);
  const [vetoPhase, setVetoPhase] = useState(0);
  const [vetoLog, setVetoLog] = useState<VetoAction[]>([]);
  const vetoLogRef = useRef<VetoAction[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const isAiThinkingRef = useRef(false);

  const currentEntry = vetoPhase < 7 ? VETO_SEQUENCE[vetoPhase] : null;
  const isPlayerTurn = currentEntry?.team === 'player';
  const isComplete = vetoPhase >= 7;

  // Suggestion: weakest to ban, strongest to pick
  const suggestBan = playerMapPool?.banPriority?.[0] ?? null;
  const suggestPick = playerMapPool?.strongestMaps?.[0] ?? null;

  const sortedMaps = useMemo(() => {
    if (!currentEntry || isComplete) return MAPS;
    return [...MAPS].sort((a, b) => {
      const aStr = getMapOverallStrength(playerMapPool, a);
      const bStr = getMapOverallStrength(playerMapPool, b);
      return currentEntry.action === 'ban'
        ? aStr - bStr   // worst → best during ban
        : bStr - aStr;  // best → worst during pick/decider
    });
  }, [currentEntry, playerMapPool, isComplete]);

  const resolvePhase = useCallback((mapName: string, phase: number) => {
    const entry = VETO_SEQUENCE[phase];
    const teamId = entry.team === 'player' ? playerTeam.id : entry.team === 'opponent' ? opponentTeam.id : 'auto';
    const action = entry.action;

    const newLog = [...vetoLogRef.current, { phase, action, teamId, mapName }];
    vetoLogRef.current = newLog;
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
  }, [playerTeam.id, opponentTeam.id, onVetoComplete]);

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
    if (isAiThinkingRef.current) return;

    isAiThinkingRef.current = true;
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

      isAiThinkingRef.current = false;
      setIsAiThinking(false);
      resolvePhase(chosen, vetoPhase);
    }, 500);

    return () => {
      clearTimeout(timer);
      isAiThinkingRef.current = false;
    };
  }, [vetoPhase, currentEntry, availableMaps, opponentTeam, resolvePhase]);

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
            <p className="text-xs text-vct-gray mt-0.5">Tip: consider banning <span className="text-yellow-400">{suggestBan}</span> <span className="text-vct-gray/50">(your weakest map)</span></p>
          )}
          {!isComplete && isPlayerTurn && currentEntry?.action === 'pick' && suggestPick && availableMaps.includes(suggestPick) && (
            <p className="text-xs text-vct-gray mt-0.5">Tip: consider picking <span className="text-green-400">{suggestPick}</span></p>
          )}
        </div>
        <div className="flex items-start gap-3">
          {opponentMapPool && (
            <div className="text-right text-xs">
              <p className="text-vct-gray font-medium mb-0.5">Scouted intel</p>
              <p className="text-green-400">Best: {opponentMapPool.strongestMaps.slice(0, 2).join(', ')}</p>
              <p className="text-red-400">Weak: {opponentMapPool.banPriority.slice(0, 2).join(', ')}</p>
            </div>
          )}
          <button
            onClick={onAutoPrep}
            className="px-3 py-1 text-xs font-medium bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-gray rounded shrink-0"
          >
            Auto Prep
          </button>
        </div>
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

      {/* Action banner */}
      {!isComplete && isPlayerTurn && !isAiThinking && currentEntry && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded border text-sm font-bold ${
          currentEntry.action === 'ban'
            ? 'bg-red-900/30 border-red-500/40 text-red-400'
            : 'bg-green-900/30 border-green-500/40 text-green-400'
        }`}>
          <span>{currentEntry.action === 'ban' ? '✕' : '✓'}</span>
          <span>{currentEntry.action === 'ban' ? 'BAN A MAP' : 'PICK A MAP'}</span>
        </div>
      )}

      {/* Map grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {sortedMaps.map((mapName) => {
          const isBanned = bannedMaps.includes(mapName);
          const pickEntry = pickedMaps.find((p) => p.mapName === mapName);
          const isPicked = !!pickEntry;
          const isAvailable = availableMaps.includes(mapName);
          const playerStrength = getMapOverallStrength(playerMapPool, mapName);
          const oppIsStrong = opponentMapPool?.strongestMaps.includes(mapName) ?? false;
          const oppIsWeak = opponentMapPool?.banPriority.includes(mapName) ?? false;
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
                    ? `bg-vct-gray/10 border-vct-gray/30 cursor-pointer ${
                        currentEntry?.action === 'ban'
                          ? 'hover:bg-vct-red/10 hover:border-vct-red/50'
                          : 'hover:bg-green-900/20 hover:border-green-400/50'
                      }`
                    : 'bg-vct-gray/10 border-vct-gray/20 cursor-default opacity-60'
                  : ''}
              `}
            >
              <div className="relative mb-1">
                <GameImage
                  src={getMapImageUrl(mapName)}
                  alt={mapName}
                  className="w-full h-14 object-cover rounded"
                />
                {isBanned && (
                  <span className="absolute top-1 right-1 text-red-500 text-xs font-bold bg-black/60 rounded px-1">✕</span>
                )}
                {isPicked && (
                  <span className="absolute top-1 right-1 text-green-400 text-xs font-bold bg-black/60 rounded px-1">
                    {pickEntry.byTeam === 'player' ? 'P1' : pickEntry.byTeam === 'opponent' ? 'P2' : 'D'}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs font-semibold text-vct-light leading-tight truncate">{mapName}</p>
                {oppIsStrong && (
                  <span title="Opponent is strong on this map" className="text-[8px] font-bold ml-1 shrink-0 text-orange-400 bg-orange-400/15 px-1 rounded">
                    Opp Strong
                  </span>
                )}
                {oppIsWeak && !oppIsStrong && (
                  <span title="Opponent struggles here — good map to pick" className="text-[8px] font-bold ml-1 shrink-0 text-green-400/60 bg-green-400/10 px-1 rounded">
                    Opp Weak
                  </span>
                )}
              </div>
              <div className="mt-1">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-vct-gray w-4 shrink-0">Us</span>
                  <div className="flex-1 h-1 bg-vct-gray/20 rounded overflow-hidden">
                    <div
                      className="h-full rounded bg-green-400"
                      style={{ width: `${playerStrength}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-vct-gray w-5 text-right shrink-0">{Math.round(playerStrength)}</span>
                </div>
              </div>
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
  metaRankings: string[];
  onChange: (playerId: string, agentName: string) => void;
  onNext: () => void;
  onBack?: () => void;
  onAutoPrep: () => void;
}

const META_TIER_STYLES: Record<string, string> = {
  S: 'text-amber-400 bg-amber-400/10',
  A: 'text-green-400 bg-green-400/10',
  B: 'text-blue-400 bg-blue-400/10',
  C: 'text-slate-400 bg-slate-400/10',
  D: 'text-vct-gray/50 bg-vct-gray/5',
};

function AgentSelectionPhase({
  mapName, mapIndex, totalMaps, players, playerAgentPrefs, assignments, metaRankings, onChange, onNext, onBack, onAutoPrep,
}: AgentSelectionPhaseProps) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const handleAgentPick = (playerId: string, agentName: string) => {
    const currentAgent = assignments[playerId];
    if (currentAgent === agentName) return;

    // Find if another player has this agent
    const displacedId = Object.entries(assignments).find(
      ([pid, a]) => pid !== playerId && a === agentName
    )?.[0];

    if (displacedId) {
      const displacedPrefs =
        (playerAgentPrefs[displacedId] ?? players.find((p) => p.id === displacedId)?.agentPreferences)
          ?.preferredAgents ?? [];
      const takenByOthers = new Set(
        Object.entries(assignments)
          .filter(([pid]) => pid !== displacedId && pid !== playerId)
          .map(([, a]) => a)
      );
      takenByOthers.add(agentName);
      const fallback =
        displacedPrefs.find((a) => !takenByOthers.has(a)) ??
        (Object.values(AGENTS) as unknown as string[]).flat().find((a) => !takenByOthers.has(a)) ??
        'Jett';
      onChange(displacedId, fallback);
    }
    onChange(playerId, agentName);
  };

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

      {/* Map banner */}
      <div className="relative rounded overflow-hidden">
        <GameImage
          src={getMapImageUrl(mapName)}
          alt={mapName}
          className="w-full h-20 object-cover rounded"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-3">
          <span className="text-white font-bold text-lg drop-shadow">{mapName}</span>
        </div>
      </div>

      {/* Player rows */}
      <div className="flex flex-col gap-2">
        {players.map((player) => {
          const prefs = playerAgentPrefs[player.id] ?? player.agentPreferences;
          const currentAgent = assignments[player.id] ?? prefs?.preferredAgents?.[0] ?? 'Jett';
          const role = getAgentRole(currentAgent);
          const hint = getStatusHint(player.id, currentAgent);

          const agentPicker = (
            <>
              {(prefs?.preferredAgents ?? ['Jett', 'Reyna', 'Sova']).map((agent) => {
                const isCurrent = currentAgent === agent;
                const isTaken = !isCurrent && Object.entries(assignments).some(([pid, a]) => pid !== player.id && a === agent);
                const takenBy = isTaken ? players.find((p) => p.id !== player.id && assignments[p.id] === agent)?.name : undefined;
                const mastery = getMastery(prefs, agent);
                const tier = getAgentMetaTier(agent, metaRankings);
                return (
                  <button
                    key={agent}
                    title={isTaken ? `Taken by ${takenBy}` : `${agent} — mastery ${mastery} — Meta: ${tier}-tier on ${mapName}`}
                    onClick={() => handleAgentPick(player.id, agent)}
                    className={`flex flex-col items-center gap-0.5 shrink-0 transition-opacity ${
                      isCurrent ? 'opacity-100' :
                      isTaken   ? 'opacity-40 hover:opacity-70' :
                                  'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded overflow-hidden border-2 ${
                      isCurrent ? 'border-vct-red' : 'border-transparent'
                    }`}>
                      <GameImage src={getAgentImageUrl(agent)} alt={agent} className="w-full h-full object-cover" />
                    </div>
                    <div className="w-7 h-0.5 bg-vct-gray/20 rounded overflow-hidden">
                      <div className={`h-full rounded ${masteryBarColor(mastery)}`} style={{ width: `${mastery}%` }} />
                    </div>
                    <span className={`text-[9px] font-bold px-0.5 rounded leading-tight ${META_TIER_STYLES[tier]}`}>{tier}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setExpandedPlayer(expandedPlayer === player.id ? null : player.id)}
                className="text-xs text-vct-gray hover:text-vct-light shrink-0"
              >
                {expandedPlayer === player.id ? '▴' : '+more ▾'}
              </button>
            </>
          );

          return (
            <div key={player.id} className="flex flex-col">
              <div className="bg-vct-gray/5 rounded px-3 py-2">
                {/* Row 1: identity + selected agent/role (always visible) */}
                <div className="flex items-center gap-2">
                  {/* Player photo */}
                  <GameImage
                    src={getPlayerImageUrl(player.name)}
                    alt={player.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />

                  {/* Player name — fills remaining space on mobile, fixed width on sm+ */}
                  <span className="text-sm font-medium text-vct-light flex-1 min-w-0 sm:flex-none sm:w-20 sm:shrink-0 truncate">
                    {player.name}
                  </span>

                  {/* Desktop only: agent pickers inline */}
                  <div className="hidden sm:flex items-center gap-1">{agentPicker}</div>

                  {/* Desktop spacer */}
                  <div className="hidden sm:block flex-1" />

                  {/* Selected agent icon */}
                  <GameImage
                    src={getAgentImageUrl(currentAgent)}
                    alt={currentAgent}
                    className="w-8 h-8 object-contain shrink-0"
                  />

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

                {/* Row 2: mobile only — agent pickers on second line */}
                <div className="flex sm:hidden items-center gap-1 mt-1.5 flex-wrap">
                  {agentPicker}
                </div>
              </div>

              {/* Expanded agent grid */}
              {expandedPlayer === player.id && (
                <div className="ml-11 flex flex-col gap-1 bg-vct-gray/5 rounded p-2 mt-1">
                  {(Object.entries(AGENTS) as [AgentRole, string[]][]).map(([roleName, agents]) => (
                    <div key={roleName} className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-vct-gray w-16 shrink-0">{roleName}</span>
                      {agents.map((agent) => {
                        const isCurrent = currentAgent === agent;
                        const isTaken = !isCurrent && Object.entries(assignments).some(([pid, a]) => pid !== player.id && a === agent);
                        const takenBy = isTaken ? players.find((p) => p.id !== player.id && assignments[p.id] === agent)?.name : undefined;
                        const mastery = getMastery(prefs, agent);
                        const tier = getAgentMetaTier(agent, metaRankings);
                        return (
                          <button
                            key={agent}
                            title={isTaken ? `Taken by ${takenBy}` : `${agent} — mastery ${mastery} — Meta: ${tier}-tier on ${mapName}`}
                            onClick={() => { handleAgentPick(player.id, agent); setExpandedPlayer(null); }}
                            className={`flex flex-col items-center gap-0.5 shrink-0 transition-opacity ${
                              isCurrent ? 'opacity-100' :
                              isTaken   ? 'opacity-40 hover:opacity-70' :
                                          'opacity-70 hover:opacity-100'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded overflow-hidden border-2 ${
                              isCurrent ? 'border-vct-red' : 'border-transparent'
                            }`}>
                              <GameImage src={getAgentImageUrl(agent)} alt={agent} className="w-full h-full object-cover" />
                            </div>
                            <div className="w-7 h-0.5 bg-vct-gray/20 rounded overflow-hidden">
                              <div className={`h-full rounded ${masteryBarColor(mastery)}`} style={{ width: `${mastery}%` }} />
                            </div>
                            <span className={`text-[9px] font-bold px-0.5 rounded leading-tight ${META_TIER_STYLES[tier]}`}>{tier}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
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

      {/* Navigation */}
      <div className="flex justify-between items-center">
        {mapIndex > 0 ? (
          <button
            onClick={onBack}
            className="px-4 py-1.5 text-sm font-medium bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded"
          >
            Back
          </button>
        ) : (
          <div />
        )}
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
              <div className="relative mb-2">
                <GameImage
                  src={getMapImageUrl(mapName)}
                  alt={mapName}
                  className="w-full h-16 object-cover rounded"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center px-3 rounded">
                  <p className="text-xs text-vct-gray font-medium">{mapLabel}</p>
                  <p className="text-sm font-bold text-white">{mapName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {players.map((player) => {
                  const agentName = assignments[player.id] ?? '—';
                  const role = getAgentRole(agentName);
                  return (
                    <div key={player.id} className="flex items-center gap-1.5">
                      <GameImage
                        src={getPlayerImageUrl(player.name)}
                        alt={player.name}
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                      <span className="text-xs text-vct-gray truncate w-16">{player.name}</span>
                      <GameImage
                        src={getAgentImageUrl(agentName)}
                        alt={agentName}
                        className="w-5 h-5 object-contain shrink-0"
                      />
                      <span className="text-xs text-vct-light font-medium truncate">{agentName}</span>
                      {role && (
                        <span className={`text-xs px-1 rounded shrink-0 ${ROLE_COLORS[role]}`}>{role[0]}</span>
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
  currentPatch,
  onConfirm,
  onCancel,
  matchId,
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

  const handleAgentBack = () => {
    if (agentMapIndex > 0) {
      setAgentMapIndex((i) => i - 1);
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
    const autoAgents = runAutoAgentSelection(autoMaps, playerTeamPlayers, playerAgentPrefs, currentPatch ?? null);
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
            <div className="flex items-center gap-2">
              <GameImage src={getTeamLogoUrl(playerTeam.name)} alt={playerTeam.name} className="w-6 h-6 object-contain" />
              <span className="text-vct-light text-sm font-medium">{playerTeam.name}</span>
              <span className="text-vct-gray text-sm">vs</span>
              <span className="text-vct-light text-sm font-medium">{opponentTeam.name}</span>
              <GameImage src={getTeamLogoUrl(opponentTeam.name)} alt={opponentTeam.name} className="w-6 h-6 object-contain" />
            </div>
            <span className="text-vct-gray text-sm">
              {phase === 'veto' && '· Step 1: Map Veto'}
              {phase === 'agents' && '· Step 2: Agent Selection'}
              {phase === 'confirm' && '· Step 3: Confirm'}
            </span>
          </div>
          <button
            onClick={onCancel}
            className="text-vct-gray hover:text-vct-light text-lg"
          >
            ✕
          </button>
        </div>

        {/* Match context header */}
        {matchId && <PreMatchHeader matchId={matchId} />}

        {/* Phase content */}
        <div className="px-5 py-4">
          {phase === 'veto' && (
            <MapVetoPhase
              playerTeam={playerTeam}
              opponentTeam={opponentTeam}
              playerMapPool={playerTeam.mapPool}
              opponentMapPool={opponentTeam.mapPool}
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
              metaRankings={getMetaAgentRankings(currentMap, currentPatch ?? null)}
              onChange={(playerId, agentName) => handleAgentChange(currentMap, playerId, agentName)}
              onNext={handleAgentNext}
              onBack={handleAgentBack}
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
