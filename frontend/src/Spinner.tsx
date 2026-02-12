interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

function Spinner(props: SpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <div class="flex flex-col items-center justify-center gap-4 animate-scale-in">
      {/* Outer ring */}
      <div class="relative">
        <svg
          class={`animate-spin ${sizeClasses[props.size || "lg"]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="url(#gradient)"
            stroke-width="3"
          />
          <path
            class="opacity-100"
            stroke="url(#gradient)"
            stroke-width="3"
            stroke-linecap="round"
            d="M12 2a10 10 0 0 1 10 10"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#a78bfa" />
              <stop offset="100%" stop-color="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center glow */}
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-1/2 h-1/2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 animate-pulse-glow blur-md" />
        </div>
      </div>

      {/* Optional message */}
      {props.message && (
        <p class="text-white/70 text-sm font-medium animate-pulse">
          {props.message}
        </p>
      )}
    </div>
  );
}

export default Spinner;
