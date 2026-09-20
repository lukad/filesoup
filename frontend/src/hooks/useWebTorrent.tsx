import WebTorrent from "webtorrent";
import { batch, createSignal, onCleanup } from "solid-js";
import { summarizeFiles, trackEvent } from "../analytics";
import { afterPaint } from "../utils/afterPaint";

export type TorrentStatus = "idle" | "downloading" | "processing" | "seeding";
export type PreparationProgress = {
  phase: "starting" | "reading" | "finalizing" | "publishing";
  processedBytes: number;
  totalBytes: number;
};

// WebTorrent passes this create-torrent option through, but its older type
// definitions don't include the byte-level hashing progress callback.
type SeedOptions = WebTorrent.TorrentOptions & {
  onProgress: (processedBytes: number, totalBytes: number) => void;
};

const useWebTorrent = () => {
  const client = new WebTorrent();
  const [state, setState] = createSignal<TorrentStatus>("idle");
  const [torrentId, setTorrentId] = createSignal<string>("");
  const [error, setError] = createSignal<string | null>(null);
  const [preparation, setPreparation] = createSignal<PreparationProgress>({
    phase: "starting",
    processedBytes: 0,
    totalBytes: 0,
  });

  let disposed = false;
  let attempt = 0;
  let cancelStart: (() => void) | undefined;
  let request: AbortController | undefined;
  let pendingTorrent: WebTorrent.Torrent | undefined;

  const failSeed = (
    cause: unknown,
    stage: "prepare_file" | "create_link",
    currentAttempt: number,
  ) => {
    if (disposed || currentAttempt !== attempt || state() !== "processing")
      return;
    // Invalidate any late progress or completion callbacks from this attempt.
    attempt++;
    request?.abort();
    pendingTorrent?.destroy();
    pendingTorrent = undefined;
    console.error("Failed to prepare shared file:", cause);
    trackEvent("share_link_failed", { stage });
    batch(() => {
      setError(
        stage === "prepare_file"
          ? "Couldn't prepare this file. Please choose it again and try once more."
          : "Failed to create shareable link. Please try again.",
      );
      setState("idle");
    });
  };

  client.on("error", (cause) => failSeed(cause, "prepare_file", attempt));

  const seedFiles = (files: FileList) => {
    // A drop's FileList is only available during the event. Keep File references
    // before deferring work; this does not read the files into memory.
    const selectedFiles = Array.from(files);
    if (selectedFiles.length === 0 || disposed || state() === "processing")
      return;
    const currentAttempt = ++attempt;
    const isCurrent = () => !disposed && currentAttempt === attempt;
    let lastProgressUpdate = -Infinity;

    batch(() => {
      setPreparation({
        phase: "starting",
        processedBytes: 0,
        totalBytes: selectedFiles.reduce((sum, file) => sum + file.size, 0),
      });
      setError(null);
      setState("processing");
    });

    // Let the browser paint the preparation UI before hashing a large file.
    cancelStart = afterPaint(() => {
      if (!isCurrent()) return;
      const options: SeedOptions = {
        onProgress: (processedBytes, totalBytes) => {
          if (!isCurrent()) return;
          const now = performance.now();
          const complete = processedBytes >= totalBytes;
          // Hashing can report hundreds of pieces per second. Keep UI updates
          // inexpensive while always delivering the last progress update.
          if (!complete && now - lastProgressUpdate < 100) return;
          lastProgressUpdate = now;
          setPreparation({
            phase: complete ? "finalizing" : "reading",
            processedBytes,
            totalBytes,
          });
        },
      };

      try {
        pendingTorrent = client.seed(selectedFiles, options, (torrent) => {
          if (!isCurrent()) return;
          setPreparation((progress) => ({ ...progress, phase: "publishing" }));
          request = new AbortController();
          fetch("/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ magnetUri: torrent.magnetURI }),
            signal: request.signal,
          })
            .then((res) => {
              if (!res.ok)
                throw new Error(`Server responded with ${res.status}`);
              return res.json();
            })
            .then((data) => {
              if (!isCurrent()) return;
              pendingTorrent = undefined;
              batch(() => {
                setTorrentId(data.id);
                setState("seeding");
              });
              trackEvent("share_link_ready", summarizeFiles(selectedFiles));
            })
            .catch((cause) => failSeed(cause, "create_link", currentAttempt));
        });
        pendingTorrent.once("metadata", () => {
          if (!isCurrent()) return;
          // Also covers empty files, which have no hashing progress callbacks.
          setPreparation((progress) => ({
            ...progress,
            phase: "finalizing",
            processedBytes: progress.totalBytes,
          }));
        });
        pendingTorrent.on("error", (cause) =>
          failSeed(cause, "prepare_file", currentAttempt),
        );
      } catch (cause) {
        failSeed(cause, "prepare_file", currentAttempt);
      }
    });
  };

  const addMagnetURI = (magnetUri: string) => client.add(magnetUri);
  const clearError = () => setError(null);

  onCleanup(() => {
    disposed = true;
    cancelStart?.();
    request?.abort();
    client.destroy();
  });

  return {
    state,
    torrentId,
    seedFiles,
    addMagnetURI,
    error,
    clearError,
    preparation,
  };
};

export default useWebTorrent;
