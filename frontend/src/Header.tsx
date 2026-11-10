import { SoupMark } from "./Illustrations";

export default function Header() {
  return (
    <header class="site-header">
      <div class="wordmark">
        <span class="brand-mark">
          <SoupMark />
        </span>
        <span>filesoup</span>
      </div>
    </header>
  );
}
