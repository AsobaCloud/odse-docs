---
title: "MCP Server"
layout: default
nav_order: 8
has_children: true
---

# ODS-E MCP Server

The [`@asobacloud/odse-mcp`](https://www.npmjs.com/package/@asobacloud/odse-mcp) package is a [Model Context Protocol](https://modelcontextprotocol.io/) server that lets AI coding agents and data agents call ODS-E tools directly — no manual scripting required.

Agents can convert OEM telemetry payloads to ODS-E records, validate batches, and list supported OEMs, all via structured MCP tool calls backed by the published [`odse`](https://pypi.org/project/odse/) Python package.

## Tools

| Tool | What it does |
|------|-------------|
| `ListSupportedOEMs` | Returns all OEM source keys from the installed `odse` transformer registry, plus `odse.__version__`. |
| `ConvertToODSE` | Converts raw CSV/JSON text (or a file path) to ODS-E records. Supports explicit `source`, auto-detection, `asset_id`, `timezone`, and `timeout`. |
| `ValidateODSERecord` | Runs `odse.validate_batch` on a JSON array of records. Accepts an optional `level` (`schema` or `semantic`). |

## Requirements

| Runtime | Required for |
|---------|-------------|
| Node.js ≥ 22 | MCP server process |
| Python 3 + [`odse`](https://pypi.org/project/odse/) | All tools (`pip install odse`) |

## Quick Install

```bash
pip install odse
npx -y @asobacloud/odse-mcp
```

Set `ODSE_WORKSPACE` to an absolute directory path if you want agents to reference telemetry files by relative path. The server speaks MCP over **stdio** — no HTTP port needed.

## Client Setup Guides

- [Using with AI Agents (Cursor, Claude Code, Codex)](/docs/mcp/using-with-ai-agents)

## Related Docs

- [Transforms: Supported OEMs](/docs/transforms/supported-oems)
- [Validation Overview](/docs/validation/overview)
- [Python SDK Reference](/docs/reference/python-sdk)
- [LLM Integration](/docs/llm-integration)
