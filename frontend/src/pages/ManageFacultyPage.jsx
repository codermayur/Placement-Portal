import { useState } from "react";
import toast from "react-hot-toast";
import api, { extractApiError } from "../api";
import Layout from "../components/Layout";
import PasswordInput from "../components/PasswordInput";
import { PrimaryButton, SectionTitle, StatusMessage } from "../components/ui";

const ManageFacultyPage = () => {
  const [facultyForm, setFacultyForm] = useState({ name: "", email: "", password: "", department: "" });
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState({ faculty: false, admin: false });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const instituteEmailRegex = /^[a-z]+(?:\.[a-z]+)+@vsit\.edu\.in$/i;

  const createFaculty = async () => {
    if (!facultyForm.name || !facultyForm.email || !facultyForm.password || !facultyForm.department) {
      setError("All faculty fields are required.");
      return;
    }
    if (!instituteEmailRegex.test(facultyForm.email)) {
      setError("Faculty email must follow name.surname@vsit.edu.in format.");
      return;
    }
    setLoading((prev) => ({ ...prev, faculty: true }));
    setError("");
    try {
      await api.post("/admin/faculty", facultyForm);
      setFacultyForm({ name: "", email: "", password: "", department: "" });
      setMessage("Faculty created successfully.");
      toast.success("Faculty account created");
    } catch (err) {
      setError(extractApiError(err, "Failed to create faculty."));
    } finally {
      setLoading((prev) => ({ ...prev, faculty: false }));
    }
  };

  const createAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password) {
      setError("All admin fields are required.");
      return;
    }
    if (!instituteEmailRegex.test(adminForm.email)) {
      setError("Admin email must follow name.surname@vsit.edu.in format.");
      return;
    }
    setLoading((prev) => ({ ...prev, admin: true }));
    setError("");
    try {
      await api.post("/admin/admins", adminForm);
      setAdminForm({ name: "", email: "", password: "" });
      setMessage("Admin created successfully.");
      toast.success("Admin account created");
    } catch (err) {
      setError(extractApiError(err, "Failed to create admin."));
    } finally {
      setLoading((prev) => ({ ...prev, admin: false }));
    }
  };

  return (
    <Layout role="Admin">
      <SectionTitle title="Admin User Management" subtitle="Create faculty and admin accounts with institute-only email policy." />
      <StatusMessage message={message} />
      <StatusMessage type="error" message={error} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-panel grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <h3 className="md:col-span-2 text-lg font-semibold text-slate-800">Create Faculty</h3>
          <input className="input-modern" placeholder="Faculty Name" value={facultyForm.name} onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })} />
          <input className="input-modern" placeholder="Faculty Email (name.surname@vsit.edu.in)" value={facultyForm.email} onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })} />
          <select className="input-modern" value={facultyForm.department} onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}>
            <option value="">Select Department</option><option value="CSE">CSE</option><option value="IT">IT</option><option value="ECE">ECE</option><option value="ME">ME</option><option value="CE">CE</option><option value="EEE">EEE</option><option value="MBA">MBA</option>
          </select>
          <PasswordInput placeholder="Password" value={facultyForm.password} onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })} />
          <PrimaryButton onClick={createFaculty} loading={loading.faculty} disabled={loading.faculty}>Create Faculty</PrimaryButton>
        </div>
        <div className="glass-panel grid grid-cols-1 gap-4 p-6">
          <h3 className="text-lg font-semibold text-slate-800">Create Admin</h3>
          <input className="input-modern" placeholder="Admin Name" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} />
          <input className="input-modern" placeholder="Admin Email (name.surname@vsit.edu.in)" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
          <PasswordInput placeholder="Password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
          <PrimaryButton onClick={createAdmin} loading={loading.admin} disabled={loading.admin}>Create Admin</PrimaryButton>
        </div>
      </div>
    </Layout>
  );
};

export default ManageFacultyPage;
