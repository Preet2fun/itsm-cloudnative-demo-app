# Phase 1 Deployment Guide — Repo Scaffold

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Git | any | `git --version` |
| Node.js | 18+ | `node --version` |
| npx | bundled with Node | `npx --version` |
| Claude Code CLI | latest | `claude --version` |

---

## Step 1 — Clone / initialise the repository

```bash
# If you already cloned:
$ cd itsm-cloudnative-demo-app

# Verify structure
$ ls
CONTRIBUTING.md  SYSTEM_PROMPT.md  README.md  database/  docs/  infra/  policies/  scripts/  services/  tests/
```

---

## Step 2 — Set up MCP servers

MCP servers let Claude Code interact with your local PostgreSQL, Docker, K8s, and Prometheus.

### 2a — Project-level MCP config

The file `itsm-cloudnative-demo-app/.claude/settings.json` is already in the repo
(git-ignored so your local paths are not committed).

If it is missing, create it:

```bash
$ mkdir -p .claude
$ cat > .claude/settings.json <<'EOF'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/absolute/path/to/itsm-cloudnative-demo-app"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://itsm:itsm@<machine-ip>:5432/itsm"
      }
    },
    "fetch":      { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-fetch"] },
    "docker":     { "command": "npx", "args": ["-y", "@docker/mcp-server"] },
    "kubernetes": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-kubernetes"] },
    "prometheus": {
      "command": "npx",
      "args": ["-y", "mcp-prometheus-server"],
      "env": { "PROMETHEUS_URL": "http://localhost:9090" }
    }
  }
}
EOF
```

Replace `/absolute/path/to/itsm-cloudnative-demo-app` and `<machine-ip>` with real values.

### 2b — Verify MCP servers load

Restart Claude Code and check the MCP panel shows 6 servers connected (filesystem,
postgres, fetch, docker, kubernetes, prometheus).

---

## Step 3 — Create .env file

```bash
$ cp .env.example .env
# Edit .env — replace <machine-ip> with real values
$ nano .env
```

---

## Acceptance Criteria

- [ ] `ls` shows all expected top-level directories
- [ ] `.claude/settings.json` exists and has 6 MCP servers
- [ ] `.env` exists (not committed to git)
- [ ] Claude Code MCP panel shows all servers as connected
