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
        <div className="max-w-2xl mx-auto space-y-3">
          <p className="text-lg text-vct-gray">
            You are a new manager in the competitive world of VALORANT esports.
          </p>
          <p className="text-lg text-vct-gray">
            The <span className="text-vct-red font-semibold">2026 VCT season</span> is about to begin.
            Build your roster, train your players, and lead your team to glory
            at Masters and Champions.
          </p>
          <p className="text-base text-vct-gray/70">
            Your journey starts now.
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
