import { Show } from "solid-js";
import type { PreparationProgress } from "./hooks/useWebTorrent";
import { Glyph } from "./Illustrations";
import ProgressBar from "./ProgressBar";
import Spinner from "./Spinner";

function formatBytes(bytes: number) {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  if (bytes < 1_000_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
}

export default function Preparation(props: {
  fileName: string;
  progress: PreparationProgress;
}) {
  const starting = () => props.progress.phase === "starting";
  const reading = () => props.progress.phase === "reading";
  const progress = () =>
    props.progress.totalBytes > 0
      ? props.progress.processedBytes / props.progress.totalBytes
      : reading()
        ? 0
        : 1;

  return (
    <div class="transfer-card preparation-card">
      <div class="card-topline">
        <h2>{starting() ? "File selected." : "Getting your file ready…"}</h2>
        <Show when={!starting()}>
          <Spinner size="sm" />
        </Show>
      </div>
      <p class="muted">
        Larger files take longer to prepare. Your share link will appear here
        when it’s ready.
      </p>
      <div class="file-row">
        <Glyph name="file" />
        <span title={props.fileName}>{props.fileName}</span>
        <span class="file-size">{formatBytes(props.progress.totalBytes)}</span>
      </div>
      <Show
        when={starting()}
        fallback={
          <>
            <ProgressBar
              label={reading() ? "Preparing your file" : "File prepared"}
              detail={`${formatBytes(props.progress.processedBytes)} of ${formatBytes(props.progress.totalBytes)}`}
              progress={progress()}
            />
            <Show when={!reading()}>
              <div class="preparation-next-step" role="status" aria-live="polite">
                <span class="preparation-pulse" aria-hidden="true" />
                <p>
                  {props.progress.phase === "publishing"
                    ? "Creating your share link…"
                    : "Finishing preparation…"}
                </p>
              </div>
            </Show>
          </>
        }
      >
        <div class="preparation-starting" role="status">
          <Spinner size="lg" />
          <div>
            <strong>Getting ready…</strong>
            <p>
              We’re opening your file. Progress will appear as soon as it’s
              available.
            </p>
          </div>
        </div>
      </Show>
      <p class="state-footnote">
        Your file stays in your browser. Keep this tab open.
      </p>
    </div>
  );
}
