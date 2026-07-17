# 🔐 Vaultly — Digital Locker

A secure, full-stack digital locker for uploading, organizing, and retrieving personal files — built with React, Express, Firestore, and Supabase Storage.(https://digital-vaultly.vercel.app)

[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/express-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Firestore](https://img.shields.io/badge/database-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/products/firestore)
[![Supabase](https://img.shields.io/badge/storage-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-Unlicensed-lightgrey)](#license)

---


<img width="1919" height="992" alt="image" src="https://github.com/user-attachments/assets/692d2036-61fa-4bec-ba0e-1b95f0b41f1c" />
<img width="1918" height="996" alt="image" src="https://github.com/user-attachments/assets/95d7ee50-c756-4c02-bba4-9d189840c9ae" />
<img width="1919" height="996" alt="image" src="https://github.com/user-attachments/assets/f9211e2c-aa34-49db-bedc-a36a75dc6169" />
<img width="1919" height="994" alt="image" src="https://github.com/user-attachments/assets/77b58e3d-9c22-4eb4-a2b5-1a70b98a9567" />



## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Set up Firestore](#2-set-up-firestore)
  - [3. Set up Supabase Storage](#3-set-up-supabase-storage)
  - [4. Configure the backend](#4-configure-the-backend)
  - [5. Configure the frontend](#5-configure-the-frontend)
  - [6. Verify the setup](#6-verify-the-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Available Scripts](#available-scripts)
- [Production Build](#production-build)
- [Deployment](#deployment)
- [Security Notes](#security-notes)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Vaultly is a digital locker application that lets users register an account, organize files into folders, and securely upload, download, rename, move, and delete them. File **metadata** (users, folders, file records) lives in **Firestore**, while the actual **file bytes** are stored in a private **Supabase Storage** bucket — keeping structured data and binary storage cleanly separated.

## Features

- 🔑 **Authentication** — register/login with JWT (7-day tokens), password hashing via bcrypt, and a "forgot password" flow with email delivery (or console-logged reset links in local dev)
- 📁 **Folder management** — create, rename, and delete folders
- 📄 **File management** — upload, download, rename, move between folders, and delete files
- 🛡️ **Protected routes** — all folder/file endpoints require a valid JWT
- ⚡ **No disk writes on the server** — files are handled as base64 payloads straight through to Supabase Storage (no `multer`, no temp files)
- 🎨 **Modern UI** — React + Tailwind CSS, with a client-side protected-route guard and auth context

## Architecture

```
┌──────────────┐        HTTPS/JSON         ┌──────────────────┐
│   Frontend   │ ───────────────────────▶ |     Backend       │
│ React + Vite │ ◀─────────────────────── │  Express + JWT    │
└──────────────┘                           └─────────┬────────┘
                                                       │
                                     ┌─────────────────┼─────────────────┐
                                     ▼                                   ▼
                          ┌────────────────────┐              ┌───────────────────┐
                          │      Firestore     │              │  Supabase Storage │
                          │ users / folders /  │              │  locker-files     │
                          │ file metadata      │              │  (private bucket) │
                          └────────────────────┘              └───────────────────┘
```

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
| @supabase/supabase-js | ^2.110.7 | Supabase Storage (file bytes) |
| jsonwebtoken | ^9.0.2 | JWT auth (7-day tokens) |
| bcryptjs | ^2.4.3 | password hashing |
| cors | ^2.8.5 | cross-origin requests |
| dotenv | ^16.4.5 | env var loading |
| nodemailer | ^6.10.1 | password-reset emails |
| nodemon *(dev)* | ^3.1.4 | dev auto-reload |

**Node engine:** `>=18.0.0`

### Data Layer

- **Firestore** — users, folders, and file metadata (via the Firebase Admin SDK)
- **Supabase Storage** — actual file bytes, stored in a private bucket accessed with a service-role key

### Deployment

- **Vercel** — frontend hosting
- **Render** — backend hosting



## Prerequisites

- [Node.js](https://nodejs.org/) `>= 18.0.0` and npm
- A [Firebase](https://console.firebase.google.com/) project with Firestore enabled
- A [Supabase](https://supabase.com/) project with Storage enabled
- (Optional) SMTP credentials for sending password-reset emails in production

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/sakthinathan-viswanathan/Digital-locker.git
cd Digital-locker
```

### 2. Set up Firestore

1. Firebase console → **Build → Firestore Database → Create database**
2. Select **production mode** (locked down) and your preferred region
3. **Project settings → Service accounts → Generate new private key**
   ↳ downloads a JSON file containing `project_id`, `client_email`, and `private_key`

### 3. Set up Supabase Storage

1. Create a project at [supabase.com](https://supabase.com)
2. **Storage → New bucket** → name it `locker-files`, keep it **PRIVATE**
3. **Settings → API** → copy the Project URL and the `service_role` key

### 4. Configure the backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env` (see [Environment Variables](#environment-variables) for details), then:

```bash
npm run dev
```

Expected output:

```
[nodemon] starting `node server.js`
🔐 Digital Locker API running on port 5000
✅ Firestore connected
✅ Supabase Storage connected
```

### 5. Configure the frontend

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

### 6. Verify the setup

```bash
curl http://localhost:5000/api/health
# {"status":"ok","service":"digital-locker-api","time":"..."}

open http://localhost:5173
# register an account, upload a file, done.
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default `5000`) |
| `NODE_ENV` | No | `development` or `production` |
| `JWT_SECRET` | **Yes** | Long random string used to sign JWTs |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `7d`) |
| `FIREBASE_PROJECT_ID` | **Yes** | From the Firebase service account JSON |
| `FIREBASE_CLIENT_EMAIL` | **Yes** | From the Firebase service account JSON |
| `FIREBASE_PRIVATE_KEY` | **Yes** | From the Firebase service account JSON — keep `\n` literal, wrapped in quotes |
| `SUPABASE_URL` | **Yes** | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase service-role key (server-side only, never expose to the client) |
| `SUPABASE_BUCKET` | **Yes** | Storage bucket name (`locker-files`) |
| `CLIENT_ORIGIN` | **Yes** | Comma-separated list of allowed frontend origins for CORS |
| `CLIENT_URL` | No | Base URL used to build password-reset links (defaults to the first `CLIENT_ORIGIN`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | No | SMTP credentials for password-reset emails. If left blank, the backend logs the reset link to the console instead |
| `MAX_UPLOAD_MB` | No | Max upload size in MB (default `15`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **Yes** | Base URL of the backend API, e.g. `http://localhost:5000/api` |

## API Reference

All routes are prefixed with `/api`. Endpoints marked 🔒 require an `Authorization: Bearer <token>` header.

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check |

### Auth (`/api/auth`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Create a new account |
| `POST` | `/login` | Authenticate and receive a JWT |
| `POST` | `/forgot-password` | Request a password-reset email/link |
| `POST` | `/reset-password` | Reset the password using a reset token |
| `GET` | `/me` 🔒 | Get the current authenticated user |

### Folders (`/api/folders`) 🔒

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List folders |
| `POST` | `/` | Create a folder |
| `PUT` | `/:id` | Rename a folder |
| `DELETE` | `/:id` | Delete a folder |

### Files (`/api/files`) 🔒

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List files |
| `POST` | `/` | Upload a file (base64 payload) |
| `GET` | `/:id/download` | Download a file |
| `PATCH` | `/:id/move` | Move a file to another folder |
| `PATCH` | `/:id/rename` | Rename a file |
| `DELETE` | `/:id` | Delete a file |

## Available Scripts

### Backend

| Command | Description |
|---|---|
| `npm run dev` | Start the API with nodemon (auto-reload) |
| `npm start` | Start the API in production mode |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build locally |

## Production Build

```bash
cd frontend
npm run build
# vite v5.4.6 building for production...
# ✓ built in 2.1s → dist/

npm run preview   # sanity-check the build locally
```

## Deployment

| Service | Platform | Config |
|---|---|---|
| Backend | [Render](https://render.com) | New Web Service → root: `backend` → build: `npm install` → start: `npm start` |
| Frontend | [Vercel](https://vercel.com) | Add New Project → root: `frontend` → framework: Vite |

After deploying, verify the backend is reachable:

```bash
curl https://<your-service>.onrender.com/api/health
# {"status":"ok"}
```

Remember to update `CLIENT_ORIGIN` on the backend and `VITE_API_URL` on the frontend to point at your deployed URLs.

## Security Notes

- Passwords are hashed with bcrypt before storage — never stored in plaintext.
- JWTs are signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN` (default 7 days).
- The Supabase Storage bucket is **private**; files are only reachable through the authenticated API, not direct public URLs.
- `SUPABASE_SERVICE_ROLE_KEY` and `FIREBASE_PRIVATE_KEY` are server-only secrets — never commit them or expose them to the frontend.
- Uploads are capped by `MAX_UPLOAD_MB` and rejected with `413 Payload too large` when exceeded.

## Roadmap

- [ ] File sharing / shareable links
- [ ] Storage quota per user
- [ ] Drag-and-drop multi-file upload
- [ ] Automated tests (backend + frontend)

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

1. Fork the repo and create a feature branch
2. Make your changes with clear, focused commits
3. Open a pull request describing the change

## License

No license file is currently included in this repository. Add a `LICENSE` file (e.g. MIT) if you intend for this project to be used or contributed to by others.
