import { useState } from "react";
import { motion as Motion } from "framer-motion";
import { Building2, CalendarClock, ExternalLink, GraduationCap, Pencil, Sparkles, Trash2 } from "lucide-react";
import { Modal, PrimaryButton } from "./ui";

const toLabel = (value) => {
  if (!value) return "Not specified";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const isExpired = (value) => new Date(value).getTime() < Date.now();

const OpportunityCard = ({
  opportunity,
  className = "",
  canManage = false,
  onEdit,
  onDelete,
  editDisabled = false,
  editLoading = false,
  deleteLoading = false,
}) => {
  const archived = opportunity.status === "archived" || isExpired(opportunity.lastDate);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Motion.article
        whileHover={{ y: -8 }}
        onClick={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        tabIndex={0}
        role="button"
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white/65 shadow-[0_16px_36px_-22px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all duration-200 hover:shadow-[0_22px_44px_-16px_rgba(99,102,241,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${className}`}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-400" />
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="clamp-2 text-lg font-semibold leading-6 text-slate-800">{opportunity.announcementHeading}</h3>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-indigo-200/80 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                {opportunity.type}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  archived
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {archived ? "Archived" : "Active"}
              </span>
            </div>
          </div>

          <p className="clamp-2 text-sm leading-6 text-slate-600">{opportunity.description}</p>

          <div className="space-y-2 text-sm text-slate-600">
            <p className="flex items-start gap-2">
              <GraduationCap size={16} className="mt-0.5 shrink-0 text-indigo-600" aria-hidden="true" />
              <span>
                <span className="font-semibold text-slate-700">Eligibility:</span> {toLabel(opportunity.eligibilityCriteria)}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <CalendarClock size={16} className="mt-0.5 shrink-0 text-sky-600" aria-hidden="true" />
              <span>
                <span className="font-semibold text-slate-700">Last Date:</span>{" "}
                {new Date(opportunity.lastDate).toLocaleDateString()}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Building2 size={16} className="mt-0.5 shrink-0 text-cyan-600" aria-hidden="true" />
              <span>
                <span className="font-semibold text-slate-700">Departments:</span> {toLabel(opportunity.department)}
              </span>
            </p>
          </div>

          <PrimaryButton className="w-full" onClick={(event) => event.stopPropagation()}>
            View Details
          </PrimaryButton>
        </div>
        {canManage ? (
          <div className="pointer-events-none absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              type="button"
              disabled={editDisabled || editLoading || deleteLoading}
              onClick={(event) => {
                event.stopPropagation();
                if (editDisabled || editLoading || deleteLoading) return;
                onEdit?.(opportunity);
              }}
              className={`pointer-events-auto rounded-lg border bg-white/85 p-2 transition ${
                editDisabled || editLoading || deleteLoading
                  ? "cursor-not-allowed border-slate-200 text-slate-300"
                  : "border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
              }`}
              aria-label="Edit opportunity"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              disabled={editLoading || deleteLoading}
              onClick={(event) => {
                event.stopPropagation();
                if (editLoading || deleteLoading) return;
                onDelete?.(opportunity);
              }}
              className={`pointer-events-auto rounded-lg border bg-white/85 p-2 transition ${
                editLoading || deleteLoading
                  ? "cursor-not-allowed border-slate-200 text-slate-300"
                  : "border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-600"
              }`}
              aria-label="Delete opportunity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : null}
      </Motion.article>
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={opportunity.announcementHeading}
        subtitle={opportunity.type ? `Opportunity Type: ${opportunity.type}` : ""}
      >
        <div className="space-y-5 text-slate-700">
          <p className="leading-7">{opportunity.description || "No description provided."}</p>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-800">Eligibility</p>
              <p className="mt-1 text-slate-600">{toLabel(opportunity.eligibilityCriteria)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-800">Last Date</p>
              <p className="mt-1 text-slate-600">{new Date(opportunity.lastDate).toLocaleDateString()}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
              <p className="font-semibold text-slate-800">Departments</p>
              <p className="mt-1 text-slate-600">{toLabel(opportunity.department)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-800">Updated</p>
              <p className="mt-1 text-slate-600">
                {opportunity.updatedAt ? new Date(opportunity.updatedAt).toLocaleString() : "Not available"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-800">Created By</p>
              <p className="mt-1 text-slate-600">{opportunity.createdBy || "Not available"}</p>
            </div>
          </div>
          {archived ? (
            <PrimaryButton disabled className="w-full bg-slate-200 text-slate-500 shadow-none hover:translate-y-0 hover:shadow-none">
              Archived
            </PrimaryButton>
          ) : (
            <a href={opportunity.applicationLink} target="_blank" rel="noreferrer" aria-label="Open application link in new tab">
              <PrimaryButton className="w-full" onClick={() => setIsOpen(false)}>
                <Sparkles size={15} />
                Apply Now
                <ExternalLink size={14} />
              </PrimaryButton>
            </a>
          )}
        </div>
      </Modal>
    </>
  );
};

export default OpportunityCard;
