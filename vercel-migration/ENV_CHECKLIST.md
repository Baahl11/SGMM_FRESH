# vercel-migration env checklist (Supabase-first)

Required in .env.local (never commit secrets):

- NEXTAUTH_URL=
- NEXTAUTH_SECRET=
- SUPABASE_URL=
- SUPABASE_ANON_KEY=
- SUPABASE_SERVICE_ROLE=   # only for server-side jobs if needed

Optional:
- VERCEL_URL=
- RESEND_API_KEY=          # emails
- TWILIO_ACCOUNT_SID=      # whatsapp
- TWILIO_AUTH_TOKEN=
- OPENAI_API_KEY=          # AI (MVP)

Hard constraints for this project:
- Do NOT reference 127.0.0.1:8000 or local MSI APIs
- Do NOT import src/lib/appApi from the root project
- Use lib/supabase.ts (createClient) everywhere in pages and API Routes

Validation steps:
- [ ] `npm run dev` starts without MSI references in logs
- [ ] Test scripts `test-*.js` hit Supabase-backed API routes
- [ ] Login via NextAuth works and session protects pages
