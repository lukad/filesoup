import WebTorrent from "webtorrent";
import { createSignal, onCleanup } from "solid-js";

export type TorrentStatus = "idle" | "downloading" | "processing" | "seeding";

const useWebTorrent = () => {
  const client = new WebTorrent();

  const [state, setState] = createSignal<TorrentStatus>("idle");
  const [torrentId, setTorrentId] = createSignal<string>("");

  const seedFiles = (files: FileList) => {
    setState("processing");

    client.seed(files, {}, (torrent) => {
      const magnetUri = torrent.magnetURI;

      fetch("/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ magnetUri }),
      })
        .then((res) => res.json())
        .then((data) => {
          setTorrentId(data.id);
          setState("seeding");
        })
        .catch((error) => {
          console.error(error);
        });
    });
  };

  const addMagnetURI = (magnetUri: string) => {
    return client.add(magnetUri);
  };

  onCleanup(() => client.destroy());

  return { state, torrentId, seedFiles, addMagnetURI };
};

export default useWebTorrent;
