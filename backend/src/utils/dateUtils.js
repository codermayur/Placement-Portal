/**
 * Date utility functions for consistent date handling
 * All dates are normalized to start of day (00:00:00) for comparisons
 * Timezone-safe: Uses local time, normalized to start of day for comparison
 */

/**
 * Get current date at start of day (00:00:00) in local timezone
 * Used for database comparisons with normalized start-of-day dates
 * @returns {Date} Today at 00:00:00 local time
 */
const getTodayStart = () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateDisplay = todayStart.toISOString().split("T")[0];
  console.log(`[DATE_UTILS] getTodayStart: ${dateDisplay} (timestamp: ${todayStart.getTime()})`);
  return todayStart;
};

/**
 * Normalize a date to start of day (00:00:00) in local timezone
 * Handles string format like "2026-04-22" and Date objects
 *
 * Timezone strategy:
 * - String input "2026-04-22" is parsed as local midnight of that day
 * - Date objects are converted to local midnight
 * - This ensures "22 April 2026" means the whole day in local time
 *
 * @param {string|Date|null} dateInput - Date to normalize
 * @returns {Date|null} Normalized date at 00:00:00 local time, or null if input is falsy
 */
const normalizeDateToStartOfDay = (dateInput) => {
  if (!dateInput) {
    console.log("[DATE_UTILS] normalizeDateToStartOfDay: Input is null/undefined");
    return null;
  }

  let date;
  let inputDesc = "";

  if (typeof dateInput === "string") {
    // Parse string format like "2026-04-22"
    // Split and use local Date constructor to ensure local midnight
    const [year, month, day] = dateInput.split("-");
    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    inputDesc = `string "${dateInput}"`;
  } else if (dateInput instanceof Date) {
    date = new Date(dateInput);
    inputDesc = `Date object ${dateInput.toISOString()}`;
  } else {
    console.warn("[DATE_UTILS] normalizeDateToStartOfDay: Unknown input type", typeof dateInput);
    date = new Date(dateInput);
    inputDesc = `unknown type: ${dateInput}`;
  }

  date.setHours(0, 0, 0, 0);
  const normalized = {
    displayDate: date.toISOString().split("T")[0],
    timestamp: date.getTime(),
    localTime: date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
  };

  console.log(`[DATE_UTILS] normalizeDateToStartOfDay:`, {
    input: inputDesc,
    normalized: normalized.displayDate,
    timestamp: normalized.timestamp,
    localTime: normalized.localTime
  });

  return date;
};

/**
 * Check if a given date is in the past (before today)
 * Compares dates at start-of-day level (ignores time)
 *
 * @param {Date} date - Date to check (should be normalized to start of day)
 * @returns {boolean} True if date is before today at 00:00:00
 */
const isDateInPast = (date) => {
  const today = getTodayStart();
  const isPast = date < today;

  console.log(`[DATE_UTILS] isDateInPast:`, {
    checkDate: date.toISOString().split("T")[0],
    today: today.toISOString().split("T")[0],
    isPast: isPast
  });

  return isPast;
};

/**
 * Compare two normalized dates for opportunity status
 * Returns "archived" if lastDate < today, else "active"
 *
 * @param {Date} lastDate - The opportunity's last date (should be normalized)
 * @returns {string} "archived" or "active"
 */
// const getStatusFromLastDate = (lastDate) => {
//   if (!lastDate) {
//     console.log("[DATE_UTILS] getStatusFromLastDate: lastDate is null, returning 'active'");
//     return "active";
//   }

//   const today = getTodayStart();
//   const normLastDate = normalizeDateToStartOfDay(lastDate);
//   const status = normLastDate < today ? "archived" : "active";

//   console.log(`[DATE_UTILS] getStatusFromLastDate:`, {
//     lastDate: normLastDate.toISOString().split("T")[0],
//     today: today.toISOString().split("T")[0],
//     comparison: normLastDate < today ? "lastDate < today" : "lastDate >= today",
//     status: status
//   });

//   return status;
// };

/**
 * Determine opportunity status based on lastDate (timezone-safe)
 *
 * ⭐ KEY LOGIC:
 * An opportunity with lastDate = 2026-04-22 means:
 * - ACTIVE: Entire day of 2026-04-22 (from 00:00:00 to 23:59:59)
 * - ARCHIVED: Starting 2026-04-23 at 00:00:00 onwards
 *
 * Implementation: today > lastDate → archived (day level comparison)
 * This ensures oppis only archived AFTER lastDate has completely passed.
 *
 * @param {Date|string|null} lastDate - The opportunity's last date
 * @returns {string} "active" or "archived"
 */
const getStatusFromLastDate = (lastDate) => {
  if (!lastDate) {
    console.log(`[DATE_UTILS] getStatusFromLastDate: Input is null/undefined, returning 'active'`);
    return "active";
  }

  // Get today's start of day (local timezone)
  const now = new Date();
  const todayNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Parse and normalize lastDate to start of day (local timezone)
  let lastParsed;
  let rawDateLog = "";

  if (typeof lastDate === "string") {
    // Parse string format like "2026-04-22" as local midnight
    const [year, month, day] = lastDate.split("-");
    lastParsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    rawDateLog = `string "${lastDate}"`;
  } else if (lastDate instanceof Date) {
    lastParsed = new Date(lastDate);
    rawDateLog = `Date: ${lastDate.toISOString()}`;
  } else {
    console.warn(`[DATE_UTILS] getStatusFromLastDate: Unknown input type: ${typeof lastDate}`);
    lastParsed = new Date(lastDate);
    rawDateLog = `unknown type: ${lastDate}`;
  }

  // Normalize to start of day (local timezone)
  const lastNormalized = new Date(lastParsed.getFullYear(), lastParsed.getMonth(), lastParsed.getDate());

  // ⭐ CRITICAL COMPARISON: Only archive if today is AFTER lastDate (strictly greater than)
  // This ensures the opportunity remains active through the ENTIRE lastDate
  const status = todayNormalized > lastNormalized ? "archived" : "active";

  // Detailed logging for debugging
  console.log(`[DATE_UTILS] getStatusFromLastDate (⭐ AFTER last date only):`, {
    rawLastDate: rawDateLog,
    todayNormalized: todayNormalized.toISOString().split("T")[0],
    lastNormalized: lastNormalized.toISOString().split("T")[0],
    todayTime: todayNormalized.getTime(),
    lastTime: lastNormalized.getTime(),
    comparison: `today (${todayNormalized.toISOString().split("T")[0]}) > lastDate (${lastNormalized.toISOString().split("T")[0]})? ${todayNormalized > lastNormalized}`,
    result: status,
    meaning: status === "archived" ? "Today is AFTER the last date" : "Today IS or BEFORE the last date (opp still active)"
  });

  return status;
};

module.exports = {
  getTodayStart,
  normalizeDateToStartOfDay,
  isDateInPast,
  getStatusFromLastDate,
};
