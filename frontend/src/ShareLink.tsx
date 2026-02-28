import { createSignal } from "solid-js";
import { Icon } from "solid-heroicons";
import { clipboard, check } from "solid-heroicons/outline";
import { useToast } from "./Toast";

interface CopyToClipboardProps {
  content: string;
  fileName?: string;
}

function ShareLink(props: CopyToClipboardProps) {
  const [copied, setCopied] = createSignal(false);
  const { showToast } = useToast();
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(props.content);
      setCopied(true);
      showToast("Link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast("Failed to copy link", "error");
    }
  };

  const share = async () => {
    try {
      await navigator.share({
        title: props.fileName
          ? `Download ${props.fileName}`
          : "Download shared file",
        text: props.fileName
          ? `Download ${props.fileName} with Filesoup`
          : "Download this shared file with Filesoup",
        url: props.content,
      });
      showToast("Share dialog opened", "success");
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === "AbortError" || err.name === "NotAllowedError")
      ) {
        return;
      }
      showToast("Failed to share link", "error");
    }
  };

  return (
    <div class="flex flex-col items-center gap-6 animate-scale-in max-w-2xl w-full px-4">
      {/* Success message */}
      <div
        class={`flex items-center gap-2 text-green-400 transition-all duration-300 ${
          copied() ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <Icon path={check} class="w-5 h-5" />
        <span class="font-medium">Ready to share!</span>
      </div>

      {/* Main card */}
      <div class="glass-card p-8 w-full">
        {/* Header */}
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400/20 to-cyan-400/20 border border-white/20 mb-4">
            <svg
              class="w-8 h-8 text-green-400"
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
          <h2 class="text-2xl font-bold text-white mb-2">File is ready!</h2>
          <p class="text-white/60">
            Your file has been seeded and is ready to share
          </p>
          {props.fileName && (
            <p class="text-white/40 text-sm mt-1">{props.fileName}</p>
          )}
        </div>

        {/* Link display */}
        <div class="bg-black/30 rounded-xl p-4 mb-4 border border-white/10">
          <p class="text-white/80 text-sm font-mono overflow-hidden whitespace-nowrap text-ellipsis">
            {props.content}
          </p>
        </div>

        {/* Share actions */}
        <div class="flex flex-col gap-3 sm:flex-row">
          {canShare && (
            <button
              onClick={share}
              class="w-full flex items-center justify-center gap-3 font-medium px-6 py-4 rounded-xl transition-all duration-300 bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:scale-105 active:scale-95"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.684 13.342C8.882 13.12 9 12.827 9 12.5s-.118-.62-.316-.842m0 1.684a3 3 0 10-4.368 0m4.368 0a3 3 0 104.264 4.2m-4.264-4.2l6.632 3.316m0 0a3 3 0 103.42-5.317m-3.42 5.317a3 3 0 010-5.317m0 0l-6.632-3.316"
                />
              </svg>
              Share Link
            </button>
          )}
          <button
            onClick={copy}
            class={`w-full flex items-center justify-center gap-3 font-medium px-6 py-4 rounded-xl transition-all duration-300 ${
              copied()
                ? "bg-green-500 text-white"
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95"
            }`}
          >
            {copied() ? (
              <>
                <Icon path={check} class="w-6 h-6" />
                Copied!
              </>
            ) : (
              <>
                <Icon path={clipboard} class="w-6 h-6" />
                {canShare ? "Copy Link" : "Copy Download Link"}
              </>
            )}
          </button>
        </div>

        {/* Helper text */}
        <p class="text-center text-white/40 text-sm mt-4">
          {canShare
            ? "Share directly or copy the link to send it anywhere"
            : "Share this link with anyone to let them download your file"}
        </p>
      </div>

      {/* Additional info */}
      <div class="glass-card p-4 w-full">
        <div class="flex items-start gap-3">
          <div class="text-yellow-400 mt-0.5">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm text-white/70">
              <span class="font-semibold text-white/90">
                Keep this page open
              </span>{" "}
              to continue seeding. The faster your connection, the faster others
              can download.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShareLink;
