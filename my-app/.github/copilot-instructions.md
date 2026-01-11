<!-- Copilot instructions for AI coding agents in this repo -->
Purpose: Help an AI agent be immediately productive with edits, PRs, and debugging.

- Quick facts:
  - Framework: Next.js (App Router) — see `app/` directory.
  - React 19, Next 16, Tailwind v4. Key deps: `@stream-io/*`, `stream-chat*` (see `package.json`).
  - Scripts: `npm run dev`, `npm run build`, `npm start`, `npm run lint`.

- Key locations (examples):
  - Entry UI: `app/page.js` (client component; join flow uses `NEXT_PUBLIC_CALL_ID`).
  - Meeting page: `app/meeting/[id]/page.jsx` (route param + meeting UI).
  - API token endpoint: `app/api/token/route.js` (server route for exchanging/generating tokens).
  - Components: `app/components/meeting-room.jsx`, `stream-provider.jsx`, `transcript.jsx`.
  - Hooks: `app/hooks/use-stream-clients.js` (stream client initialization patterns).

- Project-specific conventions to follow:
  - App Router conventions: put route UI under `app/`. Use file names and folders as routes.
  - Client vs server: files with a top-line `"use client"` are client components (e.g., `app/page.js`); avoid importing browser-only APIs in server components.
  - API routes live under `app/api/*/route.js` and should export the route handler; treat them as server-only.
  - Public environment variables must be prefixed with `NEXT_PUBLIC_`. Do not move secret keys into client bundles.
  - Styling is Tailwind-first — prefer editing `globals.css` and using utility classes in JSX.

- Integration notes (important):
  - Stream Video/Chat SDKs are used. Token exchange happens via `app/api/token/route.js`; changes there affect client join flows.
  - `process.env.NEXT_PUBLIC_CALL_ID` is used by the join UI in `app/page.js`. If you change how meetings are selected, update both client and any server-side defaults.

- Editing guidance / PR checklist for agents:
  - Preserve client/server separation. If moving code to server, ensure secrets are not exposed and update `app/api` routes accordingly.
  - After edits, verify locally with `npm run dev` and test the join → meeting flow in the browser.
  - Run `npm run lint` for style/ESLint issues.
  - Update or add examples in the `app/components` folder if you change component props or initialization patterns.

- Useful examples to reference:
  - Client join flow: `app/page.js` uses `useState`, `useRouter` and pushes to `/meeting/${meetingId}?name=...`.
  - Token server: `app/api/token/route.js` is the place to add authentication/token fixes rather than modifying client code.

- What not to do:
  - Do not hardcode secret keys into client files. Use environment variables and server routes.
  - Do not convert server route handlers into client components.

If anything here is unclear or you want more examples (tests, CI, or deeper call flows), say which area and I will extend this file.
