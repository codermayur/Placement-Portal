# Fix POST /api/opportunities 400 Error

Status: In Progress

**Diagnosis:**
- Missing/invalid `applicationLink` (required in schema but no frontend field)
- Possible empty `eligibilityCriteria` failing validation

**Completed:**
- [x] Created TODO.md
- [x] Updated `backend/src/models/Opportunity.js`: Made `applicationLink` optional
- [x] Updated `backend/src/controllers/opportunityController.js`: Removed `eligibilityCriteria` from strict required, added detailed logging

**Remaining Steps:**
1. Restart backend server to apply changes
2. Test POST /api/opportunities with valid payload (curl or form)
3. Check server console for logs if still 400
4. Frontend test form submission (ensure JSON body, auth token)
5. attempt_completion

**Updated TODO after each step.**
