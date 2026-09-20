interface ProgressBarProps {
  label: string;
  detail: string;
  progress: number;
  showPeers?: boolean;
  peers?: number;
}

function ProgressBar(props: ProgressBarProps) {
  const progressPercent = () =>
    Math.max(0, Math.min(100, Math.round(props.progress * 100)));

  return (
    <div class="transfer-progress">
      <div class="progress-heading">
        <span>{props.label}</span>
        <strong>
          {progressPercent()}
          <span>%</span>
        </strong>
      </div>
      <div
        class="progress-track"
        role="progressbar"
        aria-label={props.label}
        aria-valuenow={progressPercent()}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div class="progress-fill" style={{ width: `${progressPercent()}%` }} />
      </div>
      <div class="progress-meta">
        <span>
          {props.showPeers && (
            <>
              <span class="status-dot" /> {props.peers || 0}{" "}
              {(props.peers || 0) === 1 ? "peer connected" : "peers connected"}
            </>
          )}
        </span>
        <span>{props.detail}</span>
      </div>
    </div>
  );
}

export default ProgressBar;
