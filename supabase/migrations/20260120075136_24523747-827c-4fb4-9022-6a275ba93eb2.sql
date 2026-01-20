-- Create user_sessions table to track login activity
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  logged_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Manager can view all sessions, users can view their own
CREATE POLICY "Users can view sessions"
  ON public.user_sessions FOR SELECT
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_user_sessions_date ON public.user_sessions(session_date);
CREATE INDEX idx_user_sessions_email ON public.user_sessions(email);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;