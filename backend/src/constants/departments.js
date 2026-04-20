const DEPARTMENTS = [
  "B.Sc.IT",
  "B.Sc.DS",
  "BAF",
  "BMS",
  "BBI",
  "BFM",
  "BAMMC",
  "M.Sc.IT",
  "M.Com(AA)",
  "M.Com(B&A)",
  "M.Com(B&F)",
  "M.Com(BM)",
  "MAEMA",
];

const OPPORTUNITY_BROADCAST_ALL = "all";

const OPPORTUNITY_DEPARTMENTS = [OPPORTUNITY_BROADCAST_ALL, ...DEPARTMENTS];

const isValidDepartment = (value) => DEPARTMENTS.includes(value);
const isValidOpportunityDepartment = (value) => {
  if (value === OPPORTUNITY_BROADCAST_ALL) return true;
  const depts = value.split(",").map(d => d.trim()).filter(Boolean);
  return depts.length > 0 && depts.every(d => DEPARTMENTS.includes(d));
};

module.exports = {
  DEPARTMENTS,
  OPPORTUNITY_BROADCAST_ALL,
  OPPORTUNITY_DEPARTMENTS,
  isValidDepartment,
  isValidOpportunityDepartment,
};
