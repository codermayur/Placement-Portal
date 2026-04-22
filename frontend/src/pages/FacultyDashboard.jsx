import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { extractApiError } from "../api";
import Layout from "../components/Layout";
import Footer from "../components/Footer";
import OpportunityCard from "../components/OpportunityCard";
import { EmptyState, SectionTitle, Spinner, StatusMessage } from "../components/ui";
import { useOpportunities } from "../context/OpportunitiesContext";
import { getApplicantsCount, deleteOpportunity } from "../services/opportunitiesService";

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { fetchOpportunities } = useOpportunities();
  const [active, setActive] = useState([]);
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applicantCounts, setApplicantCounts] = useState({});
  const [deletingId, setDeletingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchOpportunities();
      const activeData = data.active || [];
      const archiveData = data.archive || [];
      setActive(activeData);
      setArchive(archiveData);

      // Fetch applicant counts for own opportunities (keep for now)
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
  }, [fetchOpportunities]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEdit = (opportunity) => {
    navigate(`/faculty/opportunities?edit=${opportunity._id}`);
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

  return (
    <>
      <Layout role="Faculty">
      <SectionTitle title="Faculty Dashboard" subtitle="Overview of your department opportunities." />
      <StatusMessage type="error" message={error} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="glass-panel p-6 space-y-3">
          <p className="text-sm text-slate-600">Active Opportunities</p>
          <p className="text-2xl font-semibold">{active.length}</p>
        </div>
        <div className="glass-panel p-6 space-y-3">
          <p className="text-sm text-slate-600">Archived Opportunities</p>
          <p className="text-2xl font-semibold">{archive.length}</p>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="mb-4 text-lg font-medium">Opportunity Details</h3>
        {loading ? (
          <div className="py-8 flex justify-center"><Spinner /></div>
        ) : allOpportunities.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allOpportunities.map((item) => (
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
          <EmptyState title="No opportunities available" subtitle="Create opportunities from Post Opportunities page." />
        )}
      </div>
    </Layout>
    <Footer />
    </>
  );
};

export default FacultyDashboard;
