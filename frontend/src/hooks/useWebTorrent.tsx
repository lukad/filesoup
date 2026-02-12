import WebTorrent from "webtorrent";
import { createSignal, onCleanup } from "solid-js";

export type TorrentStatus = "idle" | "downloading" | "processing" | "seeding";

const useWebTorrent = () => {
  const client = new WebTorrent();

  const [state, setState] = createSignal<TorrentStatus>("idle");
  const [torrentId, setTorrentId] = createSignal<string>("");
  const [error, setError] = createSignal<string | null>(null);

  const seedFiles = (files: FileList) => {
    setState("processing");
    setError(null);

    client.seed(files, {}, (torrent) => {
      const magnetUri = torrent.magnetURI;

      fetch("/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ magnetUri }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Server responded with ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setTorrentId(data.id);
          setState("seeding");
        })
        .catch((error) => {
          console.error(error);
          setError("Failed to create shareable link. Please try again.");
          setState("idle");
        });
    });
  };

  const addMagnetURI = (magnetUri: string) => {
    return client.add(magnetUri);
  };

  const clearError = () => setError(null);

  onCleanup(() => client.destroy());

  return { state, torrentId, seedFiles, addMagnetURI, error, clearError };
};

export default useWebTorrent;
