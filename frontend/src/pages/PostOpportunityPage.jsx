import { useState } from "react";
import toast from "react-hot-toast";
import api, { extractApiError } from "../api";
import Layout from "../components/Layout";
import OpportunityForm from "../components/OpportunityForm";
import { SectionTitle, StatusMessage } from "../components/ui";
import { OPPORTUNITY_BROADCAST_ALL } from "../constants/departments";

const initial = {
  announcementHeading: "",
  type: "Internship",
  description: "",
  eligibilityCriteria: [],
  lastDate: "",
  applicationLink: "",
  department: OPPORTUNITY_BROADCAST_ALL,
};

const PostOpportunityPage = () => {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setMessage("");
    const hasEligibility = Array.isArray(form.eligibilityCriteria)
      ? form.eligibilityCriteria.length > 0
      : Boolean(form.eligibilityCriteria);
    if (!form.announcementHeading || !form.description || !hasEligibility || !form.lastDate || !form.applicationLink) {
      setError("Please fill all required opportunity fields.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/opportunities", form);
      setForm(initial);
      setMessage("Opportunity created successfully.");
      toast.success("Opportunity created");
    } catch (err) {
      setError(extractApiError(err, "Unable to save opportunity."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="Faculty">
      <SectionTitle title="Post Opportunity" subtitle="Create new opportunities for your department." />
      <StatusMessage message={message} />
      <StatusMessage type="error" message={error} />
      <OpportunityForm
        value={form}
        onChange={setForm}
        onSubmit={submit}
        submitLabel="Create Opportunity"
        showDepartment
        departmentLocked
        loading={loading}
      />
    </Layout>
  );
};

export default PostOpportunityPage;
