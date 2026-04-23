import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";


import { motion as Motion } from "framer-motion";
import { Building2, CalendarClock, ExternalLink, GraduationCap, Pencil, Sparkles, Trash2, Badge, FileText, User, Clock, Code, Calendar, Mail, AlertTriangle, X } from "lucide-react";
import { Modal, PrimaryButton, EmptyState, Spinner, StatusMessage } from "./ui";
import { DEPARTMENTS, OPPORTUNITY_BROADCAST_ALL } from "../constants/departments";
import { useAuth } from "../context/AuthContext";
import { useOpportunities } from "../context/OpportunitiesContext";
import { getSocket } from "../utils/socket";
import OpportunityTimeline from "./OpportunityTimeline";
import OpportunityAttendance from "./OpportunityAttendance";
import { getApplicantsCount, getApplicants } from "../services/opportunitiesService";

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

const isExpired = (value) => {
  try {
    // ⭐ MATCH BACKEND LOGIC: Compare dates at midnight, not timestamps
    // This ensures opportunities remain active through their entire lastDate
    const lastMidnight = new Date(value);
    lastMidnight.setHours(0, 0, 0, 0); // Normalize to start of day

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0); // Today at midnight

    // Archive only if today is AFTER lastDate (strictly greater-than)
    return todayMidnight > lastMidnight;
  } catch {
    return false;
  }
};

const OpportunityCard = ({
  opportunity,
  className = "",
  canManage = false,
  hasApplied = false,
  onApply = () => {},
  onEdit,
  onDelete,
  editDisabled = false,
  editLoading = false,
  deleteLoading = false,
  applicantCount = null,
}) => {
  const { user } = useAuth();
  const socket = getSocket();
  const { fetchTimeline, invalidateTimelineCache } = useOpportunities();
  const [isOpen, setIsOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [localApplied, setLocalApplied] = useState(hasApplied);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [activeStages, setActiveStages] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsError, setApplicantsError] = useState("");
  const effectiveApplied = localApplied || hasApplied;

  useEffect(() => {
    if (!isOpen || !opportunity?._id || !socket) return;

    // Join opportunity room on modal open
    socket.emit("join:opportunity", { opportunityId: opportunity._id });

    // Cleanup on modal close
    return () => {
      if (socket) {
        socket.emit("leave:opportunity", { opportunityId: opportunity._id });
      }
    };
  }, [isOpen, opportunity?._id, socket]);

  // Listen for activeStages updates via socket and refetch timeline
  useEffect(() => {
    if (!socket) return; // Guard against null socket

    const handleTimelineEntry = ({ activeStages: newActiveStages }) => {
      console.log('[OpportunityCard Socket] timeline:new_entry received with activeStages:', newActiveStages);
      if (opportunity?._id) {

        // Invalidate cache so next fetch gets fresh data
        invalidateTimelineCache(opportunity._id);
        // Then immediately refetch to get updated activeStages
        fetchTimeline(opportunity._id).then((result) => {
          const activeStagesFromFetch = Array.isArray(result?.activeStages) ? result.activeStages : [];
          console.log('[OpportunityCard Socket] Updated activeStages from refetch:', activeStagesFromFetch);
          if (activeStagesFromFetch.length > 0) {
            setActiveStages(activeStagesFromFetch);
          }
        });
      }
    };

    socket.on("timeline:new_entry", handleTimelineEntry);

    return () => {
      socket.off("timeline:new_entry", handleTimelineEntry);
    };
  }, [socket, opportunity?._id, fetchTimeline, invalidateTimelineCache]);

  // Fetch activeStages from timeline when modal opens
  useEffect(() => {
    if (!isOpen || !opportunity?._id) return;

    const fetchActiveStages = async () => {
      try {
        const result = await fetchTimeline(opportunity._id);
        const activeStagesFromFetch = Array.isArray(result?.activeStages) ? result.activeStages : [];
        console.log('[OpportunityCard] Fetched activeStages from timeline context:', activeStagesFromFetch);
        if (activeStagesFromFetch.length >= 0) {
          setActiveStages(activeStagesFromFetch);
        }
      } catch (err) {
        console.error('[OpportunityCard] Failed to fetch timeline:', err);
      }
    };

    fetchActiveStages();
  }, [isOpen, opportunity?._id]);

// Determine if current user should see applicants
  const shouldShowApplicants =
    (user?.role === "admin") ||
    (user?.role === "faculty" && String(opportunity.createdBy) === String(user?._id));

  // Fetch applicants when modal opens (faculty own or admin only)
  useEffect(() => {
    if (!isOpen || !opportunity?._id || !shouldShowApplicants) return;

    const fetchApplicants = async () => {
      setApplicantsLoading(true);
      setApplicantsError("");
      try {
        const data = await getApplicants(opportunity._id);
        setApplicants(Array.isArray(data) ? data : []);
      } catch (err) {
        setApplicantsError(err.message || "Unable to load applicants. Please try again.");
      } finally {
        setApplicantsLoading(false);
      }
    };

    fetchApplicants();
  }, [isOpen, opportunity?._id, shouldShowApplicants]);

  const handleApply = async () => {
    if (applying || effectiveApplied) return;
    setApplying(true);
    setError("");
    try {
      await onApply(opportunity._id);
      setLocalApplied(true);
      setError("");
    } catch (error) {
      console.error("Apply failed:", error);
      setError(error.message || "Failed to apply. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  // Determine which tabs to show based on role
  const getTabs = () => {
    const tabs = ["details", "status-timeline"];
    if (user?.role === "faculty" || user?.role === "admin") {
      tabs.push("attendance");
    }
    if (shouldShowApplicants) {
      tabs.push("applicants");
    }
    return tabs;
  };

  const tabs = getTabs();
  const userRole = user?.role || "student";
  const userId = user?._id;

  // Determine if current user can edit/delete
  const canEditDelete =
    userRole === "admin" ||
    (userRole === "faculty" && String(opportunity.createdBy) === String(userId));

  // Determine if this is owner for faculty
  const isFacultyOwner =
    userRole === "faculty" && String(opportunity.createdBy) === String(userId);

  const archived = opportunity.status === "archived" || isExpired(opportunity.lastDate);
  const isDisabled = archived || effectiveApplied;
  const isStudent = userRole === "student";

  return (
    <>
      <Motion.article
        whileHover={isDisabled ? {} : { y: -4 }}
        onClick={isDisabled ? undefined : () => setIsOpen(true)}
        onKeyDown={isDisabled ? undefined : (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        tabIndex={isDisabled ? undefined : 0}
        role={isDisabled ? undefined : "button"}
        aria-disabled={isDisabled}
        className={`group relative cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white/65 shadow-[0_16px_36px_-22px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all duration-200 hover:shadow-[0_22px_44px_-16px_rgba(99,102,641,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${className}`}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-400" />
        <div className="space-y-3 sm:space-y-4 p-3.5 sm:p-5">
          <div className="flex flex-col xs:flex-row items-start gap-2 xs:gap-3 xs:justify-between">
            <h3 className="clamp-2 text-base sm:text-lg font-semibold leading-6 text-slate-800">{opportunity.announcementHeading}</h3>
            <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 flex-shrink-0">
              <span className="rounded-full border border-indigo-200/80 bg-indigo-50 px-2 xs:px-2.5 py-0.5 xs:py-1 text-xs font-medium text-indigo-700 whitespace-nowrap">
                {opportunity.type}
              </span>
              <span
                className={`rounded-full border px-2 xs:px-2.5 py-0.5 xs:py-1 text-xs font-medium whitespace-nowrap ${
                  archived
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : effectiveApplied
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {archived ? "Archived" : effectiveApplied ? "Applied" : "Active"}
              </span>
            </div>
          </div>

          <p className="clamp-2 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-600">{opportunity.description}</p>

          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-600">
            <p className="flex items-start gap-2">
              <GraduationCap size={14} className="mt-0.5 shrink-0 text-indigo-600 sm:size-4" aria-hidden="true" />
              <span className="min-w-0">
                <span className="font-semibold text-slate-700">Eligibility:</span> <span className="break-words">{toLabel(opportunity.eligibilityCriteria)}</span>
              </span>
            </p>
            <p className="flex items-start gap-2">
              <CalendarClock size={14} className="mt-0.5 shrink-0 text-sky-600 sm:size-4" aria-hidden="true" />
              <span className="min-w-0">
                <span className="font-semibold text-slate-700">Last Date:</span>{" "}
                <span className="break-words">{new Date(opportunity.lastDate).toLocaleDateString()}</span>
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Building2 size={14} className="mt-0.5 shrink-0 text-cyan-600 sm:size-4" aria-hidden="true" />
              <span className="min-w-0">
                <span className="font-semibold text-slate-700">Departments:</span> <span className="break-words">{opportunity.department === OPPORTUNITY_BROADCAST_ALL ? "All Departments" : toLabel(opportunity.department)}</span>
              </span>
            </p>
            {opportunity.technicalSkills && opportunity.technicalSkills.length > 0 && (
              <p className="flex items-start gap-2">
                <Code size={14} className="mt-0.5 shrink-0 text-purple-600 sm:size-4" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="font-semibold text-slate-700">Skills:</span> <span className="break-words">{opportunity.technicalSkills.slice(0, 3).join(", ")}{opportunity.technicalSkills.length > 3 ? ` +${opportunity.technicalSkills.length - 3}` : ""}</span>
                </span>
              </p>
            )}
          </div>

          {/* Show applicant count for faculty/admin */}
          {!isStudent && applicantCount !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-indigo-50/60 px-2.5 sm:px-3 py-1.5 sm:py-2 border border-indigo-200/60">
              <User size={13} className="text-indigo-600 flex-shrink-0 sm:size-4" />
              <span className="text-xs sm:text-sm font-medium text-indigo-700">{applicantCount} Applicant{applicantCount !== 1 ? 's' : ''}</span>
            </div>
          )}

          <PrimaryButton className="w-full text-xs sm:text-sm" onClick={() => setIsOpen(true)}>
            View Details
          </PrimaryButton>
        </div>
        {canManage && canEditDelete ? (
          <div className="pointer-events-none absolute right-2 sm:right-3 top-2 sm:top-3 flex gap-1.5 xs:gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              type="button"
              disabled={editDisabled || editLoading || deleteLoading}
              onClick={(event) => {
                event.stopPropagation();
                if (editDisabled || editLoading || deleteLoading) return;
                onEdit?.(opportunity);
              }}
              className={`pointer-events-auto rounded-lg border bg-white/85 p-1.5 xs:p-2 transition text-xs sm:text-sm ${
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
        {/* Tab Bar */}
        <div className="mb-6 border-b border-slate-200">
          <div className="flex gap-1 -mx-6 px-6">
            {tabs.map((tab) => {
              const tabLabel = {
                "details": "Details",
                "status-timeline": "Status Timeline",
                "attendance": "Attendance",
                "applicants": "Applicants",
              }[tab];

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                    activeTab === tab
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tabLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6 min-h-96">
          {/* Details Tab */}
          {activeTab === "details" && (
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
                      <p className="mt-2 text-sm text-purple-800">{opportunity.createdName || "Not available"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertTriangle size={16} />
                  {error}
                  <button onClick={() => setError("")} className="ml-auto text-red-600 hover:text-red-700">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Action Button - Only for Students */}
              {isStudent && (
                <>
                  {effectiveApplied ? (
                    <PrimaryButton disabled className="w-full bg-emerald-200 text-emerald-700 shadow-none hover:translate-y-0 hover:shadow-none">
                      <span className="flex items-center gap-2 justify-center">
                        ✓ Applied Successfully
                      </span>
                    </PrimaryButton>
                  ) : archived ? (
                    <PrimaryButton disabled className="w-full bg-slate-200 text-slate-500 shadow-none hover:translate-y-0 hover:shadow-none">
                      Archived - Cannot Apply
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton
                      className="w-full"
                      onClick={handleApply}
                      disabled={applying}
                      loading={applying}
                    >
                      <span className="flex items-center gap-2 justify-center">
                        {applying ? "Applying..." : "Apply Now"}
                        <Sparkles size={15} />
                      </span>
                    </PrimaryButton>
                  )}
                </>
              )}
            </div>
          )}

          {/* Status Timeline Tab */}
          {activeTab === "status-timeline" && (
            <OpportunityTimeline
              opportunityId={opportunity._id}
              userRole={userRole}
              activeStages={activeStages}
            />
          )}

          {/* Attendance Tab */}
          {activeTab === "attendance" && (
            <OpportunityAttendance
              opportunityId={opportunity._id}
              activeStages={activeStages}
            />
          )}

          {/* Applicants Tab */}
          {activeTab === "applicants" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">
                  Applicants ({applicants.length})
                </h3>
                <p className="text-sm text-slate-600">
                  Total applications for this opportunity
                </p>
              </div>

              {applicantsLoading ? (
                <div className="py-8 flex justify-center">
                  <Spinner />
                </div>
              ) : applicantsError ? (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <AlertTriangle size={16} />
                  {applicantsError}
                </div>
              ) : applicants.length === 0 ? (
                <EmptyState title="No applicants yet" subtitle="Check back later for applications" />
              ) : (
                <div className="space-y-3">
                  {applicants.map((applicant) => (
                    <div key={applicant._id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-100/50 transition">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">{applicant.student.name}</p>
                            <p className="text-sm text-slate-600">{applicant.student.email}</p>
                            {applicant.student.department && (
                              <p className="text-sm text-slate-500 mt-1">
                                <span className="font-medium">Department:</span> {applicant.student.department}
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded ml-2 flex-shrink-0">
                            {applicant.student.studentId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Applied on {new Date(applicant.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <StatusMessage type="error" message={error} />
      </Modal>
    </>
  );
};

export default OpportunityCard;
