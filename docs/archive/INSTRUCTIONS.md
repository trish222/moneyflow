# MoneyFlow - Developer Instructions

## Overview

MoneyFlow is a full-stack finance tracker application built with TypeScript. It helps users manage their transactions, budgets, and financial overview in one place.

**Tech Stack:**
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript, Prisma
- Database: PostgreSQL

---

## Project Structure

```
moneyflow/
├── frontend/                 # React application
│   ├── src/
│   │   ├── App.tsx          # Main app component with routing
│   │   ├── main.tsx         # Entry point that mounts App
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # Summary view (balance, income, spending)
│   │   │   ├── Transactions.tsx # Transaction list UI
│   │   │   └── Budgets.tsx      # Budget management and progress
│   │   ├── index.css        # Global styles
│   │   ├── App.css          # App-specific styles
│   │   └── ...config files
│   └── node_modules/
├── backend/                  # Express API server
│   ├── src/
│   │   └── server.ts        # Main server entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # Database migrations
│   ├── prisma.config.ts     # Prisma configuration
│   └── node_modules/
└── README.md                # General project info
```

---

## File Comments Standard

All source code files that can have comments include a top-level comment describing the file's purpose using this format:

```javascript
/* FileName.tsx describes what this file does.
 * - bullet point with key responsibility or behavior.
 * - another bullet point with additional details.
 */
```

Or for backend files:
```javascript
/**
 * FileName.ts describes what this file does
 * - bullet point with key responsibility or behavior.
 * - another bullet point with additional details.
 */
```

### Files with Comments

**Frontend:**
- `src/App.tsx` — Main component with routing navigation
- `src/main.tsx` — React entry point
- `src/pages/Dashboard.tsx` — Summary view page
- `src/pages/Transactions.tsx` — Transaction list page
- `src/pages/Budgets.tsx` — Budget management page
- `vite.config.ts` — Vite build configuration
- `postcss.config.js` — PostCSS configuration
- `eslint.config.js` — ESLint configuration

**Backend:**
- `src/server.ts` — Express server setup and routes
- `prisma.config.ts` — Prisma ORM configuration

---

## Adding Comments to New Files

When creating new source files (`.ts`, `.tsx`, `.js`, `.jsx`):

1. Add a file-level comment at the top describing its purpose
2. Use bullet points for key responsibilities
3. Include 1-3 bullets depending on complexity
4. Keep descriptions concise and practical

**Example:**
```typescript
/* userService.ts handles user authentication and profile management.
 * - validates user credentials against the database.
 * - manages session tokens and login state.
 */
```

---

## Setup & Running

### Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Environment Configuration

Create `.env` in the `backend/` directory:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=3000
```

### Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
```

---

## Important Notes

- Comments should describe **what** the file does, not **how** it's implemented
- Keep comments updated when file responsibilities change
- Config files should have brief comments explaining their purpose
- Comments should be actionable context for future developers, not nitpicking details
