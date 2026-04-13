import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { extractApiData, extractApiError } from "../api";
import Layout from "../components/Layout";
import OpportunityForm from "../components/OpportunityForm";
import OpportunityCard from "../components/OpportunityCard";
import { EmptyState, SectionTitle, Spinner, StatusMessage } from "../components/ui";

const initial = {
  announcementHeading: "",
  type: "Internship",
  description: "",
  eligibilityCriteria: "",
  lastDate: "",
  applicationLink: "",
  department: "all",
};

const AdminOpportunitiesPage = () => {
  const [form, setForm] = useState(initial);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/opportunities/active");
      setItems(extractApiData(response) || []);
    } catch (err) {
      setError(extractApiError(err, "Failed to load opportunities"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createOpportunity = async () => {
    setError("");
    setMessage("");
    if (!form.announcementHeading || !form.description || !form.eligibilityCriteria || !form.lastDate || !form.applicationLink) {
      setError("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      const normalizedLink =
        /^https?:\/\//i.test(form.applicationLink) ? form.applicationLink : `https://${form.applicationLink}`;
      await api.post("/opportunities", { ...form, applicationLink: normalizedLink });
      setForm(initial);
      await load();
      setMessage("Opportunity created successfully.");
      toast.success("Opportunity created");
    } catch (err) {
      setError(extractApiError(err, "Failed to create opportunity"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout role="Admin">
      <SectionTitle title="Opportunities" subtitle="Create and review opportunities." />
      <StatusMessage message={message} />
      <StatusMessage type="error" message={error} />
      <OpportunityForm
        value={form}
        onChange={setForm}
        onSubmit={createOpportunity}
        submitLabel="Create Opportunity"
        showDepartment
        loading={saving}
      />
      <div className="mt-6">
        {loading ? (
          <div className="py-8 flex justify-center"><Spinner /></div>
        ) : items.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => <OpportunityCard key={item._id} opportunity={item} />)}
          </div>
        ) : (
          <EmptyState title="No active opportunities" subtitle="Create an opportunity using the form above." />
        )}
      </div>
    </Layout>
  );
};

export default AdminOpportunitiesPage;
