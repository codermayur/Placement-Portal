import { NavLink } from "react-router-dom";
import { BriefcaseBusiness, ChevronLeft, ChevronRight, FileText, LayoutDashboard, ListChecks, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import { motion as Motion } from "framer-motion";

const roleItems = {
  Student: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "My Profile", to: "/student/profile", icon: FileText },
    { label: "Opportunities", to: "/opportunities", icon: BriefcaseBusiness },
    { label: "Request Deletion", to: "/request-deletion", icon: Trash2 },
    { label: "Profile", to: "/profile", icon: UserRound },
  ],
  Faculty: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Post Opportunities", to: "/post-opportunity", icon: BriefcaseBusiness },
    { label: "My Posts", to: "/my-posts", icon: ListChecks },
    { label: "Profile", to: "/profile", icon: UserRound },
  ],
  Admin: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Opportunities", to: "/opportunities", icon: BriefcaseBusiness },
    { label: "Create Faculty", to: "/manage-faculty", icon: Users },
    { label: "Profile", to: "/profile", icon: ShieldCheck },
  ],
};

const Sidebar = ({ role, collapsed, setCollapsed, mobile = false }) => (
  <Motion.aside
    animate={{ width: collapsed ? 80 : 260 }}
    className={`${
      mobile
        ? "flex h-auto w-full flex-col"
        : "sticky top-24 hidden h-[calc(100vh-7.5rem)] md:flex md:w-[260px] lg:w-auto flex-col"
    } overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50 to-white shadow-sm`}
  >
    <div className="flex items-center justify-between border-b border-indigo-100 bg-white/70 px-3 sm:px-4 py-3 sm:py-4">
      {!collapsed ? <p className="text-xs sm:text-sm font-semibold text-indigo-900 truncate">{role} Panel</p> : null}
      {!mobile && (
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="rounded-lg border border-indigo-200 bg-white p-1 text-indigo-700 transition-all duration-200 ease-in-out hover:bg-indigo-50 flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}
    </div>

    <div className="space-y-1.5 sm:space-y-2 px-2.5 sm:px-3 py-3 sm:py-4">
      {(roleItems[role] || roleItems.Student).map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center gap-2 sm:gap-3 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out ${
              isActive
                ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                : "text-indigo-900/80 hover:bg-indigo-100/70 hover:text-indigo-900"
            }`
          }
        >
          <item.icon size={16} className="flex-shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </NavLink>
      ))}
    </div>
  </Motion.aside>
);

export default Sidebar;
