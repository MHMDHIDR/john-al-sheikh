import { toast } from "sonner";
import { Error, Loading, Success } from "@/components/custom/icons";
import type { ToastT } from "sonner";

type ToastType = "success" | "error" | "loading";

type ToastStyles = {
  backgroundColor: string;
  color: string;
  border: string;
};

type ToastFunctions = {
  success: (message: string, options?: Omit<ToastT, "message">) => void;
  error: (message: string, options?: Omit<ToastT, "message">) => void;
  loading: (message: string, options?: Omit<ToastT, "message">) => void;
};

const toastStyles: Record<ToastType, ToastStyles> = {
  success: {
    backgroundColor: "#F0FAF0",
    color: "#367E18",
    border: "1px solid #367E18",
  },
  error: {
    backgroundColor: "#FDE7E7",
    color: "#C53030",
    border: "1px solid #C53030",
  },
  loading: {
    backgroundColor: "#F0F4FF",
    color: "#3B82F6",
    border: "1px solid #3B82F6",
  },
};

/**
 * Custom Toast Hook
 * @returns {
 *          success: (message: string, options?: Omit<ToastT, "message">) => void;
 *          error: (message: string, options?: Omit<ToastT, "message">) => void;
 *          loading : (message: string, options?: Omit<ToastT, "message">) => void;
 *        } - Toast functions
 */
export function useToast(): ToastFunctions {
  const showToast = (message: string, type: ToastType, options?: Omit<ToastT, "message">) => {
    const Icon = type === "success" ? Success : type === "error" ? Error : Loading;

    const toastContent = (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Icon className="w-5 h-5" />
        <span>{message}</span>
      </div>
    );

    toast(toastContent, {
      ...options,
      style: { ...toastStyles[type], gap: "1.5rem" },
      className: "ltr rtl:rtl rtl:text-right select-none",
      position: "bottom-center",
      duration: 3000,
    });
  };

  return {
    success: (message: string, options?: Omit<ToastT, "message">) =>
      showToast(message, "success", options),
    error: (message: string, options?: Omit<ToastT, "message">) =>
      showToast(message, "error", options),
    loading: (message: string, options?: Omit<ToastT, "message">) =>
      showToast(message, "loading", options),
  };
}
