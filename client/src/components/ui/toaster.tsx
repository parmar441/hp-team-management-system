import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (options: Omit<Toast, "id">) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />,
  error: <XCircle className="w-5 h-5 flex-shrink-0 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />,
  info: <Info className="w-5 h-5 flex-shrink-0 text-blue-500" />,
};

const leftBorder: Record<ToastType, string> = {
  success: "border-l-emerald-500",
  error: "border-l-red-500",
  warning: "border-l-amber-500",
  info: "border-l-blue-500",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const duration = toast.duration ?? (toast.type === "error" ? 6000 : 4000);
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [dismiss, toast.duration, toast.type]);

  return (
    <div
      className={`flex items-start gap-3 bg-white rounded-2xl border border-gray-200 border-l-4 shadow-elevated px-4 py-3.5 w-full max-w-[360px] pointer-events-auto transition-all duration-300 ease-out ${leftBorder[toast.type]} ${visible && !leaving ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      role="alert"
      aria-live="assertive"
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-gray-900 mb-0.5">{toast.title}</p>
        )}
        <p className={`text-sm text-gray-600 leading-snug ${!toast.title ? "font-medium" : ""}`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={dismiss}
        className="flex-shrink-0 p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors -mr-1 -mt-0.5"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((options: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev.slice(-3), { ...options, id }]);
  }, []);

  const ctx: ToastContextValue = {
    toast: addToast,
    success: (message, title) => addToast({ type: "success", message, title }),
    error: (message, title) => addToast({ type: "error", message, title }),
    warning: (message, title) => addToast({ type: "warning", message, title }),
    info: (message, title) => addToast({ type: "info", message, title }),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2.5 items-end pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
