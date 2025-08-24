gotcha — you’ve already got **isolated worktrees per task attempt**, but you don’t yet have a **separate *running* environment** (i.e., a per-attempt dev/preview server you can hit in the browser, plus API swagger for that exact attempt). Here’s the tight, implementation-ready plan to add it without fighting your current architecture.

---

# What’s missing (in one line)

You have the **where** (isolated worktrees) and the **how to run things** (process/executor plumbing + SSE logs), but not a **runtime manager** that: (1) starts/stops a dev server per attempt on its own port, (2) exposes a **stable preview URL** via reverse proxy, (3) persists/process-lifecycle state, and (4) lets QA/E2E hit *that* running attempt. Your schema and services already hint at this (worktrees, `execution_processes`, local deployment crates), so we just need to wire a small “Dev Service” layer and UI hooks.  &#x20;

---

# Minimal design to add “separate running env”

## 1) Data: add a tiny service registry

Create a table to track running servers per attempt (keep it lean; you already store process logs separately via `execution_processes`/`execution_process_logs`).&#x20;

```sql
CREATE TABLE dev_services (
  id               BLOB PRIMARY KEY,
  task_attempt_id  BLOB NOT NULL REFERENCES task_attempts(id) ON DELETE CASCADE,
  command          TEXT NOT NULL,     -- e.g. "pnpm dev"
  pid              INTEGER,
  port             INTEGER,
  token            TEXT,              -- for preview auth
  url              TEXT,              -- computed "/preview/<id>?t=..."
  status           TEXT CHECK (status IN ('starting','running','stopped','failed')) NOT NULL,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
```

> Why new table? You *could* fold into `execution_processes`, but a dedicated row grants a canonical “what is the active preview for this attempt?” without sifting through historical runs. Use `execution_processes` for the logs/stream as you do now.&#x20;

## 2) Backend: PreviewService (+ tiny reverse proxy)

New endpoints (Axum):

* `POST /api/task-attempts/:id/dev` → start dev server in the attempt’s worktree

  * Allocate a free port (you already have port/IPC helpers in utils).
  * Spawn with `tokio::process::Command`, env `PORT=<allocated>` (or zero if the framework supports 0 = random).
  * Create `dev_services` row (status `starting` → `running`), store `pid`, `port`, `token`, and computed `url`.
  * Stream logs to `execution_processes` + SSE (you already have this path). &#x20;

* `DELETE /api/dev-services/:id` → stop (SIGTERM + SIGKILL after grace).

* `GET /preview/:devServiceId` → **reverse proxy** to `localhost:<port>` with token guard.

  * Strip hop-by-hop headers, optional CSP injection.
  * This gives you a *stable* URL even if the underlying port changes.

You’ve got all the right crates & patterns in place: Axum server, service layer, SSE message stores, and the “local deployment” crate intended for process orchestration/cleanup. This slot fits there. &#x20;

**Process lifecycle**

* TTL auto-stop (e.g., 60 min idle) + cleanup hook when attempt merges.
* Orphan reaper on boot (see “orphan cleanup” pattern in config/envs). &#x20;

## 3) Project config you already expose

You already store `projects.dev_script` — use it as the default command. Add optional `backend_script` if you want 2 services later, but keep MVP single-service.&#x20;

```json
{
  "setup_script": "pnpm install",
  "dev_script": "pnpm dev"   // used by POST /dev to start the preview
}
```

## 4) Frontend: one new tab + one button

* **Task Details → “Preview” tab**

  * Button: **Start preview** → calls POST `/dev`; show live logs (SSE) using your existing log components.
  * When `status=running`, show **Open preview** (target `/preview/:id?t=...`) and **Stop**.
    You already have the React structure, SSE hooks, and process log components to reuse. &#x20;

---

# Backend API/Swagger for *that* attempt

Two pragmatic options:

1. **Native (preferred):** project defines `openapi_script` (e.g., Nest/FastAPI/Express generator).

   * Endpoint: `POST /api/task-attempts/:id/openapi/gen` → runs in the *attempt* worktree, writes `openapi.yaml` artifact.
   * `GET /api/task-attempts/:id/openapi` → serve that artifact.
   * Frontend “API” tab mounts Swagger-UI against that URL.

2. **Agent assist (fallback):** dedicate a Claude “Spec/Swagger” step to synthesize `openapi.yaml` if the codebase lacks a generator. (You already have standardized executors + variants to route this.)&#x20;

---

# E2E + Unit against the running env

Add a tiny `TestRunnerService` (very similar to your current process runs):

* `POST /api/task-attempts/:id/tests/unit` → runs project `unit_script`
* `POST /api/task-attempts/:id/tests/e2e` → runs `e2e_script` and targets the **preview URL**
* Store exit code + artifacts (JUnit XML, HTML report), stream logs over SSE, surface in a **“Tests”** tab.

Project config example:

```json
{
  "unit_script": "pnpm test:unit --reporter=junit",
  "e2e_script": "pnpm test:e2e --reporter=junit"
}
```

You already document the testing lanes and SSE/logging, so this is mostly wiring + artifact storage. &#x20;

---

# Optional (but powerful) “truly separate env” knobs

* **Per-attempt DB/schema:**

  * **SQLite**: `DB_URL=file:./.tmp/db-<attemptId>.sqlite`
  * **Postgres**: create schema `attempt_<id>`, pass `search_path` to the app.
    This makes API & data isolation match your worktree isolation.

* **Containerized preview:** leverage `crates/local-deployment` to run a container per attempt (compose profile). Start with simple host process first; add containers when you need parity with production services.&#x20;

* **Multi-service preview:** later, promote `dev_script` → `dev_services[]` (frontend, api, worker). Each gets its own row in `dev_services` and its own proxied path (e.g., `/preview/:id`, `/preview/:id/api`).

---

# Why this slots neatly into what you have

* **Worktrees** give you perfect code isolation per attempt.&#x20;
* **Execution process tables + SSE** already handle spawning and streaming logs. We reuse them for the dev server process while tracking “which one is active” in `dev_services`.&#x20;
* **Local deployment crates** are explicitly for process/container lifecycle — ideal home for the preview manager and cleanup.&#x20;
* **Projects.dev\_script** is already modeled; PreviewService just honors it.&#x20;

---

## Checklist you can implement straight away

* [ ] SQL: add `dev_services` table
* [ ] Backend:

  * [ ] `POST /api/task-attempts/:id/dev` (spawn + register + SSE logs)
  * [ ] `DELETE /api/dev-services/:id` (stop)
  * [ ] `GET /preview/:id` (reverse proxy with token)
  * [ ] `POST /api/task-attempts/:id/openapi/gen` + `GET /api/task-attempts/:id/openapi`
  * [ ] `POST /api/task-attempts/:id/tests/{unit|e2e}`
* [ ] Frontend:

  * [ ] Task Details → **Preview** tab (Start/Open/Stop + logs)
  * [ ] **API** tab (Swagger-UI)
  * [ ] **Tests** tab (run buttons + JUnit summary)
* [ ] Config: ensure each project has `dev_script` (and optional `openapi/unit/e2e` scripts)

Once you wire this, you’ll have **separate running envs** per attempt (Lovable-style), browser preview for frontend, swagger/API for the backend, and a place for QA/E2E to target the *right* instance every time.
