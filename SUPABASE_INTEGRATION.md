# Supabase Integration for Study App

This document explains how to migrate the Study App from MongoDB to Supabase (PostgreSQL).

## Quick Setup

### 1. Get Supabase Credentials

Go to your Supabase Dashboard: https://supabase.com/dashboard/project/pwiefrivtdypnvqzimwv

- **Project URL**: Settings → API → Project URL
- **Anon Key**: Settings → API → Project API keys → anon/public
- **Service Role Key**: Settings → API → Project API keys → service_role (keep secret!)

### 2. Configure Environment Variables

Copy `.env.example` to `.env` in the backend directory:

```bash
cp .env.example backend/.env
```

Edit `backend/.env` with your Supabase credentials:

```env
SUPABASE_URL=https://pwiefrivtdypnvqzimwv.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

### 3. Run Database Schema

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/pwiefrivtdypnvqzimwv/sql
2. Copy and paste the contents of `supabase_schema.sql`
3. Click "Run"

This creates:
- `profiles` table (extends auth.users)
- `study_plans`, `exercises`, `exercise_submissions`
- `chat_sessions`, `moodle_integrations`, `judge_submissions`
- `schedule_entries`
- Row Level Security (RLS) policies
- Auto-profile creation trigger on signup

### 4. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 5. Use Supabase Auth Routes

Replace the old auth routes with the new Supabase ones in `backend/server.py`:

```python
# Change this:
from routes.auth import router as auth_router

# To this:
from routes.auth_supabase import router as auth_router
```

## Architecture

### Authentication Flow

```
Frontend                    Backend                    Supabase
   |                          |                          |
   |--- POST /auth/register -->|                          |
   |                          |--- signUp() ------------>|
   |                          |<-- user + session -------|
   |<-- 201 + user + token ----|                          |
   |                          |                          |
   |--- POST /auth/login ----->|                          |
   |                          |--- signInWithPassword() ->|
   |                          |<-- user + session -------|
   |<-- 200 + user + token ----|                          |
   |                          |                          |
   |--- GET /auth/me (Bearer) -->|                        |
   |                          |--- getUser(token) ------>|
   |                          |<-- user ------------------|
   |<-- 200 + user ------------|                          |
```

### Database Access

Use the Supabase client in your routes:

```python
from utils.supabase import get_supabase, get_supabase_admin

# For user-specific operations (respects RLS)
supabase = get_supabase()

# For admin operations (bypasses RLS)
supabase_admin = get_supabase_admin()

# Query examples
data = supabase.table("study_plans").select("*").eq("user_id", user_id).execute()
supabase.table("exercises").insert({"user_id": user_id, "title": "Math"}).execute()
```

## Migration Checklist

- [ ] Add Supabase credentials to `.env`
- [ ] Run `supabase_schema.sql` in Supabase SQL Editor
- [ ] Install `supabase` package (`pip install supabase>=2.0.0`)
- [ ] Update `server.py` to use `auth_supabase` router
- [ ] Update other routes to use Supabase client instead of MongoDB
- [ ] Test authentication flow
- [ ] Test database operations
- [ ] Deploy to Render with new environment variables

## Row Level Security (RLS)

All tables have RLS enabled. Policies ensure users can only access their own data:

```sql
-- Example: Users can only see their own study plans
CREATE POLICY "Users can manage own study plans" ON public.study_plans
    FOR ALL USING (auth.uid() = user_id);
```

Admin users (with `is_admin = true` in profiles) can access all data.

## Frontend Integration

The frontend should use the Supabase JS client for auth state management:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    // User logged in - set token for API calls
    api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`
  } else {
    // User logged out
    delete api.defaults.headers.common['Authorization']
  }
})
```

## Environment Variables for Render

Add these in Render Dashboard → Environment:

```
SUPABASE_URL=https://pwiefrivtdypnvqzimwv.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

## Troubleshooting

### "Invalid API key"
- Check that `SUPABASE_KEY` is the **anon/public** key, not service role
- Verify the URL matches your project exactly

### "Row Level Security policy violation"
- Ensure the user is authenticated
- Check that `user_id` in the request matches `auth.uid()`
- For admin operations, use `get_supabase_admin()`

### "JWT expired"
- Tokens expire after 1 hour by default
- Frontend should handle refresh via `supabase.auth.refreshSession()`

### Profile not created on signup
- Check the trigger exists in Supabase SQL Editor
- Verify `handle_new_user()` function was created
- Check logs in Supabase → Logs → Database