# TaskPilot Backend

REST API for TaskPilot — a fullstack project management system built as a final bootcamp assignment. Provides authentication, role-based access control, projects, tasks, comments, activity logs, dashboard stats, and a users directory.

## Tech Stack

- **Node.js** with **Express.js** (HTTP server, routing, middleware)
- **MariaDB** (relational database)
- **Prisma ORM** (schema modeling, migrations, query builder)
- **JWT** (`jsonwebtoken`) for stateless authentication
- **bcrypt** for password hashing
- **Zod** for request body validation
- **cors**, **morgan**, **dotenv** for cross-origin support, request logging, and environment loading

## Features

- Email/password authentication with JWT bearer tokens
- Role-based access control (`ADMIN`, `MEMBER`) via auth + role middleware
- Projects API — create, read, update, delete with member-scoped visibility
- Tasks API — full CRUD with project + assignee relationships
- Task comments API — add, edit, delete with ownership rules
- Activity logs API — admin-only audit trail with date range filter
- Dashboard stats API — role-aware counts and recent activity
- Users API — read-only directory with safe field selection (no password leak)
- Search, filter, sort, pagination across projects, tasks, activity logs, users

## Folder Structure

```text
taskpilot-backend/
├── prisma/
│   ├── schema.prisma          Prisma schema (source of truth)
│   └── seed.js                Demo data seed script
├── src/
│   ├── server.js              Server bootstrap
│   ├── app.js                 Express app + middleware wiring
│   ├── routes/                URL definitions per resource
│   ├── controllers/           Request/response handlers
│   ├── services/              Business logic + Prisma queries
│   ├── middleware/            authMiddleware, roleMiddleware, errorMiddleware
│   ├── validators/            Zod schemas
│   └── utils/                 prisma, apiResponse, pagination, generateToken
├── .env.example               Safe template for required env vars
├── .gitignore                 Ignores .env, node_modules, logs
└── package.json
```

## Environment Variables

Copy `.env.example` to `.env` and fill in real values. **Never commit `.env`.**

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="mysql://taskpilot_user:taskpilot_pass@localhost:3306/taskpilot_db"
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
```

## MariaDB Setup

Make sure MariaDB is running locally and a database/user exists:

```sql
CREATE DATABASE taskpilot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'taskpilot_user'@'localhost' IDENTIFIED BY 'taskpilot_pass';
GRANT ALL PRIVILEGES ON taskpilot_db.* TO 'taskpilot_user'@'localhost';
FLUSH PRIVILEGES;
```

The `DATABASE_URL` in `.env` should match this user/password/database.

## Prisma Setup

```bash
npm install
npx prisma generate          # generate the Prisma client
npx prisma migrate dev --name init    # apply migrations and create tables (use --name init on first run)
npx prisma db seed           # populate demo users, projects, tasks
npx prisma studio            # browse the database in a local web UI
```

## Run Locally

```bash
npm run dev    # nodemon, restarts on file change
# or
npm start      # plain node
```

Backend runs at `http://localhost:5000`. Health check: `GET http://localhost:5000/api/health`.

## Demo Accounts

After running the seed:

| Role   | Email                   | Password      |
|--------|-------------------------|---------------|
| Admin  | admin@taskpilot.com     | password123   |
| Member | member@taskpilot.com    | password123   |

## API Endpoint Summary

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Health
- `GET /api/health`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (protected)

### Users (protected)
- `GET /api/users` — supports `search`, `role`, `page`, `limit`

### Projects (protected)
- `GET /api/projects` — supports `search`, `status`, `priority`, `sortBy`, `sortOrder`, `page`, `limit`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PUT /api/projects/:id` (admin only)
- `DELETE /api/projects/:id` (admin only)

### Tasks (protected)
- `GET /api/tasks` — supports `search`, `status`, `priority`, `projectId`, `assignedToId`, `sortBy`, `sortOrder`, `page`, `limit`
- `GET /api/tasks/:id`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id` (admin only)

### Comments (protected)
- `GET /api/tasks/:taskId/comments`
- `POST /api/tasks/:taskId/comments` — body: `{ "comment": "text" }`
- `PUT /api/comments/:id` — body: `{ "comment": "text" }` (owner only)
- `DELETE /api/comments/:id` (owner or admin)

### Activity Logs
- `GET /api/activity-logs` (admin only) — supports `page`, `limit`, `dateFrom`, `dateTo`

### Dashboard (protected)
- `GET /api/dashboard/stats` — role-aware totals, recent activity, upcoming tasks

## Response Format

Success:
```json
{ "success": true, "message": "Request successful", "data": {} }
```

Success with pagination metadata:
```json
{ "success": true, "message": "Request successful", "data": {}, "meta": {} }
```

Error:
```json
{ "success": false, "message": "Validation failed", "errors": {} }
```

## Database Schema

Six main tables, all defined in `prisma/schema.prisma`:

| Table             | Purpose                                                      |
|-------------------|--------------------------------------------------------------|
| `users`           | Account records — id, name, email, password (hashed), role  |
| `projects`        | Project records — title, description, status, priority, owner |
| `project_members` | Join table for which users belong to which projects         |
| `tasks`           | Task records — title, status, priority, project, assignee   |
| `task_comments`   | Comments on tasks — text stored in `comment` field          |
| `activity_logs`   | Audit trail of important actions across projects/tasks      |

Notes:
- The Users API queries the `users` table with a safe field selection (`id`, `name`, `email`, `role`, `createdAt`). The `password` field is never returned in any API response.
- All foreign keys use cascade or set-null behaviors appropriate to the relationship (deleting a project cascades to its tasks; deleting a user nulls task assignment but cascades comments).
- Enums: `Role` (ADMIN, MEMBER), `ProjectStatus` (PLANNING, ACTIVE, COMPLETED, ARCHIVED), `TaskStatus` (TODO, IN_PROGRESS, REVIEW, DONE), `Priority` (LOW, MEDIUM, HIGH).

## Project Links

- **Frontend Repository:** https://github.com/azizizaidi/taskpilot-frontend
- **Backend Repository:** https://github.com/azizizaidi/taskpilot-backend
- **Deployed App:** https://taskpilot.lintaskod.com

## Notes

- `.env` is local-only and is excluded from git via `.gitignore`. Use `.env.example` as the safe template.
- `node_modules/` is also excluded from git.
- Run the seed after every fresh database reset to restore demo accounts.
