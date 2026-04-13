# TaskNest

A multi-tenant task management application with role-based access control.

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router  
**Backend:** Node.js, Express, MySQL, JWT Auth, Passport.js (Google OAuth)

## Project Structure

```
NITT/
├── backend/    # Express REST API
└── frontend/   # React + TypeScript SPA
```

## Getting Started

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

| Variable            | Description                        |
|---------------------|------------------------------------|
| `PORT`              | Server port (default: 8080)        |
| `DB_HOST`           | MySQL host                         |
| `DB_USER`           | MySQL user                         |
| `DB_PASSWORD`       | MySQL password                     |
| `DB_NAME`           | MySQL database name                |
| `JWT_SECRET`        | Secret key for signing JWTs        |
| `JWT_EXPIRES_IN`    | JWT expiry (default: 7d)           |
| `ADMIN_SIGNUP_KEY`  | Secret key required to register as admin |
| `GOOGLE_CLIENT_ID`  | Google OAuth client ID             |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret      |
| `FRONTEND_URL`      | Frontend origin for OAuth redirect (default: http://localhost:5173) |
| `ALLOWED_ORIGINS`   | Comma-separated CORS allowed origins |

## Features

- JWT-based authentication
- Google OAuth 2.0 login (Passport.js)
- Role-based access control (RBAC) — admin / member
- Multi-tenant task management (organization-scoped)
- Audit logging with pagination and filtering
- Rate limiting & security headers (Helmet)

## API Endpoints

| Method | Path                        | Auth     | Description              |
|--------|-----------------------------|----------|--------------------------|
| POST   | `/api/auth/signup`          | Public   | Register a new user      |
| POST   | `/api/auth/login`           | Public   | Login with email/password|
| GET    | `/api/auth/me`              | JWT      | Get current user         |
| GET    | `/api/auth/google`          | Public   | Start Google OAuth flow  |
| GET    | `/api/auth/google/callback` | Public   | Google OAuth callback    |
| GET    | `/api/tasks`                | JWT      | List tasks               |
| POST   | `/api/tasks`                | JWT      | Create a task            |
| PUT    | `/api/tasks/:id`            | JWT      | Update a task            |
| DELETE | `/api/tasks/:id`            | JWT      | Delete a task            |
| GET    | `/api/audit-logs`           | JWT+Admin| List audit logs          |
| GET    | `/api/health`               | Public   | Health check             |

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create an OAuth 2.0 Client ID
3. Add `http://localhost:8080/api/auth/google/callback` as an Authorized Redirect URI
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`
