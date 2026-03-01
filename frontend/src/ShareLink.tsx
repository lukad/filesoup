import { Show, createEffect, createSignal, onCleanup } from "solid-js";
import { Icon } from "solid-heroicons";
import {
  clipboard,
  check,
  qrCode,
  share as shareIcon,
} from "solid-heroicons/outline";
import * as QRCode from "qrcode";
import { useToast } from "./Toast";
import { trackEvent } from "./analytics";

interface CopyToClipboardProps {
  content: string;
  fileName?: string;
}

function ShareLink(props: CopyToClipboardProps) {
  const [copied, setCopied] = createSignal(false);
  const [showQrCode, setShowQrCode] = createSignal(false);
  const [qrCodeUrl, setQrCodeUrl] = createSignal("");
  const [qrCodeFailed, setQrCodeFailed] = createSignal(false);
  const { showToast } = useToast();
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  createEffect(() => {
    if (!showQrCode()) {
      return;
    }

    const content = props.content;
    let cancelled = false;

    setQrCodeUrl("");
    setQrCodeFailed(false);

    void QRCode.toDataURL(content, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
      color: {
        dark: "#e2e8f0",
        light: "#00000000",
      },
    })
      .then((url) => {
        if (!cancelled) {
          setQrCodeUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrCodeFailed(true);
        }
      });

    onCleanup(() => {
      cancelled = true;
    });
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(props.content);
      trackEvent("share_link_copied", {
        has_native_share: canShare,
      });
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
      trackEvent("share_link_shared", {
        method: "native_share",
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
      <div class="glass-card p-6 sm:p-8 w-full">
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

        <div class="flex flex-col gap-4 mb-4">
          <div class="bg-black/30 rounded-xl p-4 border border-white/10">
            <p class="text-white/50 text-xs uppercase tracking-[0.2em] mb-2">
              Share link
            </p>
            <p class="text-white/80 text-sm font-mono whitespace-normal [overflow-wrap:anywhere]">
              {props.content}
            </p>
            <div class="mt-4 border-t border-white/10 pt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={copy}
                class={`w-full md:w-auto md:min-w-[154px] md:shrink-0 flex items-center justify-center gap-3 font-medium px-4 py-3 rounded-xl transition-all duration-300 ${
                  copied()
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                }`}
              >
                {copied() ? (
                  <>
                    <Icon path={check} class="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Icon path={clipboard} class="w-5 h-5" />
                    Copy Link
                  </>
                )}
              </button>
              <p class="text-white/40 text-sm md:max-w-md">
                Copy the link if you want to paste it into chat, email, or
                messages.
              </p>
            </div>
          </div>

          <Show when={showQrCode()}>
            <div class="bg-black/30 rounded-xl border border-white/10 p-4">
              <div class="mx-auto w-full max-w-[220px] sm:max-w-[260px]">
                <div class="aspect-square rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-center overflow-hidden">
                  <Show
                    when={qrCodeUrl()}
                    fallback={
                      <p class="text-center text-sm text-white/50 px-4">
                        {qrCodeFailed()
                          ? "QR code unavailable"
                          : "Generating QR code..."}
                      </p>
                    }
                  >
                    <img
                      src={qrCodeUrl()}
                      alt="QR code for the share link"
                      class="h-full w-full object-contain"
                    />
                  </Show>
                </div>
              </div>
              <p class="text-center text-white/50 text-xs mt-3">
                Scan to open on another device
              </p>
            </div>
          </Show>
        </div>

        {/* Share actions */}
        <div class="flex flex-col gap-3 sm:flex-row">
          {canShare && (
            <button
              onClick={share}
              class="w-full flex items-center justify-center gap-3 font-medium px-6 py-4 rounded-xl transition-all duration-300 bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:scale-105 active:scale-95"
            >
              <Icon path={shareIcon} class="w-6 h-6" />
              Share Link
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowQrCode((visible) => !visible)}
            class="w-full flex items-center justify-center gap-3 font-medium px-6 py-4 rounded-xl transition-all duration-300 bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:scale-105 active:scale-95"
          >
            <Icon path={qrCode} class="w-6 h-6" />
            {showQrCode() ? "Hide QR Code" : "Show QR Code"}
          </button>
        </div>

        {/* Helper text */}
        <p class="text-center text-white/40 text-sm mt-4">
          {canShare
            ? "Share directly or open a QR code for another device"
            : "Open a QR code or copy the link to send it anywhere"}
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
