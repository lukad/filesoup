import { SoupMark } from "./Illustrations";

export default function Header(props: { icon: "seed" | "leech" }) {
  return (
    <header class="site-header">
      <div class="wordmark" aria-label="FileSoup">
        <span class="brand-mark">
          <SoupMark />
        </span>
        <span>
          file<span class="wordmark-light">soup</span>
          <span class="brand-period">.</span>
        </span>
      </div>
      <div class="header-note">
        <span class="status-dot" />
        <span>
          {props.icon === "seed"
            ? "Peer-to-peer file sharing"
            : "Direct to your browser"}
        </span>
      </div>
    </header>
  );
}
