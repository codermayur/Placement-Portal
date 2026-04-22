import React from "react";
import Badge from "./Badge";

const Footer = ({ linkedinUrl = "https://www.linkedin.com/in/your-profile/" }) => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 shadow-sm py-3 sm:py-4">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 flex flex-row xs:flex-row items-center justify-between gap-3 xs:gap-4 sm:gap-6">
        <p className="text-xs xs:text-sm sm:text-base text-slate-600 font-medium tracking-wide text-center xs:text-left">© 2026 All Rights Reserved</p>
        <Badge link={linkedinUrl} />
      </div>
    </footer>
  );
};

export default Footer;
