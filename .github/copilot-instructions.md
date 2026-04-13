# Project Guidelines

## Architecture

ThinkWeave has two frontend surfaces that coexist:

- The React SPA lives in [frontend/src](frontend/src) and is built with Vite, TypeScript, Zustand, and React Query.
- The HTML prototype pages live in [frontend/public](frontend/public) and are served directly by FastAPI from [backend/app/main.py](backend/app/main.py).

When a task mentions Chinese-named pages like [frontend/public/首页.html](frontend/public/首页.html) or [frontend/public/创建高级房间.html](frontend/public/创建高级房间.html), edit the static HTML prototype surface, not the React SPA.

Backend entrypoint is [backend/app/main.py](backend/app/main.py). API routes are organized under [backend/app/api](backend/app/api), data models under [backend/app/models](backend/app/models), schemas under [backend/app/schemas](backend/app/schemas), and AI or ThinkLet logic under [backend/app/services](backend/app/services).

## Build And Run

Prefer the repository start scripts for end-to-end local validation:

- Windows: run [start.ps1](start.ps1)
- Unix-like shells: run [start.sh](start.sh)

On Windows, [start.ps1](start.ps1) is the most reliable path. It:

- creates `backend/.venv` if needed
- installs backend requirements from [backend/requirements.txt](backend/requirements.txt)
- copies the root `.env` into `backend/.env`
- starts FastAPI on port 8000
- serves the static HTML prototype pages from the backend

For React SPA work, use commands from [frontend/package.json](frontend/package.json):

- `npm run dev`
- `npm run build`
- `npm run lint`

The backend health endpoint is `/api/health`.

## Conventions

Use the narrowest active surface for changes:

- For static prototype and demo flow work, change files in [frontend/public](frontend/public) and shared browser auth code in [frontend/public/auth.js](frontend/public/auth.js).
- For React application work, follow the existing split of pages in [frontend/src/pages](frontend/src/pages), API clients in [frontend/src/services/api](frontend/src/services/api), hooks in [frontend/src/hooks](frontend/src/hooks), and Zustand stores in [frontend/src/store](frontend/src/store).
- For backend API work, keep route handlers in [backend/app/api](backend/app/api) thin and reuse the existing model and schema layout instead of introducing ad hoc structures.

Keep Chinese file names, page labels, and user-facing copy consistent with the existing product language.

## Project-Specific Gotchas

- The currently served UI from the default backend startup is the static HTML prototype in [frontend/public](frontend/public), not the React SPA. Do not assume a change in [frontend/src](frontend/src) will affect what [start.ps1](start.ps1) serves.
- Root `.env` is part of the local startup flow and is copied into `backend/.env` by [start.ps1](start.ps1). Avoid hardcoding secrets in code or docs, and do not repeat values from `.env` or [api.txt](api.txt).
- [backend/app/main.py](backend/app/main.py) creates database tables at startup via SQLAlchemy metadata. Prefer minimal schema-safe changes unless the task explicitly requires broader persistence work.
- Existing architecture docs describe a larger full-stack design. Treat the code in the workspace as the source of truth when docs and implementation diverge.

## References

Use these docs for context instead of duplicating them in responses or new instruction files:

- [全栈架构设计文档.md](全栈架构设计文档.md)
- [项目功能文档.md](项目功能文档.md)
- [前端架构设计文档.md](前端架构设计文档.md)
