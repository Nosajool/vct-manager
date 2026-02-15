// Web Worker for simulation compute
// Handles all heavy pure-compute operations off the main thread

import { MatchSimulator } from '../engine/match/MatchSimulator';
import { ScrimEngine } from '../engine/scrim/ScrimEngine';
import { PlayerDevelopment } from '../engine/player/PlayerDevelopment';
import { evaluate as evaluateDrama } from '../engine/drama/DramaEngine';

import type {
  WorkerRequest,
  WorkerResponse,
  MatchSimInput,
  TrainingInput,
  TrainingBatchInput,
  ScrimInput,
  DramaInput,
  ProgressUpdate,
} from './types';
import type { ScrimResult, MapResult } from '../types';

// ============================================================================
// Engine Instances
// ============================================================================

// Create engine instances once on worker startup
const matchSimulator = new MatchSimulator();
const scrimEngine = new ScrimEngine();
const playerDevelopment = new PlayerDevelopment();

// ============================================================================
// Progress Reporting
// ============================================================================

/**
 * Send progress update to main thread
 */
function sendProgress(id: string, stage: string, progress: number, details?: string): void {
  const update: ProgressUpdate = { stage, progress, details };
  const response: WorkerResponse = {
    type: 'PROGRESS',
    id,
    payload: update,
  };
  self.postMessage(response);
}

// ============================================================================
// Worker Message Handlers
// ============================================================================

/**
 * Handle match simulation request
 */
function handleMatchSimulation(id: string, input: MatchSimInput): void {
  const { teamA, teamB, playersA, playersB, strategyA, strategyB } = input;

  sendProgress(id, 'Starting match simulation', 0);

  const result = matchSimulator.simulate(
    teamA,
    teamB,
    playersA,
    playersB,
    strategyA,
    strategyB
  );

  sendProgress(id, 'Match simulation complete', 100);

  const response: WorkerResponse = {
    type: 'RESULT',
    id,
    payload: { resultType: 'match', data: result },
  };
  self.postMessage(response);
}

/**
 * Handle single player training request
 */
function handleTraining(id: string, input: TrainingInput): void {
  const { player, goal, focus, intensity, coachBonus } = input;

  sendProgress(id, 'Training player', 50);

  let result;
  if (goal) {
    result = playerDevelopment.trainPlayerWithGoal(player, goal, intensity, coachBonus);
  } else if (focus) {
    result = playerDevelopment.trainPlayer(player, focus, intensity, coachBonus);
  } else {
    throw new Error('Training request must specify either goal or focus');
  }

  sendProgress(id, 'Training complete', 100);

  const response: WorkerResponse = {
    type: 'RESULT',
    id,
    payload: { resultType: 'training', data: result },
  };
  self.postMessage(response);
}

/**
 * Handle batch training request
 */
function handleTrainingBatch(id: string, input: TrainingBatchInput): void {
  const { assignments } = input;
  const results = [];

  for (let i = 0; i < assignments.length; i++) {
    const assignment = assignments[i];
    const progress = Math.round(((i + 1) / assignments.length) * 100);
    sendProgress(id, `Training player ${i + 1}/${assignments.length}`, progress);

    let result;
    if (assignment.goal) {
      result = playerDevelopment.trainPlayerWithGoal(
        assignment.player,
        assignment.goal,
        assignment.intensity,
        assignment.coachBonus
      );
    } else if (assignment.focus) {
      result = playerDevelopment.trainPlayer(
        assignment.player,
        assignment.focus,
        assignment.intensity,
        assignment.coachBonus
      );
    } else {
      throw new Error('Training assignment must specify either goal or focus');
    }

    results.push(result);
  }

  const response: WorkerResponse = {
    type: 'RESULT',
    id,
    payload: { resultType: 'training_batch', data: results },
  };
  self.postMessage(response);
}

/**
 * Handle scrim simulation request
 * Replicates the logic from ScrimService.scheduleScrim
 */
function handleScrimSimulation(id: string, input: ScrimInput): void {
  const {
    playerTeam,
    partnerTeam,
    playerTeamPlayers,
    partnerTeamPlayers,
    options,
    relationship,
    mapPool,
    currentDate,
    playerTeamStrength,
    partnerTeamStrength,
    chemistryBefore,
    relationshipBefore,
  } = input;

  sendProgress(id, 'Preparing scrim', 10);

  // Calculate efficiency
  const efficiency = scrimEngine.calculateEfficiency(
    partnerTeam.tier,
    relationship.relationshipScore
  );

  // Select maps
  const mapsToPlay = scrimEngine.selectScrimMaps(options, mapPool);

  sendProgress(id, 'Simulating maps', 20);

  // Simulate each map
  const maps: MapResult[] = [];
  const mapStatsBefore: Record<string, any> = {};

  for (let i = 0; i < mapsToPlay.length; i++) {
    const mapName = mapsToPlay[i];
    const progress = 20 + Math.round(((i + 1) / mapsToPlay.length) * 50);
    sendProgress(id, `Simulating map ${i + 1}/${mapsToPlay.length}: ${mapName}`, progress);

    // Store map stats before for display
    if (mapPool.maps[mapName]) {
      mapStatsBefore[mapName] = { ...mapPool.maps[mapName].attributes };
    }

    const mapResult = scrimEngine.simulateScrimMap(
      playerTeamStrength,
      partnerTeamStrength,
      mapName,
      playerTeamPlayers,
      partnerTeamPlayers,
      options.intensity
    );

    maps.push(mapResult);
  }

  sendProgress(id, 'Calculating improvements', 75);

  // Calculate improvements
  const mapImprovements = scrimEngine.calculateMapImprovements(
    mapsToPlay,
    options.focusAttributes,
    efficiency,
    options.intensity
  );

  // Calculate chemistry changes
  const chemistryChanges = scrimEngine.calculateChemistryChanges(
    playerTeamPlayers,
    maps,
    options.intensity
  );

  sendProgress(id, 'Evaluating relationship', 85);

  // Roll for relationship event
  const relationshipEvent = scrimEngine.rollRelationshipEvent(
    relationship,
    partnerTeam,
    options.intensity,
    currentDate
  );

  // Calculate relationship change
  const relationshipChange = scrimEngine.calculateRelationshipChange(
    maps,
    options.intensity,
    relationshipEvent
  );

  sendProgress(id, 'Finalizing results', 95);

  // Determine overall winner (majority of maps)
  const playerTeamWins = maps.filter(m => m.winner === 'teamA').length;
  const partnerTeamWins = maps.filter(m => m.winner === 'teamB').length;
  const overallWinner = playerTeamWins > partnerTeamWins ? playerTeam.id : partnerTeam.id;

  // Build result object
  const result: ScrimResult = {
    id: `scrim-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    date: new Date().toISOString(),
    playerTeamId: playerTeam.id,
    partnerTeamId: partnerTeam.id,
    partnerTeamName: partnerTeam.name,
    partnerTier: partnerTeam.tier,
    maps,
    overallWinner,
    mapImprovements,
    chemistryChange: chemistryChanges.overallChange,
    pairChemistryChanges: chemistryChanges.pairChanges,
    relationshipChange,
    relationshipEvent,
    efficiencyMultiplier: efficiency,
    duration: mapsToPlay.length * 1.5, // ~1.5 hours per map
    chemistryBefore,
    relationshipBefore,
    mapStatsBefore,
  };

  sendProgress(id, 'Scrim complete', 100);

  const response: WorkerResponse = {
    type: 'RESULT',
    id,
    payload: { resultType: 'scrim', data: result },
  };
  self.postMessage(response);
}

/**
 * Handle drama evaluation request
 */
function handleDramaEvaluation(id: string, input: DramaInput): void {
  const { snapshot, templates } = input;

  sendProgress(id, 'Evaluating drama triggers', 50);

  const result = evaluateDrama(snapshot, templates);

  sendProgress(id, 'Drama evaluation complete', 100);

  const response: WorkerResponse = {
    type: 'RESULT',
    id,
    payload: { resultType: 'drama', data: result },
  };
  self.postMessage(response);
}

// ============================================================================
// Main Message Handler
// ============================================================================

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  try {
    switch (request.type) {
      case 'SIMULATE_MATCH':
        handleMatchSimulation(request.id, request.payload);
        break;

      case 'TRAIN_PLAYER':
        handleTraining(request.id, request.payload);
        break;

      case 'TRAIN_BATCH':
        handleTrainingBatch(request.id, request.payload);
        break;

      case 'RESOLVE_SCRIM':
        handleScrimSimulation(request.id, request.payload);
        break;

      case 'EVALUATE_DRAMA':
        handleDramaEvaluation(request.id, request.payload);
        break;

      default:
        // @ts-expect-error - exhaustiveness check
        throw new Error(`Unknown request type: ${request.type}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const response: WorkerResponse = {
      type: 'ERROR',
      id: request.id,
      error: errorMessage,
    };
    self.postMessage(response);
  }
};
