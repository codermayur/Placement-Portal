import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { PrimaryButton } from "./ui";
import { DEPARTMENTS, OPPORTUNITY_BROADCAST_ALL } from "../constants/departments";
import SKILLS_BY_DEPARTMENT from "../constants/skillsByDepartment";

const departmentOptions = DEPARTMENTS;
const yearOptions = ["First Year", "Second Year", "Third Year", "Masters"];

const parseToArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    if (!value.trim()) return [];
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const OpportunityForm = ({
  value,
  onChange,
  onSubmit,
  submitLabel = "Submit",
  showDepartment = true,
  departmentLocked = false,
  loading = false,
  isEditing = false,
  onCancelEdit,
}) => {
  const today = new Date().toISOString().split("T")[0];
  const [showDepartmentPanel, setShowDepartmentPanel] = useState(false);
  const [showEligibilityPanel, setShowEligibilityPanel] = useState(false);
  const [customSkill, setCustomSkill] = useState("");
  const departmentRef = useRef(null);
  const eligibilityRef = useRef(null);

  const selectedDepartments = useMemo(() => {
    if (value.department === OPPORTUNITY_BROADCAST_ALL) return [...departmentOptions];
    return parseToArray(value.department);
  }, [value.department]);

  const availableSkills = useMemo(() => {
    if (value.department === OPPORTUNITY_BROADCAST_ALL) {
      const allSkills = new Set();
      DEPARTMENTS.forEach((dept) => {
        const deptSkills = SKILLS_BY_DEPARTMENT[dept] || [];
        deptSkills.forEach((skill) => allSkills.add(skill));
      });
      return Array.from(allSkills).sort();
    }
    const depts = parseToArray(value.department);
    const allSkills = new Set();
    depts.forEach((dept) => {
      const deptSkills = SKILLS_BY_DEPARTMENT[dept] || [];
      deptSkills.forEach((skill) => allSkills.add(skill));
    });
    return Array.from(allSkills).sort();
  }, [value.department]);

  const selectedSkills = useMemo(() => {
    return Array.isArray(value.technicalSkills) ? value.technicalSkills : [];
  }, [value.technicalSkills]);

  const selectedYears = useMemo(() => parseToArray(value.eligibilityCriteria), [value.eligibilityCriteria]);

  useEffect(() => {
    const handler = (event) => {
      if (departmentRef.current && !departmentRef.current.contains(event.target)) setShowDepartmentPanel(false);
      if (eligibilityRef.current && !eligibilityRef.current.contains(event.target)) setShowEligibilityPanel(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pushNext = (nextValue) => onChange({ ...value, ...nextValue });

  const toggleDepartment = (dept) => {
    if (departmentLocked) return;

    let next;
    if (value.department === OPPORTUNITY_BROADCAST_ALL) {
      // If currently all, deselect all and select this one
      next = [dept];
    } else {
      const current = parseToArray(value.department);
      const has = current.includes(dept);
      next = has ? current.filter((item) => item !== dept) : [...current, dept];
    }

    if (next.length === departmentOptions.length) {
      pushNext({ department: OPPORTUNITY_BROADCAST_ALL });
    } else {
      pushNext({ department: next.join(", ") });
    }
  };

  const toggleAllDepartments = () => pushNext({ department: OPPORTUNITY_BROADCAST_ALL });

  const toggleEligibility = (year) => {
    const has = selectedYears.includes(year);
    const next = has ? selectedYears.filter((item) => item !== year) : [...selectedYears, year];
    pushNext({ eligibilityCriteria: next });
  };

  const handleRemoveSkill = (skill) => {
    const next = selectedSkills.filter((item) => item !== skill);
    pushNext({ technicalSkills: next });
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      const next = [...selectedSkills, customSkill.trim()];
      pushNext({ technicalSkills: next });
      setCustomSkill("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.();
  };

  const departmentText =
    value.department === OPPORTUNITY_BROADCAST_ALL ? "Broadcast to All Departments" : `${selectedDepartments.length} selected`;

  return (
    <form onSubmit={handleSubmit} className="glass-panel grid gap-5 p-5 md:grid-cols-2 md:p-6">
      <div className="md:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <h3 className="text-xl font-semibold text-slate-800">
            {isEditing ? "Edit Opportunity Details" : "Opportunity Details"}
          </h3>
          <span className="rounded-full border border-indigo-200/80 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Faculty Form
          </span>
        </div>
      </div>

      <label className="md:col-span-2">
        <span className="label-modern">Announcement Heading</span>
        <input
          className="input-modern"
          placeholder="SDE Internship Drive - 2026"
          value={value.announcementHeading || ""}
          onChange={(event) => pushNext({ announcementHeading: event.target.value })}
          required
          aria-label="Announcement heading"
        />
      </label>

      <label>
        <span className="label-modern">Opportunity Type</span>
        <select
          className="input-modern"
          value={value.type || "Internship"}
          onChange={(event) => pushNext({ type: event.target.value })}
          aria-label="Opportunity type"
        >
          <option value="Internship">Internship</option>
          <option value="Placement">Placement</option>
        </select>
      </label>

      {showDepartment ? (
        <div ref={departmentRef} className="relative">
          <span className="label-modern">Department</span>
          <button
            type="button"
            disabled={departmentLocked}
            onClick={() => setShowDepartmentPanel((open) => !open)}
            className="input-modern flex items-center justify-between text-left disabled:cursor-not-allowed disabled:bg-slate-100"
            aria-haspopup="listbox"
            aria-expanded={showDepartmentPanel}
            aria-label="Department selector"
          >
            <span>{departmentText}</span>
            <ChevronDown size={16} className={`transition ${showDepartmentPanel ? "rotate-180" : ""}`} />
          </button>

          {showDepartmentPanel ? (
            <div className="glass-panel absolute z-20 mt-2 w-full space-y-3 p-3">
              {!departmentLocked && (
                <button
                  type="button"
                  onClick={toggleAllDepartments}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-slate-700 transition hover:bg-indigo-50"
                >
                  <input
                    type="checkbox"
                    checked={value.department === OPPORTUNITY_BROADCAST_ALL}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleAllDepartments();
                    }}
                  />
                  Broadcast to All Departments
                </button>
              )}
              <div className="grid grid-cols-2 gap-2">
                {departmentOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleDepartment(option)}
                    className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-slate-700 transition hover:bg-indigo-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDepartments.includes(option)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleDepartment(option);
                      }}
                    />
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <label className="md:col-span-2">
        <span className="label-modern">Description</span>
        <textarea
          rows={6}
          maxLength={10000}
          className="input-modern resize-y"
          placeholder="Share role details, hiring process, requirements, and important notes."
          value={value.description || ""}
          onChange={(event) => pushNext({ description: event.target.value })}
          required
          aria-label="Opportunity description"
        />
      </label>

      <label>
        <span className="label-modern">Last Date</span>
        <input
          type="date"
          className="input-modern"
          value={value.lastDate || ""}
          min={today}
          onChange={(event) => pushNext({ lastDate: event.target.value })}
          required
          aria-label="Application last date"
        />
      </label>

      <div ref={eligibilityRef} className="relative">
        <span className="label-modern">Eligibility Criteria</span>
        <button
          type="button"
          onClick={() => setShowEligibilityPanel((open) => !open)}
          className="input-modern flex items-center justify-between text-left"
          aria-haspopup="listbox"
          aria-expanded={showEligibilityPanel}
          aria-label="Eligibility year selector"
        >
          <span>{selectedYears.length ? `${selectedYears.length} selected` : "Select eligible years"}</span>
          <ChevronDown size={16} className={`transition ${showEligibilityPanel ? "rotate-180" : ""}`} />
        </button>

        {showEligibilityPanel ? (
          <div className="glass-panel absolute z-20 mt-2 w-full p-3">
            <div className="grid grid-cols-2 gap-2">
              {yearOptions.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => toggleEligibility(year)}
                  className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-slate-700 transition hover:bg-indigo-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedYears.includes(year)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleEligibility(year);
                    }}
                  />
                  {year}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="md:col-span-2">
        <span className="label-modern">Add Technical Skills (Optional)</span>

        {/* Custom Skill Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomSkill();
                }
              }}
              placeholder="e.g., Docker, Kubernetes, React"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-500 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              aria-label="Custom skill input"
            />
            <button
              type="button"
              onClick={handleAddCustomSkill}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-white transition hover:bg-indigo-700 active:bg-indigo-800"
              aria-label="Add custom skill"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Selected Skills Display */}
        {selectedSkills.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <div key={skill} className="flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1.5 text-sm text-indigo-700 border border-indigo-200">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 transition hover:text-indigo-900 focus:outline-none"
                    aria-label={`Remove skill: ${skill}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <label className="md:col-span-2">
        <span className="label-modern">Application Link</span>
        <input
          type="url"
          className="input-modern"
          placeholder="https://forms.gle/..."
          value={value.applicationLink || ""}
          onChange={(event) => pushNext({ applicationLink: event.target.value })}
          required
          aria-label="Application link"
        />
      </label>

      <PrimaryButton type="submit" loading={loading} disabled={loading} className="md:col-span-2">
        {submitLabel}
      </PrimaryButton>
      {isEditing && onCancelEdit ? (
        <button
          type="button"
          onClick={onCancelEdit}
          className="md:col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
        >
          Cancel Edit
        </button>
      ) : null}
    </form>
  );
};

export default OpportunityForm;
