import { ParentComponent } from "solid-js";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  onClick: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  class?: string;
}

const Button: ParentComponent<ButtonProps> = (props) => {
  const baseClass =
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 px-6 py-3 rounded-xl",
    secondary:
      "bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:scale-105 active:scale-95 px-6 py-3 rounded-xl",
    ghost:
      "bg-transparent hover:bg-white/10 text-white/80 hover:text-white px-4 py-2 rounded-lg",
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
