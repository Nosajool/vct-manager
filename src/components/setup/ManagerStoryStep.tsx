// ManagerStoryStep - Step 0: Manager story introduction

interface ManagerStoryStepProps {
  onContinue: () => void;
  onCancel?: () => void;
  onLoadSave?: () => void;
}

export function ManagerStoryStep({ onContinue, onCancel, onLoadSave }: ManagerStoryStepProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">🎮</div>
        <h2 className="text-3xl font-bold text-vct-light">
          Welcome to VCT Manager
        </h2>
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-lg text-vct-gray">
            You are a new manager in the competitive world of VALORANT esports.
            The <span className="text-vct-red font-semibold">2026 VCT season</span> is about to begin.
          </p>
          <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4 text-left space-y-2">
            <p className="text-sm font-semibold text-vct-light uppercase tracking-wide">Your job</p>
            <ul className="text-sm text-vct-gray space-y-1.5">
              <li className="flex items-start gap-2"><span className="text-vct-red mt-0.5">▸</span> Manage your roster — sign players, set your lineup, handle contracts</li>
              <li className="flex items-start gap-2"><span className="text-vct-red mt-0.5">▸</span> Schedule training and scrimmages to improve your team's performance</li>
              <li className="flex items-start gap-2"><span className="text-vct-red mt-0.5">▸</span> Navigate press conferences, team drama, and sponsor relationships</li>
              <li className="flex items-start gap-2"><span className="text-vct-red mt-0.5">▸</span> Compete through Kickoff, Stage 1, Stage 2, and ultimately <span className="text-vct-red font-medium">Champions</span></li>
            </ul>
          </div>
          <p className="text-base text-vct-gray/70">
            Advance days to progress through the season. Your decisions shape everything.
          </p>
        </div>
      </div>

      {/* Begin / Load Save Buttons */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onContinue}
          className="px-8 py-3 bg-vct-red hover:bg-vct-red/80
                     text-white font-bold rounded-lg
                     transition-all duration-200
                     transform hover:scale-105"
        >
          Begin New Game
        </button>
        {onLoadSave && (
          <button
            onClick={onLoadSave}
            className="px-6 py-2 text-vct-gray hover:text-vct-light border border-vct-gray/30 hover:border-vct-gray/60 rounded-lg transition-colors text-sm"
          >
            Load Save
          </button>
        )}
      </div>

      {/* Cancel Button */}
      {onCancel && (
        <div className="flex justify-center">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-vct-gray hover:text-vct-light transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
