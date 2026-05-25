# VedaAI Frontend

Next.js frontend for the VedaAI AI Assessment Creator assignment.

## Requirements

- Node.js 20+
- Backend API running on `http://localhost:4000` by default

## Setup

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

App URL: `http://localhost:3000`

## Environment

`frontend/.env.local.example` contains the public API endpoints used by the UI:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

## Scripts

- `npm run dev` — start the Next.js dev server
- `npm run build` — build for production
- `npm run start` — serve the production build
- `npm run lint` — run ESLint

## Notes

- Assignment state is stored in Zustand and persisted in local storage.
- Real-time assignment and PDF updates are handled with Socket.IO.
- The output page expects the backend queue workers to be running for generation and PDF export.
