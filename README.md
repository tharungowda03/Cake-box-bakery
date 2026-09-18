# Cake Box Kakinada

## Project Overview
Digital Ordering Platform for Cake Box – Kakinada.

## Tech Stack
- **Frontend**: React, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, React Router, Lucide.
- **Backend**: Node.js, Express.js, TypeScript.
- **Database/Auth**: Supabase Client Foundation.

## Project Structure
- `client/`: React frontend application.
- `server/`: Express backend application.
- `data/`: Source of truth files (menu, master information).
- `scripts/`: Development and deployment scripts.

## Environment Setup
The project uses a **single root `.env` architecture**. All environment variables are stored in the `.env` file at the root of the repository.

1. Copy `.env.example` to `.env` in the root folder.
2. Provide actual values in `.env`.
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are exposed to the frontend.
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY` are server-only.

## Running the App Locally

1. Install dependencies:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

2. Start the Frontend (Vite):
   ```bash
   cd client
   npm run dev
   # Runs on http://localhost:5173
   ```

3. Start the Backend (Express):
   ```bash
   cd server
   npm run dev
   # Runs on http://localhost:3000
   ```

## Endpoints
- **Health Check**: `GET /api/health` -> Returns a simple JSON response confirming the API is running.

## Current Phase: Phase 1 — Project Foundation

Currently Implemented:
- Monorepo project structure
- React frontend (Vite, TS, Tailwind, shadcn/ui) shell
- Express backend (Node, TS) shell
- Supabase client foundation
- Single root `.env` architecture
- API health check

**Intentionally NOT implemented yet (Reserved for Later Phases):**
- Database tables or migrations
- Supabase authentication
- RLS policies
- Business logic (products, cart, checkout, orders, custom cakes)
- Data ingestion (Excel/DOCX)
- Gemini integration / RAG
- Deployment configurations
