import { trackEvent } from "./analytics";

export default function Footer() {
  return (
    <footer class="site-footer">
      <span>Runs on WebTorrent</span>
      <a
        class="text-link"
        href="https://github.com/lukad/filesoup"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackEvent("github_link_clicked", { location: "footer" })
        }
      >
        Source on GitHub
      </a>
    </footer>
  );
}
