/** Give immediate feedback a full paint before starting expensive file work. */
export function afterPaint(callback: () => void): () => void {
  let finished = false;
  let task: ReturnType<typeof setTimeout> | undefined;
  let frame: number | undefined;

  const cancel = () => {
    finished = true;
    if (frame !== undefined) cancelAnimationFrame(frame);
    clearTimeout(task);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
  const run = () => {
    if (finished) return;
    cancel();
    callback();
  };
  const onVisibilityChange = () => {
    // Animation frames pause in background tabs. If the user switches away,
    // keep preparing without depending on another frame to start the work.
    if (document.hidden && !finished) {
      if (frame !== undefined) cancelAnimationFrame(frame);
      clearTimeout(task);
      task = setTimeout(run, 0);
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  if (document.hidden) {
    onVisibilityChange();
  } else {
    // rAF runs BEFORE paint. Waiting for the second frame leaves a complete
    // paint opportunity in between, with the loading indicator fully visible.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        task = setTimeout(run, 0);
      });
    });
  }
  return cancel;
}
