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
      margin: 2,
      width: 320,
      color: {
        dark: "#18191b",
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
      showToast("Link copied", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast("Couldn’t copy the link. Select it and copy it by hand.", "error");
    }
  };

  const share = async () => {
    try {
      await navigator.share({
        title: props.fileName
          ? `Download ${props.fileName}`
          : "Download shared file",
        text: props.fileName
          ? `Download ${props.fileName} with FileSoup`
          : "Download this shared file with FileSoup",
        url: props.content,
      });
      trackEvent("share_link_shared", {
        method: "native_share",
      });
      showToast("Link shared", "success");
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === "AbortError" || err.name === "NotAllowedError")
      ) {
        return;
      }
      showToast("Couldn’t open the share sheet", "error");
    }
  };

  return (
    <div class="transfer-card share-card">
      <h2>Your link is ready</h2>
      <p class="muted">
        Send it to whoever needs the file, or let them scan the QR code. It
        works for as long as this tab stays open.
      </p>
      <Show when={props.fileName}>
        <div class="file-row">
          <Glyph name="file" />
          <span class="file-name" title={props.fileName}>
            {props.fileName}
          </span>
          <span class="file-ready">
            <Glyph name="check" />
            <span class="sr-only">Ready</span>
          </span>
        </div>
      </Show>
      <div class="share-link-box">
        <label class="field-label" for="share-url">
          Share link
        </label>
        <div class="link-field">
          <input
            id="share-url"
            class="share-url"
            type="text"
            readOnly
            value={props.content}
            title={props.content}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            onClick={copy}
            class={`button button-primary copy-button ${copied() ? "is-copied" : ""}`}
          >
            <Icon path={copied() ? check : clipboard} class="icon" />
            <span aria-live="polite">{copied() ? "Copied" : "Copy link"}</span>
          </button>
        </div>
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
      <Show when={showQrCode()}>
        <div class="qr-panel" id="share-qr-code">
          <div class="qr-frame">
            <Show
              when={qrCodeUrl()}
              fallback={
                <p role="status" class="qr-status">
                  {qrCodeFailed() ? "QR code unavailable" : "Generating…"}
                </p>
              }
            >
              <img
                src={qrCodeUrl()}
                alt="QR code for the share link"
                width="160"
                height="160"
              />
            </Show>
          </div>
          <p>Point a phone camera at it to open the link there.</p>
        </div>
      </Show>
      <p class="card-note">
        Keep this tab open until they’ve finished downloading.
      </p>
    </div>
  );
}

export default ShareLink;
