// Tournament Page - Tournament bracket and standings view
//
// Note: Match simulation is handled by the global TimeBar.
// This page is view-only for browsing tournaments and brackets.
//
// Now supports viewing tournaments from ALL regions (not just player's)

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGameStore } from '../store';
import { seasonManager } from '../engine/competition';
import {
  BracketView,
  TournamentCard,
  TournamentCardMini,
  StandingsTable,
  SwissStageView,
  LeagueStageView,
} from '../components/tournament';
import { MatchResult } from '../components/match/MatchResult';
import { MonthCalendar, DayDetailPanel, TrainingModal } from '../components/calendar';
import { ScrimModal } from '../components/scrim';
import { DayScheduleService } from '../services/DayScheduleService';
import { isMultiStageTournament, isLeagueToPlayoffTournament, isSwissToPlayoffTournament } from '../types';
import type { Region, TournamentRegion, Match, Team } from '../types';

type TournamentTab = 'current' | 'schedule';
type ViewMode = 'bracket' | 'standings' | 'swiss' | 'league';
type RegionFilter = Region | 'International' | 'all';

const REGION_OPTIONS: { value: RegionFilter; label: string }[] = [
  { value: 'all', label: 'All Regions' },
  { value: 'Americas', label: 'Americas' },
  { value: 'EMEA', label: 'EMEA' },
  { value: 'Pacific', label: 'Pacific' },
  { value: 'China', label: 'China' },
  { value: 'International', label: 'International' },
];

export function TournamentPage() {
  // Main tab state
  const [activeTab, setActiveTab] = useState<TournamentTab>('current');

  // Current tournament view state
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('bracket');
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('all');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  // Schedule view state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState<string | null>(null);
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [scrimModalOpen, setScrimModalOpen] = useState(false);
  const [scheduleSelectedMatch, setScheduleSelectedMatch] = useState<Match | null>(null);
  const [targetDate, setTargetDate] = useState<string | null>(null);

  const dayScheduleService = useMemo(() => new DayScheduleService(), []);
  const tournaments = useGameStore((state) => state.tournaments);
  const standings = useGameStore((state) => state.standings);
  const calendar = useGameStore((state) => state.calendar);
  const currentPhase = useGameStore((state) => state.calendar.currentPhase);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const matches = useGameStore((state) => state.matches);

  // Reset tournament selection when phase changes (e.g., Stage 1 → Stage 1 Playoffs)
  // This ensures the view updates to show the current phase's tournament
  useEffect(() => {
    setSelectedTournamentId(null);
  }, [currentPhase]);

  // Get player's region for default filter
  const playerTeam = playerTeamId ? teams[playerTeamId] : null;

  // Filter tournaments by region
  const filterByRegion = (t: { region: TournamentRegion }) => {
    if (selectedRegion === 'all') return true;
    return t.region === selectedRegion;
  };

  const allTournaments = Object.values(tournaments).filter(filterByRegion);
  const activeTournaments = allTournaments.filter((t) => t.status === 'in_progress');
  const upcomingTournaments = allTournaments.filter((t) => t.status === 'upcoming');
  const completedTournaments = allTournaments.filter((t) => t.status === 'completed');

  // Get selected tournament or current one
  // Prefer player's region tournament when none is selected
  const currentTournament = selectedTournamentId
    ? tournaments[selectedTournamentId]
    : (() => {
        // Try to find an active tournament in the player's region first
        if (playerTeam) {
          const playerRegionActive = activeTournaments.find(t => t.region === playerTeam.region);
          if (playerRegionActive) return playerRegionActive;
          const playerRegionUpcoming = upcomingTournaments.find(t => t.region === playerTeam.region);
          if (playerRegionUpcoming) return playerRegionUpcoming;
        }
        // Fall back to any active/upcoming tournament
        return activeTournaments[0] || upcomingTournaments[0];
      })();

  // Note: Standings sync for league tournaments is now handled by MatchService
  // after each match result, following the service layer orchestration pattern

  const tournamentStandings = currentTournament
    ? standings[currentTournament.id] || []
    : [];

  // Check if current tournament is a multi-stage tournament
  const isSwissTournament = currentTournament && isSwissToPlayoffTournament(currentTournament);
  const isLeagueTournament = currentTournament && isLeagueToPlayoffTournament(currentTournament);
  const isInSwissStage = isSwissTournament && currentTournament.currentStage === 'swiss';
  const isInLeagueStage = isLeagueTournament && currentTournament.currentStage === 'league';
  const isInPlayoffStage = currentTournament && isMultiStageTournament(currentTournament) && currentTournament.currentStage === 'playoff';

  // Handle clicking on a completed match in the bracket
  const handleMatchClick = (matchId: string) => {
    setSelectedMatchId(matchId);
  };

  const handleCloseMatchDetails = () => {
    setSelectedMatchId(null);
  };

  // Get the selected match for the modal
  const selectedMatch = selectedMatchId ? matches[selectedMatchId] : null;

  // === Schedule view data ===
  // Get all events for calendar display
  const allEvents = useMemo(() => {
    return calendar.scheduledEvents;
  }, [calendar.scheduledEvents]);

  // Initialize selectedDate to current date if not set
  const currentSelectedDate = selectedDate || calendar.currentDate;
  const currentViewDate = viewDate || calendar.currentDate;

  // Handle schedule view callbacks
  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleMonthChange = useCallback((date: string) => {
    setViewDate(date);
  }, []);

  const handleScheduleViewMatch = useCallback((match: Match) => {
    if (match.status === 'completed') {
      setScheduleSelectedMatch(match);
    }
  }, []);

  // Determine available view modes based on tournament type
  const getAvailableViewModes = (): ViewMode[] => {
    // Swiss stage of swiss_to_playoff tournaments
    if (isInSwissStage) {
      return ['swiss', 'standings'];
    }

    // League stage of league_to_playoff tournaments
    if (isInLeagueStage) {
      return ['league', 'standings'];
    }

    // Playoff stage of multi-stage tournaments
    if (isInPlayoffStage) {
      return ['bracket', 'standings'];
    }

    // Legacy league tournaments (stage1/stage2 round_robin) only have standings view
    if (
      currentTournament &&
      (currentTournament.type === 'stage1' || currentTournament.type === 'stage2') &&
      currentTournament.format === 'round_robin'
    ) {
      return ['standings'];
    }

    return ['bracket', 'standings'];
  };

  // Reset view mode when tournament changes
  const effectiveViewMode = (() => {
    const available = getAvailableViewModes();
    if (!available.includes(viewMode)) {
      return available[0];
    }
    return viewMode;
  })();

  // No tournaments yet
  if (allTournaments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-xl text-vct-gray mb-4">No Tournaments</p>
          <p className="text-sm text-vct-gray/60">
            Tournaments will appear here as the season progresses
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tournament</h1>
          <p className="text-sm text-vct-gray">
            {seasonManager.getPhaseName(calendar.currentPhase)} &middot;{' '}
            Season {calendar.currentSeason}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Region Filter - only show on Current tab */}
          {activeTab === 'current' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-vct-gray">Region:</span>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value as RegionFilter);
                    setSelectedTournamentId(null); // Reset selection when changing region
                  }}
                  className="bg-vct-dark border border-vct-gray/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-vct-red"
                >
                  {REGION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {playerTeam && selectedRegion !== playerTeam.region && selectedRegion !== 'all' && (
                  <button
                    onClick={() => setSelectedRegion(playerTeam.region)}
                    className="text-xs text-vct-red hover:text-vct-red/80"
                  >
                    My Region
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              {currentTournament && (
                <div className="flex bg-vct-dark rounded-lg p-1">
                  {getAvailableViewModes().map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1.5 text-sm rounded ${
                        effectiveViewMode === mode
                          ? 'bg-vct-red text-white'
                          : 'text-vct-gray hover:text-white'
                      }`}
                    >
                      {mode === 'swiss' ? 'Swiss Stage' :
                       mode === 'league' ? 'League Stage' :
                       mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-vct-gray/20">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'current'
              ? 'text-vct-red border-vct-red'
              : 'text-vct-gray border-transparent hover:text-vct-light'
          }`}
        >
          Current
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'schedule'
              ? 'text-vct-red border-vct-red'
              : 'text-vct-gray border-transparent hover:text-vct-light'
          }`}
        >
          Schedule
        </button>
      </div>

      {/* Current Tab Content */}
      {activeTab === 'current' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tournament List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Active Tournaments */}
          {activeTournaments.length > 0 && (
            <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-vct-red uppercase mb-3">
                Live ({activeTournaments.length})
              </h3>
              <div className="space-y-1">
                {activeTournaments.map((t) => (
                  <TournamentCardMini
                    key={t.id}
                    tournament={t}
                    onClick={() => setSelectedTournamentId(t.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tournaments */}
          {upcomingTournaments.length > 0 && (
            <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-vct-gray uppercase mb-3">
                Upcoming ({upcomingTournaments.length})
              </h3>
              <div className="space-y-1">
                {upcomingTournaments.map((t) => (
                  <TournamentCardMini
                    key={t.id}
                    tournament={t}
                    onClick={() => setSelectedTournamentId(t.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tournaments */}
          {completedTournaments.length > 0 && (
            <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-400 uppercase mb-3">
                Completed ({completedTournaments.length})
              </h3>
              <div className="space-y-1">
                {completedTournaments.slice(-5).map((t) => (
                  <TournamentCardMini
                    key={t.id}
                    tournament={t}
                    onClick={() => setSelectedTournamentId(t.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {currentTournament ? (
            <>
              {/* Tournament Info Card */}
              <TournamentCard tournament={currentTournament} showDetails />

              {/* Info about simulation */}
              {currentTournament.status === 'in_progress' && (
                <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-3">
                  <p className="text-sm text-vct-gray text-center">
                    Tournament matches play automatically when you advance time using the controls above
                  </p>
                </div>
              )}

              {/* Narrative Context Bar */}
              <NarrativeContextBar
                playerTeam={playerTeam}
                tournamentTeamIds={currentTournament.teamIds}
              />

              {/* Content based on view mode */}
              <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4">
                {effectiveViewMode === 'swiss' && isSwissTournament && currentTournament.swissStage && (
                  <SwissStageView swissStage={currentTournament.swissStage} onMatchClick={handleMatchClick} />
                )}

                {effectiveViewMode === 'league' && isLeagueTournament && currentTournament.leagueStage && (
                  <LeagueStageView leagueStage={currentTournament.leagueStage} onMatchClick={handleMatchClick} />
                )}

                {effectiveViewMode === 'bracket' && (
                  <BracketView bracket={currentTournament.bracket} onMatchClick={handleMatchClick} />
                )}

                {effectiveViewMode === 'standings' && (
                  <StandingsTable
                    standings={tournamentStandings}
                    highlightTop={
                      currentTournament.type === 'stage1' ||
                      currentTournament.type === 'stage2'
                        ? 8 // Top 8 qualify for Stage Playoffs
                        : 0
                    }
                  />
                )}
              </div>
            </>
          ) : (
            <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-8 text-center">
              <p className="text-vct-gray">Select a tournament to view</p>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Schedule Tab Content */}
      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <MonthCalendar
              currentDate={calendar.currentDate}
              viewDate={currentViewDate}
              events={allEvents}
              selectedDate={currentSelectedDate}
              onDateSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
            />
          </div>

          {/* Day Details Panel */}
          <div>
            <DayDetailPanel
              selectedDate={currentSelectedDate}
              currentDate={calendar.currentDate}
              events={allEvents}
              teams={teams}
              matches={matches}
              playerTeamId={playerTeamId}
              onViewMatch={handleScheduleViewMatch}
              onTrainingClick={(date) => {
                setTargetDate(date);
                const existingEvent = calendar.scheduledEvents.find(
                  (e) => e.type === 'scheduled_training' && e.date.startsWith(date.split('T')[0])
                );
                if (!existingEvent) {
                  try {
                    dayScheduleService.scheduleActivity(date, 'training');
                  } catch (err) {
                    console.error('Failed to schedule training:', err);
                    return;
                  }
                }
                setTrainingModalOpen(true);
              }}
              onScrimClick={(date) => {
                setTargetDate(date);
                const existingEvent = calendar.scheduledEvents.find(
                  (e) => e.type === 'scheduled_scrim' && e.date.startsWith(date.split('T')[0])
                );
                if (!existingEvent) {
                  try {
                    dayScheduleService.scheduleActivity(date, 'scrim');
                  } catch (err) {
                    console.error('Failed to schedule scrim:', err);
                    return;
                  }
                }
                setScrimModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Match Result Modal - for Current tab */}
      {selectedMatch && (
        <MatchResult match={selectedMatch} onClose={handleCloseMatchDetails} />
      )}

      {/* Match Result Modal - for Schedule tab */}
      {scheduleSelectedMatch && scheduleSelectedMatch.status === 'completed' && (
        <MatchResult
          match={scheduleSelectedMatch}
          onClose={() => setScheduleSelectedMatch(null)}
        />
      )}

      {/* Training Modal */}
      <TrainingModal
        isOpen={trainingModalOpen}
        onClose={() => {
          setTrainingModalOpen(false);
          setTargetDate(null);
        }}
        eventId={
          targetDate
            ? calendar.scheduledEvents.find(
                (e) =>
                  e.type === 'scheduled_training' &&
                  e.date.startsWith(targetDate.split('T')[0])
              )?.id
            : undefined
        }
        existingConfig={
          targetDate
            ? (() => {
                const event = calendar.scheduledEvents.find(
                  (e) =>
                    e.type === 'scheduled_training' &&
                    e.date.startsWith(targetDate.split('T')[0])
                );
                if (!event) return undefined;
                const config = useGameStore.getState().activityConfigs[event.id];
                return config?.type === 'training' ? config : undefined;
              })()
            : undefined
        }
      />

      {/* Scrim Modal */}
      <ScrimModal
        isOpen={scrimModalOpen}
        onClose={() => {
          setScrimModalOpen(false);
          setTargetDate(null);
        }}
        eventId={
          targetDate
            ? calendar.scheduledEvents.find(
                (e) =>
                  e.type === 'scheduled_scrim' &&
                  e.date.startsWith(targetDate.split('T')[0])
              )?.id
            : undefined
        }
        existingConfig={
          targetDate
            ? (() => {
                const event = calendar.scheduledEvents.find(
                  (e) =>
                    e.type === 'scheduled_scrim' &&
                    e.date.startsWith(targetDate.split('T')[0])
                );
                if (!event) return undefined;
                const config = useGameStore.getState().activityConfigs[event.id];
                return config?.type === 'scrim' ? config : undefined;
              })()
            : undefined
        }
      />
    </div>
  );
}

// Narrative context bar: shows rivalry and hype indicators for the player's team
function NarrativeContextBar({
  playerTeam,
  tournamentTeamIds,
}: {
  playerTeam: Team | null;
  tournamentTeamIds: string[];
}) {
  const getTopRivalries = useGameStore((state) => state.getTopRivalries);

  if (!playerTeam) return null;

  const playerInTournament = tournamentTeamIds.includes(playerTeam.id);
  if (!playerInTournament) return null;

  const topRivalry = getTopRivalries(1)[0] ?? null;
  const isRivalryMatchup =
    topRivalry &&
    topRivalry.intensity >= 60 &&
    tournamentTeamIds.includes(topRivalry.opponentTeamId);
  const isHyped = playerTeam.reputation.hypeLevel > 70;

  if (!isRivalryMatchup && !isHyped) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {isRivalryMatchup && (
        <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2">
          <span className="text-orange-400 text-sm">🔥</span>
          <span className="text-sm font-medium text-orange-300">Rivalry Match in This Tournament</span>
          <span className="text-xs text-orange-400/60 ml-1">{topRivalry.intensity} intensity</span>
        </div>
      )}
      {isHyped && (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
          <span className="text-yellow-400 text-sm">⚡</span>
          <span className="text-sm font-medium text-yellow-300">Most Hyped Team</span>
          <span className="text-xs text-yellow-400/60 ml-1">{playerTeam.reputation.hypeLevel} hype</span>
        </div>
      )}
    </div>
  );
}

export default TournamentPage;
