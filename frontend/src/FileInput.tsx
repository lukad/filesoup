import { Show, createSignal } from "solid-js";
import { DropIllustration, Glyph, SharingStamp } from "./Illustrations";
import { summarizeFiles, trackEvent } from "./analytics";

function formatBytes(bytes: number): string {
  if (bytes < 1e3) return `${bytes} B`;
  if (bytes < 1e6) return `${(bytes / 1e3).toFixed(1)} KB`;
  if (bytes < 1e9) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e9).toFixed(1)} GB`;
}

interface FileInputProps {
  onFiles: (files: FileList) => void;
}

function FileInput(props: FileInputProps) {
  const [dragOver, setDragOver] = createSignal(false);
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
  let fileInput: HTMLInputElement | undefined;

  const onChange = (e: Event) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      trackEvent("files_selected", {
        source: "browse",
        ...summarizeFiles(files),
      });
      props.onFiles(files);
    }
  };

  const onDragEnter = (e: Event) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragOver = (e: Event) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (e: DragEvent) => {
    // Only clear drag over if we're actually leaving the drop zone
    const target = e.currentTarget as HTMLElement;
    if (!target.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  };

  const onDrop = (e: Event) => {
    e.preventDefault();
    setDragOver(false);
    const files = (e as DragEvent).dataTransfer?.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      trackEvent("files_selected", {
        source: "drop",
        ...summarizeFiles(files),
      });
      props.onFiles(files);
    }
  };

  const onClick = () => {
    if (!fileInput) return;
    fileInput.click();
  };

  return (
    <div class="upload-area">
      <div
        class="drop-mat"
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <button
          type="button"
          class={`drop-zone ${dragOver() ? "is-dragging" : ""}`}
          onClick={onClick}
          aria-label="Choose a file or drop it here"
          aria-describedby="file-input-hint"
        >
          <SharingStamp />
          <DropIllustration />
          <span class="drop-title" aria-live="polite">
            {dragOver()
              ? "Release to add the file."
              : selectedFile()
                ? "File selected."
                : "Your file goes here."}
          </span>
          <Show
            when={selectedFile()}
            fallback={
              <span class="drop-description">
                Drag it in or choose a file from your device.
              </span>
            }
          >
            {(file) => (
              <span class="drop-description">
                {file().name} ({formatBytes(file().size)})
              </span>
            )}
          </Show>
          <span class="button button-primary choose-file">
            <Glyph name="arrow-up" /> Choose a file
          </span>
          <span class="drop-file-types">
            Documents, photos, videos, ZIPs. Any file type works.
          </span>
        </button>
      </div>
      <input
        type="file"
        ref={fileInput}
        onChange={onChange}
        class="hidden"
        aria-label="Choose a file"
      />
      <p class="under-card-note" id="file-input-hint">
        <span class="small-asterisk" aria-hidden="true">
          ✳
        </span>{" "}
        Keep both tabs open until the download finishes.
      </p>
    </div>
  );
}

export default FileInput;
