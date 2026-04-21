import { useEffect, useMemo, useState } from "react";
import api, { extractApiData, extractApiError } from "../api";
import Layout from "../components/Layout";
import OpportunityCard from "../components/OpportunityCard";
import { EmptyState, SectionTitle, Spinner, StatusMessage } from "../components/ui";

const AdminDashboard = () => {
  const [active, setActive] = useState([]);
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [activeRes, archiveRes] = await Promise.all([
          api.get("/opportunities/active"),
          api.get("/opportunities/archive"),
        ]);
        setActive(extractApiData(activeRes) || []);
        setArchive(extractApiData(archiveRes) || []);
      } catch (err) {
        setError(extractApiError(err, "Failed to load dashboard opportunities"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allOpportunities = useMemo(() => [...active, ...archive], [active, archive]);

  return (
    <Layout role="Admin">
      <SectionTitle title="Admin Dashboard" subtitle="Overview of all opportunities." />
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
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No opportunities available" subtitle="Create opportunities from the Opportunities page." />
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
