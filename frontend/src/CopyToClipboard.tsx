import Button from "./Button";
import { Icon } from "solid-heroicons";
import { clipboard } from "solid-heroicons/outline";

function CopyToClipboard(props: { content: string }) {
  const copy = () => navigator.clipboard.writeText(props.content);

  return (
    <div class="flex flex-col w-auto p-2 sm:p-4">
      <Button onClick={copy}>
        <Icon path={clipboard} class="h-6" />
        Copy Download Link
      </Button>
    </div>
  );
}

export default CopyToClipboard;
