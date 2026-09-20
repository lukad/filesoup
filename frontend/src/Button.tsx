import { ParentComponent } from "solid-js";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  onClick: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  class?: string;
}

const Button: ParentComponent<ButtonProps> = (props) => {
  const baseClass = "button";
  const variantClasses: Record<ButtonVariant, string> = {
    primary: "button-primary",
    secondary: "button-secondary",
    ghost: "button-ghost",
  };

  return (
    <button
      type="button"
      class={`${baseClass} ${variantClasses[props.variant || "primary"]} ${props.class || ""}`}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
};

export default Button;
