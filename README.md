# AISteth — AI-Powered Medical Billing Assistant

AISteth helps healthcare providers with medical billing and coding. You describe a patient encounter, and the app suggests the right billing codes (OHIP / ICD-10 / CPT), flags missed revenue opportunities, and answers billing questions with AI.

The live site runs at **[wiserdoc.com](https://wiserdoc.com)** on Cloudflare Workers. This guide explains how to run your own copy on your computer — **no programming experience needed** if you follow the steps in order.

---

## 1. What you need before starting (one-time installs)

Install these two free programs first:

| Program | What it's for | Where to get it |
|---|---|---|
| **Node.js 20 (LTS)** | Runs the app | [nodejs.org](https://nodejs.org) — click the big green "LTS" button, then run the installer and click Next through everything |
| **Git** | Downloads ("clones") this project | [git-scm.com/downloads](https://git-scm.com/downloads) — install with all default options |

To check they installed correctly: open **PowerShell** (press the Windows key, type `powershell`, press Enter) and type:

```
node --version
git --version
```

Each should print a version number (e.g. `v20.11.0`). If you see *"not recognized"*, restart your computer and try again.

## 2. Download the project

In PowerShell, run these two lines (press Enter after each):

```
git clone https://github.com/aistethxyz-design/medical-billing-rag.git
cd medical-billing-rag
```

This creates a folder called `medical-billing-rag` with all the code inside.

## 3. Set up your keys (the app's "passwords")

The app needs two small settings files. **These files stay on your computer and must never be shared or uploaded** — they're like passwords.

**Step 3a — Copy the templates.** In PowerShell (still inside the project folder), run:

```
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

**Step 3b — Get a Google Client ID** (this is what lets people sign in with their Google account):

1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) and sign in with Google.
2. Create a project if asked, then click **Create Credentials → OAuth client ID → Web application**.
3. Under **Authorized JavaScript origins**, add: `http://localhost:3002`
4. Click Create, and copy the **Client ID** (it looks like `1234-abcd.apps.googleusercontent.com`).

**Step 3c — Paste the Client ID into both files.** Open these two files in Notepad (right-click → Open with → Notepad):

- `backend\.env` — replace the value after `GOOGLE_CLIENT_ID=` with your Client ID. Also change `JWT_SECRET=` to any long random sentence (mash the keyboard — just make it long).
- `frontend\.env` — replace the value after `VITE_GOOGLE_CLIENT_ID=` with the **same** Client ID.

Save both files.

## 4. Start the app

**The easy way:** double-click **`start.bat`** in the project folder. The first run installs everything automatically (takes a few minutes) and then starts the app.

**Or from PowerShell:**

```
npm run start
```

When you see messages that the servers are running, open your web browser and go to:

> **http://localhost:3002**

That's the app. Sign in with Google and you're in. Leave the black PowerShell window open while you use it — closing it stops the app. Next time, just double-click `start.bat` again (it starts much faster after the first time).

## 5. Something not working?

| What you see | What to do |
|---|---|
| "not recognized as a command" | Node.js or Git isn't installed (or needs a restart) — see step 1 |
| Sign-in with Google fails or the button doesn't appear | The Client ID in `frontend\.env` and `backend\.env` doesn't match, or `http://localhost:3002` isn't in your Google Console's authorized origins (step 3b) |
| "Port 3002 is in use" | The app is already running in another window — close it, or just use the new address printed in the window |
| Errors during install | Run `npm run reset` in PowerShell (deletes and reinstalls everything cleanly), then `npm run start` |
| Page loads but features error | The backend probably isn't running — make sure you started with `start.bat` or `npm run start` (which runs both parts), not just the frontend |

Still stuck? [Open an issue on GitHub](https://github.com/aistethxyz-design/medical-billing-rag/issues) describing what you did and what you saw.

---

## For developers

<details>
<summary><strong>Project layout</strong></summary>

```
├── frontend/          # React 18 + Vite + Tailwind app (dev server on :3002)
├── backend/           # Express + TypeScript API (dev server on :3001)
├── worker.js          # Cloudflare Worker: serves the built frontend + embeds the API in production
├── wrangler.toml      # Cloudflare Worker config (deployed as "medical-billing-rag" → wiserdoc.com)
├── RAG/               # Python/Streamlit RAG prototype (Pinecone + OpenRouter) — separate from the main app
├── chatbot/           # Chatbot experiments
├── Codes_by_class.csv # Billing code reference data
├── setup.bat/.ps1     # Windows one-shot setup
└── start.bat          # Windows one-shot run
```

</details>

<details>
<summary><strong>Common commands</strong></summary>

```bash
npm run start        # setup (first time) + run both servers
npm run dev          # run frontend + backend concurrently
npm run dev:frontend # frontend only (:3002)
npm run dev:backend  # backend only (:3001)
npm run build        # production build of both
npm run reset        # nuke node_modules and reinstall
npm run db:studio    # Prisma Studio GUI (backend database)
```

</details>

<details>
<summary><strong>Deploying to Cloudflare Workers (production)</strong></summary>

Production is a single Cloudflare Worker (`worker.js`) that serves the built frontend from `frontend/dist` and handles API routes itself — no separate backend server.

```bash
npm run deploy:cf    # build frontend + wrangler deploy
```

Cloudflare Workers Builds settings (see comments in `wrangler.toml`):
- Build command: `npm ci && npm run build:pages`
- Deploy command: `npx wrangler deploy`

After deploying, in the Cloudflare dashboard bind the `AISTETH_KV` namespace (`npm run cf:kv:create` to create it) and set `VITE_GOOGLE_CLIENT_ID` and `JWT_SECRET` on the Worker. Add your production domain to the Google OAuth authorized origins.

</details>

<details>
<summary><strong>Tech stack</strong></summary>

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Query, React Router
- **Backend:** Node.js, Express, TypeScript, Prisma (SQLite in dev), Google Sign-In + JWT auth
- **Production hosting:** Cloudflare Workers with KV storage
- **AI:** LLM-powered coding suggestions; `RAG/` contains a Pinecone + OpenRouter retrieval prototype

</details>

## Security notes

- **Never commit `.env` files or real API keys.** Only the `*.example` templates with placeholder values belong in git.
- Patient data handling is designed with HIPAA in mind: JWT-authenticated sessions, audit logging, role-based access.

## License

MIT
