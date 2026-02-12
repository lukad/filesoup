import { ParentComponent } from "solid-js";

const Button: ParentComponent<{ onClick: () => void }> = (props) => {
  return (
    <button
      type="button"
      class="p-2 flex gap-2 items-center border border-gray rounded shadow bg-gray-50 hover:bg-gray-200 active:bg-gray-100"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};

export default Button;
