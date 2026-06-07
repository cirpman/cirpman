-- Verify existence of tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Verify columns in the properties table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'properties';

-- Verify columns in the profiles table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles';

-- Verify RLS policies on the profiles table
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Verify RLS policies on the properties table
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'properties';

-- Verify publication for realtime
SELECT *
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';