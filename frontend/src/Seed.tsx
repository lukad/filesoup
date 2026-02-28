import FileInput from "./FileInput";
import useWebTorrent from "./hooks/useWebTorrent";
import ShareLink from "./ShareLink";
import Spinner from "./Spinner";
import Header from "./Header";
import Footer from "./Footer";
import { Show, createSignal } from "solid-js";
import { trackEvent } from "./analytics";

function link(id: string) {
  let host = window.location.host;
  let protocol = window.location.protocol;
  return `${protocol}//${host}/${id}`;
}

function Seed() {
  const { state, torrentId, seedFiles, error, clearError } = useWebTorrent();
  const [fileName, setFileName] = createSignal<string>("");

  const handleFiles = (files: FileList) => {
    clearError();
    if (files.length > 0) {
      setFileName(files[0].name);
    }
    seedFiles(files);
  };

  return (
    <div class="w-full min-h-screen flex flex-col">
      <Header icon="seed" />

      {/* Main content */}
      <main class="flex-1 flex items-center justify-center p-4">
        <Show when={!error() && state() === "idle"} fallback={<></>}>
          <FileInput onFiles={handleFiles} />
        </Show>

        <Show when={state() === "processing"}>
          <div class="flex flex-col items-center gap-6">
            <Spinner size="lg" message="Creating torrent..." />
            {fileName() && (
              <div class="text-center animate-slide-up">
                <p class="text-white/60 text-sm">Seeding</p>
                <p class="text-white font-medium">{fileName()}</p>
              </div>
            )}
          </div>
        </Show>

        <Show when={error()}>
          <div class="glass-card p-8 text-center animate-scale-in max-w-md">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-white mb-2">Something went wrong</h2>
            <p class="text-white/60 mb-6">{error()}</p>
            <button
              onClick={() => {
                trackEvent("seed_error_retry");
                clearError();
                setFileName("");
              }}
              class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Try Again
            </button>
          </div>
        </Show>

        <Show when={state() === "seeding"}>
          <ShareLink content={link(torrentId())} fileName={fileName()} />
        </Show>
      </main>

      <Footer />
    </div>
  );
}

export default Seed;
