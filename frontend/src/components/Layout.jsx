import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Menu, UserCircle2, X } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { PrimaryButton } from "./ui";
import Sidebar from "./Sidebar";

const Layout = ({ children, role = "Student" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white text-black">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute -right-20 top-16 h-72 w-72 rounded-full bg-sky-100/60 blur-3xl" />
      </div>
      <nav className="sticky top-0 z-40 border-b border-indigo-200/70 bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 px-4 py-4 text-white shadow-[0_8px_24px_rgba(79,70,229,0.24)] md:px-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-white/35 bg-white/15 p-2 text-white transition-all duration-200 ease-in-out hover:bg-white/25 md:hidden"
              onClick={() => setShowMenu(true)}
            >
              <Menu size={18} />
            </button>
            <Link to="/" className="text-lg font-semibold tracking-tight text-white">Placement Portal</Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative rounded-xl border border-white/35 bg-white/15 p-2 text-white transition-all duration-200 ease-in-out hover:bg-white/25"
            >
              <Bell size={17} />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.7)]" />
            </button>
            <button
              onClick={() => setShowProfile((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-white/35 bg-white/15 px-3 py-2 text-sm text-white transition-all duration-200 ease-in-out hover:bg-white/25"
            >
              <UserCircle2 size={18} className="text-white" />
              <span className="hidden sm:inline">{user?.name}</span>
            </button>
            <AnimatePresence>
              {showNotifications ? (
                <Motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-28 top-16 w-64 rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-lg"
                >
                  <p className="mb-2 font-medium text-black">Notifications</p>
                  <div className="space-y-2 text-gray-600">
                    <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">No new notifications.</p>
                  </div>
                </Motion.div>
              ) : null}
            </AnimatePresence>
            <AnimatePresence>
              {showProfile ? (
                <Motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-4 top-16 w-48 rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-lg"
                >
                  <p className="mb-2 text-gray-600">Signed in as {role}</p>
                  <PrimaryButton onClick={handleLogout} className="w-full px-3 py-1.5">Logout</PrimaryButton>
                </Motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {showMenu ? (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/25 md:hidden"
          >
            <Motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              className="h-full w-72 bg-white p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-medium text-black">Menu</p>
                <button onClick={() => setShowMenu(false)} className="rounded-lg border border-gray-200 p-2 text-gray-700 transition-all duration-200 ease-in-out hover:border-indigo-200 hover:bg-indigo-50"><X size={16} /></button>
              </div>
              <Sidebar role={role} collapsed={false} setCollapsed={() => {}} mobile />
            </Motion.div>
          </Motion.div>
        ) : null}
      </AnimatePresence>

      <main className="grid w-full gap-4 p-4 md:grid-cols-[auto_1fr] md:gap-6 md:p-6">
        <Sidebar role={role} collapsed={collapsed} setCollapsed={setCollapsed} />
        <Motion.section
          className="w-full min-w-0"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          {children}
        </Motion.section>
      </main>
    </div>
  );
};

export default Layout;
