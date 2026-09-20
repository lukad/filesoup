import { createEffect, createSignal, Show, onCleanup } from "solid-js";
import useWebTorrent from "./hooks/useWebTorrent";
import { useParams } from "@solidjs/router";
import ProgressBar from "./ProgressBar";
import Spinner from "./Spinner";
import PageLayout from "./PageLayout";
import { Glyph } from "./Illustrations";
import { summarizeDownload, trackEvent } from "./analytics";

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
  | { type: "error"; message: string }
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
  const [downloadStartedTracked, setDownloadStartedTracked] =
    createSignal(false);
  const [downloadCompletedTracked, setDownloadCompletedTracked] =
    createSignal(false);
  const [downloadNotFoundTracked, setDownloadNotFoundTracked] =
    createSignal(false);
  const [downloadErrorTracked, setDownloadErrorTracked] = createSignal(false);

  // Clean up blob URL on component unmount
  onCleanup(() => {
    const url = blobUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
  });

  createEffect(() => {
    setState({ type: "loading" });
    setMagnetUri(null);
    setTorrentAdded(false);
    setDownloadStartedTracked(false);
    setDownloadCompletedTracked(false);
    setDownloadNotFoundTracked(false);
    setDownloadErrorTracked(false);
    fetch(`/files/${params.id}`)
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else if (res.status === 404) {
          setState({ type: "not_found" });
          throw new Error("File not found");
        }
        throw new Error(`Unexpected status: ${res.status}`);
      })
      .then((data) => {
        setMagnetUri(data.magnetUri);
      })
      .catch((error) => {
        console.error("Failed to fetch file info:", error);
        if (state().type === "loading") {
          setState({
            type: "error",
            message: "Failed to load file. Please try again.",
          });
        }
      });
  });

  createEffect(() => {
    const magnet = magnetUri();
    if (magnet && !torrentAdded()) {
      setTorrentAdded(true);
      const torrent = addMagnetURI(magnet);

      torrent.on("download", () => {
        if (!downloadStartedTracked() && torrent.progress > 0) {
          trackEvent(
            "download_started",
            summarizeDownload(torrent.name, torrent.length),
          );
          setDownloadStartedTracked(true);
        }

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
          if (!downloadStartedTracked()) {
            trackEvent(
              "download_started",
              summarizeDownload(torrent.name, torrent.length),
            );
            setDownloadStartedTracked(true);
          }
          if (!downloadCompletedTracked()) {
            trackEvent(
              "download_completed",
              summarizeDownload(torrent.name, torrent.length),
            );
            setDownloadCompletedTracked(true);
          }
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

  createEffect(() => {
    const currentState = state();

    if (currentState.type === "error" && !downloadErrorTracked()) {
      trackEvent("download_lookup_failed", {
        reason: "request_failed",
      });
      setDownloadErrorTracked(true);
    }

    if (currentState.type === "not_found" && !downloadNotFoundTracked()) {
      trackEvent("download_lookup_failed", {
        reason: "not_found",
      });
      setDownloadNotFoundTracked(true);
    }
  });

  const calculateETA = () => {
    const s = state();
    if (s.type !== "leeching") return null;
    if (s.downloadSpeed === 0) return null;
    const remaining = s.length - s.received;
    return remaining / s.downloadSpeed;
  };

  return (
    <PageLayout mode="leech">
      <Show when={state().type === "loading"}>
        <div class="transfer-card state-card" role="status">
          <Spinner size="lg" />
          <h2>Connecting to the sender…</h2>
          <p class="muted">Your download will start automatically.</p>
          <p class="state-footnote">
            The sender needs to keep their tab open, too.
          </p>
        </div>
      </Show>
      <Show when={state().type === "not_found"}>
        <div class="transfer-card state-card" role="alert">
          <div class="state-icon state-icon-error">
            <Glyph name="info" />
          </div>
          <h2>This link is unavailable.</h2>
          <p class="muted">
            The link may have expired or be incorrect. Ask the sender for a
            new one.
          </p>
          <p class="state-footnote">
            Links expire after 10 minutes of inactivity.
          </p>
        </div>
      </Show>
      <Show when={state().type === "error"}>
        <div class="transfer-card state-card" role="alert">
          <div class="state-icon state-icon-error">
            <Glyph name="info" />
          </div>
          <h2>Couldn’t get that file.</h2>
          <p class="muted">
            {(() => {
              const s = state();
              return s.type === "error" ? s.message : "";
            })()}
          </p>
        </div>
      </Show>
      <Show when={state().type === "leeching"}>
        <div class="transfer-card download-card">
          {(() => {
            const s = state();
            if (s.type !== "leeching") return null;
            return (
              <>
                <div class="card-topline">
                  <h2>Downloading your file…</h2>
                  <Glyph name="download" />
                </div>
                <div class="file-row">
                  <Glyph name="file" />
                  <span title={s.fileName}>{s.fileName}</span>
                  <span class="file-size">{formatBytes(s.length)}</span>
                </div>
                <ProgressBar
                  label="Downloading"
                  detail={formatBytes(s.downloadSpeed, "/s")}
                  progress={s.progress}
                  showPeers={true}
                  peers={s.peers}
                />
                <dl class="download-stats">
                  <div>
                    <dt>RECEIVED</dt>
                    <dd>{formatBytes(s.received)}</dd>
                  </div>
                  <div>
                    <dt>TOTAL SIZE</dt>
                    <dd>{formatBytes(s.length)}</dd>
                  </div>
                  <div>
                    <dt>TIME LEFT</dt>
                    <dd>
                      {calculateETA() ? formatTime(calculateETA()!) : "—"}
                    </dd>
                  </div>
                </dl>
                <p class="state-footnote">
                  Keep this tab open until the download finishes.
                </p>
              </>
            );
          })()}
        </div>
      </Show>
      <Show when={state().type === "done"}>
        <div class="transfer-card state-card" role="status">
          {(() => {
            const s = state();
            if (s.type !== "done") return null;
            return (
              <>
                <div class="state-icon state-icon-success">
                  <Glyph name="check" />
                </div>
                <h2>Download complete.</h2>
                <p class="muted">
                  Find your file in your browser’s downloads.
                </p>
                <div class="file-row">
                  <Glyph name="file" />
                  <span title={s.fileName}>{s.fileName}</span>
                  <span class="file-ready">
                    <Glyph name="check" />
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      </Show>
    </PageLayout>
  );
}

export default Leech;
