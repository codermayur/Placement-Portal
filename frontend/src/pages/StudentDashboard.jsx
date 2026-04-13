import { useEffect, useMemo, useState } from "react";
import api, { extractApiData, extractApiError } from "../api";
import Layout from "../components/Layout";
import OpportunityCard from "../components/OpportunityCard";
import { EmptyState, SectionTitle, Spinner, StatusMessage } from "../components/ui";

const StudentDashboard = ({ role = "Student" }) => {
  const [active, setActive] = useState([]);
  const [archive, setArchive] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [message] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [activeRes, archiveRes] = await Promise.all([api.get("/opportunities/active"), api.get("/opportunities/archive")]);
        setActive(extractApiData(activeRes) || []);
        setArchive(extractApiData(archiveRes) || []);
      } catch (err) {
        setError(extractApiError(err, "Failed to load opportunities"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeView = useMemo(
    () =>
      [...active]
        .filter((item) => item.announcementHeading.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) =>
          sort === "asc"
            ? new Date(a.lastDate).getTime() - new Date(b.lastDate).getTime()
            : new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
        ),
    [active, search, sort]
  );
  const archiveView = useMemo(
    () =>
      [...archive]
        .filter((item) => item.announcementHeading.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) =>
          sort === "asc"
            ? new Date(a.lastDate).getTime() - new Date(b.lastDate).getTime()
            : new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
        ),
    [archive, search, sort]
  );

  return (
    <Layout role={role}>
      <section className="space-y-6">
          <SectionTitle title={`${role} Dashboard`} subtitle="Explore active opportunities and track archived postings." />
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="input-modern"
              placeholder="Search by heading"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="input-modern"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="asc">Sort by Deadline: Earliest</option>
              <option value="desc">Sort by Deadline: Latest</option>
            </select>
          </div>
          <StatusMessage message={message} />
          <StatusMessage type="error" message={error} />
          {loading ? (
            <div className="py-8 flex justify-center"><Spinner /></div>
          ) : (
            <>
          <h2 className="text-xl font-semibold text-black">Active Opportunities</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeView.length ? activeView.map((item) => <OpportunityCard key={item._id} opportunity={item} />) : <EmptyState title="No active opportunities" subtitle="Check back later for new postings." />}
          </div>
          <h2 className="pt-2 text-xl font-semibold text-black">Archived Opportunities</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {archiveView.length ? archiveView.map((item) => <OpportunityCard key={item._id} opportunity={item} />) : <EmptyState title="No archived opportunities" subtitle="Expired postings will appear here automatically." />}
          </div>
            </>
          )}
        </section>
    </Layout>
  );
};

export default StudentDashboard;
