import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Menu, UserCircle2, X } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { PrimaryButton } from "./ui";
import Sidebar from "./Sidebar";
import Logo from "./Logo";

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
      <nav className="sticky top-0 z-40 border-b border-indigo-200/70 bg-white/75 px-2.5 xs:px-3 sm:px-4 md:px-5 py-2 xs:py-2.5 md:py-3 backdrop-blur-lg">
        <div className="flex items-center justify-between gap-1.5 xs:gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              aria-label="Open mobile menu"
              className="rounded-lg xs:rounded-xl border border-slate-200 bg-white/85 p-1.5 xs:p-2 text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 md:hidden flex-shrink-0"
              onClick={() => setShowMenu(true)}
            >
              <Menu size={16} className="xs:size-4.5 sm:size-5" />
            </button>
            <Logo />
            <span className="text-xs xs:text-sm sm:text-base font-semibold tracking-tight text-slate-800 truncate">
              Placement Portal
            </span>
          </div>

          <div className="relative flex items-center gap-1 xs:gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setShowNotifications((current) => !current)}
              className="relative rounded-lg xs:rounded-xl border border-slate-200 bg-white/85 p-1.5 xs:p-2 text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
              aria-label="Toggle notifications"
            >
              <Bell size={16} className="xs:size-4.5 sm:size-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 xs:h-2.5 xs:w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.75)]" />
            </button>
            <button
              onClick={() => setShowProfile((current) => !current)}
              className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 rounded-lg xs:rounded-xl border border-slate-200 bg-white/85 px-1.5 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 text-xs sm:text-sm text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
              aria-label="Toggle user profile menu"
            >
              <UserCircle2 size={14} className="xs:size-4 sm:size-5" />
              <span className="hidden xs:inline lg:hidden truncate text-xs sm:text-sm">{user?.name?.split(" ")[0] || "Profile"}</span>
              <span className="hidden lg:inline truncate">{user?.name || "Profile"}</span>
            </button>

            <AnimatePresence>
              {showNotifications ? (
                <Motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="glass-panel absolute right-12 top-12 sm:right-16 w-56 sm:w-64 p-4 text-sm z-50"
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
                  className="glass-panel absolute right-0 top-12 w-48 sm:w-52 space-y-3 p-4 text-sm z-50"
                >
                  <p className="text-slate-600">Signed in as {role}</p>
                  <PrimaryButton onClick={handleLogout} className="w-full text-xs sm:text-sm">
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
              className="h-full w-[280px] bg-white/95 p-3 xs:p-4 backdrop-blur-lg flex flex-col"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <Logo className="scale-90 xs:scale-100" />
                <button
                  onClick={() => setShowMenu(false)}
                  className="rounded-lg border border-slate-200 p-1.5 xs:p-2 text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                  aria-label="Close mobile menu"
                >
                  <X size={16} className="xs:size-4.5" />
                </button>
              </div>
              <Sidebar role={role} collapsed={false} setCollapsed={() => {}} mobile />
            </Motion.div>
          </Motion.div>
        ) : null}
      </AnimatePresence>

      <main className="flex-1 px-2.5 py-3 xs:px-3 sm:px-4 md:px-5 md:py-5">
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
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

      <footer className="border-t border-slate-200/80 px-2.5 py-2 xs:px-3 sm:px-4 md:px-5 md:py-3 text-xs text-slate-500">
        Vidyalankar-inspired design system · Modern Placement Portal
      </footer>
    </div>
  );
};

export default Layout;
