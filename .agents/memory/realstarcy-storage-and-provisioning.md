---
name: Realstarcy storage backend and provisioning gotchas
description: Object storage backend choice for uploads, and DB/Clerk provisioning checks needed after import
---

## Uploads use Supabase Storage, not local disk
Realstarcy's `POST /api/upload` route uploads to Supabase Storage (bucket configured via `SUPABASE_UPLOADS_BUCKET` env var, actual bucket is named `Uploads` with capital U) and returns a public URL via `getPublicUrl`.

**Why:** deployment target is autoscale (multiple instances, no shared disk) — local `multer.diskStorage` under `artifacts/api-server/uploads/` caused uploaded images to be invisible from other instances/devices. Firebase Storage was tried first but abandoned (billing card declined, bucket never provisioned in Firebase console).

**How to apply:** Any future upload/media feature must go through `getSupabase()` / `SUPABASE_UPLOADS_BUCKET` from `artifacts/api-server/src/lib/supabase.ts`, never local disk. Multer uses `memoryStorage()` with a 15MB file size limit (kept low deliberately — memoryStorage buffers full file in RAM, so don't raise this without switching to streaming).

## Imported/pre-existing projects may reference infra that was never actually provisioned
This project's code already had full Clerk wiring (proxy middleware, `clerkMiddleware`, frontend `ClerkProvider`) and Drizzle schema, but `checkClerkManagementStatus()` returned `not_configured` and the Postgres DB had zero tables — despite the user insisting "Clerk already works." Code presence is not proof of environment provisioning.

**Why:** the repo was imported/transplanted; secrets and DB state don't travel with source code.

**How to apply:** When a user claims an integration "already works" but you see runtime errors (missing secret key, missing table), verify with the actual status check (`checkClerkManagementStatus`, `psql \dt`) rather than trusting the code or the user's claim. Fix is often just: run `setupClerkWhitelabelAuth()` and `drizzle-kit push` from `lib/db` — no code changes needed.
