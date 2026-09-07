# Scholax Authentication Setup

## Overview
Scholax uses **Supabase** for authentication, supporting both email/password and OAuth (Google) login methods.

## Prerequisites
- Supabase account (https://supabase.com)
- Project created in Supabase dashboard

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in project details:
   - Organization: Create or select
   - Project Name: `scholax-prod`
   - Database Password: Set a strong password
   - Region: Choose closest to your usersf
4. Click "Create new project"

## Step 2: Get API Keys

1. Go to Project Settings → API
2. Copy the following:
   - **Project URL**: Used as `VITE_SUPABASE_URL`
   - **anon public key**: Used as `VITE_SUPABASE_ANON_KEY`

## Step 3: Configure Environment Variables

Create `.env.local` in your project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Set Up Email Provider (Optional but Recommended)

### Using Supabase's Built-in Email
1. Go to Authentication → Providers → Email
2. Configure SMTP settings or use Supabase's default email service

### Using SendGrid or AWS SES
Recommended for production. See "Resend Email Setup" guide.

## Step 5: Enable Google OAuth (Optional)

1. Go to Authentication → Providers → Google
2. Create OAuth credentials in Google Cloud Console:
   - Go to https://console.cloud.google.com
   - Create new project: "Scholax"
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. Copy Client ID and Client Secret
4. Paste into Supabase Google provider settings
5. Enable the provider

## Step 6: Create Users Table (if using custom profile data)

In Supabase SQL Editor, run:

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  avatar_url text,
  subscription text DEFAULT 'free',
  balance decimal(10, 2) DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

## Step 7: Test Authentication Flow

1. Run your app: `npm run dev`
2. Navigate to http://localhost:3000/auth
3. Test email/password signup
4. Test Google OAuth (if configured)
5. Verify tokens are stored in browser localStorage

## Implementation Details

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      first_name: firstName,
      last_name: lastName,
    }
  }
});
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

### Get Current User
```typescript
const { data: { user }, error } = await supabase.auth.getUser();
```

### Sign Out
```typescript
await supabase.auth.signOut();
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Invalid API key" | Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY |
| "Redirect URI mismatch" | Ensure OAuth redirect matches Supabase settings |
| "Email already exists" | User already signed up - use Sign In instead |
| "Session expired" | Supabase auto-refreshes; check browser storage |

## Security Best Practices

1. **Never commit .env files** - Add to .gitignore
2. **Use HTTPS in production** - Supabase handles this
3. **Enable email verification** - Settings → Email Templates
4. **Set session timeout** - Settings → Security
5. **Use RLS policies** - Restrict user data access
6. **Rotate keys regularly** - Monthly rotation recommended

## Production Checklist

- [ ] Configured custom domain (optional)
- [ ] Set up email provider (not using default)
- [ ] Enabled Google OAuth
- [ ] Set session timeout to 24 hours
- [ ] Enabled email verification
- [ ] Tested all auth flows
- [ ] Set up backup recovery codes for admins
- [ ] Configured CORS for your domain
- [ ] Reviewed Row Level Security policies
- [ ] Set up monitoring/alerts

## References
- Supabase Docs: https://supabase.com/docs
- Auth Helpers: https://supabase.com/docs/guides/auth/auth-helpers/react
- Troubleshooting: https://supabase.com/docs/reference/javascript/auth-signup
