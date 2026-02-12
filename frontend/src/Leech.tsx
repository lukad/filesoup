import { createEffect, createSignal, Show, onCleanup } from "solid-js";
import useWebTorrent from "./hooks/useWebTorrent";
import { useParams } from "@solidjs/router";
import ProgressBar from "./ProgressBar";
import Spinner from "./Spinner";
import Header from "./Header";
import Footer from "./Footer";

function downloadBlobUrl(name: string, blobUrl: string) {
  let a = document.createElement("a");
  a.setAttribute("download", name);
  a.setAttribute("href", blobUrl);
  const root = document.querySelector("#root");
  if (root) {
    root.appendChild(a);
    a.click();
    root.removeChild(a);
  }
}

function formatBytes(bytes: number | undefined, suffix = "") {
  if (bytes === undefined || bytes === null || isNaN(bytes)) {
    return "--";
  }
  let num = bytes;
  let unit = "B";
  if (bytes < 1e6) {
    num = bytes / 1e3;
    unit = "KB";
  } else if (bytes < 1e9) {
    num = bytes / 1e6;
    unit = "MB";
  } else if (bytes < 1e12) {
    num = bytes / 1e9;
    unit = "GB";
  }

  return `${num.toFixed(2)} ${unit}${suffix}`;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

type Leeching = {
  type: "leeching";
  downloadSpeed: number;
  received: number;
  progress: number;
  peers: number;
  length: number;
  fileName: string;
};

type State =
  | Leeching
  | { type: "loading" }
  | { type: "not_found" }
  | { type: "done"; fileName: string };

function Leech() {
  const params = useParams();

  const {
    state: _torrentState,
    torrentId: _a,
    seedFiles: _b,
    addMagnetURI,
  } = useWebTorrent();
  const [state, setState] = createSignal<State>({ type: "loading" });
  const [magnetUri, setMagnetUri] = createSignal<string | null>(null);
  const [blobUrl, setBlobUrl] = createSignal<string | null>(null);
  const [torrentAdded, setTorrentAdded] = createSignal(false);

  // Clean up blob URL on component unmount
  onCleanup(() => {
    const url = blobUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
  });

  createEffect(() => {
    setState({ type: "loading" });
    let request = new XMLHttpRequest();
    request.open("GET", `/files/${params.id}`);
    request.send("");
    request.addEventListener("load", () => {
      if (request.status === 200) {
        let response = JSON.parse(request.response);
        setMagnetUri(response.magnetUri);
      } else if (request.status === 404) {
        setState({ type: "not_found" });
      }
    });
  });

  createEffect(() => {
    const magnet = magnetUri();
    if (magnet && !torrentAdded()) {
      setTorrentAdded(true);
      const torrent = addMagnetURI(magnet);

      torrent.on("download", () => {
        if (state().type === "done") return;
        setState({
          type: "leeching",
          downloadSpeed: torrent.downloadSpeed,
          received: torrent.received,
          progress: torrent.progress,
          peers: torrent.numPeers,
          length: torrent.length,
          fileName: torrent.name,
        });
      });
      torrent.on("done", () => {
        torrent.files[0].blob().then((blob) => {
          setState({ type: "done", fileName: torrent.name });
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          downloadBlobUrl(torrent.name, url);
          // Revoke blob URL after download is triggered
          setTimeout(() => URL.revokeObjectURL(url), 100);
        });
      });
    }
  });

  const calculateETA = () => {
    const s = state();
    if (s.type !== "leeching") return null;
    if (s.downloadSpeed === 0) return null;
    const remaining = s.length - s.received;
    return remaining / s.downloadSpeed;
  };

  const getFileIcon = () => {
    // File type icons could be expanded here
    return (
      <svg
        class="w-12 h-12 text-white/80"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  };

  return (
    <div class="w-full min-h-screen flex flex-col">
      <Header icon="leech" />

      {/* Main content */}
      <main class="flex-1 flex items-center justify-center p-4">
        <div class="w-full max-w-xl">
          {/* Loading state */}
          <Show when={state().type === "loading"}>
            <div class="flex flex-col items-center gap-4">
              <Spinner size="lg" message="Connecting to peers..." />
            </div>
          </Show>

          {/* Not found state */}
          <Show when={state().type === "not_found"}>
            <div class="glass-card p-8 text-center animate-scale-in">
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
              <h2 class="text-2xl font-bold text-white mb-2">File Not Found</h2>
              <p class="text-white/60">
                This file may have expired or the link is incorrect.
              </p>
            </div>
          </Show>

          {/* Downloading state */}
          <Show when={state().type === "leeching"}>
            <div class="glass-card p-8 animate-scale-in">
              {(() => {
                const s = state();
                if (s.type !== "leeching") return null;
                return (
                  <>
                    {/* File info header */}
                    <div class="flex items-center gap-4 mb-6">
                      <div class="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        {getFileIcon()}
                      </div>
                      <div class="min-w-0 flex-1">
                        <h2 class="text-lg font-semibold text-white truncate">
                          {s.fileName}
                        </h2>
                        <p class="text-white/50 text-sm">
                          {formatBytes(s.length)}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <ProgressBar
                      label="Downloading"
                      detail={`${formatBytes(s.downloadSpeed, "/s")}`}
                      progress={s.progress}
                      showPeers={true}
                      peers={s.peers}
                    />

                    {/* Stats grid */}
                    <div class="grid grid-cols-3 gap-4 mt-6">
                      <div class="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                        <p class="text-white/50 text-xs mb-1">Downloaded</p>
                        <p class="text-white font-semibold">
                          {formatBytes(s.received)}
                        </p>
                      </div>
                      <div class="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                        <p class="text-white/50 text-xs mb-1">Speed</p>
                        <p class="text-cyan-400 font-semibold">
                          {formatBytes(s.downloadSpeed, "/s")}
                        </p>
                      </div>
                      <div class="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                        <p class="text-white/50 text-xs mb-1">ETA</p>
                        <p class="text-white font-semibold">
                          {calculateETA() ? formatTime(calculateETA()!) : "--"}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </Show>

          {/* Done state */}
          <Show when={state().type === "done"}>
            <div class="glass-card p-8 text-center animate-scale-in">
              {(() => {
                const s = state();
                if (s.type !== "done") return null;
                return (
                  <>
                    <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-400/20 to-cyan-400/20 border border-white/20 flex items-center justify-center">
                      <svg
                        class="w-10 h-10 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">
                      Download Complete!
                    </h2>
                    <p class="text-white/60 mb-6">{s.fileName}</p>
                    <p class="text-white/40 text-sm">
                      Your file has been saved to your downloads folder
                    </p>
                  </>
                );
              })()}
            </div>
          </Show>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Leech;
