// ContractService - Orchestrates contract negotiations and roster changes
// Connects engine logic with store updates

import { useGameStore } from '../store';
import {
  contractNegotiator,
  type ContractOffer,
  type NegotiationResult,
  type SalaryExpectation,
} from '../engine/player';
import type { Player, Transaction } from '../types';

/**
 * Result of a signing attempt
 */
export interface SigningResult {
  success: boolean;
  error?: string;
  negotiationResult?: NegotiationResult;
}

/**
 * Result of a release operation
 */
export interface ReleaseResult {
  success: boolean;
  error?: string;
  releaseCost?: number;
}

/**
 * ContractService - Handles all contract and roster operations
 */
export class ContractService {
  /**
   * Get salary expectation for a player
   */
  getSalaryExpectation(playerId: string): SalaryExpectation | null {
    const player = useGameStore.getState().players[playerId];
    if (!player) return null;

    return contractNegotiator.getSalaryExpectation(player);
  }

  /**
   * Get release cost for a player
   */
  getReleaseCost(playerId: string): number {
    const player = useGameStore.getState().players[playerId];
    if (!player) return 0;

    return contractNegotiator.calculateReleaseCost(player);
  }

  /**
   * Evaluate a contract offer without committing
   */
  evaluateOffer(
    playerId: string,
    teamId: string,
    offer: ContractOffer
  ): NegotiationResult | null {
    const state = useGameStore.getState();
    const player = state.players[playerId];
    const team = state.teams[teamId];

    if (!player || !team) return null;

    return contractNegotiator.evaluateOffer(player, offer, team);
  }

  /**
   * Attempt to sign a player to a contract
   */
  signPlayer(
    playerId: string,
    teamId: string,
    offer: ContractOffer,
    position: 'active' | 'reserve' = 'active'
  ): SigningResult {
    const state = useGameStore.getState();
    const player = state.players[playerId];
    const team = state.teams[teamId];

    // Validation
    if (!player) {
      return { success: false, error: 'Player not found' };
    }
    if (!team) {
      return { success: false, error: 'Team not found' };
    }
    if (player.teamId !== null) {
      return { success: false, error: 'Player is already on a team' };
    }

    // Validate roster space
    const rosterValidation = contractNegotiator.validateRosterSpace(team, position);
    if (!rosterValidation.valid) {
      return { success: false, error: rosterValidation.reason };
    }

    // Validate budget
    const budgetValidation = contractNegotiator.validateTeamBudget(team, offer);
    if (!budgetValidation.valid) {
      return { success: false, error: budgetValidation.reason };
    }

    // Evaluate the offer
    const negotiationResult = contractNegotiator.evaluateOffer(player, offer, team);

    if (!negotiationResult.accepted) {
      return {
        success: false,
        error: 'Player rejected the offer',
        negotiationResult,
      };
    }

    // Offer accepted - commit changes

    // 1. Create the contract
    const contract = contractNegotiator.createContract(offer);

    // 2. Update player
    state.updatePlayer(playerId, {
      teamId: teamId,
      contract: contract,
      morale: Math.min(100, player.morale + 10), // Happy to be signed!
    });

    // 3. Add player to team roster
    if (position === 'active') {
      state.addPlayerToTeam(teamId, playerId);
    } else {
      state.addPlayerToReserve(teamId, playerId);
    }

    // 4. Deduct signing bonus from team balance
    if (offer.signingBonus > 0) {
      state.updateTeamBalance(teamId, -offer.signingBonus);

      // Record transaction
      this.recordTransaction(teamId, {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'signing_bonus',
        amount: -offer.signingBonus,
        date: new Date().toISOString(),
        description: `Signing bonus for ${player.name}`,
      });
    }

    // 5. Update monthly salary expenses
    const currentExpenses = team.finances.monthlyExpenses;
    state.updateTeamFinances(teamId, {
      monthlyExpenses: {
        ...currentExpenses,
        playerSalaries: currentExpenses.playerSalaries + Math.round(offer.salary / 12),
      },
    });

    return {
      success: true,
      negotiationResult,
    };
  }

  /**
   * Release a player from their contract
   */
  releasePlayer(playerId: string): ReleaseResult {
    const state = useGameStore.getState();
    const player = state.players[playerId];

    if (!player) {
      return { success: false, error: 'Player not found' };
    }
    if (!player.teamId) {
      return { success: false, error: 'Player is not on a team' };
    }

    const team = state.teams[player.teamId];
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    // Calculate release cost (buyout)
    const releaseCost = contractNegotiator.calculateReleaseCost(player);

    // Check if team can afford buyout
    if (team.finances.balance < releaseCost) {
      return {
        success: false,
        error: `Insufficient funds for buyout. Need $${Math.round(releaseCost / 1000)}K but only have $${Math.round(team.finances.balance / 1000)}K.`,
        releaseCost,
      };
    }

    // Commit changes
    const teamId = player.teamId;
    const monthlySalary = player.contract?.salary
      ? Math.round(player.contract.salary / 12)
      : 0;

    // 1. Remove player from team roster
    state.removePlayerFromTeam(teamId, playerId);

    // 2. Update player - clear team and contract
    state.updatePlayer(playerId, {
      teamId: null,
      contract: null,
      morale: Math.max(30, player.morale - 15), // Sad to be released
    });

    // 3. Deduct buyout cost
    if (releaseCost > 0) {
      state.updateTeamBalance(teamId, -releaseCost);

      // Record transaction
      this.recordTransaction(teamId, {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'transfer_fee',
        amount: -releaseCost,
        date: new Date().toISOString(),
        description: `Contract buyout for ${player.name}`,
      });
    }

    // 4. Remove from monthly salary expenses
    const currentExpenses = team.finances.monthlyExpenses;
    state.updateTeamFinances(teamId, {
      monthlyExpenses: {
        ...currentExpenses,
        playerSalaries: Math.max(0, currentExpenses.playerSalaries - monthlySalary),
      },
    });

    return {
      success: true,
      releaseCost,
    };
  }

  /**
   * Move a player between active and reserve roster
   */
  movePlayerPosition(
    playerId: string,
    newPosition: 'active' | 'reserve'
  ): { success: boolean; error?: string } {
    const state = useGameStore.getState();
    const player = state.players[playerId];

    if (!player || !player.teamId) {
      return { success: false, error: 'Player not on a team' };
    }

    const team = state.teams[player.teamId];
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    const isActive = team.playerIds.includes(playerId);
    const isReserve = team.reservePlayerIds.includes(playerId);

    if (newPosition === 'active') {
      if (isActive) {
        return { success: false, error: 'Player is already in active roster' };
      }
      if (team.playerIds.length >= 5) {
        return { success: false, error: 'Active roster is full (5/5)' };
      }
      // Check for visa restriction — player cannot be promoted while visa is pending
      const isRestricted = `visa_delayed_${playerId}` in state.activeFlags;
      if (isRestricted) {
        return { success: false, error: 'Player is unavailable — visa processing still pending' };
      }
      // Move from reserve to active
      state.movePlayerToActive(player.teamId, playerId);

      // Track substitute for visa arc recovery: store promoted player's ID in the flag value
      const substituteFlag = Object.keys(state.activeFlags).find(flagKey => {
        if (!flagKey.startsWith('substitute_taking_over_')) return false;
        if (state.activeFlags[flagKey].value) return false; // already tracked
        const originalPlayerId = flagKey.replace('substitute_taking_over_', '');
        return team.reservePlayerIds.includes(originalPlayerId);
      });
      if (substituteFlag) {
        state.setDramaFlag(substituteFlag, {
          ...state.activeFlags[substituteFlag],
          value: playerId,
        });
      }
    } else {
      if (isReserve) {
        return { success: false, error: 'Player is already in reserve' };
      }
      // Move from active to reserve
      // First remove from active, then add to reserve
      const teamId = player.teamId;
      useGameStore.setState((prev) => {
        const currentTeam = prev.teams[teamId];
        if (!currentTeam) return prev;

        return {
          teams: {
            ...prev.teams,
            [teamId]: {
              ...currentTeam,
              playerIds: currentTeam.playerIds.filter((id) => id !== playerId),
              reservePlayerIds: [...currentTeam.reservePlayerIds, playerId],
            },
          },
        };
      });
    }

    return { success: true };
  }

  /**
   * Record a financial transaction
   */
  private recordTransaction(teamId: string, transaction: Transaction): void {
    const state = useGameStore.getState();
    const team = state.teams[teamId];
    if (!team) return;

    state.updateTeamFinances(teamId, {
      pendingTransactions: [...team.finances.pendingTransactions, transaction],
    });
  }

  /**
   * Get player info for contract modal
   */
  getPlayerContractInfo(playerId: string): {
    player: Player;
    salaryExpectation: SalaryExpectation;
    releaseCost: number;
  } | null {
    const player = useGameStore.getState().players[playerId];
    if (!player) return null;

    return {
      player,
      salaryExpectation: contractNegotiator.getSalaryExpectation(player),
      releaseCost: contractNegotiator.calculateReleaseCost(player),
    };
  }
}

// Export singleton instance
export const contractService = new ContractService();
