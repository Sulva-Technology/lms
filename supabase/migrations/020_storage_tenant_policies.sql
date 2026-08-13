-- Storage hardening.
--
-- Two competing bucket sets existed: migration 006 created vui_* buckets and
-- migration 008 created hyphenated buckets. The hyphenated set is canonical.
--
-- More importantly, every previous storage policy was effectively
-- "auth.role() = 'authenticated'", which let any signed-in user at any
-- university read any other university's assignment submissions and course
-- material. This migration replaces those with tenant-scoped policies.
--
-- New key convention, enforced by lib/storage/paths.ts:
--   {university_id}/{scope}/{owner_id}/{uuid}-{file_name}
-- Segment 1 is the tenant. Segment 3 is the owner.

-- ---------------------------------------------------------------------------
-- 1. Retire the duplicate bucket set.
-- ---------------------------------------------------------------------------
DELETE FROM storage.objects WHERE bucket_id IN ('vui_public', 'vui_materials', 'vui_submissions', 'vui_profiles');
DELETE FROM storage.buckets WHERE id IN ('vui_public', 'vui_materials', 'vui_submissions', 'vui_profiles');

DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Profile images are public" ON storage.objects;
DROP POLICY IF EXISTS "Lecturers can upload materials" ON storage.objects;
DROP POLICY IF EXISTS "Tenant users can view materials" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload submissions" ON storage.objects;
DROP POLICY IF EXISTS "Lecturers and students can view submissions" ON storage.objects;

-- ---------------------------------------------------------------------------
-- 2. Add the lesson video bucket and drop the permissive 008 policies.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-video', 'lesson-video', false)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Tenant read course resources" ON storage.objects;
DROP POLICY IF EXISTS "Lecturers admins upload course resources" ON storage.objects;
DROP POLICY IF EXISTS "Tenant read transcripts" ON storage.objects;
DROP POLICY IF EXISTS "Read exports" ON storage.objects;
DROP POLICY IF EXISTS "Create exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Tenant view lecture thumbnails" ON storage.objects;

-- ---------------------------------------------------------------------------
-- 3. Helpers.
-- ---------------------------------------------------------------------------

-- The caller's university, read from their profile. SECURITY DEFINER so it does
-- not depend on the profiles RLS policy set.
CREATE OR REPLACE FUNCTION public.current_university_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT university_id FROM public.profiles WHERE id = auth.uid();
$$;

-- First path segment of a storage key, as a uuid. NULL when the key does not
-- follow the convention, which makes every tenant comparison fail closed.
CREATE OR REPLACE FUNCTION public.storage_tenant_id(object_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN NULLIF(split_part(object_name, '/', 1), '')::UUID;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

-- Whether the caller holds a staff role.
CREATE OR REPLACE FUNCTION public.current_user_is_staff()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('lecturer', 'department_admin', 'admin', 'super_admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. Course resources: any member of the same university may read; staff write.
-- ---------------------------------------------------------------------------
CREATE POLICY "Tenant read course resources" ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-resources'
  AND public.storage_tenant_id(name) = public.current_university_id()
);

CREATE POLICY "Staff upload course resources" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-resources'
  AND public.storage_tenant_id(name) = public.current_university_id()
  AND public.current_user_is_staff()
);

-- ---------------------------------------------------------------------------
-- 5. Lesson video: same tenant read, staff write.
-- ---------------------------------------------------------------------------
CREATE POLICY "Tenant read lesson video" ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-video'
  AND public.storage_tenant_id(name) = public.current_university_id()
);

CREATE POLICY "Staff upload lesson video" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-video'
  AND public.storage_tenant_id(name) = public.current_university_id()
  AND public.current_user_is_staff()
);

-- ---------------------------------------------------------------------------
-- 6. Submissions: a student sees only their own; staff see their tenant's.
-- ---------------------------------------------------------------------------
CREATE POLICY "Students upload own submissions" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-submissions'
  AND public.storage_tenant_id(name) = public.current_university_id()
  AND split_part(name, '/', 3) = auth.uid()::text
);

CREATE POLICY "Students read own submissions" ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions'
  AND split_part(name, '/', 3) = auth.uid()::text
);

CREATE POLICY "Staff read tenant submissions" ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions'
  AND public.storage_tenant_id(name) = public.current_university_id()
  AND public.current_user_is_staff()
);

-- ---------------------------------------------------------------------------
-- 7. Thumbnails, transcripts, exports, branding.
-- ---------------------------------------------------------------------------
CREATE POLICY "Tenant read lecture thumbnails" ON storage.objects FOR SELECT
USING (
  bucket_id = 'lecture-thumbnails'
  AND public.storage_tenant_id(name) = public.current_university_id()
);

CREATE POLICY "Staff upload lecture thumbnails" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lecture-thumbnails'
  AND public.storage_tenant_id(name) = public.current_university_id()
  AND public.current_user_is_staff()
);

CREATE POLICY "Tenant read transcripts" ON storage.objects FOR SELECT
USING (
  bucket_id = 'transcripts'
  AND public.storage_tenant_id(name) = public.current_university_id()
);

CREATE POLICY "Owner read exports" ON storage.objects FOR SELECT
USING (bucket_id = 'exports' AND split_part(name, '/', 3) = auth.uid()::text);

CREATE POLICY "Staff create exports" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exports'
  AND public.storage_tenant_id(name) = public.current_university_id()
  AND public.current_user_is_staff()
);

-- Profile images stay public-read because they render as avatars, but a user
-- may only write under their own id.
CREATE POLICY "Users upload own profile image" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images'
  AND split_part(name, '/', 3) = auth.uid()::text
);

-- ---------------------------------------------------------------------------
-- 8. Owners may replace or remove their own objects; nobody else may.
-- ---------------------------------------------------------------------------
CREATE POLICY "Owners update own objects" ON storage.objects FOR UPDATE
USING (split_part(name, '/', 3) = auth.uid()::text)
WITH CHECK (split_part(name, '/', 3) = auth.uid()::text);

CREATE POLICY "Owners delete own objects" ON storage.objects FOR DELETE
USING (split_part(name, '/', 3) = auth.uid()::text);
