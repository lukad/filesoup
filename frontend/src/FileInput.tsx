import { createSignal } from "solid-js";
import { cloudArrowUp, document } from "solid-heroicons/outline";
import { Icon } from "solid-heroicons";
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

  const getFileIcon = () => {
    const file = selectedFile();
    if (!file) return cloudArrowUp;
    // Could return different icons based on file type
    return document;
  };

  const getDropZoneClass = () => {
    const baseClass =
      "glass-card p-8 sm:p-12 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 border-2";
    if (dragOver()) {
      return `${baseClass} border-purple-500 bg-purple-500/20 scale-105`;
    }
    return `${baseClass} border-dashed border-white/20 hover:border-purple-400/50 hover:bg-white/5`;
  };

  return (
    <div class="w-full h-full flex flex-col items-center justify-center p-4">
      <div
        class={getDropZoneClass()}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
      >
        {/* Icon container with animation */}
        <div
          class={`relative ${dragOver() ? "animate-pulse" : "animate-float"}`}
        >
          <div class="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full blur-2xl opacity-30" />
          <div class="relative bg-gradient-to-br from-purple-500/20 to-cyan-400/20 rounded-2xl p-6 border border-white/20">
            <Icon path={getFileIcon()} class="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Text content */}
        <div class="text-center space-y-2">
          <h3 class="text-2xl font-bold text-white">
            {selectedFile() ? "File Selected!" : "Drop your file here"}
          </h3>
          <p class="text-white/60 text-sm">
            {selectedFile()
              ? `${selectedFile()!.name} (${formatBytes(selectedFile()!.size)})`
              : "or click to browse • Any file type supported"}
          </p>
        </div>

        {/* Hidden file input */}
        <input type="file" ref={fileInput} onChange={onChange} class="hidden" />
      </div>

      {/* Feature hints */}
      <div class="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div class="glass-card p-4">
          <div class="text-2xl mb-2">⚡</div>
          <div class="text-sm font-medium text-white">Instant</div>
          <div class="text-xs text-white/50">No waiting, just share</div>
        </div>
        <div class="glass-card p-4">
          <div class="text-2xl mb-2">🔒</div>
          <div class="text-sm font-medium text-white">Private</div>
          <div class="text-xs text-white/50">Your files never touch a server</div>
        </div>
        <div class="glass-card p-4">
          <div class="text-2xl mb-2">∞</div>
          <div class="text-sm font-medium text-white">Simple</div>
          <div class="text-xs text-white/50">Drag, drop, done</div>
        </div>
      </div>
    </div>
  );
}

export default FileInput;
