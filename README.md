# Nexora Labs — Internship Platform

A working scaffold for the full internship pipeline: public site → application →
admin review → auto offer letter → student dashboard → task submissions → badges
→ paid quiz unlock → auto-graded exam → auto-generated certificate → public
verification page → admin portal for all of it.

**Stack:** React (Vite) + Tailwind · Supabase (Postgres, Auth, Storage) · Vercel
serverless functions (`/api`) · Resend for email · `pdf-lib` for certificate/offer
letter generation.

See **DEPLOY.md** for the full step-by-step deploy guide (GitHub → Vercel →
Supabase integration → Resend → go live).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
npm run dev
```

The `/api` functions only run when deployed on Vercel (or via `vercel dev`
locally, which needs the Vercel CLI: `npm i -g vercel`, then `vercel dev`
instead of `npm run dev`).

## What's fully wired vs. what you still need to fill in

**Fully wired, including content:**
- Public site (Home / About / Tracks / Contact), branded in the Nexora Labs
  red-and-black theme
- Application form → Supabase Storage (CV, private bucket) + `applicants` table
- Password-based login for interns and admins (no per-login emails) — new
  accounts get a one-time "set your password" link inside their offer letter
  email, plus a forgot-password flow for later
- Admin: Applications tab → Select triggers an auto-generated offer letter
  (PDF, both real signatures) emailed via Resend, and creates the intern's
  account + Intern ID automatically
- Student dashboard: Overview, Tasks (weekly, with early-unlock logic),
  submission with a link, badges on approval
- Admin: Submissions and Payments review tabs (signed-URL viewing, private buckets)
- Certificate page: full quiz/cert info panel, payment instructions (NayaPay),
  proof upload, quiz gate
- Quiz: server-graded, instant result, 3-attempt limit with a 24-hour cooldown,
  permanent lockout after 3 fails
- On passing: certificate auto-generated (PDF, dual real signature, valid
  forever) and instantly downloadable
- Public `/verify/:code` certificate verification page
- Admin: Quiz Results and Certificates tabs
- **All 9 domains fully seeded**: 63 tasks (7 per domain) and 270 quiz
  questions (30 per domain: 20 hard + 10 easy, 70% to pass) — see
  `supabase/seed_full.sql`

**You still need to fill in:**
- Your actual WhatsApp group invite links (one per domain) in the
  `WHATSAPP_GROUP_LINKS` env var
- Your Resend sending domain (buy a domain, verify it with Resend)
- Malik's and Ahmed's admin accounts (create their Supabase Auth users, then
  insert their user IDs into the `admins` table — see DEPLOY.md)

## Project structure

```
src/
  pages/            public pages, dashboard pages, admin pages
  components/       Navbar, Footer, Logo, route guards
  lib/               Supabase client, auth context, shared config (domains, cohort dates, fee)
api/
  admin-approve.js   select/reject an applicant, sends offer letter
  quiz-questions.js  serves quiz questions with answers stripped
  quiz-submit.js     grades the quiz, enforces retakes/lockout, issues certificate
  _lib/              server-only Supabase client, PDF templates, email sender
supabase/
  schema.sql         full DB schema + RLS policies + storage buckets
  seed_full.sql       full task + quiz seed data — all 9 domains
```
