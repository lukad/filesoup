import { createContext, createSignal, onCleanup, useContext } from "solid-js";
import { createStore, produce } from "solid-js/store";
import {
  checkCircle,
  xCircle,
  informationCircle,
} from "solid-heroicons/outline";
import { Icon } from "solid-heroicons";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose?: () => void;
}

interface ToastItem {
  id: number;
  props: ToastProps;
}

const icons = {
  success: checkCircle,
  error: xCircle,
  info: informationCircle,
};

const iconColors = {
  success: "text-green-400",
  error: "text-red-400",
  info: "text-cyan-400",
};

const bgColors = {
  success: "border-green-500/30 bg-green-500/10",
  error: "border-red-500/30 bg-red-500/10",
  info: "border-cyan-500/30 bg-cyan-500/10",
};

// Context type
interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

// Create context
const ToastContext = createContext<ToastContextType>();

// Provider component
export function ToastProvider(props: { children: any }) {
  const [toasts, setToasts] = createStore<ToastItem[]>([]);
  let nextId = 0;

  const showToast = (
    message: string,
    type: ToastType = "info",
    duration?: number,
  ) => {
    const id = nextId++;
    const toast: ToastItem = {
      id,
      props: { message, type, duration, onClose: () => removeToast(id) },
    };
    setToasts(produce((toasts) => toasts.push(toast)));
  };

  const removeToast = (id: number) => {
    setToasts(produce((toasts) => {
      const index = toasts.findIndex((t) => t.id === id);
      if (index !== -1) {
        toasts.splice(index, 1);
      }
    }));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {props.children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

// Hook to use toast context
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function Toast(props: ToastProps) {
  const [visible, setVisible] = createSignal(true);

  const close = () => {
    setVisible(false);
    setTimeout(() => props.onClose?.(), 300);
  };

  const timeout = setTimeout(close, props.duration || 3000);
  onCleanup(() => clearTimeout(timeout));

  return (
    <div
      class={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${bgColors[props.type]} ${
        visible() ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <Icon
        path={icons[props.type]}
        class={`w-6 h-6 ${iconColors[props.type]}`}
      />
      <span class="text-white font-medium">{props.message}</span>
      <button
        onClick={close}
        class="ml-2 text-white/50 hover:text-white transition-colors"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

function ToastContainer(props: { toasts: ToastItem[] }) {
  return (
    <div class="fixed top-0 right-0 z-50 p-4 flex flex-col gap-2 pointer-events-none">
      {props.toasts.map((toast) => (
        <div class="pointer-events-auto">
          <Toast {...toast.props} />
        </div>
      ))}
    </div>
  );
}

export default Toast;
