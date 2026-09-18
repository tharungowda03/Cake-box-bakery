# Cake Box Kakinada

## Project Overview
Digital Ordering Platform for Cake Box – Kakinada.

## Tech Stack
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router.
- **Backend**: Node.js, Express.js, TypeScript.
- **Database/Auth (Planned)**: Supabase (PostgreSQL, Auth, Storage, pgvector).
- **AI (Planned)**: Google Gemini API.

## Project Structure
- `client/`: React frontend application.
- `server/`: Express backend application.
- `data/`: Source of truth files (menu, master information).
- `scripts/`: Development and deployment scripts.

## Development Setup
1. Run `npm install` from the root directory to install dependencies for both client and server.
2. Copy `.env.example` to `.env` and fill in the required values (to be used in Phase 2).

## Environment Variables
See `.env.example` for the required environment variables. Secrets should never be committed to version control.

## Running Frontend
To run only the frontend:
```bash
npm run dev:client
```

## Running Backend
To run only the backend:
```bash
npm run dev:server
```

## Running Both
To run both simultaneously:
```bash
npm run dev
```

## API Health Check
The backend exposes a health check endpoint to verify it is running correctly:
```
GET http://localhost:3000/api/health
```

## Current Phase
**Phase 1 — Project Foundation**

Currently Implemented:
- Monorepo project structure
- React frontend (Vite, TS, Tailwind, shadcn/ui) shell
- Express backend (Node, TS) shell
- Development scripts
- Basic error handling in backend
- API health check

Intentionally NOT implemented yet:
- Database tables or migrations
- Supabase authentication
- RLS policies
- Business logic (products, cart, checkout, orders, custom cakes)
- Data ingestion (Excel/DOCX)
- Gemini integration / RAG
- Deployment configurations
