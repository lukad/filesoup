import { JSX } from "solid-js";

type HeaderIcon = "seed" | "leech";

const icons: Record<HeaderIcon, JSX.Element> = {
  seed: (
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  ),
  leech: (
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  ),
};

type HeaderProps = {
  icon: HeaderIcon;
};

export default function Header(props: HeaderProps) {
  return (
    <header class="py-6 px-4 text-center animate-slide-up">
      <div class="flex items-center justify-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <svg
            class="w-7 h-7 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {icons[props.icon]}
          </svg>
        </div>
        <div class="text-left">
          <h1 class="text-2xl font-bold gradient-text">FileSoup</h1>
          <p class="text-white/50 text-sm">P2P File Sharing</p>
        </div>
      </div>
    </header>
  );
}
