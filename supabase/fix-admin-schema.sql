-- =========================================================
-- DRAGONBYTE ADMIN MIGRATION
-- For the CURRENT snake_case DragonByte schema
-- =========================================================

-- =========================================================
-- MEMBERS
-- =========================================================

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS photo text;

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS linkedin text;

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS github text;


-- =========================================================
-- CONTRIBUTORS
-- =========================================================

ALTER TABLE public.contributors
ADD COLUMN IF NOT EXISTS photo text;

ALTER TABLE public.contributors
ADD COLUMN IF NOT EXISTS github text;

ALTER TABLE public.contributors
ADD COLUMN IF NOT EXISTS linkedin text;

ALTER TABLE public.contributors
ADD COLUMN IF NOT EXISTS cover_photo text;


-- =========================================================
-- EVENTS
-- =========================================================

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS cover_photo text;


-- =========================================================
-- PROJECTS
-- =========================================================

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS cover_photo text;


-- =========================================================
-- STORAGE BUCKET
-- =========================================================

INSERT INTO storage.buckets
(
    id,
    name,
    public
)
VALUES
(
    'dragonbyte-media',
    'dragonbyte-media',
    true
)
ON CONFLICT (id)
DO UPDATE SET
    public = true;


-- =========================================================
-- STORAGE POLICIES
-- =========================================================

DROP POLICY IF EXISTS
"DragonByte public media read"
ON storage.objects;

CREATE POLICY
"DragonByte public media read"
ON storage.objects
FOR SELECT
USING
(
    bucket_id = 'dragonbyte-media'
);


DROP POLICY IF EXISTS
"DragonByte authenticated media upload"
ON storage.objects;

CREATE POLICY
"DragonByte authenticated media upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK
(
    bucket_id = 'dragonbyte-media'
);


DROP POLICY IF EXISTS
"DragonByte authenticated media update"
ON storage.objects;

CREATE POLICY
"DragonByte authenticated media update"
ON storage.objects
FOR UPDATE
TO authenticated
USING
(
    bucket_id = 'dragonbyte-media'
)
WITH CHECK
(
    bucket_id = 'dragonbyte-media'
);


DROP POLICY IF EXISTS
"DragonByte authenticated media delete"
ON storage.objects;

CREATE POLICY
"DragonByte authenticated media delete"
ON storage.objects
FOR DELETE
TO authenticated
USING
(
    bucket_id = 'dragonbyte-media'
);


-- =========================================================
-- RELOAD POSTGREST
-- =========================================================

NOTIFY pgrst, 'reload schema';