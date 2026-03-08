/*
  # Create Telegram Reporter Tables

  1. New Tables
    - `telegram_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `phone_number` (text, encrypted phone number)
      - `session_data` (text, encrypted session data)
      - `account_name` (text, display name for account)
      - `is_active` (boolean, whether account is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `report_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `target_channel` (text, channel username)
      - `report_reason` (text, reason for report)
      - `report_count` (integer, number of reports sent)
      - `accounts_used` (integer, number of accounts used)
      - `status` (text, report status)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own accounts and report history
*/

-- Create telegram_accounts table
CREATE TABLE IF NOT EXISTS telegram_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone_number text NOT NULL,
  session_data text,
  account_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create report_history table
CREATE TABLE IF NOT EXISTS report_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_channel text NOT NULL,
  report_reason text NOT NULL,
  report_count integer DEFAULT 0,
  accounts_used integer DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE telegram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;

-- Policies for telegram_accounts
CREATE POLICY "Users can view own telegram accounts"
  ON telegram_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own telegram accounts"
  ON telegram_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own telegram accounts"
  ON telegram_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own telegram accounts"
  ON telegram_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for report_history
CREATE POLICY "Users can view own report history"
  ON report_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own report history"
  ON report_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telegram_accounts_user_id ON telegram_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_report_history_user_id ON report_history(user_id);
CREATE INDEX IF NOT EXISTS idx_report_history_created_at ON report_history(created_at DESC);
