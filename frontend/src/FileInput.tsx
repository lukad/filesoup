import { createSignal } from "solid-js";
import { arrowUpTray } from "solid-heroicons/outline";
import { Icon } from "solid-heroicons";

function FileInput(props: { onFiles: (files: FileList) => void }) {
  const [dragOver, setDragOver] = createSignal(false);
  let fileInput: HTMLInputElement | undefined;

  const onChange = (e: Event) => {
    props.onFiles((e.target as HTMLInputElement).files!);
  };

  const onDragEnter = (e: Event) => {
    e.preventDefault();
  };

  const onDragOver = (e: Event) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => {
    setDragOver(false);
  };

  const onDrop = (e: Event) => {
    e.preventDefault();
    setDragOver(false);
    props.onFiles((e as DragEvent).dataTransfer!.files);
  };

  const onClick = () => {
    if (!fileInput) return;
    fileInput.click();
  };

  const classList = () => (dragOver() ? "border-gray-400" : "");

  return (
    <div
      class="select-none w-full h-full p-2 sm:p-4 flex justify-center items-center"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDragEnd={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
    >
      <div
        class={`border-4 border-dashed rounded p-2 sm:p-4 w-96 max-w-full h-96 max-h-full flex gap-2 justify-center items-center ${classList()}`}
      >
        <Icon path={arrowUpTray} class="h-6" />
        <span>Drag a file here</span>
        <input
          type="file"
          ref={fileInput}
          onChange={onChange}
          class="hidden"
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

export default FileInput;
