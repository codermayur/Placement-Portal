import { Link } from "react-router-dom";

const Logo = ({ className = "" }) => (
  <Link
    to="/"
    className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
    aria-label="Placement Portal Home"
  >
    <div className="h-8 xs:h-9 sm:h-10 lg:h-12 aspect-square bg-transparent flex items-center justify-center flex-shrink-0">
      <img
        src="/vsit.png"
        alt="Placement Portal Logo"
        className="h-full w-full object-contain hover:opacity-80 transition-opacity duration-200"
      />
    </div>
  </Link>
);

export default Logo;
