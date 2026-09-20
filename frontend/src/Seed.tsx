import FileInput from "./FileInput";
import useWebTorrent from "./hooks/useWebTorrent";
import ShareLink from "./ShareLink";
import Preparation from "./Preparation";
import PageLayout from "./PageLayout";
import { Glyph } from "./Illustrations";
import { Show, createSignal } from "solid-js";
import { trackEvent } from "./analytics";

function link(id: string) {
  let host = window.location.host;
  let protocol = window.location.protocol;
  return `${protocol}//${host}/${id}`;
}

function Seed() {
  const { state, torrentId, seedFiles, error, clearError, preparation } =
    useWebTorrent();
  const [fileName, setFileName] = createSignal<string>("");

  const handleFiles = (files: FileList) => {
    clearError();
    if (files.length > 0) {
      setFileName(files[0].name);
    }
    seedFiles(files);
  };

  return (
    <PageLayout mode="seed">
      <Show when={!error() && state() === "idle"}>
        <FileInput onFiles={handleFiles} />
      </Show>
      <Show when={state() === "processing"}>
        <Preparation fileName={fileName()} progress={preparation()} />
      </Show>
      <Show when={error()}>
        <div class="transfer-card state-card" role="alert">
          <div class="state-icon state-icon-error">
            <Glyph name="info" />
          </div>
          <h2>Couldn’t prepare your file.</h2>
          <p class="muted">{error()}</p>
          <button
            onClick={() => {
              trackEvent("seed_error_retry");
              clearError();
              setFileName("");
            }}
            class="button button-primary"
          >
            Try again <Glyph name="arrow-right" />
          </button>
        </div>
      </Show>
      <Show when={state() === "seeding"}>
        <ShareLink content={link(torrentId())} fileName={fileName()} />
      </Show>
    </PageLayout>
  );
}

export default Seed;
