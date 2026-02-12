import FileInput from "./FileInput";
import useWebTorrent from "./hooks/useWebTorrent";
import CopyToClipboard from "./CopyToClipboard";
import Spinner from "./Spinner";

function link(id: string) {
  let host = window.location.host;
  let protocol = window.location.protocol;
  return `${protocol}//${host}/${id}`;
}

function Seed() {
  const { state, torrentId, seedFiles } = useWebTorrent();

  const handleFiles = (files: FileList) => {
    seedFiles(files);
  };

  return (
    <div class="flex w-full h-full justify-center items-center">
      {state() === "idle" && <FileInput onFiles={handleFiles} />}
      {state() === "processing" && <Spinner />}
      {state() === "seeding" && <CopyToClipboard content={link(torrentId())} />}
    </div>
  );
}

export default Seed;
