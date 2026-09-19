# Infiro

An educational mathematics platform — structured course content, adaptive leveling tests, and role-based panels for students, teachers, and admins. Built on Keycloak for OAuth2 / OpenID Connect authentication, with a Flask REST API, a Next.js panel, and an Expo mobile app, all running behind a single nginx entrypoint via `docker compose`.

<p>
  <img alt="Flask" src="https://img.shields.io/badge/Flask-Python%203.12-000000?logo=flask&logoColor=white">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?logo=next.js">
  <img alt="Expo" src="https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white">
  <img alt="Keycloak" src="https://img.shields.io/badge/Keycloak-26-4D4D4D?logo=keycloak&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white">
</p>

## Overview

The project organizes course content into sections → subsections → tasks, with a short theory e-book attached to each subsection. Tasks come in three types and three difficulty levels, and every task carries per-theme variants so the same exercise can be framed around a student's interests. Students work through this content, a leveling test, and timed practice from a React Native (Expo) app; admins manage content, students, and teachers, while teachers get read-only access to sections and student results, both from a Next.js panel. A single Flask REST API backs both clients and validates every request by verifying the JWT against Keycloak's JWKS endpoint. Keycloak is the single source of truth for identity — the realm defines the `admin`, `ROLE_TEACHER`, and `ROLE_STUDENT` roles, and members of the `nauczyciele` (teachers) group receive `ROLE_TEACHER`.

## Table of Contents

- [Infiro](#infiro)
  - [Overview](#overview)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Architecture](#architecture)
  - [Tech Stack](#tech-stack)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Clone](#clone)
    - [Environment Variables](#environment-variables)
    - [Run Backend \& Infrastructure](#run-backend--infrastructure)
    - [Run the Mobile App](#run-the-mobile-app)
  - [Services](#services)
  - [User Roles](#user-roles)
  - [Creating Accounts](#creating-accounts)
  - [API Reference](#api-reference)
  - [Project Structure](#project-structure)
  - [Documentation](#documentation)

## Features

**Course content**
- Content structured as sections → subsections → tasks
- Three task types — single choice, short answer, and memory (pair matching)
- Three difficulty levels per subsection
- Per-theme variants of every task, chosen from seven student interests (sport, games, LEGO, animals, drawing, music, food)
- One theory e-book per subsection, with text, images, lists, and callouts
- Bulk import of tasks (JSON) and e-books (ZIP with images) from the admin panel

**Students**
- Browse sections and subsections, work through tasks with instant feedback
- Three attempts per task; the solution is revealed after the last failed attempt
- Higher difficulty levels unlock once every task on the level below is solved
- Timed practice — up to 20 single-choice questions in 60 seconds
- Leveling (diagnostic) test with per-section results and attempt history
- Theory e-book reader
- Fractions rendered in stacked notation
- Personal stats, interests, and profile

**Teachers & Admins**
- Teacher panel — read-only view of sections and student results
- Admin panel — manage sections, subsections, tasks, students, and teachers, and import content
- Role and access control fully driven by Keycloak (realm roles + groups)

**Authentication**
- Login and registration via Keycloak (OAuth2 + OpenID Connect)
- Backend validates every request by fetching signing keys from Keycloak's JWKS endpoint — no session state on the API
- A single nginx entrypoint routes traffic to Keycloak, the API, and the web panel

## Architecture

```mermaid
graph LR
  subgraph Clients
    MOBILE["mobile\nExpo / React Native\nStudent\nclient: matematyka-mobile"]
    STAFF["staff\nNext.js panel\nAdmin + Teacher\nclient: nextjs-app"]
  end

  subgraph "Docker network"
    NGINX["nginx :80\nsingle entrypoint"]
    KC["Keycloak\nmatematyka-app realm"]
    API["backend :5000\nFlask REST API + JWKS validation"]
    DB[("PostgreSQL")]
    UPLOADS[("static/uploads\nvolume")]
  end

  MOBILE -- "Authorization Code + PKCE" --> NGINX
  STAFF -- "Authorization Code + PKCE" --> NGINX
  MOBILE -- "Bearer token /api" --> NGINX
  STAFF -- "Bearer token /api" --> NGINX
  NGINX -- "/realms, /admin, /resources" --> KC
  NGINX -- "/api, /static" --> API
  NGINX -- "/" --> STAFF
  API -- "SQL" --> DB
  API -- "task images, e-book images" --> UPLOADS
```

## Tech Stack

| Layer | Technology |
|---|---|
| Authorization Server | Keycloak 26 |
| Backend | Python 3.12, Flask, Flask-SQLAlchemy, Flask-Migrate (applied on startup), PyJWT, jsonschema, Pillow |
| Web panel (staff) | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, keycloak-js |
| Mobile app | Expo SDK 57, React Native 0.86, React 19, TypeScript, Expo Router, expo-auth-session, NativeWind |
| Database | PostgreSQL 16 |
| File storage | Docker bind mount (`backend/app/static/uploads`) for task and e-book images |
| Reverse proxy | nginx |
| Testing | pytest |
| Infrastructure | Docker Compose |

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Docker Desktop | latest |
| Docker Compose | v2+ |
| Node.js | 20+ (for running the mobile app locally) |
| Android Studio or Expo Go | for running the mobile app |

### Clone

```bash
git clone https://github.com/jpolchowska/infiro.git
cd infiro
```

### Environment Variables

```bash
cp .env.example .env
# fill in .env with your values
```

Create the database password secret:

```bash
echo "mysecretpassword" > infrastructure/secrets/db_password.txt
```

Then set up the mobile app's environment file — see [Run the Mobile App](#run-the-mobile-app).

### Run Backend & Infrastructure

First run, or after changing a Dockerfile:

```bash
docker compose build
```

Every time while developing (rebuilds and syncs on file changes):

```bash
docker compose watch
```

### Run the Mobile App

```bash
cp mobile/.env.example mobile/.env
# fill in mobile/.env — see the comments in mobile/.env.example for
# Android Studio vs. Expo Go configuration
```

From the `mobile/` directory:

```bash
npx expo start
```

- **Android Studio:** press `a` once the dev server starts.
- **Expo Go:** scan the printed QR code.

## Services

Everything is served through the nginx entrypoint on `http://localhost`:

| Path | Routed to |
|---|---|
| `/` | staff — Next.js panel |
| `/api/`, `/static/` | backend — Flask REST API |
| `/realms/`, `/admin/`, `/resources/` | Keycloak |

## User Roles

| Role | Permissions |
|---|---|
| **Admin** (`admin`) | manage sections, subsections, tasks, students, and teachers; import tasks and e-books |
| **Teacher** (`ROLE_TEACHER`, via the `nauczyciele` group) | view sections and student results (read-only) |
| **Student** (`ROLE_STUDENT`) | browse content, complete tasks, read e-books, take timed practice and the leveling test |

## Creating Accounts

Account creation and role assignment currently happen directly in the Keycloak admin console, under the `matematyka-app` realm.

**Student (Uczeń)**
1. Log in to the Keycloak admin console.
2. Go to the `matematyka-app` realm → **Users** → create a new user with the form.

**Teacher (Nauczyciel)**
1. Same as above, then open the created user → **Groups** → **Join Group**.
2. Select `nauczyciele` and join.

**Admin (Administrator)**
1. Create the user as above.
2. Create an `admin` role under **Realm roles** (if it doesn't exist yet).
3. On the user, go to **Role mapping** → **Assign role**, filter by realm roles, and assign `admin`.

## API Reference

All endpoints require `Authorization: Bearer <token>` unless noted otherwise.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/public` | Health/status check (public) |
| `GET` | `/api/tasks` | List tasks |
| `GET` | `/api/tasks/:id` | Get a single task |
| `GET` | `/api/student` | Student overview |
| `GET` | `/api/student/me` | Current student's profile |
| `PATCH` | `/api/student/interest` | Update student interests |
| `GET` | `/api/student/sections` | List sections for the student |
| `GET` | `/api/student/subsections/:id/tasks` | List tasks in a subsection |
| `GET` | `/api/student/stats` | Student statistics |
| `GET` | `/api/student/leveling-test` | Get a leveling test attempt |
| `POST` | `/api/student/leveling-test/submit` | Submit a leveling test attempt |
| `GET` | `/api/student/leveling-test/history` | List past leveling test attempts |
| `GET` | `/api/admin/sections` | List sections |
| `POST` | `/api/admin/sections` | Create a section |
| `GET`/`PATCH`/`DELETE` | `/api/admin/sections/:id` | Get, update, or delete a section |
| `POST` | `/api/admin/sections/:id/subsections` | Create a subsection |
| `GET`/`PATCH`/`DELETE` | `/api/admin/subsections/:id` | Get, update, or delete a subsection |
| `POST` | `/api/admin/subsections/:id/tasks` | Create a task |
| `PATCH`/`DELETE` | `/api/admin/tasks/:id` | Update or delete a task |
| `POST` | `/api/admin/tasks/import` | Bulk-import tasks from JSON |
| `POST` | `/api/admin/uploads/images` | Upload a task image |
| `POST` | `/api/admin/sections/:id/materials` | Add a material to a section |
| `POST` | `/api/admin/subsections/:id/materials` | Add a material to a subsection |
| `PATCH`/`DELETE` | `/api/admin/materials/:id` | Update or delete a material |
| `GET` | `/api/admin/teachers` | List teachers |
| `GET` | `/api/admin/students` | List students |
| `GET`/`PATCH` | `/api/admin/students/:id` | Get or update a student |

## Project Structure

```
infiro/
├── backend/
│   ├── app/
│   │   ├── models/            # SQLAlchemy models
│   │   ├── middleware/auth.py # JWT/JWKS verification
│   │   ├── routes/            # public, student, tasks, leveling test, admin routes
│   │   └── services/
│   ├── migrations/            # Flask-Migrate migrations
│   ├── seed/                  # seed data
│   └── tests/
├── staff/                     # Next.js panel (admin + teacher)
├── mobile/                    # Expo app (student + teacher), Expo Router
├── infrastructure/
│   ├── realm-export.json      # Keycloak realm — auto-imported on startup
│   ├── nginx.conf             # single entrypoint / reverse proxy config
│   └── secrets/db_password.txt
├── docs/                      # task JSON format spec, etc.
├── compose.yaml
└── .env.example
```

## Documentation

- [docs/format-zadan.md](docs/format-zadan.md) — JSON format spec for the task import file used by the admin panel's import feature.
