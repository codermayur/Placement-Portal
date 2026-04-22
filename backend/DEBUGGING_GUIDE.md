/**
 * DEBUGGING GUIDE: Opportunity Expiration Logic
 *
 * Use this guide to verify the fix is working correctly and troubleshoot any issues.
 */

// ============================================================================
// LOG PREFIX REFERENCE
// ============================================================================
//
// [DATE_UTILS]              - Low-level date normalization functions
// [OPPORTUNITY MODEL]       - Model pre-validation logic
// [OPPORTUNITY SYNC]        - Daily status sync operation
// [OPPORTUNITIES][CREATE    - Opportunity creation workflow
// [OPPORTUNITIES][UPDATE    - Opportunity update workflow
// [OPPORTUNITIES][APPLIED   - Explicit status operations
// [OPPORTUNITY LIST/ACTIVE/ARCHIVED] - Fetch operations
//

// ============================================================================
// EXPECTED LOG SEQUENCE: CREATE OPPORTUNITY
// ============================================================================
//
// Scenario: Faculty creates opportunity with lastDate = "2026-04-22"
//
// 1. API receives POST /api/opportunities
//    Log: [OPPORTUNITIES][CREATE_START]
//    Shows: userEmail, userRole, receivedLastDate
//
// 2. Date normalization happens
//    Log: [DATE_UTILS] normalizeDateToStartOfDay
//    Shows: input format, normalized date, timestamp, IST time
//
// 3. Status is derived
//    Log: [OPPORTUNITIES][DATE_PROCESSING]
//    Shows: receivedLastDate, normalizedLastDate, derivedStatus
//
// 4. Opportunity is saved to database
//    Log: [OPPORTUNITIES][CREATED]
//    Shows: id, department, lastDate (YYYY-MM-DD), status
//
// Example Output:
// [OPPORTUNITIES][CREATE_START] { userEmail: 'faculty@college.edu', userRole: 'faculty', receivedLastDate: '2026-04-22' }
// [DATE_UTILS] normalizeDateToStartOfDay: { input: 'string "2026-04-22"', normalized: '2026-04-22', localTime: '22/04/2026, 12:00:00 AM' }
// [OPPORTUNITIES][DATE_PROCESSING] { receivedLastDate: '2026-04-22', normalizedLastDate: '2026-04-22', derivedStatus: 'active' }
// [OPPORTUNITIES][CREATED] { id: ObjectId(...), department: 'CSE', lastDate: '2026-04-22', status: 'active' }
//

// ============================================================================
// EXPECTED LOG SEQUENCE: FETCH OPPORTUNITIES
// ============================================================================
//
// Scenario: Student fetches active opportunities
//
// 1. API receives GET /api/opportunities/active
//    Log: [OPPORTUNITY ACTIVE][START]
//    Shows: userEmail, userRole
//
// 2. Status sync is triggered
//    Log: [OPPORTUNITY SYNC] Starting status sync...
//    Log: [OPPORTUNITY SYNC] Today's date: YYYY-MM-DD
//    Log: [OPPORTUNITY SYNC] Archived X opportunities
//    Log: [OPPORTUNITY SYNC] Activated Y opportunities
//
// 3. Database query filters for active
//    Log: [OPPORTUNITY ACTIVE][RESULTS]
//    Shows: found count
//
// 4. Details logged for first 3 items
//    Log: [OPPORTUNITY ACTIVE][ITEM] (multiple)
//    Shows: id, heading, lastDate, today, status, creator
//
// Example Output:
// [OPPORTUNITY ACTIVE][START] { userEmail: 'student@college.edu', userRole: 'student' }
// [OPPORTUNITY SYNC] Starting status sync...
// [OPPORTUNITY SYNC] Today's date: 2026-04-22
// [OPPORTUNITY SYNC] Archived 0 opportunities (lastDate < 2026-04-22)
// [OPPORTUNITY SYNC] Activated 2 opportunities (lastDate >= 2026-04-22)
// [OPPORTUNITY ACTIVE][RESULTS] { found: 15, userRole: 'student' }
// [OPPORTUNITY ACTIVE][ITEM] { id: ObjectId(...), heading: 'SDE Internship Drive...', lastDate: '2026-04-22', today: '2026-04-22', status: 'active', createdName: 'Dr. Smith' }
//

// ============================================================================
// TROUBLESHOOTING: Opportunity is archived when it shouldn't be
// ============================================================================
//
// Problem: Opportunity with lastDate = today appears as ARCHIVED
//
// Check 1: Verify database stored date correctly
//   - MongoDB: db.opportunities.findOne({_id: ObjectId(...)})
//   - Look for: { lastDate: ISODate("2026-04-22T00:00:00.000Z") }
//   - Should be at midnight (00:00:00)
//
// Check 2: Look for sync logs
//   - Search server logs for: [OPPORTUNITY SYNC]
//   - If archived date < today's date, check if time component is wrong
//   - Log should show dates being compared at day-level only
//
// Check 3: Verify today's date interpretation
//   - Look for: [OPPORTUNITY SYNC] Today's date: 2026-04-22
//   - Should match the date you're testing with
//   - If shows different date, server time might be wrong
//
// Check 4: Timezone issue verification
//   - Server timezone should match India Standard Time (IST)
//   - In logs, look for: localTime: '22/04/2026, ...' in IST
//   - If showing different offset, that's the problem
//

// ============================================================================
// TROUBLESHOOTING: Cannot apply to active opportunity
// ============================================================================
//
// Problem: Student gets "Cannot apply to inactive/archived opportunities"
//
// Check 1: Verify opportunity status
//   - Call GET /api/opportunities/{id}
//   - Check response: status field should be "active"
//
// Check 2: Trigger sync before apply
//   - Call GET /api/opportunities first (which triggers sync)
//   - Then try applying again
//   - Logs should show if sync archived it
//
// Check 3: Check frontend date format
//   - HTML date input sends format: "YYYY-MM-DD"
//   - Should be parsed correctly by: normalizeDateToStartOfDay()
//   - Check log: [DATE_UTILS] normalizeDateToStartOfDay
//

// ============================================================================
// HOW TO RUN DATE LOGIC TESTS
// ============================================================================
//
// Test the date utilities directly:
//
// $ cd /backend
// $ node -e "require('./src/utils/dateTestUtils.js')"
//
// Or in your server startup, call once:
// $ require('./src/utils/dateTestUtils.js')
//
// Should output PASS for all 6 tests
//

// ============================================================================
// MANUAL VERIFICATION STEPS
// ============================================================================
//
// 1. Create an opportunity with:
//    - lastDate = today (2026-04-22)
//    - Status should be: active
//
// 2. Check server logs for:
//    [OPPORTUNITIES][CREATED] showing status: "active"
//
// 3. Fetch the opportunity:
//    GET /api/opportunities/{id}
//    Response should have: status: "active"
//
// 4. Query database:
//    db.opportunities.findOne({_id: ObjectId(...)})
//    lastDate should be: ISODate("2026-04-22T00:00:00.000Z")
//
// 5. Next day (2026-04-23), without creating any cron:
//    Call: GET /api/opportunities (which triggers sync)
//    Check logs: [OPPORTUNITY SYNC] Archived 1 opportunities
//
// 6. Fetch the same opportunity:
//    GET /api/opportunities/{id}
//    Response should have: status: "archived"
//

// ============================================================================
// KEY INSIGHTS
// ============================================================================
//
// 1. Dates stored in MongoDB are always in UTC
//    - "2026-04-22 IST" = "2026-04-21T18:30:00Z (UTC)"
//    - Our normalizeDateToStartOfDay() handles this conversion
//
// 2. Comparison is always at START-OF-DAY level
//    - Ignores time completely
//    - Only compares YYYY-MM-DD portion
//
// 3. Status sync is NOT automatic
//    - Runs when opportunity list is fetched
//    - Backend doesn't have cron job
//    - So opportunities won't be auto-archived without a request
//
// 4. Frontend sends correct format
//    - HTML <input type="date"> sends "YYYY-MM-DD"
//    - Backend normalizes to local midnight
//    - Database stores as UTC midnight
//
