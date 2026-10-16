# ILM — Integrated Learning Master

A complete educational management web application built with React 19, TypeScript, Tailwind CSS, Express, Drizzle ORM, Cloud SQL (PostgreSQL), and Firebase Authentication.

## Core Architecture & Features

1. **Three Distinct Access Experiences**
   - **Public Website (No Login Required):** Featured Poster showcase with *Change Poster* sequence navigation, U1–U6 cohort explorer, public scholar profiles (strictly displaying name, photograph, and class), moderated class feed gallery, permanent official weekly results archive, and Common + Class digital libraries with in-app preview and download.
   - **Super Admin Dashboard:** Full global control over all six classes (`U1`–`U6`), administrators (`1 active Class Admin per class` rule), participants, competition category capacities, automatic posters, feed moderation queue, official weekly results (`Best Speaker` & `Best Naat`), libraries, activity logs, and platform settings.
   - **Class Admin Dashboard:** Strictly isolated to the administrator's assigned class (`U1`, `U2`, `U3`, `U4`, `U5`, or `U6`) enforced at the backend and database query layer.
   - **Zero Student Accounts:** No student login, signup, or student dashboard exists.

2. **Six Cohorts (`U1` – `U6`) & Competition Capacities**
   - Supported classes: `U1`, `U2`, `U3`, `U4`, `U5`, `U6` (no `U7`).
   - Exact per-class category limits enforced inside PostgreSQL transactions:
     - **Naat:** 6
     - **Speech:** 5
     - **Aah Counter:** 1
     - **Evolution:** 5
     - **Marshal:** 1
     - **Grammarian:** 1

3. **Automatic Poster Generation**
   - Adding, editing, or removing a participant automatically composes and updates the corresponding class and category poster (`src/lib/posterSvg.ts`) and supports high-resolution PNG/SVG export.

## Database & Environment Setup

The application uses Cloud SQL (PostgreSQL) managed with Drizzle ORM (`src/db/schema.ts` and `src/db/drizzle.config.ts`).

Required runtime environment variables (automatically injected in Cloud Run / AI Studio):
- `SQL_HOST`
- `SQL_DB_NAME`
- `SQL_USER`
- `SQL_PASSWORD`
- `SQL_ADMIN_USER`
- `SQL_ADMIN_PASSWORD`

## Scripts

- `npm run dev` — Starts the full-stack Express + Vite server on port 3000.
- `npm run build` — Builds the production frontend bundle (`dist/`).
- `npm start` — Starts the production server on port 3000.
- `npm run lint` — Runs TypeScript type checking (`tsc --noEmit`).
