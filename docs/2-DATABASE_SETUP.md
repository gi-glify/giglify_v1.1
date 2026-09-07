# Scholax Database Setup

## Overview
Scholax uses **Supabase PostgreSQL** database for all data persistence including users, tasks, transactions, and payments.

## Database Schema

### 1. Profiles Table
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  avatar_url text,
  subscription text DEFAULT 'free' CHECK (subscription IN ('free', 'pro', 'elite')),
  balance decimal(10, 2) DEFAULT 0,
  total_earnings decimal(10, 2) DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_subscription ON profiles(subscription);
```

### 2. Tasks Table
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('academic', 'rlhf')),
  reward decimal(10, 2) NOT NULL,
  estimated_time int NOT NULL,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  requires_desktop boolean DEFAULT false,
  instructions text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_difficulty ON tasks(difficulty);
```

### 3. User Tasks Table
```sql
CREATE TABLE IF NOT EXISTS user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status text DEFAULT 'available' CHECK (status IN ('available', 'in-progress', 'completed', 'skipped')),
  completed_at timestamp,
  feedback text,
  rating int CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  UNIQUE(user_id, task_id)
);

CREATE INDEX idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX idx_user_tasks_status ON user_tasks(status);
CREATE INDEX idx_user_tasks_completed_at ON user_tasks(completed_at);
```

### 4. Transactions Table
```sql
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'task-reward', 'refund')),
  amount decimal(10, 2) NOT NULL,
  currency text DEFAULT 'USD' CHECK (currency IN ('USD', 'KES')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description text,
  metadata jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

### 5. Payments Table
```sql
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id),
  provider text NOT NULL CHECK (provider IN ('stripe', 'paypal', 'mpesa')),
  provider_payment_id text,
  amount decimal(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message text,
  metadata jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_provider ON payments(provider);
CREATE INDEX idx_payments_status ON payments(status);
```

### 6. Device Logs Table
```sql
CREATE TABLE IF NOT EXISTS device_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cpu_cores int,
  screen_width int,
  screen_height int,
  operating_system text,
  browser text,
  connection_speed text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX idx_device_logs_user_id ON device_logs(user_id);
```

## Enable Row Level Security (RLS)

```sql
-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- User Tasks
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tasks"
  ON user_tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their tasks"
  ON user_tasks
  FOR UPDATE
  USING (auth.uid() = user_id);
```

## Setup Instructions

### 1. Copy All SQL
Copy the entire schema above.

### 2. Run in Supabase SQL Editor
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Click "New Query"
4. Paste the SQL
5. Click "Run"

### 3. Verify Tables Created
1. Go to "Table Editor"
2. Verify all tables are visible:
   - profiles
   - tasks
   - user_tasks
   - transactions
   - payments
   - device_logs

## API Integration Examples

### Create User Profile
```typescript
const { data, error } = await supabase
  .from('profiles')
  .insert([{
    id: userId,
    email,
    first_name: firstName,
    last_name: lastName,
  }])
  .select();
```

### Get User Profile
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

### Get Available Tasks
```typescript
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('category', 'academic')
  .order('reward', { ascending: false });
```

### Create Transaction
```typescript
const { data, error } = await supabase
  .from('transactions')
  .insert([{
    user_id: userId,
    type: 'task-reward',
    amount: taskReward,
    currency: 'USD',
    status: 'completed',
    description: 'Task completion reward',
  }])
  .select();
```

### Update User Balance
```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({ balance: newBalance })
  .eq('id', userId)
  .select();
```

## Backup & Recovery

### Automated Backups
Supabase provides automated daily backups on all plans.

### Manual Backup
1. Go to Settings → Backups
2. Click "Request backup now"
3. Download backup file (zip format)

### Restore from Backup
Contact Supabase support for restore operations.

## Performance Optimization

### Add Indexes
Already included in schema above. Additional indexes for high-traffic fields:

```sql
-- If querying tasks frequently by created_at
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- For transaction queries by date range
CREATE INDEX idx_transactions_date_range ON transactions(created_at DESC, user_id);
```

### Query Optimization
```typescript
// ✅ Good: Only select needed fields
const { data } = await supabase
  .from('profiles')
  .select('id, email, subscription, balance')
  .eq('id', userId);

// ❌ Bad: Select all fields if you don't need them
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);
```

## Monitoring

### View Logs
1. Go to Logs Explorer
2. Filter by time range
3. Search for errors or specific queries

### Set Up Alerts
1. Settings → Alerts
2. Create alert for:
   - Database size threshold
   - Failed queries
   - Connection limit exceeded

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "relation does not exist" | Ensure tables are created via SQL editor |
| "permission denied" | Check RLS policies - verify auth context |
| "Connection timeout" | Increase pool size or optimize queries |
| "Storage quota exceeded" | Check table sizes, consider archiving old records |

## Next Steps
- [Email Setup](./3-RESEND_EMAIL_SETUP.md)
- [Payment Integration](./4-PAYMENT_SETUP.md)
