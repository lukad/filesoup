import { trackEvent } from "./analytics";

export default function Footer() {
  return (
    <footer class="py-4 px-4 text-center text-white/30 text-sm">
      <p>
        Powered by WebTorrent • No servers, just P2P •{" "}
        <a
          href="https://github.com/lukad/filesoup"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-white/60 transition-colors"
          onClick={() => trackEvent("github_link_clicked", { location: "footer" })}
        >
          GitHub
        </a>
      </p>
    </footer>
  );
}
