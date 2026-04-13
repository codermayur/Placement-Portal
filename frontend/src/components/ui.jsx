import { motion as Motion } from "framer-motion";

export const Spinner = () => (
  <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
);

export const EmptyState = ({ title, subtitle }) => (
  <div className="glass-panel flex min-h-44 flex-col items-center justify-center px-6 py-8 text-center">
    <p className="text-lg font-semibold text-black">{title}</p>
    <p className="mt-2 max-w-md text-sm text-gray-500">{subtitle}</p>
  </div>
);

export const StatusMessage = ({ type = "info", message }) => {
  if (!message) return null;
  const base = "rounded-xl border px-4 py-3 text-sm";
  if (type === "error") return <p className={`${base} border-rose-200 bg-rose-50 text-rose-700`}>{message}</p>;
  return <p className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}>{message}</p>;
};

export const PrimaryButton = ({ children, className = "", loading, ...props }) => (
  <Motion.button
    whileTap={{ scale: 0.98 }}
    {...props}
    className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2.5 font-medium text-white shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:from-indigo-500 hover:to-indigo-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
  >
    {loading ? <Spinner /> : null}
    {children}
  </Motion.button>
);

export const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-semibold text-black">{title}</h2>
    {subtitle ? <p className="mt-2 text-sm text-gray-600">{subtitle}</p> : null}
  </div>
);
