export function HandUnderline() {
  return (
    <svg
      class="hand-underline"
      viewBox="0 0 220 20"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M4 11c49-9 125-10 211-5M15 17c53-7 122-8 179-5"
        stroke="currentColor"
        stroke-width="2.3"
        stroke-linecap="round"
      />
    </svg>
  );
}

export function SharingStamp() {
  const points = Array.from({ length: 48 }, (_, i) => {
    const angle = (i * Math.PI) / 24;
    const radius = i % 2 === 0 ? 57 : 51;
    return `${60 + Math.cos(angle) * radius},${60 + Math.sin(angle) * radius}`;
  }).join(" ");

  return (
    <span class="sharing-stamp" aria-hidden="true">
      <svg viewBox="0 0 120 120" fill="none">
        <polygon points={points} fill="currentColor" />
        <circle
          cx="60"
          cy="60"
          r="44"
          stroke="var(--ink)"
          stroke-width=".75"
          opacity=".45"
        />
      </svg>
      <span class="stamp-type">
        <span>100%</span>
        <strong>
          PEER
          <br />
          TO PEER
        </strong>
        <span>✳</span>
      </span>
    </span>
  );
}

export function SoupMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M6 21h28c-1 9-6 13-14 13S7 30 6 21Z" fill="currentColor" />
      <path
        d="M5 21h30M14 37h12"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      />
      <path
        d="M14 15c-5-5 5-6 0-11m7 11c-5-5 5-6 0-11m7 11c-5-5 5-6 0-11"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  );
}

export function DropIllustration() {
  return (
    <svg
      class="drop-illustration"
      viewBox="0 0 240 172"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="120"
        cy="151"
        rx="78"
        ry="8"
        fill="currentColor"
        opacity=".06"
      />
      <g class="floating-file">
        <rect
          x="77"
          y="21"
          width="66"
          height="79"
          rx="5"
          transform="rotate(-14 77 21)"
          fill="var(--green-soft)"
          stroke="currentColor"
          stroke-width="1.6"
        />
        <path
          d="m137 13 25 25-7 66a5 5 0 0 1-5 4l-58-6a5 5 0 0 1-4-6l8-80a5 5 0 0 1 6-4l35 1Z"
          fill="var(--butter)"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
        <path
          d="m137 13-2 21 27 4M107 53l34 4m-35 7 25 3"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="m115 79 5 6 6-5m-5-12-1 17"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <path
        d="M54 106h132c-5 29-27 43-66 43s-61-14-66-43Z"
        fill="currentColor"
        stroke="currentColor"
        stroke-width="1.8"
      />
      <path
        d="M49 106h142M98 151h44"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M70 118c3 8 8 13 16 16"
        stroke="var(--surface)"
        stroke-width="1.6"
        stroke-linecap="round"
      />
      <g class="bowl-face" fill="var(--surface)">
        <circle cx="109" cy="122" r="2" />
        <circle cx="131" cy="122" r="2" />
        <path
          d="M114 129q6 6 12 0"
          fill="none"
          stroke="var(--surface)"
          stroke-width="1.7"
          stroke-linecap="round"
        />
      </g>
      <path
        d="m48 64-6 2m145 10 6 3m-13-36 5-5M60 37l-4-5"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
  );
}

type GlyphName =
  "arrow-up" | "arrow-right" | "file" | "check" | "info" | "download";

export function Glyph(props: { name: GlyphName; class?: string }) {
  const paths: Record<GlyphName, string> = {
    "arrow-up": "M12 19V5m-6 6 6-6 6 6",
    "arrow-right": "M5 12h14m-6-6 6 6-6 6",
    file: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8m-8 4h5",
    check: "m5 12 4 4L19 6",
    info: "M12 8h.01M12 11v6M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4",
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
