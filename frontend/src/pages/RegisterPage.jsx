import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import api, { extractApiData, extractApiError } from "../api";
import { useAuth } from "../context/AuthContext";
import { PrimaryButton, StatusMessage } from "../components/ui";
import PasswordInput from "../components/PasswordInput";
import { DEPARTMENTS } from "../constants/departments";

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    studentId: "",
    department: "",
    email: "",
    phone: "",
    password: "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const instituteEmailRegex = /^[a-z]+(?:\.[a-z]+)+@vsit\.edu\.in$/i;

  const register = async () => {
    setError("");
    setMsg("");
    if (!form.name.trim() || !form.studentId.trim() || !form.department.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim()) {
      setError("Name, student ID, email, department, phone and password are required.");
      return;
    }
    if (!instituteEmailRegex.test(form.email.trim())) {
      setError("Email must follow name.surname@vsit.edu.in format.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(form.password)) {
      setError("Password must be 8+ chars with uppercase, number and special character.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/auth/register", form);
      const data = extractApiData(response);
      if (import.meta.env.DEV && data?.otp) {
        setMsg(`${data?.message || "OTP generated"}. Dev OTP: ${data.otp}`);
      } else if (data?.otpDelivery === "failed" && data?.otp) {
        setMsg(`${data.message}. Use OTP: ${data.otp}`);
      } else {
        setMsg(data?.message || "OTP sent to your email.");
      }
      setStep(2);
    } catch (err) {
      setError(extractApiError(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!form.otp.trim()) {
      setError("OTP is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/verify-otp", { studentId: form.studentId, otp: form.otp });
      const data = extractApiData(response);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(extractApiError(err, "OTP verification failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-indigo-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-8 h-72 w-72 rounded-full bg-cyan-200/50 blur-3xl" />
      <Motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel relative w-full max-w-2xl space-y-5 border-slate-200/80 p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
              <Sparkles size={14} />
              Student onboarding
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
            <p className="mt-1 text-sm text-slate-600">Register with institute details and verify via OTP to activate your student login.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            Step {step} of 2
          </span>
        </div>
        {step === 1 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Name</p>
              <input className="input-modern" placeholder="Full name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Student ID</p>
              <input className="input-modern" placeholder="Student ID" onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Department</p>
              <select className="input-modern" onChange={(e) => setForm({ ...form, department: e.target.value })} defaultValue="">
                <option value="" disabled>Select Department</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Institute Email</p>
              <input className="input-modern" placeholder="name.surname@vsit.edu.in" onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Phone Number</p>
              <input className="input-modern" placeholder="Enter your 10-digit phone number" type="tel" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Password</p>
              <PasswordInput placeholder="Create a strong password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <p className="text-xs text-slate-500 md:col-span-2">
              Password must be at least 8 characters and include one uppercase letter, one number, and one special character.
            </p>
            <PrimaryButton loading={loading} disabled={loading} onClick={register} className="w-full rounded-xl py-3 md:col-span-2">{loading ? "Sending OTP..." : "Send OTP"}</PrimaryButton>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-800">
              An OTP was sent to <span className="font-semibold">{form.email || "your email"}</span>.
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">OTP</p>
              <input className="input-modern" placeholder="Enter 6-digit OTP" onChange={(e) => setForm({ ...form, otp: e.target.value })} />
            </div>
            <PrimaryButton loading={loading} disabled={loading} onClick={verify} className="w-full rounded-xl py-3">{loading ? "Verifying OTP..." : "Verify OTP"}</PrimaryButton>
          </div>
        )}
        <StatusMessage message={msg} />
        <StatusMessage type="error" message={error} />
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm text-indigo-600 transition-colors duration-200 ease-in-out hover:text-indigo-500"
        >
          <ArrowLeft size={14} />
          Back to login
        </Link>
      </Motion.div>
    </div>
  );
};

export default RegisterPage;
