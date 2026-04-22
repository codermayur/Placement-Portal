import { Link } from "react-router-dom";

const Logo = ({ className = "" }) => (
  <Link
    to="/"
    className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
    aria-label="Placement Portal Home"
  >
    <div className="h-10 xs:h-12 sm:h-14 md:h-16 aspect-video bg-transparent flex items-center justify-center">
      <img
        src="/logo.png"
        alt="Placement Portal Logo"
        className="h-full w-full object-contain hover:opacity-80 transition-opacity duration-200"
      />
    </div>
  </Link>
);

export default Logo;
