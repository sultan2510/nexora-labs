# Deploy Guide — GitHub → Vercel → Supabase (Vercel integration) → Resend

This walks through going from this folder to a live site at your own domain,
using Vercel's built-in Supabase integration (so Supabase is provisioned and
managed right from your Vercel project).

---

## 1. Push this project to GitHub

```bash
cd nexora-labs
git init
git add .
git commit -m "Initial Nexora Labs platform"
```

Create a new empty repo on GitHub (github.com/new), then:

```bash
git remote add origin https://github.com/<your-username>/nexora-labs.git
git branch -M main
git push -u origin main
```

---

## 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
2. Framework preset: Vercel should auto-detect **Vite**. Leave build command
   (`npm run build`) and output directory (`dist`) as default.
3. Don't deploy yet — first add the Supabase integration (next step) so the
   env vars exist before your first build.

---

## 3. Add Supabase via the Vercel integration

1. In your Vercel project → **Storage** tab (or **Integrations**) → **Browse
   Marketplace** → search **Supabase** → **Add Integration**.
2. Choose **Create a new Supabase project** (or link an existing one).
3. Vercel will provision the project and automatically inject these env vars
   into your Vercel project: `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, plus some Postgres
   connection strings you won't need here.

### Important: add the `VITE_` prefixed copies too

Vite only exposes env vars to the browser bundle if they start with `VITE_`.
The integration's auto-injected vars don't have that prefix, so **add two more
vars manually** in Vercel → Project Settings → Environment Variables:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | same value as the auto-injected `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | same value as the auto-injected `SUPABASE_ANON_KEY` |

(Copy the values from the Supabase section of your Vercel env vars, or from
your Supabase project's Settings → API page.)

### Also add these (not provided by the integration)

| Name | Value |
|---|---|
| `RESEND_API_KEY` | from Resend, see step 5 |
| `EMAIL_FROM` | e.g. `Nexora Labs <team@nexoralabs.com>` (must match your verified Resend domain) |
| `WHATSAPP_GROUP_LINKS` | JSON, e.g. `{"frontend":"https://chat.whatsapp.com/xxxx","backend":"https://chat.whatsapp.com/yyyy", ...}` — one entry per domain slug |

Set all of the above for **Production**, **Preview**, and **Development**
environments in Vercel so they're available everywhere.

---

## 4. Set up the database

1. Open your Supabase project (link is in Vercel → Storage → your Supabase
   integration → **Open in Supabase**).
2. Go to **SQL Editor** → **New query**.
3. Paste the entire contents of `supabase/schema.sql` and run it. This creates
   every table, the RLS policies, the storage buckets, and a helper function.
4. Paste the entire contents of `supabase/seed_full.sql` and run it. This
   seeds all 63 tasks (7 per domain × 9 domains) and all 9 quiz banks (30
   questions each: 20 hard + 10 easy, 70% to pass) — everything is ready to
   go, no further content work needed before launch.

---

## 5. Set up Resend

1. Sign up at [resend.com](https://resend.com).
2. Buy a domain if you haven't (Namecheap, GoDaddy, etc.) — e.g. `nexoralabs.com`.
3. In Resend → **Domains** → **Add Domain**, enter it, and add the SPF/DKIM
   DNS records it gives you to your domain's DNS settings. Verification
   usually takes a few minutes to a few hours.
4. Once verified, go to **API Keys** → **Create API Key** → copy it into the
   `RESEND_API_KEY` env var in Vercel (step 3 above).
5. Set `EMAIL_FROM` to an address on your verified domain, e.g.
   `Nexora Labs <team@nexoralabs.com>`.

**Free tier note:** Resend's free tier sends 100 emails/day. With ~500
interns needing an offer letter, plan to approve applicants in daily batches
of ~90–100 rather than all at once, or upgrade Resend's plan if you want to
send them all the same day.

---

## 6. Connect your domain to Vercel

1. Vercel → Project → **Settings** → **Domains** → add `nexoralabs.com` (or
   whichever you bought).
2. Update your domain's DNS with the records Vercel shows you (usually an A
   record or CNAME, depending on whether it's the root domain or a subdomain).
3. Wait for DNS to propagate (can take a few minutes to a few hours) — Vercel
   will show "Valid Configuration" once it's live.

---

## 7. Deploy

Push again (or just trigger a redeploy in Vercel) now that all env vars are
set:

```bash
git commit --allow-empty -m "Trigger deploy"
git push
```

Vercel will build the Vite frontend and deploy everything in `/api` as
serverless functions automatically — no extra configuration needed.

---

## 8. Create the founder admin accounts

Admins aren't created through the UI — create them directly in Supabase, then
send yourselves a password-set link:

1. Supabase Dashboard → **Authentication** → **Users** → **Add user** →
   enter Malik's email → toggle **Auto Confirm User** on → Create.
2. Repeat for Ahmed's email.
3. Copy each user's UUID from the Users list.
4. In Supabase SQL Editor, run:

```sql
insert into admins (id, name, title) values
  ('paste-maliks-uuid-here', 'Malik Sultan Ali', 'Founder'),
  ('paste-ahmeds-uuid-here', 'Ahmed Shaheer', 'CEO');
```

5. Since these accounts were created without a password, each founder needs
   to set one before their first login: go to your live site → `/login` →
   click **Forgot password?** → enter your email → check your inbox for the
   reset link → set a password on the `/set-password` page it opens.
6. Log in again at `/login` with that email and new password — you'll now
   see the **Admin** link in the navbar.

---

## 9. End-to-end test before opening applications

Walk through the whole pipeline once with a test email you control:

1. Go to `/apply`, submit a test application with a real email you can check.
2. Log in as admin → Applications → **Select** the test applicant → confirm
   you receive the offer letter email with the PDF attached.
3. Log in as the test applicant (click the "set your password" link in the
   offer letter email, set a password, then log in) → Dashboard → Tasks →
   submit a
   task with any link.
4. Log in as admin → Submissions → **Approve** it → confirm the badge shows
   up on the intern's dashboard.
5. Repeat for all tasks in the intern's domain until all are approved.
6. As the intern → Certificate tab → follow the NayaPay payment instructions
   → upload any test image as "proof."
7. As admin → Payments → **Verify** it.
8. As the intern → take the quiz → confirm you get an instant result.
9. If you pass: confirm the certificate downloads correctly, and that
   `/verify/<cert-code>` shows it as valid.
10. If you fail: confirm the cooldown message appears, and that after 3 fails
    you're locked out with the right message.

Once this all works end to end, you're ready to open real applications.

---

## Notes / known simplifications

- The Contact page uses a `mailto:` link rather than a server-side send —
  fine for low volume, swap for a Resend-backed `/api/contact` route if you
  want submissions logged in Supabase too.
- All 9 domains are fully seeded (tasks + 30-question quiz banks) via
  `supabase/seed_full.sql` — review the questions before launch since they're
  a solid starting bank, but you may want to swap in your own for domains
  where you want a different bar or focus.
- Password-set and forgot-password emails are sent by Supabase's own auth
  email system, not Resend — and Supabase's default sender has a low rate
  limit meant for testing (a few emails/hour), not production volume. Since
  these only fire on account creation and actual forgotten passwords (not on
  every login), volume is naturally low — but it's still worth configuring
  custom SMTP in Supabase (Settings → Auth → SMTP Settings) using your Resend
  credentials, both to raise that limit and so these emails come from your
  own domain instead of Supabase's shared sender.
- Add `SITE_URL` (your production URL, e.g. `https://nexoralabs.com`) to your
  Vercel env vars — it's used to build the "set your password" link sent in
  the offer letter email.
