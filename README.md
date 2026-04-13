# College Placement & Internship Notification Portal

Full-stack role-based portal with OTP onboarding for students, and opportunity management for admin/faculty.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + MongoDB + Mongoose
- Auth: JWT and OTP verification for students

## Setup

1. Copy `.env.example` to `.env` in project root and fill values.
2. Install dependencies:
   - `cd server && npm install`
   - `cd ../client && npm install`
3. Run backend:
   - `cd server && npm run dev`
4. Run frontend:
   - `cd client && npm run dev`

## API Modules

- Auth: `/api/auth/register`, `/api/auth/verify-otp`, `/api/auth/login`
- Opportunities: `/api/opportunities`
- Admin: `/api/admin`
- Student: `/api/student`

## Production Notes

- All role-protected routes are guarded by JWT middleware.
- Password hashes are never returned in API responses.
- OTP is returned in API response only when `NODE_ENV !== production`.
- `applicationLink` is validated as a URL before saving opportunities.
- Active/archive separation is based on `lastDate` comparison with current server date.

## Test Checklist

- Student registration with OTP send + verify
- Student login by student ID (verified only)
- Admin/faculty login by role + email/password
- Faculty create/update opportunity including eligibility and link
- Admin create faculty and handle deletion requests
- Student sees only department + broadcast opportunities
- Archive section shows expired opportunities only
- Apply button opens external link in new tab
