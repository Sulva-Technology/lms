-- Storage under membership.
--
-- Migration 020 scoped every bucket with
-- "storage_tenant_id(name) = current_university_id()", which asks which single
-- organisation the caller belongs to. That question no longer has one answer,
-- so each policy asks whether the caller belongs to the organisation that owns
-- the path instead.
--
-- current_user_is_staff() becomes is_staff_in(tenant): a lecturer at one school
-- is not staff everywhere, and under 020 that only held because the staff check
-- was ANDed with a single-tenant comparison that is now gone.
--
-- The key convention is unchanged - {university_id}/{scope}/{owner_id}/{file} -
-- so no stored object moves.

DROP POLICY IF EXISTS "Tenant read course resources" ON storage.objects;
DROP POLICY IF EXISTS "Staff upload course resources" ON storage.objects;
DROP POLICY IF EXISTS "Tenant read lesson video" ON storage.objects;
DROP POLICY IF EXISTS "Staff upload lesson video" ON storage.objects;
DROP POLICY IF EXISTS "Students upload own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students read own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Staff read tenant submissions" ON storage.objects;
DROP POLICY IF EXISTS "Tenant read lecture thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Staff upload lecture thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Tenant read transcripts" ON storage.objects;
DROP POLICY IF EXISTS "Owner read exports" ON storage.objects;
DROP POLICY IF EXISTS "Staff create exports" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Owners update own objects" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete own objects" ON storage.objects;

CREATE POLICY "Members read course resources" ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-resources'
  AND is_member_of(public.storage_tenant_id(name))
);

CREATE POLICY "Staff upload course resources" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-resources'
  AND is_staff_in(public.storage_tenant_id(name))
);

CREATE POLICY "Members read lesson video" ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-video'
  AND is_member_of(public.storage_tenant_id(name))
);

CREATE POLICY "Staff upload lesson video" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-video'
  AND is_staff_in(public.storage_tenant_id(name))
);

CREATE POLICY "Students upload own submissions" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-submissions'
  AND is_member_of(public.storage_tenant_id(name))
  AND split_part(name, '/', 3) = auth.uid()::text
);

CREATE POLICY "Students read own submissions" ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions'
  AND split_part(name, '/', 3) = auth.uid()::text
);

CREATE POLICY "Staff read organisation submissions" ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions'
  AND is_staff_in(public.storage_tenant_id(name))
);

CREATE POLICY "Members read lecture thumbnails" ON storage.objects FOR SELECT
USING (
  bucket_id = 'lecture-thumbnails'
  AND is_member_of(public.storage_tenant_id(name))
);

CREATE POLICY "Staff upload lecture thumbnails" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lecture-thumbnails'
  AND is_staff_in(public.storage_tenant_id(name))
);

CREATE POLICY "Members read transcripts" ON storage.objects FOR SELECT
USING (
  bucket_id = 'transcripts'
  AND is_member_of(public.storage_tenant_id(name))
);

CREATE POLICY "Owner read exports" ON storage.objects FOR SELECT
USING (bucket_id = 'exports' AND split_part(name, '/', 3) = auth.uid()::text);

CREATE POLICY "Staff create exports" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exports'
  AND is_staff_in(public.storage_tenant_id(name))
);

-- Profile images stay public-read because they render as avatars, and a person
-- has one avatar across every organisation, so this is not tenant-scoped.
CREATE POLICY "Users upload own profile image" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images'
  AND split_part(name, '/', 3) = auth.uid()::text
);

CREATE POLICY "Owners update own objects" ON storage.objects FOR UPDATE
USING (split_part(name, '/', 3) = auth.uid()::text)
WITH CHECK (split_part(name, '/', 3) = auth.uid()::text);

CREATE POLICY "Owners delete own objects" ON storage.objects FOR DELETE
USING (split_part(name, '/', 3) = auth.uid()::text);
