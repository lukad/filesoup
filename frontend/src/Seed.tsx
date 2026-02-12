import FileInput from "./FileInput";
import useWebTorrent from "./hooks/useWebTorrent";
import CopyToClipboard from "./CopyToClipboard";
import Spinner from "./Spinner";
import { Show, createSignal } from "solid-js";

function link(id: string) {
  let host = window.location.host;
  let protocol = window.location.protocol;
  return `${protocol}//${host}/${id}`;
}

function Seed() {
  const { state, torrentId, seedFiles } = useWebTorrent();
  const [fileName, setFileName] = createSignal<string>("");

  const handleFiles = (files: FileList) => {
    if (files.length > 0) {
      setFileName(files[0].name);
    }
    seedFiles(files);
  };

  return (
    <div class="w-full min-h-screen flex flex-col">
      {/* Header/Logo */}
      <header class="py-6 px-4 text-center animate-slide-up">
        <div class="flex items-center justify-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <svg
              class="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div class="text-left">
            <h1 class="text-2xl font-bold gradient-text">FileSoup</h1>
            <p class="text-white/50 text-sm">P2P File Sharing</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main class="flex-1 flex items-center justify-center p-4">
        <Show when={state() === "idle"} fallback={<></>}>
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

        <Show when={state() === "seeding"}>
          <CopyToClipboard content={link(torrentId())} fileName={fileName()} />
        </Show>
      </main>

      {/* Footer */}
      <footer class="py-4 px-4 text-center text-white/30 text-sm">
        <p>Powered by WebTorrent • No servers, just P2P</p>
      </footer>
    </div>
  );
}

export default Seed;
