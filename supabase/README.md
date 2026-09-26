# The SQL in this folder is a sequence, not a set

Apply in this order. Written 2026-09-27, after a restore drill on the Beit Elia project showed what
goes wrong when these are replayed on a database Supabase did not create.

| # | File | Written |
|---|---|---|
| 0 | **`00_baseline_grants.sql`** | 27 Sep, see below |
| 1 | `schema.sql` | 22 Sep |
| 2 | `enable-auth.sql` | 24 Sep |
| 3 | `harden_access.sql` | 24 Sep |

**No function is defined twice here**, and this database has no functions at all, checked against
the live project on 2026-09-27. So the only ordering trap is the baseline.

## Restoring from a backup

🔴 **This project is not backed up yet.** The nightly job in `~/al-aseel-backups` covers the Beit
Elia and Tawasif projects only. Adding this one needs its database password set, then two lines in
that workflow's matrix. It is the newest dashboard and the only one with no copy of its data
anywhere.

When it is covered, restore in this order:

1. **Create the Supabase roles first** (`anon`, `authenticated`, `service_role`, `authenticator`,
   `supabase_auth_admin`, `supabase_storage_admin`, `supabase_admin`, `dashboard_user`), or **every
   RLS policy silently fails to restore** and the tables come back unprotected.
2. Restore `auth.users`, then `auth.identities` **as a separate step**.
3. Then the schema, then `00_baseline_grants.sql`, then `harden_access.sql`.
4. **Reload PostgREST**, which caches the schema.

## This project sends email

`src/lib/auth.js` calls `resetPasswordForEmail`. Hosted Supabase provides the mailer; any other
host does not, so SMTP has to be configured before a password reset can work.
