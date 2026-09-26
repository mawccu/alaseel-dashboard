-- The grants Supabase gives a cloud project by default, written down.
--
-- WHY THIS FILE EXISTS. `harden_access.sql` and `enable-auth.sql` only *tighten* access: they revoke what should
-- not be reachable and grant back what should. They assume the baseline below is already there,
-- because on a Supabase cloud project it is, silently, from the moment the project is created.
--
-- On any database that did not come from Supabase's cloud it is not, and the failure does not
-- look like a missing grant. Every table is present, every row is present, every policy is
-- present, and every request returns
--
--     42501  permission denied for schema public
--
-- A complete database with a dead application. Reproduced on 2026-09-27 restoring a real backup
-- of the Beit Elia project into a self-hosted stack; this project has the same gap.
--
-- IT ALSO MATTERS WITHOUT A RESTORE. Supabase is changing the platform default so these automatic
-- grants are revoked and exposure becomes opt-in. When that reaches this project, the cloud
-- database will behave exactly as a fresh one does today.
--
-- ORDER: apply this FIRST, before schema.sql, then enable-auth.sql and harden_access.sql after it, so their
-- tightening lands on top. Re-running this later undoes them, so re-run harden_access.sql if you do.

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables    in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all functions in schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables    to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to postgres, anon, authenticated, service_role;
