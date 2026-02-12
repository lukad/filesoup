interface ProgressBarProps {
  label: string;
  detail: string;
  progress: number;
  showPeers?: boolean;
  peers?: number;
}

function ProgressBar(props: ProgressBarProps) {
  const progressPercent = () => Math.round(props.progress * 100);

  return (
    <div class="w-full">
      {/* Header with label and stats */}
      <div class="flex justify-between items-center mb-3">
        <span class="text-lg font-semibold text-white">{props.label}</span>
        <div class="flex items-center gap-3">
          {props.showPeers && (
            <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20">
              <svg
                class="w-4 h-4 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <circle cx="10" cy="10" r="4" />
              </svg>
              <span class="text-sm text-white/80">
                {props.peers || 0} peers
              </span>
            </div>
          )}
          <span class="text-sm font-mono text-cyan-400">{props.detail}</span>
        </div>
      </div>

      {/* Progress bar container */}
      <div class="relative h-4 bg-white/10 rounded-full overflow-hidden border border-white/10">
        {/* Animated progress fill with gradient */}
        <div
          class="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent()}%` }}
        >
          {/* Shimmer effect overlay */}
          <div class="absolute inset-0 shimmer opacity-30" />
        </div>
      </div>

      {/* Percentage display */}
      <div class="flex justify-end mt-2">
        <span class="text-2xl font-bold gradient-text">
          {progressPercent()}%
        </span>
      </div>
    </div>
  );
}

export default ProgressBar;
