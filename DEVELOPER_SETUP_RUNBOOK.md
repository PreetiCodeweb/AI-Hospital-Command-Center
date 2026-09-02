# MedSync / AI Hospital Command Center
## Clean-machine developer setup and end-to-end runbook

**Audience:** a developer receiving this repository as a ZIP archive or Git checkout.  
**Validated environment:** macOS, Apple Silicon, Node 25, Python 3.14, Docker Engine with Colima, PostgreSQL 16.  
**Recommended supported toolchain:** Node 22 LTS, Python 3.12, Docker Desktop with Docker Compose v2.  
**Repository root:** the directory containing `frontend/`, `backend/`, `dbms/`, `k8s/`, and `docker-compose.yml`.

This runbook is intentionally self-contained. Follow the Docker Compose path for the closest reproduction of the validated full stack. Follow the local-process path when Docker Compose is unavailable or when backend/frontend debugging is required.

> **Clinical and security notice:** This is a hackathon/research decision-support prototype. It is not a certified clinical diagnostic system. Never use real patient data, production credentials, or a production database with this setup.

---

## 1. What you receive

```text
AI-Hospital-Command-Center/
├── frontend/                 Next.js 15 / React 19 / TypeScript UI
├── backend/                  FastAPI / SQLAlchemy / Python API
├── dbms/
│   ├── migrations/           PostgreSQL schema and incremental migrations
│   ├── seeds/                synthetic demo data
│   └── views/                command-center reporting views
├── k8s/                      Kubernetes manifests (not required for local setup)
├── docker-compose.yml        local PostgreSQL + backend + frontend stack
├── docker-compose.production.yml
├── CODEBASE_AUDIT.md         architecture and audit findings
├── FRONTEND_ISSUES.md        frontend audit and severity table
└── FIXES_APPLIED.md          implementation and verification summary
```

The database is PostgreSQL. The live inventory, authentication, users, injury-analysis API, and bed-order flow do not use an in-memory database. The frontend calls FastAPI through the Next.js `/api/*` rewrite when `NEXT_PUBLIC_API_BASE_URL` is empty.

**Source references:** [`docker-compose.yml`](docker-compose.yml), [`frontend/package.json`](frontend/package.json), [`backend/requirements.txt`](backend/requirements.txt), [`backend/app/main.py`](backend/app/main.py), [`dbms/migrations/001_initial_schema.sql`](dbms/migrations/001_initial_schema.sql).

---

## 2. Prerequisites

Install these before running any project command.

| Tool | Recommended version | Why it is needed | Verify |
|---|---:|---|---|
| Git | Current stable | Checkout/history and source management | `git --version` |
| Node.js | 22 LTS | Next.js build/dev server | `node --version` |
| npm | Bundled with Node 22 | Frontend dependencies/scripts | `npm --version` |
| Python | 3.12.x | Backend and ML dependencies; matches backend image | `python3.12 --version` |
| pip | Current for Python 3.12 | Backend dependency installation | `python3.12 -m pip --version` |
| Docker Desktop | Current stable | PostgreSQL and containerized stack | `docker version` |
| Docker Compose | v2 plugin | Full-stack orchestration | `docker compose version` |

### macOS

1. Install Xcode Command Line Tools if Git is missing:

   ```bash
   xcode-select --install
   ```

2. Install Docker Desktop and start it. Docker Desktop includes Compose v2.
3. Install Node 22 LTS using the official installer or a version manager.
4. Install Python 3.12 using the official installer or a version manager.

Homebrew is optional. If using Homebrew, verify that the binaries on `PATH` are the intended versions:

```bash
brew install node@22 python@3.12
node --version
python3.12 --version
```

### Linux

Install Git, Docker Engine, the Docker Compose v2 plugin, Node 22 LTS, and Python 3.12 using the distribution's supported repositories. Add the developer account to the Docker group only according to local security policy. Log out/in after changing group membership.

### Windows

Use Docker Desktop with the WSL2 backend, Git, Node 22 LTS, and Python 3.12. Run the commands below from Git Bash, WSL, or PowerShell after translating `export` commands to PowerShell `$env:NAME = 'value'` syntax.

### Confirm the complete prerequisite set

```bash
git --version
node --version
npm --version
python3.12 --version
python3.12 -m pip --version
docker version
docker compose version
```

If `docker compose version` fails with `unknown command: compose`, Docker Engine is installed without the Compose plugin. Install/start Docker Desktop or install Docker Compose v2 before using the Compose procedure.

---

## 3. Obtain and prepare the repository

### From the Git repository

```bash
mkdir -p ~/src
cd ~/src
git clone https://github.com/PreetiCodeweb/AI-Hospital-Command-Center.git hospitalmanage
cd hospitalmanage
git checkout main
```

### From a ZIP archive

1. Extract the archive into a path with no spaces if possible, for example `~/src/hospitalmanage`.
2. Open a terminal at the directory containing `docker-compose.yml`.
3. Confirm the root is correct:

```bash
pwd
ls -la
```

The listing must contain `frontend`, `backend`, `dbms`, `k8s`, and `docker-compose.yml`.

Do not include or send these generated/local directories in the ZIP:

```text
frontend/node_modules/
frontend/.next/
backend/.venv/
.venv/
.env
backend/.env
frontend/.env.local
```

Do not send real secrets or patient information. The repository's `.env.example` files are templates only.

---

## 4. Recommended path: run the complete stack with Docker Compose

This is the closest reproduction of the validated full-stack setup.

### 4.1 Set local-only secrets

Run from the repository root. Do not commit the values or place them in a shared shell profile.

```bash
export ADMIN_PASSWORD='428570'
export ADMIN_USERNAME='roselyn_yu'
export ADMIN_EMAIL='roselyn_yu@northstar.example'
export SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
```

The password is supplied through the environment and hashed by the backend. It is not stored in source code. The administrator logs in with the email `roselyn_yu@northstar.example`; the backend user model uses email as the login identifier.

### 4.2 Start PostgreSQL, backend, and frontend

```bash
docker compose up --build
```

For detached mode:

```bash
docker compose up --build -d
docker compose ps
```

Expected services:

| Service | Host URL/port | Container role |
|---|---|---|
| `postgres` | `localhost:5433` | PostgreSQL 16 |
| `backend` | `http://localhost:8000` | FastAPI |
| `frontend` | `http://localhost:3000` | Next.js |

On a clean named volume, PostgreSQL runs these scripts in order:

```text
dbms/migrations/001_initial_schema.sql
dbms/seeds/001_demo_data.sql
dbms/views/001_command_center_views.sql
dbms/migrations/003_add_bed_orders_and_reviews.sql
dbms/migrations/004_add_order_details.sql
```

The backend waits for PostgreSQL health through Compose dependency ordering. It creates any ORM metadata that is not already present and idempotently creates the configured administrator when `AUTO_SEED=true` and `ADMIN_PASSWORD` is non-empty.

### 4.3 Verify container health

```bash
curl --fail http://localhost:8000/health
curl --fail -I http://localhost:3000
```

Expected API response:

```json
{"status":"healthy","service":"hospital-command-center","version":"1.0.0"}
```

Open:

- Application: <http://localhost:3000>
- FastAPI Swagger: <http://localhost:8000/docs>

### 4.4 Login and validate the admin flow

Use the login screen with:

```text
Email:    roselyn_yu@northstar.example
Password: 428570
```

The UI obtains a JWT, reads the authenticated user, and routes administrators to `/admin`. The admin page loads registered users and bed orders from the API. Use the Resources page to request ICU capacity and the Admin page to transition an order between `pending`, `approved`, `fulfilled`, and `rejected`.

For an API-only smoke test:

```bash
TOKEN=$(curl --fail -sS \
  -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'username=roselyn_yu@northstar.example' \
  --data-urlencode "password=$ADMIN_PASSWORD" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')

curl --fail -sS -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/auth/me

curl --fail -sS -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/admin/users

curl --fail -sS -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/beds/ICU
```

Do not print or paste JWT values into tickets, logs, or chat.

### 4.5 Stop the stack

```bash
docker compose down
```

This stops/removes containers but retains the named PostgreSQL volume.

> **Destructive operation:** `docker compose down -v` deletes the local PostgreSQL volume and all data in it. Use it only when intentionally resetting a disposable local database.

---

## 5. Alternative path: run backend and frontend directly

Use this when Docker Compose is unavailable. PostgreSQL is still required; run only the PostgreSQL service in Docker or use a local PostgreSQL 16 instance.

### 5.1 Start PostgreSQL only

If Compose is available:

```bash
export ADMIN_PASSWORD='428570'
docker compose up -d postgres
docker compose ps postgres
```

If Compose is unavailable but Docker is running, start a disposable local database with the repository initialization scripts:

```bash
docker volume create hospital_command_center_pgdata
docker run -d --name hospital-command-center-postgres \
  -e POSTGRES_DB=hospital_command_center \
  -e POSTGRES_USER=hospital \
  -e POSTGRES_PASSWORD=hospital_dev_password \
  -p 5433:5432 \
  -v hospital_command_center_pgdata:/var/lib/postgresql/data \
  -v "$PWD/dbms/migrations/001_initial_schema.sql:/docker-entrypoint-initdb.d/001_initial_schema.sql:ro" \
  -v "$PWD/dbms/seeds/001_demo_data.sql:/docker-entrypoint-initdb.d/002_demo_data.sql:ro" \
  -v "$PWD/dbms/views/001_command_center_views.sql:/docker-entrypoint-initdb.d/003_command_center_views.sql:ro" \
  -v "$PWD/dbms/migrations/003_add_bed_orders_and_reviews.sql:/docker-entrypoint-initdb.d/004_add_bed_orders_and_reviews.sql:ro" \
  -v "$PWD/dbms/migrations/004_add_order_details.sql:/docker-entrypoint-initdb.d/005_add_order_details.sql:ro" \
  postgres:16-alpine
```

Wait until PostgreSQL is ready:

```bash
docker logs -f hospital-command-center-postgres
```

Continue after `database system is ready to accept connections` appears. Press `Ctrl-C` only stops log streaming; it does not stop the container.

### 5.2 Create and populate the backend virtual environment

From the repository root:

```bash
python3.12 -m venv backend/.venv
source backend/.venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

On Windows PowerShell:

```powershell
py -3.12 -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
```

Verify imports and tests:

```bash
PYTHONPATH=backend python -m compileall -q backend/app
PYTHONPATH=backend pytest -q backend/tests
```

Expected result for the audited revision: **6 passed**.

### 5.3 Configure and start FastAPI

Create a backend environment file from the template:

```bash
cp backend/.env.example backend/.env
```

Set these values in `backend/.env` for local development:

```dotenv
ENVIRONMENT=development
DATABASE_URL=postgresql+psycopg://hospital:hospital_dev_password@localhost:5433/hospital_command_center
SECRET_KEY=replace-with-a-random-local-secret-at-least-32-characters
CORS_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
AUTO_SEED=true
ADMIN_USERNAME=roselyn_yu
ADMIN_EMAIL=roselyn_yu@northstar.example
ADMIN_PASSWORD=428570
```

Keep `backend/.env` untracked. Then start the API:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The API is now available at `http://127.0.0.1:8000`. Keep this terminal open.

### 5.4 Install and start Next.js

In a second terminal:

```bash
cd /path/to/hospitalmanage/frontend
npm ci
```

For the standard same-origin proxy, leave `NEXT_PUBLIC_API_BASE_URL` unset. Optionally create `frontend/.env.local`:

```dotenv
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_URL=
```

Start the frontend:

```bash
npm run dev -- --hostname 127.0.0.1
```

Open `http://127.0.0.1:3000`.

### 5.5 Direct-process verification

```bash
curl --fail http://127.0.0.1:8000/health
curl --fail http://127.0.0.1:3000/
curl --fail http://127.0.0.1:3000/api/v1/dashboard
```

---

## 6. Development commands and quality gates

Run frontend commands from `frontend/`:

```bash
npm ci
npm run dev
npm run lint
npx tsc --noEmit
npm run build
npm run start
```

Run backend commands from the repository root with the virtual environment active:

```bash
PYTHONPATH=backend pytest -q backend/tests
PYTHONPATH=backend python -m compileall -q backend/app
```

Run the complete pre-handoff check:

```bash
cd frontend
npm run lint
npx tsc --noEmit
npm run build
cd ..
PYTHONPATH=backend backend/.venv/bin/pytest -q backend/tests
PYTHONPATH=backend backend/.venv/bin/python -m compileall -q backend/app
```

The frontend uses strict TypeScript mode. Do not commit `node_modules`, `.next`, virtual environments, local `.env` files, generated caches, JWTs, or passwords.

---

## 7. Feature smoke-test checklist

Perform this checklist after a clean setup.

### Authentication and identity

- [ ] Unauthenticated browser opens the login screen.
- [ ] Wrong password produces a visible error.
- [ ] Admin login routes to `/admin`.
- [ ] Regular user login routes to `/dashboard`.
- [ ] Sidebar/topbar show the authenticated user's actual name.
- [ ] Logout clears the session and returns to login.
- [ ] Direct unauthenticated `GET /api/v1/admin/users` returns `401`.

### Admin

- [ ] Registered users load from PostgreSQL.
- [ ] User search filters name/email.
- [ ] Registration date is visible where provided.
- [ ] Bed orders load from PostgreSQL.
- [ ] Status changes persist after refresh.
- [ ] Non-admin API tokens receive `403` for admin endpoints.

### Capacity and orders

- [ ] Resources page loads live ICU beds.
- [ ] Requesting quantity `1` creates a pending order.
- [ ] Confirmation includes an order reference.
- [ ] Admin sees the same order.
- [ ] Admin status change is reflected in the order list.

### Injury detection

- [ ] `/injury-detection` loads without a module or console error.
- [ ] Guided simulation returns findings.
- [ ] PNG/JPG/WEBP upload is accepted under 50 MB.
- [ ] Unsupported files and files over 50 MB show an error.
- [ ] Clinical-review disclaimer remains visible.

### Homepage and UI

- [ ] MedSync branding is visible.
- [ ] Northstar Medical Center image is visible.
- [ ] Dashboard, Resources, Injury Detection, and Admin routes load.
- [ ] Browser viewport works at 1366×768 and a tablet width.
- [ ] Loading, success, and error states are visible on live Resources operations.

---

## 8. Configuration reference

| Variable | Component | Local value/behavior | Secret |
|---|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL at `localhost:5433` for direct process; `postgres:5432` in Compose | Contains password; yes |
| `SECRET_KEY` | Backend | Random local value, at least 32 characters | Yes |
| `CORS_ORIGINS` | Backend | `http://localhost:3000` | No |
| `FRONTEND_URL` | Backend | `http://localhost:3000` | No |
| `AUTO_SEED` | Backend | `true` for disposable local setup | No |
| `ADMIN_USERNAME` | Backend | `roselyn_yu` | No |
| `ADMIN_EMAIL` | Backend | `roselyn_yu@northstar.example` | No |
| `ADMIN_PASSWORD` | Backend | Supplied through shell/secret store only | Yes |
| `BACKEND_URL` | Next.js | `http://localhost:8000` direct; `http://backend:8000` in Compose build | No |
| `NEXT_PUBLIC_API_BASE_URL` | Browser | Empty for same-origin Next rewrite | Public configuration |

Never put `ADMIN_PASSWORD`, database passwords, `SECRET_KEY`, JWTs, SMTP passwords, or patient data into Git.

---

## 9. Troubleshooting

### `docker compose` is unknown

Install Docker Desktop or Docker Compose v2 and verify:

```bash
docker compose version
```

If Docker is installed but not running, start Docker Desktop/Colima and retry `docker version`.

### Port 5433, 8000, or 3000 is occupied

```bash
lsof -nP -iTCP:5433 -sTCP:LISTEN
lsof -nP -iTCP:8000 -sTCP:LISTEN
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Stop only the process you own, or change the host port and corresponding environment value. Do not kill unknown production or developer processes.

### Database starts but tables are missing

Initialization scripts run only when PostgreSQL initializes an empty data directory. Check logs:

```bash
docker compose logs postgres
```

For a disposable local volume, stop the stack and intentionally reset the volume with `docker compose down -v`, then start again. This deletes local database data and must not be used for any valuable database.

For an existing database, apply migrations through the approved migration procedure. The order/review migrations are:

```text
dbms/migrations/003_add_bed_orders_and_reviews.sql
dbms/migrations/004_add_order_details.sql
```

### Backend cannot connect to PostgreSQL

- Direct backend process: use host `localhost:5433`.
- Backend container: use hostname `postgres` and port `5432`.
- Confirm PostgreSQL is healthy and credentials match.
- Confirm `backend/.env` is loaded from the directory where Uvicorn is launched.

### Frontend shows a network error

Confirm both services:

```bash
curl http://localhost:8000/health
curl http://localhost:3000/
```

For local Next development, `BACKEND_URL` must point to `http://localhost:8000`. For Compose, it must point to `http://backend:8000` inside the container network. Keep `NEXT_PUBLIC_API_BASE_URL` empty when using the Next rewrite.

### Login fails after changing the seed password

The seed is idempotent and does not overwrite an existing user. Changing `ADMIN_PASSWORD` does not change an already-created administrator. For a disposable local database, reset the volume intentionally, or update the account through an approved administrative/database procedure.

### Injury Detection page does not load

Check that these files exist after extraction:

```text
frontend/components/InjuryScanner.tsx
frontend/injuryDetectionService.ts
frontend/app/injury-interactions.css
```

Then run:

```bash
cd frontend
npm ci
npm run build
```

### Python dependency installation fails

Use Python 3.12 and a new virtual environment. Do not reuse a system environment:

```bash
rm -rf backend/.venv  # only if it is your disposable project venv
python3.12 -m venv backend/.venv
source backend/.venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

### Frontend build complains about generated files

`.next/` and `*.tsbuildinfo` are generated and ignored. Remove only your local generated `.next` directory if necessary, then run `npm ci` and `npm run build` again. Never remove source files or database volumes as a generic troubleshooting step.

---

## 10. Runtime architecture

```mermaid
flowchart LR
    Browser[Browser :3000]
    Next[Next.js App Router\nclient shell + /api rewrite]
    API[FastAPI :8000\n/api/v1]
    DB[(PostgreSQL 16\n:5433 host / :5432 container)]
    ML[Forecasting and\nsimulation services]

    Browser --> Next
    Next --> API
    API --> DB
    API --> ML
```

### Authentication request flow

```mermaid
sequenceDiagram
    participant U as User browser
    participant N as Next.js
    participant A as FastAPI
    participant D as PostgreSQL

    U->>N: Submit email/password
    N->>A: POST /api/v1/auth/login (form encoded)
    A->>D: Find verified active user
    A-->>N: JWT + role claim
    N->>N: Store bearer token in browser storage
    U->>N: Open protected route
    N->>A: API request with Authorization header
    A->>D: Validate JWT subject and active user
    A-->>N: JSON response
    N-->>U: Render authenticated view
```

The current compatibility implementation stores the bearer token in browser local storage. A production deployment should migrate to secure, httpOnly, SameSite cookies with an explicit CSRF strategy before handling real hospital data.

---

## 11. Important implementation constraints

- All application password entry points require at least 6 characters and at most 72 UTF-8 bytes for bcrypt compatibility. The six-character `428570` local admin credential is therefore accepted.
- Public registration always creates the regular `operations_manager` role; clients cannot self-select an admin role.
- Admin authorization is enforced in FastAPI dependencies, not only by hiding UI controls.
- Bed requests use PostgreSQL `bed_orders` rows and are not local-only UI state.
- Injury findings are assistive/demo output and must not be presented as a diagnosis.
- PostgreSQL initialization is volume-sensitive: init scripts do not automatically replay on an existing volume.
- The static hospital image is the selected homepage fallback. Three.js was not added because the requirement explicitly permits a lighter fallback and the existing client bundle is already large.
- `npm audit --omit=dev --audit-level=high` currently reports high-severity transitive `postcss`/`sharp` advisories. The automated fix requires a breaking Next.js 16 upgrade; evaluate and test that upgrade separately rather than using `--force`.

---

## 12. Handoff checklist for the developer receiving the ZIP

- [ ] Extracted archive into a clean project directory.
- [ ] Verified the repository root and required directories.
- [ ] Installed and verified Git, Node 22, npm, Python 3.12, Docker, and Compose v2.
- [ ] Created local secrets without committing them.
- [ ] Started PostgreSQL and confirmed it is healthy.
- [ ] Started backend and confirmed `/health`.
- [ ] Started frontend and confirmed HTTP 200.
- [ ] Logged in as the seeded admin.
- [ ] Tested live ICU inventory and order creation.
- [ ] Tested admin order status update.
- [ ] Tested injury simulation/upload validation.
- [ ] Ran lint, TypeScript, build, and backend tests.
- [ ] Confirmed no real patient data or credentials were introduced.

**Primary source files:**

- [`docker-compose.yml`](docker-compose.yml)
- [`frontend/package.json`](frontend/package.json)
- [`frontend/Dockerfile`](frontend/Dockerfile)
- [`backend/requirements.txt`](backend/requirements.txt)
- [`backend/.env.example`](backend/.env.example)
- [`backend/app/core/config.py`](backend/app/core/config.py)
- [`backend/app/main.py`](backend/app/main.py)
- [`dbms/Dockerfile`](dbms/Dockerfile)
- [`CODEBASE_AUDIT.md`](CODEBASE_AUDIT.md)
- [`FIXES_APPLIED.md`](FIXES_APPLIED.md)
