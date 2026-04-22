import Logo from "./Logo";

const Navbar = () => (
  <nav className="sticky top-0 z-40 border-b border-indigo-200/70 bg-white/75 px-2.5 xs:px-3 sm:px-4 md:px-5 py-2 xs:py-2.5 md:py-3 backdrop-blur-lg">
    <div className="flex items-center justify-between gap-1.5 xs:gap-2 sm:gap-3">
      <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 min-w-0 flex-1">
        <Logo />
        <span className="text-xs xs:text-sm sm:text-base font-semibold tracking-tight text-slate-800 truncate">
          Placement Portal
        </span>
      </div>
      <div className="text-xs text-slate-600 whitespace-nowrap flex-shrink-0">
        Secure
      </div>
    </div>
  </nav>
);

export default Navbar;
