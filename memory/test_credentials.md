# Test Credentials

- Demo: click "Continue as Demo Teacher" (data-testid=demo-signin-btn) on /login. Loads 30-day mock data locally, skips onboarding, and does not write to Supabase.
- New teacher (Supabase): sign up on the /login "Sign up" tab with a real email and password (min 6). Confirm email if Auth confirmation is enabled, then /setup-profile and /onboarding. Data is stored per teacher under RLS.
- If `REACT_APP_SUPABASE_ANON_KEY` is still the placeholder, the app falls back to localStorage auth (same as the old frontend demo).
- Sample roster CSV for import tests: /app/test_reports/test_roster.csv
