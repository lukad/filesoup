import { createEffect, createSignal } from "solid-js";
import useWebTorrent from "./hooks/useWebTorrent";
import { useParams } from "@solidjs/router";
import ProgressBar from "./ProgressBar";

function downloadBlobUrl(name: string, blobUrl: string) {
  let a = document.createElement("a");
  a.setAttribute("download", name);
  a.setAttribute("href", blobUrl);
  const root = document.querySelector("#root");
  if (root) {
    root.appendChild(a);
    a.click();
    root.removeChild(a);
  }
}

function formatBytes(bytes: number, suffix = "") {
  let num = bytes;
  let unit = "B";
  if (bytes < 1e6) {
    num = bytes / 1e3;
    unit = "KB";
  } else if (bytes < 1e9) {
    num = bytes / 1e6;
    unit = "MB";
  } else if (bytes < 1e12) {
    num = bytes / 1e9;
    unit = "GB";
  }

  return `${num.toFixed(2)} ${unit}${suffix}`;
}

type Leeching = {
  type: "leeching";
  downloadSpeed: number;
  received: number;
  progress: number;
};

type State =
  | Leeching
  | { type: "loading" }
  | { type: "not_found" }
  | { type: "done" };

function Leech() {
  const params = useParams();

  const {
    state: _torrentState,
    torrentId: _a,
    seedFiles: _b,
    addMagnetURI,
  } = useWebTorrent();
  const [state, setState] = createSignal<State>({ type: "loading" });
  const [magnetUri, setMagnetUri] = createSignal<string | null>(null);

  createEffect(() => {
    setState({ type: "loading" });
    let request = new XMLHttpRequest();
    request.open("GET", `/files/${params.id}`);
    request.send("");
    request.addEventListener("load", () => {
      if (request.status === 200) {
        let response = JSON.parse(request.response);
        setMagnetUri(response.magnetUri);
      } else if (request.status === 404) {
        setState({ type: "not_found" });
      }
    });
  });

  createEffect(() => {
    const magnet = magnetUri();
    if (magnet) {
      let torrent = addMagnetURI(magnet);
      torrent.on("download", () => {
        setState({
          type: "leeching",
          downloadSpeed: torrent.downloadSpeed,
          received: torrent.received,
          progress: torrent.progress,
        });
      });
      torrent.on("done", () => {
        torrent.files[0].blob().then((blob) => {
          setState({ type: "done" });
          const blobUrl = URL.createObjectURL(blob);
          downloadBlobUrl(torrent.name, blobUrl);
        });
      });
    }
  });

  return (
    <div class="p-2 sm:p-4 w-96 max-w-full h-96 max-h-full flex flex-col justify-center items-center">
      {(() => {
        const s = state();
        switch (s.type) {
          case "loading":
            return <span>Loading</span>;
          case "leeching":
            return (
              <ProgressBar
                label="Downloading"
                detail={formatBytes(s.downloadSpeed, "/s")}
                progress={s.progress}
              />
            );
          case "not_found":
            return <span>Not Found</span>;
          case "done":
            return <span>Done</span>;
        }
      })()}
    </div>
  );
}

export default Leech;
