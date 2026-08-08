-- Supabase Database Schema for Study App
-- Execute this in Supabase SQL Editor (https://supabase.com/dashboard/project/pwiefrivtdypnvqzimwv/sql)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users via foreign key)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Study plans table
CREATE TABLE IF NOT EXISTS public.study_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subjects JSONB DEFAULT '[]'::jsonb,
    schedule JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own study plans" ON public.study_plans
    FOR ALL USING (auth.uid() = user_id);

-- Exercises table
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    study_plan_id UUID REFERENCES public.study_plans(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    subject TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    type TEXT CHECK (type IN ('multiple_choice', 'open', 'code', 'math')),
    questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own exercises" ON public.exercises
    FOR ALL USING (auth.uid() = user_id);

-- Exercise submissions
CREATE TABLE IF NOT EXISTS public.exercise_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    score NUMERIC(5,2),
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exercise_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions" ON public.exercise_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions" ON public.exercise_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Moodle integrations
CREATE TABLE IF NOT EXISTS public.moodle_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.moodle_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own moodle integrations" ON public.moodle_integrations
    FOR ALL USING (auth.uid() = user_id);

-- Judge submissions (for code judge)
CREATE TABLE IF NOT EXISTS public.judge_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    problem_id TEXT NOT NULL,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.judge_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own judge submissions" ON public.judge_submissions
    FOR ALL USING (auth.uid() = user_id);

-- Schedule entries
CREATE TABLE IF NOT EXISTS public.schedule_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    recurrence TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own schedule entries" ON public.schedule_entries
    FOR ALL USING (auth.uid() = user_id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_plans_updated_at
    BEFORE UPDATE ON public.study_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
    BEFORE UPDATE ON public.exercises
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_moodle_integrations_updated_at
    BEFORE UPDATE ON public.moodle_integrations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_entries_updated_at
    BEFORE UPDATE ON public.schedule_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();