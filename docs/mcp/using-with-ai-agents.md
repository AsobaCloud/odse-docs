---
title: "Using with AI Agents"
layout: default
parent: MCP Server
nav_order: 1
---

# Using the ODS-E MCP Server with AI Agents

The ODS-E MCP server runs as a local process and connects to AI coding agents via the [Model Context Protocol](https://modelcontextprotocol.io/) over **stdio**. Once registered, agents can call `ConvertToODSE`, `ValidateODSERecord`, and `ListSupportedOEMs` as structured tool calls — no extra scripting needed.

## Prerequisites

1. **Node.js ≥ 22** — the MCP server process.
2. **Python 3** with the `odse` package installed:

```bash
pip install odse
```

Verify the install:

```bash
python3 -c "import odse; print(odse.__version__)"
```

## Environment Variable

Set `ODSE_WORKSPACE` to an absolute directory path containing your telemetry files. Agents can then pass relative `payload_file` paths and the server will resolve them against this directory. If omitted, the server uses its process working directory.

---

## Cursor

Add the server to `~/.cursor/mcp.json` (user-wide) or `.cursor/mcp.json` inside your project (project-scoped):

```json
{
  "mcpServers": {
    "odse": {
      "command": "npx",
      "args": ["-y", "@asobacloud/odse-mcp"],
      "env": {
        "ODSE_WORKSPACE": "/absolute/path/to/your/data"
      }
    }
  }
}
```

Restart Cursor or use **Reload MCP Servers** from the command palette. The `odse` tools will appear in the agent's tool list.

---

## Claude Code

### CLI (user scope)

```bash
claude mcp add --transport stdio --scope user \
  --env ODSE_WORKSPACE=/absolute/path/to/your/data \
  odse -- npx -y @asobacloud/odse-mcp
```

Verify registration:

```bash
claude mcp list
```

### Project config (team-shared)

Create `.mcp.json` at your project root:

```json
{
  "mcpServers": {
    "odse": {
      "command": "npx",
      "args": ["-y", "@asobacloud/odse-mcp"],
      "env": {
        "ODSE_WORKSPACE": "/absolute/path/to/your/data"
      }
    }
  }
}
```

The first time a team member opens the repo in Claude Code, they'll be prompted to approve the project-level server.

### User-wide config

Add the same block under `mcpServers` in `~/.claude.json`.

---

## Codex

### CLI

```bash
codex mcp add odse \
  --env ODSE_WORKSPACE=/absolute/path/to/your/data \
  -- npx -y @asobacloud/odse-mcp
```

### Config file

Edit `~/.codex/config.toml` (user-wide) or `<project>/.codex/config.toml` (project, requires a trusted project):

```toml
[mcp_servers.odse]
command = "npx"
args    = ["-y", "@asobacloud/odse-mcp"]

[mcp_servers.odse.env]
ODSE_WORKSPACE = "/absolute/path/to/your/data"
```

This config is shared by the Codex CLI, the IDE extension, and the ChatGPT desktop Codex host.

---

## Running the server directly

Useful for testing or for clients that accept a running process:

```bash
pip install odse
npx -y @asobacloud/odse-mcp
```

---

## Running from source

If you prefer to pin to a local build instead of `npx`:

```bash
git clone https://github.com/AsobaCloud/odse-mcp.git
cd odse-mcp
python3 -m venv .venv && source .venv/bin/activate
pip install odse
npm install && npm run build
```

Then point your MCP client at the built output:

```json
{
  "mcpServers": {
    "odse": {
      "command": "node",
      "args": ["/absolute/path/to/odse-mcp/dist/index.js"],
      "env": {
        "ODSE_WORKSPACE": "/absolute/path/to/your/data",
        "PATH": "/absolute/path/to/odse-mcp/.venv/bin:/usr/bin:/bin"
      }
    }
  }
}
```

Setting `PATH` explicitly ensures the server's `python3` resolves to the venv interpreter that has `odse` installed.

---

## Available Tools

### ListSupportedOEMs

Returns the OEM source keys from the installed `odse` transformer registry, along with the `odse` version.

No arguments required. Example agent prompt:

> "List the OEMs supported by the odse MCP server."

### ConvertToODSE

Converts a raw OEM payload (CSV or JSON text, or a file path) to ODS-E records.

| Argument | Required | Description |
|----------|----------|-------------|
| `payload` | one of | Raw telemetry text (CSV or JSON) |
| `payload_file` | one of | Path to a telemetry file; relative paths resolve against `ODSE_WORKSPACE` |
| `source` | no | OEM key (e.g. `huawei`); omit to auto-detect from payload content |
| `asset_id` | no | Asset identifier forwarded to the transform |
| `timezone` | no | Timezone offset, e.g. `+02:00` |
| `timeout` | no | Timeout in ms (default `120000`, max `600000`) |

Example tool call (explicit source):

```json
{
  "name": "ConvertToODSE",
  "arguments": {
    "source": "huawei",
    "payload": "Time,Active Power(kW),Inverter State\n2024-01-01 12:00:00,12.0,0\n"
  }
}
```

Successful response:

```json
{
  "records": [
    {
      "timestamp": "2024-01-01T12:00:00Z",
      "kWh": 1.0,
      "error_type": "normal",
      "error_code": "0"
    }
  ],
  "count": 1,
  "source": "huawei",
  "odse_version": "0.8.2"
}
```

### ValidateODSERecord

Validates a JSON array of ODS-E records using `odse.validate_batch`.

| Argument | Required | Description |
|----------|----------|-------------|
| `records` | yes | A JSON **string** of an array of record objects |
| `level` | no | `schema` (default) or `semantic` |

Example:

```json
{
  "name": "ValidateODSERecord",
  "arguments": {
    "records": "[{\"timestamp\":\"2024-01-01T12:00:00Z\",\"kWh\":1.0,\"error_type\":\"normal\"}]"
  }
}
```

Tool exit code `1` is reported as `isError: true` on the MCP result.

---

## Troubleshooting

**`python3: cannot import 'odse'`** — The server spawns `python3` from the system `PATH`. Make sure `pip install odse` was run for the same interpreter, or set `PATH` in the MCP config to point at a venv that has `odse` installed (see [Running from source](#running-from-source)).

**Server not appearing in tool list** — Restart the client after editing the config. In Cursor, use **Reload MCP Servers**. In Claude Code, run `claude mcp list` to confirm registration.

**Relative `payload_file` not found** — Set `ODSE_WORKSPACE` to the absolute directory containing your data files.

---

## Related Docs

- [MCP Server Overview](/docs/mcp)
- [Supported OEMs](/docs/transforms/supported-oems)
- [Validation Overview](/docs/validation/overview)
- [Python SDK Reference](/docs/reference/python-sdk)
