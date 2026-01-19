-- Migration to create lodge_documents table
-- This table stores documents uploaded to the lodge library

CREATE TABLE IF NOT EXISTS public.lodge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_url TEXT NOT NULL, -- URL do arquivo no Supabase Storage
  file_name TEXT NOT NULL, -- Nome original do arquivo
  file_size INTEGER, -- Tamanho do arquivo em bytes
  file_type TEXT, -- Tipo MIME do arquivo (application/pdf, etc.)
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_lodge_documents_category ON public.lodge_documents(category);
CREATE INDEX IF NOT EXISTS idx_lodge_documents_upload_date ON public.lodge_documents(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_lodge_documents_uploaded_by ON public.lodge_documents(uploaded_by);

-- Enable RLS
ALTER TABLE public.lodge_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated can view documents" ON public.lodge_documents;
DROP POLICY IF EXISTS "Admins and Editors can insert documents" ON public.lodge_documents;
DROP POLICY IF EXISTS "Admins and Editors can update documents" ON public.lodge_documents;
DROP POLICY IF EXISTS "Admins and Editors can delete documents" ON public.lodge_documents;

-- Authenticated users can view all documents
CREATE POLICY "Authenticated can view documents"
  ON public.lodge_documents FOR SELECT
  TO authenticated
  USING (true);

-- Admins and Editors can insert documents
CREATE POLICY "Admins and Editors can insert documents"
  ON public.lodge_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can update documents
CREATE POLICY "Admins and Editors can update documents"
  ON public.lodge_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );

-- Admins and Editors can delete documents
CREATE POLICY "Admins and Editors can delete documents"
  ON public.lodge_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
  );
