# Vaultly — Digital Locker

## Tech Stack

### Frontend — `digital-locker/frontend`

| Package | Version | Purpose |
|---|---|---|
| react | ^18.3.1 | UI library |
| react-dom | ^18.3.1 | DOM renderer |
| react-router-dom | ^6.26.2 | client-side routing |
| axios | ^1.7.7 | HTTP client |
| lucide-react | ^0.441.0 | icon set |
| vite *(dev)* | ^5.4.6 | build tool / dev server |
| @vitejs/plugin-react *(dev)* | ^4.3.1 | React fast-refresh for Vite |
| tailwindcss *(dev)* | ^3.4.10 | utility-first CSS |
| postcss *(dev)* | ^8.4.45 | CSS transforms |
| autoprefixer *(dev)* | ^10.4.20 | vendor prefixing |

### Backend — `digital-locker/backend`

| Package | Version | Purpose |
|---|---|---|
| express | ^4.19.2 | web framework |
| firebase-admin | ^12.6.0 | Firestore access (users/folders/metadata) |
| @supabase/supabase-js | ^2.45.4 | Supabase Storage (file bytes) |
| jsonwebtoken | ^9.0.2 | JWT auth (7-day tokens) |
| bcryptjs | ^2.4.3 | password hashing |
| cors | ^2.8.5 | cross-origin requests |
| dotenv | ^16.4.5 | env var loading |
| nodemon *(dev)* | ^3.1.4 | dev auto-reload |

Node engine: `>=18.0.0`

### Data layer

- **Firestore** — users, folders, file metadata (via Firebase Admin SDK)
- **Supabase Storage** — actual file bytes, private bucket, service-role key

### Deployment

- **Vercel** — frontend hosting
- **Render** — backend hosting

---

## Project Initialization

### 0. Clone / extract

```bash
git clone https://github.com/<you>/vaultly-digital-locker.git
cd vaultly-digital-locker/digital-locker
```

### 1. Firestore project setup *(one-time, via Firebase console)*

1. Firebase console → **Build → Firestore Database → Create database**
2. Select **production mode** (locked down) + region
3. **Project settings → Service accounts → Generate new private key**
   ↳ downloads JSON with `project_id` / `client_email` / `private_key`

### 2. Supabase Storage setup *(one-time, via supabase.com)*

1. Create project at [supabase.com](https://supabase.com)
2. **Storage → New bucket** → name it `locker-files`, keep **PRIVATE**
3. **Settings → API** → copy Project URL + `service_role` key

### 3. Backend init

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```env
PORT=5000
JWT_SECRET=<generate a long random string>
FIREBASE_PROJECT_ID=<from service account JSON>
FIREBASE_CLIENT_EMAIL=<from service account JSON>
FIREBASE_PRIVATE_KEY="<from service account JSON, keep \n literal>"
SUPABASE_URL=<from Supabase Settings → API>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase Settings → API>
SUPABASE_BUCKET=locker-files
CLIENT_ORIGIN=http://localhost:5173
MAX_UPLOAD_MB=15
```

```bash
npm run dev
```

Expected output:

```
[nodemon] starting `node server.js`
✅ Firestore connected
✅ Supabase Storage connected
🚀 Server listening on http://localhost:5000
```

### 4. Frontend init

```bash
cd ../frontend
npm install
cp .env.example .env
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm run dev
```

Expected output:

```
  VITE v5.4.6  ready in 320 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 5. Verify

```bash
curl http://localhost:5000/api/health
# {"status":"ok"}

open http://localhost:5173
# register an account, upload a file, done.
```

---

## Production Build *(optional, before deploy)*

```bash
cd frontend
npm run build
# vite v5.4.6 building for production...
# ✓ built in 2.1s → dist/

npm run preview   # sanity-check the build locally
```

## Deploy

- **Render** → New Web Service → root: `backend` → build: `npm install` → start: `npm start`
- **Vercel** → Add New Project → root: `frontend` → framework: Vite

```bash
curl https://<your-service>.onrender.com/api/health
# {"status":"ok"}
```
