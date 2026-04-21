import { useState } from "react";
import { motion as Motion } from "framer-motion";
import { Building2, CalendarClock, ExternalLink, GraduationCap, Pencil, Sparkles, Trash2, Badge, FileText, User, Clock, Code } from "lucide-react";
import { Modal, PrimaryButton } from "./ui";
import { DEPARTMENTS, OPPORTUNITY_BROADCAST_ALL } from "../constants/departments";

const toLabel = (value) => {
  if (!value) return "Not specified";
  if (value === OPPORTUNITY_BROADCAST_ALL) return "All Departments";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const getDepartmentList = (department) => {
  if (department === OPPORTUNITY_BROADCAST_ALL) return DEPARTMENTS;
  if (Array.isArray(department)) return department;
  if (typeof department === "string") {
    return department.split(",").map((d) => d.trim()).filter(Boolean);
  }
  return [];
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
                <span className="font-semibold text-slate-700">Departments:</span> {opportunity.department === OPPORTUNITY_BROADCAST_ALL ? "All Departments" : toLabel(opportunity.department)}
              </span>
            </p>
            {opportunity.technicalSkills && opportunity.technicalSkills.length > 0 && (
              <p className="flex items-start gap-2">
                <Code size={16} className="mt-0.5 shrink-0 text-purple-600" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-slate-700">Skills:</span> {opportunity.technicalSkills.slice(0, 3).join(", ")}{opportunity.technicalSkills.length > 3 ? ` +${opportunity.technicalSkills.length - 3}` : ""}
                </span>
              </p>
            )}
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
        subtitle=""
      >
        <div className="space-y-6 text-slate-700">
          {/* Opportunity Type Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
              opportunity.type === "Internship"
                ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200"
                : opportunity.type === "Full-Time"
                ? "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200"
                : opportunity.type === "Contract"
                ? "bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border border-orange-200"
                : "bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-700 border border-indigo-200"
            }`}>
              <Badge size={16} />
              {opportunity.type}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              archived
                ? "bg-rose-100 text-rose-700 border border-rose-200"
                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
            }`}>
              <span className={`inline-block h-2 w-2 rounded-full ${archived ? "bg-rose-500" : "bg-emerald-500"}`}></span>
              {archived ? "Archived" : "Active"}
            </span>
          </div>

          {/* Description Card */}
          <div className="space-y-2">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-slate-100/80 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start gap-3">
                <FileText size={20} className="shrink-0 text-slate-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800 mb-2">Description</h4>
                  <p className="leading-7 text-slate-700">{opportunity.description || "No description provided."}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Information Cards Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Eligibility Card - Indigo Theme */}
            <div className="group rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/60 to-indigo-100/40 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-100 p-2">
                  <GraduationCap size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-indigo-900">Eligibility</p>
                  <p className="mt-2 text-sm text-indigo-800 leading-6">{toLabel(opportunity.eligibilityCriteria)}</p>
                </div>
              </div>
            </div>

            {/* Last Date Card - Orange/Warning Theme */}
            <div className="group rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-50/60 to-orange-100/40 p-5 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-orange-100 p-2">
                  <CalendarClock size={18} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-orange-900">Application Deadline</p>
                  <p className="mt-2 text-sm text-orange-800 font-medium">{new Date(opportunity.lastDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}</p>
                  <p className="text-xs text-orange-700 mt-1">
                    {Math.ceil((new Date(opportunity.lastDate) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                  </p>
                </div>
              </div>
            </div>

            {/* Departments Card - Cyan Theme (Full Width) */}
            <div className="md:col-span-2 group rounded-2xl border border-cyan-200/60 bg-gradient-to-br from-cyan-50/60 to-cyan-100/40 p-5 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-cyan-100 p-2">
                  <Building2 size={18} className="text-cyan-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-cyan-900">Eligible Departments</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getDepartmentList(opportunity.department).map((dept, idx) => (
                      <span key={idx} className="rounded-full px-3 py-1.5 bg-cyan-200/60 text-cyan-800 text-xs font-medium border border-cyan-300/50">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Skills Card - Purple Theme (Full Width) */}
            {opportunity.technicalSkills && opportunity.technicalSkills.length > 0 ? (
              <div className="md:col-span-2 group rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50/60 to-purple-100/40 p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <Code size={18} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-purple-900">Required Technical Skills</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {opportunity.technicalSkills.map((skill, idx) => (
                        <span key={idx} className="rounded-full px-3 py-1.5 bg-purple-200/60 text-purple-800 text-xs font-medium border border-purple-300/50">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Updated Card - Slate Theme */}
            <div className="group rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50/60 to-slate-100/40 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <Clock size={18} className="text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">Last Updated</p>
                  <p className="mt-2 text-sm text-slate-700">{opportunity.updatedAt ? new Date(opportunity.updatedAt).toLocaleString() : "Not available"}</p>
                </div>
              </div>
            </div>

            {/* Created By Card - Purple Theme */}
            <div className="group rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50/60 to-purple-100/40 p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <User size={18} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-purple-900">Posted By</p>
                  <p className="mt-2 text-sm text-purple-800">{opportunity.createdBy || "Not available"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {archived ? (
            <PrimaryButton disabled className="w-full bg-slate-200 text-slate-500 shadow-none hover:translate-y-0 hover:shadow-none">
              Archived
            </PrimaryButton>
          ) : opportunity.applicationLink ? (
            <a href={opportunity.applicationLink} target="_blank" rel="noreferrer" aria-label="Open application link in new tab">
              <PrimaryButton className="w-full" onClick={() => setIsOpen(false)}>
                <Sparkles size={15} />
                Apply Now
                <ExternalLink size={14} />
              </PrimaryButton>
            </a>
          ) : (
            <PrimaryButton disabled className="w-full">
              No Application Link Available
            </PrimaryButton>
          )}
        </div>
      </Modal>
    </>
  );
};

export default OpportunityCard;
