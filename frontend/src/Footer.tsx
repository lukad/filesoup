import { trackEvent } from "./analytics";

export default function Footer() {
  return (
    <footer class="site-footer">
      <div class="footer-links">
        <span>Made with WebTorrent</span>
        <a
          href="https://github.com/lukad/filesoup"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent("github_link_clicked", { location: "footer" })
          }
        >
          GitHub <span aria-hidden="true">↗</span>
        </a>
      </div>
    </footer>
  );
}
