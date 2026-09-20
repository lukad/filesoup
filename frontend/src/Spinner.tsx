interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

function Spinner(props: SpinnerProps) {
  return (
    <div class="spinner-group" role={props.message ? "status" : undefined}>
      <span
        class={`spinner spinner-${props.size || "lg"}`}
        aria-hidden="true"
      />
      {props.message && <p class="muted">{props.message}</p>}
    </div>
  );
}

export default Spinner;
