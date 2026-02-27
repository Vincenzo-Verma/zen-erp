# SaaS ERP Frontend

Portal application for the SaaS ERP platform, built with Vite + React 19 + TypeScript.

## Quick Start
You can run the frontend independently, but API calls (auth, tenancy) require the backend gateway.

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The app will be available at [http://localhost:5173](http://localhost:5173).

## Backend Requirement
The frontend proxies API requests (`/api/*`) to `http://localhost:3000`.
To make API calls work, start the gateway in a separate terminal:

```bash
# In the project root
cargo run --bin gateway
```

## Project Structure
- `src/pages` - Application routes (Login, Dashboard, Admin, etc.)
- `src/components` - Reusable UI components
- `src/lib` - API clients (auth.ts, tenants.ts)
- `src/stores` - Zustand state management
