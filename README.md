# Vaultly — Digital Locker System

A secure digital locker to upload, organize into folders, search, and download
documents. React + Tailwind frontend, Node.js/Express backend, with a hybrid
data layer: **Firestore** for users/folders/file metadata, **Supabase
Storage** for the actual file bytes.

Uploads reach the backend as base64 through `express.json()` — **no
multer, no local disk writes**. The Express server pushes file bytes to
Supabase Storage (using a service-role key that only the backend holds) and
stores everything else — accounts, folders, and each file's name/size/folder/
storage-path — in Firestore via the Firebase Admin SDK. Both sets of
credentials are privileged/server-only, so both Firestore and the Supabase
bucket can stay locked down to "deny all direct client access."

```
digital-locker/
├── backend/     Node.js + Express + Firestore (metadata) + Supabase Storage (files)
└── frontend/    React + Vite + Tailwind
```

---

## 1. Run it locally

### Set up Firestore (users, folders, file metadata)

1. Go to the [Firebase console](https://console.firebase.google.com), open
   (or create) your project — e.g. `digital-locker-e327c`.
2. Build → Firestore Database → Create database → Start in **production
   mode** (locked down) → pick a region.
3. Security rules: since only your backend (via the Admin SDK, which bypasses
   rules entirely) ever touches Firestore, set the rules to deny all direct
   client access:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} { allow read, write: if false; }
     }
   }
   ```
4. Service account key: Project settings (gear icon) → Service accounts →
   Generate new private key. This downloads a JSON file — you'll pull three
   values out of it below (`project_id`, `client_email`, `private_key`).
   Keep this file secret; never commit it.

### Set up Supabase Storage (file bytes)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project, go to **Storage** → **New bucket**. Name it something
   like `locker-files`, and leave it **private** (not public) — your backend
   is the only thing that reads/writes it.
3. Go to **Settings → API**. You need two values:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (not the `anon` key!) → `SUPABASE_SERVICE_ROLE_KEY`.
     This key bypasses Row Level Security, which is exactly what you want
     server-side — just never expose it to the frontend or commit it.
4. No further RLS policy setup is needed for a private bucket accessed only
   via the service-role key.

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in:
- From the Firebase service account JSON file:
  `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
  (paste `private_key` exactly as-is — keep the `\n` characters literal,
  wrap the whole thing in quotes)
- From Supabase:
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_BUCKET`
  (the bucket name you created, e.g. `locker-files`)

Then:

```bash
npm run dev                # http://localhost:5000
```

On startup the terminal prints a clear ✅/❌ for both Firestore and Supabase
Storage connectivity — check there first if anything doesn't work.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:5000/api
npm run dev                 # http://localhost:5173
```

Open `http://localhost:5173`, register an account, and start uploading.

---

## 2. Deploy: Vercel + Render + Firebase + Supabase

### Step 1 — Firestore and Supabase Storage

Already done if you followed the two setup sections above. You just need
those same credentials again for Render in the next step.

### Step 2 — Backend (Render)

1. Push this project to a GitHub repo.
2. On [render.com](https://render.com), click **New → Web Service**, connect
   the repo, and set:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
3. Add environment variables (Render dashboard → Environment) using the
   values from `backend/.env.example`:
   - `JWT_SECRET` — generate a long random string
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` —
     from your service account JSON file. For `FIREBASE_PRIVATE_KEY`, paste
     the value with literal `\n` sequences exactly as it appears in the
     JSON — Render's env var editor keeps it as one line, which is what the
     app expects.
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` — from
     your Supabase project's Settings → API page and the bucket you created.
   - `CLIENT_ORIGIN` — your Vercel URL once you have it (you can update this
     after Step 3 and redeploy)
   - `MAX_UPLOAD_MB=15`
4. Deploy. Confirm it's alive by visiting `https://<your-service>.onrender.com/api/health`.

   Note: Render's free tier spins the service down when idle, so the first
   request after inactivity takes a few seconds to wake up — that's expected.

### Step 3 — Frontend (Vercel)

1. On [vercel.com](https://vercel.com), **Add New → Project**, import the
   same repo, and set:
   - **Root directory:** `frontend`
   - **Framework preset:** Vite
2. Add an environment variable:
   - `VITE_API_URL` = `https://<your-render-service>.onrender.com/api`
3. Deploy. `frontend/vercel.json` is already set up so client-side routing
   (`/dashboard`, `/login`, etc.) works on refresh.
4. Go back to Render and update `CLIENT_ORIGIN` to your new Vercel domain
   (e.g. `https://vaultly.vercel.app`), then redeploy the backend so CORS
   allows requests from it.

That's it — register an account on your live Vercel URL and your locker is
running end to end.

---

## API reference

All routes except `/api/auth/register` and `/api/auth/login` require
`Authorization: Bearer <token>`.

| Method | Route                     | Description                          |
|--------|---------------------------|---------------------------------------|
| POST   | `/api/auth/register`      | Create an account                    |
| POST   | `/api/auth/login`         | Sign in, returns a JWT               |
| GET    | `/api/auth/me`            | Current user                         |
| GET    | `/api/folders`            | List folders with file counts        |
| POST   | `/api/folders`            | Create a folder                      |
| PUT    | `/api/folders/:id`        | Rename a folder                      |
| DELETE | `/api/folders/:id`        | Delete a folder                      |
| GET    | `/api/files?folderId&search` | List / filter / search files     |
| POST   | `/api/files`               | Upload a file (`{ name, mimeType, folderId, base64 }`) |
| GET    | `/api/files/:id/download`  | Download a file                      |
| PATCH  | `/api/files/:id/move`      | Move a file to another folder        |
| DELETE | `/api/files/:id`           | Delete a file                        |

## Notes & things to harden before real production use

- Passwords are hashed with bcrypt; tokens are signed JWTs valid for 7 days.
- Firestore security rules should stay set to deny all direct client access
  (see setup step 3) — the Admin SDK on your backend bypasses rules
  entirely, so that's what keeps the data locked down. Likewise, the
  Supabase bucket should stay **private**, since the backend's
  service-role key bypasses Row Level Security regardless of bucket policy.
- File search/filtering happens in memory over each user's file list rather
  than as a Firestore query, to avoid needing manually created composite
  indexes. This is fine for a personal locker's scale (dozens to low
  thousands of files per user); if that grows much larger, consider a real
  search index (Algolia, Typesense) instead.
- There's no file-type allowlist yet — add one in `file.controller.js` if you
  want to restrict uploads to specific document types.
- `MAX_UPLOAD_MB` defaults to 15MB. Raise it in `.env` on both ends if you
  need larger files, keeping in mind Render's request size limits.
- Consider adding rate limiting (`express-rate-limit`) on `/api/auth/*` before
  going live publicly.
