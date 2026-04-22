import { useState } from "react";
import toast from "react-hot-toast";
import api, { extractApiError } from "../api";
import Layout from "../components/Layout";
import Footer from "../components/Footer";
import { PrimaryButton, SectionTitle, StatusMessage } from "../components/ui";

const StudentDeletionRequestPage = () => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submitRequest = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for deletion request.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await api.post("/student/deletion-request", { reason: reason.trim() });
      setReason("");
      setMessage("Deletion request submitted successfully.");
      toast.success("Deletion request submitted");
    } catch (err) {
      setError(extractApiError(err, "Could not submit deletion request."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Layout role="Student">
      <SectionTitle title="Request Account Deletion" subtitle="Send your account deletion request to admin." />
      <StatusMessage message={message} />
      <StatusMessage type="error" message={error} />
      <div className="glass-panel p-6 space-y-4">
        <textarea
          rows="5"
          className="input-modern"
          placeholder="Explain why you want to delete your account"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <PrimaryButton onClick={submitRequest} loading={loading} disabled={loading}>
          Submit Request
        </PrimaryButton>
      </div>
    </Layout>
    <Footer />
    </>
  );
};

export default StudentDeletionRequestPage;
