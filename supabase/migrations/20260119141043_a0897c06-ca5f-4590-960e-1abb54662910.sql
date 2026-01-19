-- Add columns for monthly and yearly leave tracking
ALTER TABLE public.leave_balances 
ADD COLUMN IF NOT EXISTS monthly_used_days integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS yearly_used_days integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_limit integer NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS yearly_limit integer NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS last_month_reset timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_year_reset timestamp with time zone DEFAULT now();

-- Create employees table for tracking 15 team members
CREATE TABLE IF NOT EXISTS public.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text UNIQUE NOT NULL,
    department text DEFAULT 'General',
    position text DEFAULT 'Employee',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view employees
CREATE POLICY "Anyone can view employees"
ON public.employees
FOR SELECT
USING (true);

-- Policy: Only managers can insert/update employees (for now, allow all authenticated users)
CREATE POLICY "Authenticated users can manage employees"
ON public.employees
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Insert 15 sample employees
INSERT INTO public.employees (full_name, email, department, position) VALUES
('Pranathi Chandana', 'edulapranathi@gmail.com', 'Management', 'Manager'),
('Divya Reddy', 'divyareddy@gmail.com', 'Engineering', 'Developer'),
('Ravi Kumar', 'ravikumar@approvex.com', 'Engineering', 'Senior Developer'),
('Priya Sharma', 'priyasharma@approvex.com', 'Design', 'UI Designer'),
('Arun Patel', 'arunpatel@approvex.com', 'Engineering', 'Developer'),
('Sneha Gupta', 'snehagupta@approvex.com', 'HR', 'HR Executive'),
('Vikram Singh', 'vikramsingh@approvex.com', 'Finance', 'Accountant'),
('Anita Desai', 'anitadesai@approvex.com', 'Marketing', 'Marketing Lead'),
('Rahul Verma', 'rahulverma@approvex.com', 'Engineering', 'QA Engineer'),
('Meera Joshi', 'meerajoshi@approvex.com', 'Design', 'Graphic Designer'),
('Suresh Nair', 'sureshnair@approvex.com', 'Operations', 'Operations Manager'),
('Kavitha Iyer', 'kavithaiyer@approvex.com', 'Sales', 'Sales Executive'),
('Deepak Menon', 'deepakmenon@approvex.com', 'Engineering', 'DevOps Engineer'),
('Lakshmi Rao', 'lakshmirao@approvex.com', 'Support', 'Support Lead'),
('Karthik Reddy', 'karthikreddy@approvex.com', 'Engineering', 'Frontend Developer')
ON CONFLICT (email) DO NOTHING;

-- Create function to reset monthly leave balances
CREATE OR REPLACE FUNCTION public.reset_monthly_leave_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.leave_balances
  SET monthly_used_days = 0,
      last_month_reset = now()
  WHERE EXTRACT(MONTH FROM last_month_reset) < EXTRACT(MONTH FROM now())
     OR EXTRACT(YEAR FROM last_month_reset) < EXTRACT(YEAR FROM now());
END;
$$;

-- Create function to reset yearly leave balances
CREATE OR REPLACE FUNCTION public.reset_yearly_leave_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.leave_balances
  SET yearly_used_days = 0,
      last_year_reset = now()
  WHERE EXTRACT(YEAR FROM last_year_reset) < EXTRACT(YEAR FROM now());
END;
$$;