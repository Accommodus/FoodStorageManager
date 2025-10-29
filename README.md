# FoodStorageManager Dev Container

Consistent development environment for the Food Storage Manager project built on the official `typescript-node` dev container image. The container pre-installs dependencies and starts the development servers, so you can focus on coding rather than local setup.

## Prerequisites
- Docker running locally (Desktop, Rancher, Colima, etc.).
- One of:
  - VS Code with the Dev Containers extension.
  - The `devcontainer` CLI (`npm install -g @devcontainers/cli`).
- A local `MONGODB_URI` value that points at your MongoDB instance (the container inherits it from your host environment).

## Quick Start (VS Code)
1. Set `MONGODB_URI` in your host shell or an `.env` file that VS Code loads.
2. Open the project folder in VS Code and run **Dev Containers: Reopen in Container**.
3. The container runs `npm install` once on create and then `npm run dev` after every start. Ports `5173` (client) and `3000` (API) are forwarded automatically.

## Quick Start (Devcontainer CLI)
```bash
export MONGODB_URI="mongodb+srv://…"
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . npm run dev
```
The provided `test_build.bash` shows a minimal smoke test that brings the container up without executing the post-create hook.

## Environment & Tooling
- `MONGODB_URI`, `C_PORT` (`5173`), and `S_PORT` (`3000`) are injected into the container as environment variables.
- VS Code defaults force format-on-save and recommend ESLint, Prettier, MongoDB, and OpenAI ChatGPT extensions.
- The container user is `root`. Adjust `remoteUser`/`containerUser` in `.devcontainer/devcontainer.json` if you prefer a non-root workflow.

## Tips
- To skip the automatic `npm run dev`, comment out `postCreateCommand` in `.devcontainer/devcontainer.json`.
- If dependencies change, run `Dev Containers: Rebuild Container` or `devcontainer rebuild --workspace-folder .`.
- When `MONGODB_URI` changes, rebuild or restart the container so the new value is picked up.
