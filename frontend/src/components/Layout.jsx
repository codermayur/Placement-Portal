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
    <div className="flex min-h-screen flex-col text-slate-900">
      <nav className="sticky top-0 z-40 border-b border-indigo-200/70 bg-white/75 px-3 py-3 backdrop-blur-lg md:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open mobile menu"
              className="rounded-xl border border-slate-200 bg-white/85 p-2 text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 lg:hidden"
              onClick={() => setShowMenu(true)}
            >
              <Menu size={18} />
            </button>
            <Link to="/" className="text-lg font-semibold tracking-tight text-slate-800">
              Placement Portal
            </Link>
          </div>

          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setShowNotifications((current) => !current)}
              className="relative rounded-xl border border-slate-200 bg-white/85 p-2 text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
              aria-label="Toggle notifications"
            >
              <Bell size={17} />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.75)]" />
            </button>
            <button
              onClick={() => setShowProfile((current) => !current)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-sm text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
              aria-label="Toggle user profile menu"
            >
              <UserCircle2 size={18} />
              <span className="hidden sm:inline">{user?.name || "Profile"}</span>
            </button>

            <AnimatePresence>
              {showNotifications ? (
                <Motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="glass-panel absolute right-16 top-12 w-64 p-4 text-sm"
                >
                  <p className="mb-2 font-semibold text-slate-800">Notifications</p>
                  <p className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-slate-600">No new notifications.</p>
                </Motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {showProfile ? (
                <Motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="glass-panel absolute right-0 top-12 w-52 space-y-3 p-4 text-sm"
                >
                  <p className="text-slate-600">Signed in as {role}</p>
                  <PrimaryButton onClick={handleLogout} className="w-full text-sm">
                    Logout
                  </PrimaryButton>
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
            className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden"
            onClick={() => setShowMenu(false)}
          >
            <Motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="h-full w-[280px] bg-white/95 p-4 backdrop-blur-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold text-slate-800">Menu</p>
                <button
                  onClick={() => setShowMenu(false)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                  aria-label="Close mobile menu"
                >
                  <X size={16} />
                </button>
              </div>
              <Sidebar role={role} collapsed={false} setCollapsed={() => {}} mobile />
            </Motion.div>
          </Motion.div>
        ) : null}
      </AnimatePresence>

      <main className="flex-1 px-3 py-4 md:px-5 md:py-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Sidebar role={role} collapsed={collapsed} setCollapsed={setCollapsed} />
          <Motion.section
            className="min-w-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
          >
            {children}
          </Motion.section>
        </div>
      </main>

      <footer className="border-t border-slate-200/80 px-3 py-3 text-xs text-slate-500 md:px-5">
        Vidyalankar-inspired design system · Modern Placement Portal
      </footer>
    </div>
  );
};

export default Layout;
