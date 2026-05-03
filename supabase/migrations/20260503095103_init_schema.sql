-- Create notebooks table
CREATE TABLE IF NOT EXISTS public.notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general', -- 'general' or 'tree'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create nodes table (for tree structure & default container for general notebooks)
CREATE TABLE IF NOT EXISTS public.nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create pages table
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    canvas_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Policies for notebooks
CREATE POLICY "Users can view their own notebooks." ON public.notebooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notebooks." ON public.notebooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notebooks." ON public.notebooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notebooks." ON public.notebooks FOR DELETE USING (auth.uid() = user_id);

-- Policies for nodes
CREATE POLICY "Users can view their own nodes." ON public.nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own nodes." ON public.nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own nodes." ON public.nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own nodes." ON public.nodes FOR DELETE USING (auth.uid() = user_id);

-- Policies for pages
CREATE POLICY "Users can view their own pages." ON public.pages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pages." ON public.pages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pages." ON public.pages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pages." ON public.pages FOR DELETE USING (auth.uid() = user_id);
