# JIRRA — CMS V2

The existing JIRRA visual design plus a Supabase-backed content system.

## What V2 adds
- Email/password admin login
- Admin allow-list (an authenticated user is NOT automatically an admin)
- Postgres database for posts, posters, events, culture, football and community updates
- Image + video uploads to Supabase Storage
- Draft / publish workflow
- Public homepage automatically reads published content
- Delete and one-click publish from the admin dashboard

## Setup
1. Create a Supabase project.
2. Open Supabase SQL Editor and run `setup.sql` once.
3. In Authentication > Users, create your admin user with email/password.
4. Copy that user's UUID and run:
   `insert into public.admin_users(user_id) values ('YOUR-UUID');`
5. In Supabase Project Settings/API, copy the Project URL and publishable key (or legacy anon key).
6. Paste those two PUBLIC values into `config.js`.
   NEVER paste the `service_role` key into this website.
7. Commit and push the changes. Netlify will redeploy automatically.
8. Visit `https://jirraa.com/admin.html` and sign in.

The `media` bucket is public for serving published website photos/videos, but uploads/updates/deletes are protected by RLS and limited to allow-listed admins.

## Normal workflow
Content updates: sign in at `/admin.html` → upload/write → publish. No Git required.
Code/design updates: edit locally → `git add .` → `git commit` → `git push` → Netlify deploys.
