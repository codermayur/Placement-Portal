import { PrimaryButton } from "./ui";
import { CalendarClock, GraduationCap, Sparkles } from "lucide-react";
import { motion as Motion } from "framer-motion";

const toText = (value) => (typeof value === "string" ? value : JSON.stringify(value));

const OpportunityCard = ({ opportunity }) => {
  const isArchived = new Date(opportunity.lastDate) < new Date();

  return (
    <Motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass-panel p-6 transition-all duration-200 ease-in-out"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-black">{opportunity.announcementHeading}</h3>
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
            {opportunity.type}
          </span>
        </div>
        <p className="text-sm leading-6 text-gray-600">
          {opportunity.description.length > 180
            ? `${opportunity.description.slice(0, 180)}...`
            : opportunity.description}
        </p>
        <p className="flex gap-2 text-sm leading-6 text-gray-600">
          <GraduationCap size={16} className="mt-1 shrink-0 text-indigo-600" />
          <span>
            <span className="font-semibold text-indigo-700">Eligibility: </span>
            {toText(opportunity.eligibilityCriteria)}
          </span>
        </p>
        <p className="flex items-center gap-2 text-sm font-medium text-indigo-700">
          <CalendarClock size={16} />
          Last Date: {new Date(opportunity.lastDate).toLocaleDateString()}
        </p>
        {isArchived ? (
          <PrimaryButton className="w-full cursor-not-allowed bg-gray-200 text-gray-500 shadow-none hover:translate-y-0 hover:bg-gray-200 hover:shadow-none" disabled>
            Archived
          </PrimaryButton>
        ) : (
          <a href={opportunity.applicationLink} target="_blank" rel="noreferrer">
            <PrimaryButton className="w-full"><Sparkles size={14} />Apply Now</PrimaryButton>
          </a>
        )}
      </div>
    </Motion.article>
  );
};

export default OpportunityCard;
