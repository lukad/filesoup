import FileInput from "./FileInput";
import useWebTorrent from "./hooks/useWebTorrent";
import CopyToClipboard from "./CopyToClipboard";
import Spinner from "./Spinner";
import Header from "./Header";
import Footer from "./Footer";
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
      <Header icon="seed" />

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

      <Footer />
    </div>
  );
}

export default Seed;
