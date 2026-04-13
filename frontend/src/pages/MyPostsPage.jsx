import { useEffect, useMemo, useState } from "react";
import api, { extractApiData, extractApiError } from "../api";
import Layout from "../components/Layout";
import OpportunityCard from "../components/OpportunityCard";
import { EmptyState, SectionTitle, Spinner, StatusMessage } from "../components/ui";

const MyPostsPage = () => {
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
        setError(extractApiError(err, "Failed to load your opportunities"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allPosts = useMemo(() => [...active, ...archive], [active, archive]);

  return (
    <Layout role="Faculty">
      <SectionTitle title="My Posts" subtitle="All opportunities posted for your department." />
      <StatusMessage type="error" message={error} />
      {loading ? (
        <div className="py-8 flex justify-center"><Spinner /></div>
      ) : allPosts.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allPosts.map((item) => (
            <OpportunityCard key={item._id} opportunity={item} />
          ))}
        </div>
      ) : (
        <EmptyState title="No posts yet" subtitle="Your active and archived posts will appear here." />
      )}
    </Layout>
  );
};

export default MyPostsPage;
