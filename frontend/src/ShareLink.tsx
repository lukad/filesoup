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
import { Glyph } from "./Illustrations";

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
      margin: 4,
      width: 320,
      color: {
        dark: "#263c32",
        light: "#ffffff",
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
    <div class="share-area">
      <div class="transfer-card share-card">
        <div class="card-topline">
          <span class="status-label">
            <span class="status-dot" /> Ready to share
          </span>
        </div>
        <h2>Your link is ready.</h2>
        <p class="muted">
          Copy the link and send it over, or let the other person scan the QR
          code.
        </p>
        <Show when={props.fileName}>
          <div class="file-row">
            <Glyph name="file" />
            <span title={props.fileName}>{props.fileName}</span>
            <span class="file-ready">
              <Glyph name="check" />
            </span>
          </div>
        </Show>
        <div class="share-controls" classList={{ "has-qr": showQrCode() }}>
          <div class="share-link-actions">
            <div class="share-link-box">
              <p class="field-label">YOUR SHARE LINK</p>
              <p class="share-url" title={props.content}>
                {props.content}
              </p>
              <button
                type="button"
                onClick={copy}
                class={`button button-primary copy-button ${copied() ? "is-copied" : ""}`}
              >
                <Icon path={copied() ? check : clipboard} class="icon" />
                <span aria-live="polite">{copied() ? "Copied!" : "Copy link"}</span>
              </button>
            </div>
            <div class="share-actions">
              <Show when={canShare}>
                <button
                  type="button"
                  onClick={share}
                  class="button button-secondary"
                >
                  <Icon path={shareIcon} class="icon" /> Share link
                </button>
              </Show>
              <button
                type="button"
                onClick={() => setShowQrCode((visible) => !visible)}
                class="button button-secondary"
                aria-expanded={showQrCode()}
                aria-controls="share-qr-code"
              >
                <Icon path={qrCode} class="icon" />{" "}
                {showQrCode() ? "Hide QR code" : "Show QR code"}
              </button>
            </div>
          </div>
          <Show when={showQrCode()}>
            <div class="qr-panel" id="share-qr-code">
              <Show
                when={qrCodeUrl()}
                fallback={
                  <p role="status" class="muted">
                    {qrCodeFailed()
                      ? "QR code unavailable"
                      : "Generating QR code..."}
                  </p>
                }
              >
                <img
                  src={qrCodeUrl()}
                  alt="QR code for the share link"
                  width="220"
                  height="220"
                />
              </Show>
              <p>Scan to open on another device.</p>
            </div>
          </Show>
        </div>
      </div>
      <div class="keep-open-note">
        <Glyph name="info" />
        <p>
          <strong>Keep both tabs open</strong> until the download finishes.
        </p>
      </div>
    </div>
  );
}

export default ShareLink;
