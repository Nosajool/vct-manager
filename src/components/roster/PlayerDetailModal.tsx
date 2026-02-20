// PlayerDetailModal - Full player stats and actions

import type { Player, PlayerStats } from '../../types';
import { playerGenerator } from '../../engine/player';
import { useState } from 'react';
import { GameImage } from '../shared/GameImage';
import { getPlayerImageUrl } from '../../utils/imageAssets';
import { formatRating, formatKD } from '../../utils/formatNumber';

interface PlayerDetailModalProps {
  player: Player;
  onClose: () => void;
  onSign?: () => void;
  onRelease?: () => void;
  isOnPlayerTeam?: boolean;
  // Roster management props
  rosterPosition?: 'active' | 'reserve';
}

export function PlayerDetailModal({
  player,
  onClose,
  isOnPlayerTeam = false,
  rosterPosition,
  onSign,
  onRelease,
}: PlayerDetailModalProps) {
  const overall = playerGenerator.calculateOverall(player.stats);
  const [showCareerStats, setShowCareerStats] = useState(false);

  // Default season stats for players without the field (backward compatibility)
  const seasonStats = player.seasonStats ?? {
    season: 1,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    avgKills: 0,
    avgDeaths: 0,
    avgAssists: 0,
    tournamentsWon: 0,
  };

  const formatSalary = (salary: number): string => {
    if (salary >= 1000000) {
      return `$${(salary / 1000000).toFixed(2)}M`;
    }
    return `$${(salary / 1000).toFixed(0)}K`;
  };

  const getStatColor = (value: number): string => {
    if (value >= 85) return 'bg-yellow-500';
    if (value >= 75) return 'bg-green-500';
    if (value >= 65) return 'bg-blue-500';
    if (value >= 55) return 'bg-vct-gray';
    return 'bg-red-500';
  };

  const statLabels: Record<keyof PlayerStats, string> = {
    mechanics: 'Mechanics',
    igl: 'Leadership',
    mental: 'Mental',
    clutch: 'Clutch',
    vibes: 'Vibes',
    lurking: 'Lurking',
    entry: 'Entry',
    support: 'Support',
    stamina: 'Stamina',
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker border border-vct-gray/30 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-vct-gray/20">
          <div className="flex items-center gap-4">
            {/* Player Photo */}
            <GameImage
              src={getPlayerImageUrl(player.name)}
              alt={player.name}
              className="w-20 h-20 rounded-lg object-cover"
            />

            {/* Overall */}
            <div
              className={`
                w-20 h-20 rounded-lg flex items-center justify-center
                font-bold text-3xl bg-vct-dark border-2
                ${overall >= 85 ? 'border-yellow-500 text-yellow-400' : ''}
                ${overall >= 75 && overall < 85 ? 'border-green-500 text-green-400' : ''}
                ${overall >= 65 && overall < 75 ? 'border-blue-500 text-blue-400' : ''}
                ${overall < 65 ? 'border-vct-gray text-vct-gray' : ''}
              `}
            >
              {overall}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-vct-light">{player.name}</h2>
                {isOnPlayerTeam && rosterPosition && (
                  <span
                    className={`
                      text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded
                      ${rosterPosition === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                      }
                    `}
                  >
                    {rosterPosition}
                  </span>
                )}
              </div>
              <p className="text-vct-gray">
                {player.age} years • {player.nationality}
              </p>
              <p className="text-sm text-vct-red font-medium">{player.region}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-vct-gray hover:text-vct-light transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div>
            <h3 className="text-lg font-semibold text-vct-light mb-4">
              Attributes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.entries(player.stats) as [keyof PlayerStats, number][]).map(
                ([stat, value]) => (
                  <div key={stat} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-vct-gray">
                      {statLabels[stat]}
                    </span>
                    <div className="flex-1 h-2 bg-vct-dark rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getStatColor(value)}`}
                        style={{ width: `${formatRating(value)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm text-vct-light font-medium">
                      {formatRating(value)}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Form, Morale, Potential */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-vct-dark rounded-lg p-4 text-center">
              <p className="text-vct-gray text-sm mb-1">Form</p>
              <p className="text-2xl font-bold text-vct-light">{formatRating(player.form)}</p>
            </div>
            <div className="bg-vct-dark rounded-lg p-4 text-center">
              <p className="text-vct-gray text-sm mb-1">Morale</p>
              <p className="text-2xl font-bold text-vct-light">{formatRating(player.morale)}</p>
            </div>
            <div className="bg-vct-dark rounded-lg p-4 text-center">
              <p className="text-vct-gray text-sm mb-1">Potential</p>
              <p className="text-2xl font-bold text-yellow-400">
                {formatRating(player.potential)}
              </p>
            </div>
          </div>

          {/* Contract */}
          <div>
            <h3 className="text-lg font-semibold text-vct-light mb-3">
              Contract
            </h3>
            {player.contract ? (
              <div className="bg-vct-dark rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-vct-gray text-sm">Annual Salary</p>
                    <p className="text-xl font-bold text-vct-light">
                      {formatSalary(player.contract.salary)}
                    </p>
                  </div>
                  <div>
                    <p className="text-vct-gray text-sm">Years Remaining</p>
                    <p className="text-xl font-bold text-vct-light">
                      {player.contract.yearsRemaining}
                    </p>
                  </div>
                  <div>
                    <p className="text-vct-gray text-sm">Win Bonus</p>
                    <p className="text-lg text-vct-light">
                      {formatSalary(player.contract.bonusPerWin)}
                    </p>
                  </div>
                  <div>
                    <p className="text-vct-gray text-sm">Contract Ends</p>
                    <p className="text-lg text-vct-light">
                      {new Date(player.contract.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 font-medium">Free Agent</p>
                <p className="text-vct-gray text-sm mt-1">
                  This player is available for signing
                </p>
              </div>
            )}
          </div>

          {/* Season Stats */}
          <div>
            <h3 className="text-lg font-semibold text-vct-light mb-3">
              Season Stats
            </h3>
            <div className="bg-vct-dark rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-vct-light">
                    {seasonStats.matchesPlayed}
                  </p>
                  <p className="text-vct-gray text-sm">Matches</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {seasonStats.wins}
                  </p>
                  <p className="text-vct-gray text-sm">Wins</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">
                    {seasonStats.losses}
                  </p>
                  <p className="text-vct-gray text-sm">Losses</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">
                    {seasonStats.tournamentsWon}
                  </p>
                  <p className="text-vct-gray text-sm">Titles</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-vct-gray/20 text-center">
                <div>
                  <p className="text-lg font-bold text-vct-light">
                    {seasonStats.avgKills.toFixed(1)}
                  </p>
                  <p className="text-vct-gray text-xs">Avg Kills</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-vct-light">
                    {seasonStats.avgDeaths.toFixed(1)}
                  </p>
                  <p className="text-vct-gray text-xs">Avg Deaths</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-vct-light">
                    {seasonStats.avgDeaths > 0
                      ? formatKD(seasonStats.avgKills / seasonStats.avgDeaths)
                      : '-'}
                  </p>
                  <p className="text-vct-gray text-xs">K/D Ratio</p>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle for Career Stats */}
          <div className="mt-4">
            <button
              onClick={() => setShowCareerStats(!showCareerStats)}
              className="text-vct-gray hover:text-vct-light transition-colors flex items-center gap-1 text-sm"
            >
              {showCareerStats ? 'Hide' : 'Show'} Career Stats
            </button>
          </div>

          {showCareerStats && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-vct-light mb-3">
                Career Stats
              </h3>
              <div className="bg-vct-dark rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-vct-light">
                      {player.careerStats.matchesPlayed}
                    </p>
                    <p className="text-vct-gray text-sm">Matches</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">
                      {player.careerStats.wins}
                    </p>
                    <p className="text-vct-gray text-sm">Wins</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-400">
                      {player.careerStats.losses}
                    </p>
                    <p className="text-vct-gray text-sm">Losses</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">
                      {player.careerStats.tournamentsWon}
                    </p>
                    <p className="text-vct-gray text-sm">Titles</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-vct-gray/20 text-center">
                  <div>
                    <p className="text-lg font-bold text-vct-light">
                      {player.careerStats.avgKills.toFixed(1)}
                    </p>
                    <p className="text-vct-gray text-xs">Avg Kills</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-vct-light">
                      {player.careerStats.avgDeaths.toFixed(1)}
                    </p>
                    <p className="text-vct-gray text-xs">Avg Deaths</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-vct-light">
                      {player.careerStats.avgDeaths > 0
                        ? formatKD(player.careerStats.avgKills / player.careerStats.avgDeaths)
                        : '-'}
                    </p>
                    <p className="text-vct-gray text-xs">K/D Ratio</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {(onSign || onRelease) && (
            <div className="flex gap-3 pt-2 border-t border-vct-gray/20">
              {onSign && (
                <button
                  onClick={onSign}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded transition-colors"
                >
                  Sign Player
                </button>
              )}
              {onRelease && (
                <button
                  onClick={onRelease}
                  className="flex-1 px-4 py-2 bg-red-600/80 hover:bg-red-700 text-white font-medium rounded transition-colors"
                >
                  Release Player
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}