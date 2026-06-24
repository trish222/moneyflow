# MoneyFlow

MoneyFlow is a full-stack TypeScript application with a React + Vite frontend and an Express + Prisma backend.

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, PostCSS
- Backend: Node.js, Express, TypeScript, Prisma
- Database: PostgreSQL
- Environment: npm

## Project structure

- `frontend/` — React application powered by Vite
- `backend/` — Express API with TypeScript and Prisma
- `backend/prisma/` — Prisma schema and migrations

## Setup

1. Install dependencies

```bash
cd /Users/trishnguyen/projects/moneyflow/backend
npm install

cd /Users/trishnguyen/projects/moneyflow/frontend
npm install
```

2. Configure environment variables for the backend

Create a `.env` file in `backend/` containing at least:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=3000
```

The `PORT` variable is optional; the backend defaults to `3000`.

## Running the app

### Backend

```bash
cd /Users/trishnguyen/projects/moneyflow/backend
npm run dev
```

This starts the Express server in development mode using `ts-node` and `nodemon`.

### Frontend

```bash
cd /Users/trishnguyen/projects/moneyflow/frontend
npm run dev
```

This starts the Vite development server. Open the URL shown in the terminal (usually `http://localhost:5173`).

### Run both

Use two terminals and start backend and frontend separately.

## Build

### Backend production build

```bash
cd /Users/trishnguyen/projects/moneyflow/backend
npm run build
npm start
```

### Frontend production build

```bash
cd /Users/trishnguyen/projects/moneyflow/frontend
npm run build
```

## Database

The backend uses Prisma with a PostgreSQL datasource configured in `backend/prisma/schema.prisma` and `backend/prisma.config.ts`.

Run Prisma migrations after setting `DATABASE_URL` if you need to initialize the database.

## Notes

- The backend exposes a basic API at `/`
- The frontend is configured for React and Tailwind CSS using Vite
- Use npm for dependency management in both folders
