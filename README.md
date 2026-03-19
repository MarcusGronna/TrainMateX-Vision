# TrainMateX-Vision

**TrainMateX-Vision** is a full-stack fitness training application that lets users create personalized training programs, build structured workouts, manage exercises, and track their progress — all in one place.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [API Overview](#api-overview)
- [Deployment](#deployment)

---

## Features

- **Training Programs** – Create, edit, and delete personalized training programs with descriptions and difficulty levels.
- **Workout Management** – Build structured workouts within a program, including day-of-week scheduling and notes.
- **Exercise Library** – Browse a comprehensive exercise database filterable by muscle group, equipment, and difficulty.
- **Workout Builder** – Add exercises to workouts with configurable sets and reps.
- **Authentication** – Secure user accounts powered by [Clerk](https://clerk.com/).
- **Responsive UI** – Mobile-friendly interface built with Tailwind CSS.

---

## Tech Stack

### Backend

| Technology | Version |
|---|---|
| .NET / ASP.NET Core | 9.0 |
| Entity Framework Core | 9.0 |
| SQL Server | – |
| Clerk (JWT auth) | – |
| Swagger / OpenAPI | 10.0.1 |

### Frontend

| Technology | Version |
|---|---|
| React | 19.2.0 |
| TypeScript | 5.7.2 |
| Vite | 7.2.6 |
| TanStack Router | 1.132.0 |
| TanStack Query | 5.66.5 |
| Clerk React | 5.49.0 |
| Tailwind CSS | 4.0.6 |
| Vitest | 3.0.5 |

---

## Project Structure

```
TrainMateX-Vision/
├── backend/
│   ├── TrainMateX.Api/           # ASP.NET Core Web API (controllers, entry point)
│   ├── TrainMateX.Application/   # Business logic (services, DTOs)
│   ├── TrainMateX.Domain/        # Core entities and enums
│   └── TrainMateX.Infrastructure/# EF Core DB context, repositories, migrations
└── frontend/
    └── src/
        ├── routes/               # TanStack Router file-based routes
        ├── pages/                # Page-level components
        ├── features/             # Feature modules (programs, workouts, exercises)
        ├── components/           # Reusable UI components
        ├── integrations/         # Clerk and TanStack Query providers
        ├── hooks/                # Custom React hooks
        ├── lib/                  # API client and utilities
        └── types/                # TypeScript type definitions
```

---

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/) and npm
- A running SQL Server instance (local or remote)
- A [Clerk](https://clerk.com/) account for authentication

---

## Getting Started

### Backend Setup

1. **Restore dependencies:**
   ```bash
   cd backend
   dotnet restore
   ```

2. **Configure your settings** – create or update `backend/TrainMateX.Api/appsettings.Development.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=TrainMateX;Trusted_Connection=true;TrustServerCertificate=true;"
     },
     "Clerk": {
       "Issuer": "https://<your-clerk-domain>.clerk.accounts.com/",
       "Audience": "<your-clerk-audience>"
     }
   }
   ```
   > You can also use [.NET User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets) to store credentials locally.

3. **Apply database migrations:**
   ```bash
   cd backend/TrainMateX.Api
   dotnet ef database update
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables** – create `frontend/.env.local`:
   ```env
   VITE_API_BASE_URL=http://localhost:5125/api/
   VITE_CLERK_PUBLISHABLE_KEY=<your_clerk_publishable_key>
   ```

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL for the backend API (e.g. `http://localhost:5125/api/`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Publishable key from the Clerk dashboard |

### Backend (`appsettings.json` or User Secrets)

| Key | Description |
|---|---|
| `ConnectionStrings:DefaultConnection` | SQL Server connection string |
| `Clerk:Issuer` | Clerk JWT issuer URL |
| `Clerk:Audience` | Expected JWT audience |

---

## Running the Application

### Backend

```bash
cd backend/TrainMateX.Api
dotnet run
```

- HTTP: `http://localhost:5125`
- HTTPS: `https://localhost:7209`
- Swagger UI: `http://localhost:5125/swagger`

Use `dotnet watch run` for hot reload during development.

### Frontend

```bash
cd frontend
npm run dev
```

Runs on `http://localhost:3000` with Vite hot module replacement.

---

## Running Tests

### Frontend

```bash
cd frontend
npm run test          # Run all tests with Vitest
npm run test:ui       # Open the Vitest UI dashboard
```

### Linting & Formatting

```bash
cd frontend
npm run lint          # ESLint
npm run format        # Prettier
npm run check         # Combined lint + format check
```

---

## API Overview

All API routes require a valid Clerk JWT in the `Authorization: Bearer <token>` header (except public exercise queries).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/me` | Get the authenticated user's profile |
| `GET` | `/api/trainingprograms` | List all training programs |
| `POST` | `/api/trainingprograms` | Create a new training program |
| `GET` | `/api/trainingprograms/{id}` | Get a specific training program |
| `PUT` | `/api/trainingprograms/{id}` | Update a training program |
| `DELETE` | `/api/trainingprograms/{id}` | Delete a training program |
| `GET` | `/api/trainingprograms/{id}/workouts` | List workouts in a program |
| `POST` | `/api/trainingprograms/{id}/workouts` | Add a workout to a program |
| `PUT` | `/api/trainingprograms/{id}/workouts/{workoutId}` | Update a workout |
| `DELETE` | `/api/trainingprograms/{id}/workouts/{workoutId}` | Delete a workout |
| `GET` | `/api/exercises` | List exercises (supports `muscleGroup`, `equipment`, `difficulty` filters) |
| `GET` | `/api/workouts/{id}/exercises` | List exercises in a workout |
| `POST` | `/api/workouts/{id}/exercises` | Add an exercise to a workout |
| `PUT` | `/api/workouts/{id}/exercises/{exerciseId}` | Update sets/reps for a workout exercise |
| `DELETE` | `/api/workouts/{id}/exercises/{exerciseId}` | Remove an exercise from a workout |

---

## Deployment

### Backend – Azure App Service

The backend is automatically deployed to **Azure App Service** (`trainmatex-vision-api`) via the GitHub Actions workflow at `.github/workflows/main_trainmatex-vision-api.yml` on every push to `main`.

### Frontend – Vercel

The frontend is deployed to **Vercel**:

- Staging: [https://trainmatex-visionv1.vercel.app](https://trainmatex-visionv1.vercel.app)
- Production: [https://trainmatex.marcusgronna.com](https://trainmatex.marcusgronna.com)

The `frontend/vercel.json` rewrites all requests to `index.html` to support client-side SPA routing.
