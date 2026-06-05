Deployment notes
================

This project stores all data in a JSON file (`db.json`) on the local filesystem. There is no external database to provision.

Local development
-----------------

```bash
npm install
npm run dev
```

The first request to any API route automatically creates `db.json` at the project root.

Frontend on Vercel
------------------

1. Push the repository to GitHub.
2. Import the project in Vercel and use the default Next.js build settings (`npm run build`).
3. No environment variables are required.

> Note: Vercel's filesystem is ephemeral — `db.json` will reset on every deploy and is not shared between serverless function invocations. The JSON store is only appropriate for local/demo use. For production, replace `lib/db.ts` with a hosted database client (Postgres, MongoDB, etc.).

Optional Express backend on Render
----------------------------------

The repo also ships a small Express server in `server/` that exposes the same REST API and stores data in `server/db.json`.

```bash
cd server
npm install
npm run start
```

Point the Next.js frontend at it by setting `NEXT_PUBLIC_API_BASE_URL`, e.g. `http://localhost:10000`.

The provided `render.yaml` deploys this service to Render. Render's free instance disk is also ephemeral — attach a persistent disk (paid plans) if you need the JSON file to survive restarts.
