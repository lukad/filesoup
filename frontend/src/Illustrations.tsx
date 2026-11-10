export function SoupMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 11.5h19a9.5 9.5 0 0 1-19 0Z" fill="currentColor" />
      <path
        d="M8 3.5v4M12 2.5v5M16 3.5v4"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  );
}

type GlyphName =
  | "arrow-up"
  | "file"
  | "check"
  | "info"
  | "download"
  | "tray-up";

export function Glyph(props: { name: GlyphName; class?: string }) {
  const paths: Record<GlyphName, string> = {
    "arrow-up": "M12 19V5m-6 6 6-6 6 6",
    file: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8m-8 4h5",
    check: "m5 12 4 4L19 6",
    info: "M12 8h.01M12 11v6M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4",
    "tray-up": "M12 15V3m-5 5 5-5 5 5M3 14v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5",
  };
  return (
    <svg
      class={props.class || "icon"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={paths[props.name]} />
    </svg>
  );
}
