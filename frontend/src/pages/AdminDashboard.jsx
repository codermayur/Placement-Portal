import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api, { extractApiData, extractApiError } from "../api";
import Layout from "../components/Layout";
import Footer from "../components/Footer";
import OpportunityCard from "../components/OpportunityCard";
import { EmptyState, SectionTitle, Spinner, StatusMessage } from "../components/ui";
import { getApplicantsCount, deleteOpportunity, updateOpportunity } from "../services/opportunitiesService";
import { DEPARTMENTS } from "../constants/departments";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState([]);
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applicantCounts, setApplicantCounts] = useState({});
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [activeRes, archiveRes] = await Promise.all([
        api.get("/opportunities/active"),
        api.get("/opportunities/archive"),
      ]);
      const activeData = extractApiData(activeRes) || [];
      const archiveData = extractApiData(archiveRes) || [];
      setActive(activeData);
      setArchive(archiveData);

      // Fetch applicant counts for all opportunities
      const allOpportunities = [...activeData, ...archiveData];
      const counts = {};
      await Promise.all(
        allOpportunities.map(async (opp) => {
          try {
            const countData = await getApplicantsCount(opp._id);
            counts[opp._id] = countData.count;
          } catch (err) {
            console.error(`Failed to fetch count for ${opp._id}:`, err);
          }
        })
      );
      setApplicantCounts(counts);
    } catch (err) {
      setError(extractApiError(err, "Failed to load dashboard opportunities"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleEdit = (opportunity) => {
    navigate(`/admin/opportunities?edit=${opportunity._id}`);
  };

  const handleDelete = (opportunity) => {
    toast.custom((t) => (
      <div className="w-[340px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl space-y-4">
        <div>
          <h3 className="font-semibold text-slate-900">Delete Opportunity</h3>
          <p className="text-sm text-slate-600 mt-1">Are you sure you want to delete this opportunity? This action cannot be undone.</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                setDeletingId(opportunity._id);
                await deleteOpportunity(opportunity._id);
                setActive(active.filter(o => o._id !== opportunity._id));
                setArchive(archive.filter(o => o._id !== opportunity._id));
                const newCounts = { ...applicantCounts };
                delete newCounts[opportunity._id];
                setApplicantCounts(newCounts);
                toast.success("Opportunity deleted successfully.");
              } catch (err) {
                toast.error(err.message || "Failed to delete opportunity");
              } finally {
                setDeletingId("");
              }
            }}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium"
            disabled={deletingId === opportunity._id}
          >
            Delete
          </button>
        </div>
      </div>
    ));
  };

  const allOpportunities = useMemo(() => [...active, ...archive], [active, archive]);

  const filteredOpportunities = useMemo(() => {
    return allOpportunities.filter((opportunity) => {
      const matchesSearch =
        !searchQuery ||
        opportunity.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opportunity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opportunity.company?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDepartment =
        !selectedDepartment ||
        opportunity.department === selectedDepartment;

      return matchesSearch && matchesDepartment;
    });
  }, [allOpportunities, searchQuery, selectedDepartment]);

  return (
    <>
      <Layout role="Admin">
      <SectionTitle title="Admin Dashboard" subtitle="Overview of all opportunities." />
      <StatusMessage type="error" message={error} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="glass-panel p-6 space-y-3">
          <p className="text-sm text-slate-600">Active Opportunities</p>
          <p className="text-2xl font-semibold">{filteredOpportunities.filter(opp => opp.status === 'active').length}</p>
        </div>
        <div className="glass-panel p-6 space-y-3">
          <p className="text-sm text-slate-600">Archived Opportunities</p>
          <p className="text-2xl font-semibold">{filteredOpportunities.filter(opp => opp.status === 'archived').length}</p>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="mb-4 text-lg font-medium">Opportunity Details</h3>

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-3 md:space-y-0 md:flex md:items-center md:gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative group">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by title or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear search"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-56 lg:w-64 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 9a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1V9z" />
                <path d="M4 3a2 2 0 012-2h7a2 2 0 012 2v2h2a2 2 0 012 2v1h1a1 1 0 110 2h-1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V3z" />
              </svg>
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white text-sm appearance-none cursor-pointer"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          {/* Reset Filters Button */}
          {(searchQuery || selectedDepartment) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDepartment("");
              }}
              className="w-full md:w-auto px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>

        {/* Active Filters Badge */}
        {(searchQuery || selectedDepartment) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {searchQuery && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs">
                <span className="text-blue-700">Search: <span className="font-medium">{searchQuery}</span></span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-500 hover:text-blue-700"
                >
                  ✕
                </button>
              </div>
            )}
            {selectedDepartment && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs">
                <span className="text-green-700">Dept: <span className="font-medium">{selectedDepartment}</span></span>
                <button
                  onClick={() => setSelectedDepartment("")}
                  className="text-green-500 hover:text-green-700"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-8 flex justify-center"><Spinner /></div>
        ) : filteredOpportunities.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOpportunities.map((item) => (
              <OpportunityCard
                key={item._id}
                opportunity={item}
                canManage={true}
                applicantCount={applicantCounts[item._id] ?? null}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item)}
                deleteLoading={deletingId === item._id}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No opportunities found" subtitle="Try adjusting your search or filter criteria." />
        )}
      </div>
    </Layout>
    <Footer />
    </>
  );
};

export default AdminDashboard;
