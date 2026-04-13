const OpportunityForm = ({
  value,
  onChange,
  onSubmit,
  submitLabel,
  showDepartment,
  departmentLocked,
  loading,
}) => {
  const today = new Date().toISOString().split("T")[0];
  return (
  <div className="glass-panel grid gap-4 p-6 md:grid-cols-2">
    <label className="space-y-1">
      <span className="text-xs uppercase tracking-wide text-gray-700">Announcement Heading</span>
      <input
        className="input-modern"
        placeholder="SDE Internship Drive - 2026"
        value={value.announcementHeading}
        onChange={(e) => onChange({ ...value, announcementHeading: e.target.value })}
      />
    </label>
    <label className="space-y-1">
      <span className="text-xs uppercase tracking-wide text-gray-700">Opportunity Type</span>
      <select
        className="input-modern"
        value={value.type}
        onChange={(e) => onChange({ ...value, type: e.target.value })}
      >
        <option>Internship</option>
        <option>Placement</option>
      </select>
    </label>
    <label className="space-y-1 md:col-span-2">
      <span className="text-xs uppercase tracking-wide text-gray-700">Description</span>
      <textarea
        className="input-modern min-h-24"
        placeholder="Write concise details and timeline."
        value={value.description}
        onChange={(e) => onChange({ ...value, description: e.target.value })}
      />
    </label>
    <label className="space-y-1">
      <span className="text-xs uppercase tracking-wide text-gray-700">Eligibility Criteria</span>
      <input
        className="input-modern"
        placeholder="CGPA >= 7.0, no active backlogs"
        value={value.eligibilityCriteria}
        onChange={(e) => onChange({ ...value, eligibilityCriteria: e.target.value })}
      />
    </label>
    <label className="space-y-1">
      <span className="text-xs uppercase tracking-wide text-gray-700">Last Date</span>
      <input
        type="date"
        className="input-modern"
        value={value.lastDate}
        min={today}
        onChange={(e) => onChange({ ...value, lastDate: e.target.value })}
      />
    </label>
    {showDepartment && (
      <label className="space-y-1">
        <span className="text-xs uppercase tracking-wide text-gray-700">Department</span>
        <select
          className="input-modern"
          value={value.department}
          disabled={departmentLocked}
          onChange={(e) => onChange({ ...value, department: e.target.value })}
        >
          <option value="all">Broadcast to All</option>
          <option value="CSE">CSE</option>
          <option value="IT">IT</option>
          <option value="ECE">ECE</option>
          <option value="ME">ME</option>
        </select>
      </label>
    )}
    <label className={`space-y-1 ${showDepartment ? "" : "md:col-span-2"}`}>
      <span className="text-xs uppercase tracking-wide text-gray-700">Application Link</span>
      <input
        className="input-modern"
        placeholder="https://forms.gle/..."
        value={value.applicationLink}
        onChange={(e) => onChange({ ...value, applicationLink: e.target.value })}
      />
    </label>
    <button
      onClick={onSubmit}
      disabled={loading}
      className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 p-2.5 font-medium text-white transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-70 md:col-span-2"
    >
      {submitLabel}
    </button>
  </div>
  );
};

export default OpportunityForm;
