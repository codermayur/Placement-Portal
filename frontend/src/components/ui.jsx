import { useEffect } from "react";
import { motion as Motion } from "framer-motion";
import { Loader2, X } from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export const Spinner = ({ className = "" }) => (
  <Loader2 className={cn("h-5 w-5 animate-spin text-indigo-600", className)} aria-hidden="true" />
);

export const PrimaryButton = ({ children, className = "", loading = false, disabled = false, ...props }) => (
  <Motion.button
    whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
    {...props}
    disabled={disabled || loading}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-500 px-4 py-2.5 font-semibold text-white shadow-[0_14px_30px_-16px_rgba(79,70,229,0.9)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_20px_38px_-18px_rgba(14,165,233,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
      className
    )}
  >
    {loading ? <Spinner className="h-4 w-4 text-white" /> : null}
    {children}
  </Motion.button>
);

export const SectionTitle = ({ title, subtitle, className = "" }) => (
  <div className={cn("space-y-2", className)}>
    <h2 className="text-2xl font-semibold tracking-tight text-transparent bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-500 bg-clip-text md:text-3xl">
      {title}
    </h2>
    {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
  </div>
);

export const StatusMessage = ({ type = "success", message, className = "" }) => {
  if (!message) return null;

  const styles =
    type === "error"
      ? "border-rose-200/90 bg-rose-50/85 text-rose-700"
      : "border-emerald-200/90 bg-emerald-50/85 text-emerald-700";

  return <p className={cn("rounded-2xl border px-4 py-3 text-sm backdrop-blur-sm", styles, className)}>{message}</p>;
};

export const EmptyState = ({ title, subtitle, className = "" }) => (
  <div className={cn("glass-panel flex min-h-44 flex-col items-center justify-center px-6 py-8 text-center", className)}>
    <p className="text-lg font-semibold text-slate-800">{title}</p>
    {subtitle ? <p className="mt-2 max-w-md text-sm text-slate-500">{subtitle}</p> : null}
  </div>
);

export const Modal = ({
  open,
  title,
  subtitle,
  onClose,
  children,
  className = "",
  contentClassName = "",
  closeLabel = "Close modal",
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "Modal"}
      onClick={onClose}
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/35 p-3 backdrop-blur-sm md:p-5",
        className
      )}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="glass-panel flex h-[min(92vh,760px)] w-full max-w-2xl flex-col overflow-hidden"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200/80 bg-white/70 px-5 py-4 backdrop-blur-md">
          <div>
            {title ? <h3 className="text-lg font-semibold text-slate-800">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="rounded-xl border border-slate-200/90 bg-white/80 p-2 text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            <X size={16} />
          </button>
        </header>
        <div className={cn("modal-scrollbar flex-1 overflow-y-auto p-5", contentClassName)}>{children}</div>
      </div>
    </div>
  );
};
