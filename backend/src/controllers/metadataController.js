const { ok } = require("../utils/apiResponse");
const { DEPARTMENTS, OPPORTUNITY_BROADCAST_ALL } = require("../constants/departments");

const getDepartments = (req, res) => {
  return ok(res, {
    departments: DEPARTMENTS,
    opportunityDepartments: [OPPORTUNITY_BROADCAST_ALL, ...DEPARTMENTS],
    opportunityBroadcastValue: OPPORTUNITY_BROADCAST_ALL,
  });
};

module.exports = { getDepartments };
