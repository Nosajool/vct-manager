// Dashboard Page - Welcome screen and store state verification

import { useGameStore } from '../store';

export function Dashboard() {
  const players = useGameStore((state) => state.players);
  const teams = useGameStore((state) => state.teams);
  const initialized = useGameStore((state) => state.initialized);
  const gameStarted = useGameStore((state) => state.gameStarted);
  const calendar = useGameStore((state) => state.calendar);

  const playerCount = Object.keys(players).length;
  const teamCount = Object.keys(teams).length;

  // Actions for testing
  const setInitialized = useGameStore((state) => state.setInitialized);
  const setGameStarted = useGameStore((state) => state.setGameStarted);
  const addPlayer = useGameStore((state) => state.addPlayer);
  const addTeam = useGameStore((state) => state.addTeam);

  const handleInitialize = () => {
    setInitialized(true);
    setGameStarted(true);

    // Add a test player
    addPlayer({
      id: 'test-player-1',
      name: 'TenZ',
      age: 22,
      nationality: 'Canada',
      region: 'Americas',
      teamId: null,
      stats: {
        mechanics: 95,
        igl: 60,
        mental: 85,
        clutch: 90,
        vibes: 80,
        lurking: 75,
        entry: 88,
        support: 70,
        stamina: 82,
      },
      form: 85,
      morale: 90,
      potential: 95,
      contract: null,
      careerStats: {
        matchesPlayed: 250,
        wins: 180,
        losses: 70,
        avgKills: 18.5,
        avgDeaths: 12.3,
        avgAssists: 4.2,
        tournamentsWon: 5,
      },
      preferences: {
        salaryImportance: 60,
        teamQualityImportance: 90,
        regionLoyalty: 70,
        preferredTeammates: [],
      },
    });

    // Add a test team
    addTeam({
      id: 'test-team-1',
      name: 'Sentinels',
      region: 'Americas',
      playerIds: [],
      reservePlayerIds: [],
      coachIds: [],
      organizationValue: 5000000,
      fanbase: 85,
      chemistry: {
        overall: 75,
        pairs: {},
      },
      finances: {
        balance: 2000000,
        monthlyRevenue: {
          sponsorships: 150000,
          merchandise: 50000,
          prizeWinnings: 0,
          fanDonations: 10000,
        },
        monthlyExpenses: {
          playerSalaries: 100000,
          coachSalaries: 20000,
          facilities: 15000,
          travel: 10000,
        },
        pendingTransactions: [],
        loans: [],
      },
      standings: {
        wins: 0,
        losses: 0,
        roundDiff: 0,
        currentStreak: 0,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Phase 0 Complete Banner */}
      <div className="bg-gradient-to-r from-vct-red/20 to-vct-dark border border-vct-red/30 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-vct-red rounded-lg flex items-center justify-center">
            <span className="text-3xl">✓</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-vct-light">
              Phase 0 Complete!
            </h2>
            <p className="text-vct-gray">
              Foundation is set up: Vite + React + TypeScript + Zustand + Dexie +
              Tailwind
            </p>
          </div>
        </div>
      </div>

      {/* Store State Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Players"
          value={playerCount}
          icon="👥"
          color="blue"
        />
        <StatCard
          label="Teams"
          value={teamCount}
          icon="🏢"
          color="green"
        />
        <StatCard
          label="Initialized"
          value={initialized ? 'Yes' : 'No'}
          icon="⚡"
          color={initialized ? 'green' : 'gray'}
        />
        <StatCard
          label="Game Started"
          value={gameStarted ? 'Yes' : 'No'}
          icon="🎮"
          color={gameStarted ? 'green' : 'gray'}
        />
      </div>

      {/* Calendar State */}
      <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-vct-light mb-4">
          Calendar State
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-vct-gray">Current Date</p>
            <p className="text-vct-light font-medium">
              {new Date(calendar.currentDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-vct-gray">Season</p>
            <p className="text-vct-light font-medium">{calendar.currentSeason}</p>
          </div>
          <div>
            <p className="text-vct-gray">Phase</p>
            <p className="text-vct-light font-medium">{calendar.currentPhase}</p>
          </div>
          <div>
            <p className="text-vct-gray">Scheduled Events</p>
            <p className="text-vct-light font-medium">
              {calendar.scheduledEvents.length}
            </p>
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-vct-light mb-4">
          Test Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleInitialize}
            className="px-4 py-2 bg-vct-red text-white font-medium rounded
                       hover:bg-vct-red/80 transition-colors"
          >
            Initialize Test Data
          </button>
          <p className="text-vct-gray text-sm self-center">
            Click to add a test player and team to verify store works
          </p>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-vct-light mb-4">
          Phase 0 Checklist
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <ChecklistItem checked label="Vite + React + TypeScript project" />
          <ChecklistItem checked label="Tailwind CSS with VCT palette" />
          <ChecklistItem checked label="Directory structure created" />
          <ChecklistItem checked label="Core type definitions" />
          <ChecklistItem checked label="Zustand store with slices" />
          <ChecklistItem checked label="Dexie IndexedDB persistence" />
          <ChecklistItem checked label="Save/Load functionality" />
          <ChecklistItem checked label="Auto-save middleware" />
          <ChecklistItem checked label="Basic UI shell" />
          <ChecklistItem checked label="Navigation system" />
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-vct-light mb-4">
          Next: Phase 1 - Roster Management
        </h3>
        <ul className="text-sm text-vct-gray space-y-2">
          <li>• Player generator (procedural generation)</li>
          <li>• Player database (400+ players across regions)</li>
          <li>• Roster view UI</li>
          <li>• Free agent list</li>
          <li>• Sign/release player flow</li>
          <li>• Basic contract system</li>
        </ul>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'gray';
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'border-blue-500/30 bg-blue-500/10',
    green: 'border-green-500/30 bg-green-500/10',
    red: 'border-red-500/30 bg-red-500/10',
    gray: 'border-vct-gray/30 bg-vct-gray/10',
  };

  return (
    <div
      className={`p-4 rounded-lg border ${colorClasses[color]} transition-colors`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-vct-gray text-sm">{label}</p>
          <p className="text-2xl font-bold text-vct-light">{value}</p>
        </div>
        <span className="text-3xl opacity-50">{icon}</span>
      </div>
    </div>
  );
}

interface ChecklistItemProps {
  checked: boolean;
  label: string;
}

function ChecklistItem({ checked, label }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-5 h-5 rounded flex items-center justify-center text-xs
          ${checked ? 'bg-green-500/20 text-green-400' : 'bg-vct-gray/20 text-vct-gray'}`}
      >
        {checked ? '✓' : '○'}
      </span>
      <span className={checked ? 'text-vct-light' : 'text-vct-gray'}>
        {label}
      </span>
    </div>
  );
}
