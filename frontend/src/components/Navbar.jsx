import Logo from "./Logo";

const Navbar = () => (
  <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-2.5 sm:py-3 backdrop-blur-sm shadow-sm">
    <div className="flex items-center justify-between gap-2 xs:gap-3 sm:gap-4 md:gap-6">
      <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 lg:gap-4 min-w-0 flex-1">
        <Logo />
        <span className="text-xs xs:text-sm sm:text-base font-semibold tracking-tight text-slate-900 truncate">
          Vidyalankar Placement Portal
        </span>
      </div>
      <div className="text-xs xs:text-xs sm:text-sm text-slate-500 whitespace-nowrap flex-shrink-0">
        Secure
      </div>
    </div>
  </nav>
);

export default Navbar;
