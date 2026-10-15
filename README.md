# TaskFlow

Team project management app: projects, tasks, an activity timeline and team roles.

- `backend/` — Express + TypeScript + MongoDB API
- `frontend/` — Next.js (App Router) + React + Tailwind UI

---

## Quick start

```bash
# 1. API  (http://localhost:5001)
cd backend
cp .env.example .env          # then set JWT_SECRET to any random 32+ char string
npm install
npm run seed                  # demo users, projects, tasks, activity
npm run dev

# 2. UI   (http://localhost:3000)
cd ../frontend
npm install
npm run dev
```

Every seeded account uses the password `password123`:

| Email | Role |
| --- | --- |
| `alex@taskflow.com` | Admin |
| `sarah@taskflow.com` | Project Manager |
| `mike@taskflow.com`, `emma@taskflow.com`, `james@taskflow.com` | Team Member |

A `TaskFlow_Collection.postman_collection.json` for Postman sits at the repo root;
it captures the auth token and entity ids between requests automatically.

> **If the backend won't start**, you will see this message:
>
> ```
> ✖ Port 5000 is already in use.
> ```
>
> Something else already owns that port — on macOS it is almost always AirPlay
> Receiver. The server prints the fix itself; or set it yourself:
>
> ```
> backend/.env          PORT=5001
> frontend/.env.local   NEXT_PUBLIC_API_URL=http://localhost:5001/api
> ```
>
> Keep those two in step — the browser can only talk to the port the backend is
> actually listening on.

---

## Backend architecture

Every request walks the same five layers. Once you know the order, any endpoint
is trivial to trace.

```
request
  │
  ├─ app.ts           security + parsing + rate limiting
  ├─ routes/*.ts      URL, method, and which middleware guards it
  ├─ middlewares/     auth, role checks, Zod validation
  ├─ controllers/     read req -> call one service -> send the response
  ├─ services/        ALL business logic and database access
  └─ models/          Mongoose schemas
```

The rule that makes this explainable: **controllers never touch Mongoose, and
services never touch `req`/`res`.** That is why every controller is five lines
and there is not a single `try/catch` in the codebase.

### Directory map

| Path | What lives there |
| --- | --- |
| `src/server.ts` | Process entry: connect DB, listen, shut down cleanly |
| `src/app.ts` | Builds the Express app (no port) — importable by tests |
| `src/config/env.ts` | Every `process.env` read, validated by Zod at boot |
| `src/config/database.ts` | Mongo connection, cached for serverless reuse |
| `src/constants/` | Roles, statuses, priorities — one list, used everywhere |
| `src/types/dto.ts` | The exact JSON the API returns |
| `src/validators/` | Zod schemas = the input contract |
| `src/middlewares/` | `auth`, `validate`, `error` |
| `src/services/` | Business rules |
| `src/controllers/` | HTTP plumbing only |
| `src/routes/` | The full API surface, in one table (`src/routes/index.ts`) |

### Key decisions

**Errors are thrown, not returned.** Services throw `AppError.badRequest(...)`;
one middleware at the end of the stack converts it to a JSON response. See
`src/middlewares/error.ts`.

**Every response has the same envelope**, built by `src/utils/response.ts`:

```jsonc
{ "status": 200, "success": true, "message": "Task created successfully", "data": { } }
```

**Input is validated once, at the edge.** `validate(schema)` runs on the route,
coerces and trims the data, and replaces it on the request — so controllers
receive correctly typed values and invalid input never reaches the database.

**Documents become DTOs.** Mongoose returns `ObjectId`s; services map them with
`toTaskDto` / `toUserDto` (etc.) into plain objects with string ids and no
password field. See `src/utils/mappers.ts`.

**List endpoints are paginated.** Every `GET` collection returns
`{ items, pagination }`. `src/utils/paginateQuery.ts` runs the `find` and the
`countDocuments` in parallel and strips `undefined` keys from the filter —
MongoDB matches `{ status: undefined }` against *nothing*, so an omitted filter
parameter would silently return zero rows.

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Watch mode (`tsx`) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run seed` | Wipe and repopulate the database |
| `npm run reset-password -- <email> <password>` | Reset one user's password |

---

## Frontend architecture

```
app/page.tsx            layout only: pick a view, open a modal
hooks/useTaskFlowData   all server state + every mutation
services/*.ts           one function per API call, already typed
lib/api.ts              Axios instance: attaches the token, handles 401
lib/session.ts          localStorage modelled as an external store
lib/types.ts            UI types (Dto types at the top, UI shapes below)
components/*            presentational, props in / no fetching
```

### Key decisions

**`app/page.tsx` is layout.** If you want to know what the app *does*, read
`hooks/useTaskFlowData.ts`. If you want to know what it *looks like*, read
`app/page.tsx`.

**Two families of types.** `*Dto` is exactly what the API returns (`_id`); `Task`
is what components consume (`id`). `lib/mappers.ts` is the only place the two
meet.

**One place owns the HTTP layer.** `lib/api.ts` attaches the bearer token to
every request and turns a 401 into "clear the session, go to /login" exactly
once. Components never see an AxiosResponse and never read `localStorage`.

**`localStorage` is an external store** (`lib/session.ts`), consumed through
`useSyncExternalStore`. That is what keeps sessions correct across tabs — and
what `useHasHydrated` is for: `useSyncExternalStore` reports "signed out" for the
single render during hydration, so anything that redirects on a missing session
must wait for that flag or a plain refresh would log people out.

**Forms reset by remounting, not by effects.** `TaskModal` and `TeamModal` keep
their form in an inner component rendered with a `key`, so opening a different
task starts from clean state instead of a `useEffect` that wipes eight fields.

**Mutations are optimistic with rollback** — drag a card, the board updates
instantly, and a failed request restores the previous array.

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (type errors fail the build) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

---

## API reference

Base URL: `http://localhost:5001/api`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Liveness check |
| `POST` | `/auth/register` | — | Creates a `Team Member`; returns a token |
| `POST` | `/auth/login` | — | Returns `{ user, token }` |
| `GET` | `/users` | any | Paginated team directory |
| `POST` | `/users` | Admin, PM | Invite someone |
| `GET` | `/users/profile` | any | The signed-in user |
| `PUT` | `/users/profile` | any | Update your own name/email/status |
| `GET` | `/users/:id` | any | One member |
| `PUT` | `/users/:id` | Admin | Change role / status |
| `DELETE` | `/users/:id` | Admin | Remove from team |
| `GET` | `/projects` | any | Paginated |
| `POST` | `/projects` | Admin, PM | |
| `DELETE` | `/projects/:id` | Admin, PM | Cascades to the project's tasks and their activities |
| `GET` | `/tasks` | any | Supports `?projectId=&status=&page=&limit=` |
| `POST` | `/tasks` | any | Logs a `task_created` activity |
| `PUT` | `/tasks/:id` | any | Logs a `task_completed` / `task_updated` activity |
| `DELETE` | `/tasks/:id` | any | Also removes its activities |
| `GET` | `/activities` | any | Newest first |
| `POST` | `/activities` | any | `userId` is taken from the token, not the body |

Protected routes expect `Authorization: Bearer <token>`.

---

## Environment

`backend/.env`:

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `5001` | Port 5000 is usually taken by macOS AirPlay Receiver |
| `NODE_ENV` | `development` | `development` / `test` / `production` |
| `MONGODB_URI` | `mongodb://localhost:27017/taskflow` | |
| `JWT_SECRET` | — | **Required**, minimum 32 characters |
| `JWT_EXPIRES_IN` | `7d` | Anything `jsonwebtoken` accepts |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated allow-list |

The app refuses to boot with a missing or weak `JWT_SECRET` rather than silently
falling back to a guessable default.

`frontend/.env.local`:

| Variable | Default |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5001/api` | Must match the backend's `PORT` |

---

## Dependencies

Kept deliberately small — every package below is imported somewhere in the code.

**backend** (9 runtime)

| Package | Used for |
| --- | --- |
| `express` | The HTTP server |
| `mongoose` | MongoDB (schemas, queries, transactions) |
| `bcryptjs` | Password hashing (ships its own types) |
| `jsonwebtoken` | Signing / verifying login tokens |
| `zod` | Validating every request body, query and env var |
| `helmet` | Security response headers |
| `express-rate-limit` | Rate limiting `/api` |
| `cors` | Browser origin allow-list |
| `dotenv` | Loading `.env` |

**frontend** (21 runtime, 10 dev)

| Package | Used for |
| --- | --- |
| `next`, `react`, `react-dom` | The framework and UI runtime |
| `axios` | HTTP calls (wrapped once in `lib/api.ts`) |
| `lucide-react` | Icons |
| `recharts` | The charts on the Analytics view |
| `clsx`, `tailwind-merge`, `class-variance-authority` | Tailwind class handling + button variants |
| `@radix-ui/*` (11 packages) | Accessible primitives behind `components/ui/` |
| `@vercel/analytics` | Page-view tracking |
| `tailwindcss`, `@tailwindcss/postcss`, `postcss`, `tw-animate-css` | Tailwind v4 styling |

Earlier versions of this project shipped the full shadcn component set
(~50 extra packages for components like `accordion`, `carousel`, `command`,
`calendar`, `drawer` and `toast` that this app never builds). Those were removed.

### Deliberately not upgraded

| Package | Held at | Why |
| --- | --- | --- |
| `express` | 4.x | 5.x changes path matching and error semantics; not worth the risk for an interview demo |
| `mongoose` | 8.x | 9.x is a major release with its own breaking changes |
| `typescript` | 5.x | TS 7 is the native-port rewrite; the ESLint tooling has not caught up |
| `eslint` (frontend) | 9.x | `eslint-config-next` 16 requires 9.x |
| `@types/node` | 22.x | Matches the Node 22 runtime |
| `@types/express` | 4.x | Must match the express major version |

`npm audit` in `frontend/` still reports 5 advisories, all inside
`eslint-config-next`'s transitive `fast-glob` / `micromatch` / `braces`. They are
dev-only and those packages are already at their latest published versions — no
patch has been released upstream.

---

## Notes and limitations

- **Chat is not persisted.** `components/message-panel.tsx` keeps messages in
  component state and labels this in the UI.
- **"Presence" is manual.** The `online/away/offline` field is set by a user or
  seeded; there is no socket or heartbeat behind it.
- **No automated tests** are wired up yet. `src/app.ts` is separated from
  `src/server.ts` precisely so a Supertest suite can import the app without
  opening a port.
- **`npm audit` in `frontend/`** reports advisories in `eslint-config-next`'s
  transitive `fast-glob`/`micromatch`/`braces`. All are dev-only, and no patched
  version of those packages has been published yet.