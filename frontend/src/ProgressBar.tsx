function ProgressBar({
  label,
  detail,
  progress,
}: {
  label: string;
  detail: string;
  progress: number;
}) {
  return (
    <>
      <div class="w-full flex justify-between mb-1">
        <span class="text-base font-medium"> {label} </span>
        <span class="text-sm font-medium"> {detail} </span>
        <span class="text-sm font-medium"> {`${progress}%`} </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div
          class="bg-gray-600 h-2.5 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </>
  );
}

export default ProgressBar;
