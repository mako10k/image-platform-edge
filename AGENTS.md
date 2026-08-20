# Repository Guidelines

## Scope

This repository implements the provider-specific OAuth edge for image-platform. It must conform to
`contracts/oauth-edge.md`. It must not implement image pipelines, a product CLI, or persistence.
The public contract accepts only WorkOS bearer tokens; Modal credentials remain private upstream
secrets.

## Planning

`plans/edge.pert` is authoritative. Before selecting work, run document check, DAG analysis, and
DAG next with `--capacity CODEX=1`. Use preview and digest-checked writes for mutations and record
exact lifecycle events. Deployment, Cloudflare/WorkOS/DNS mutation, secret writes, Git publication,
and live requests remain separately authorized effects.

## Development

Use TypeScript in strict mode, npm for the lockfile, and the Cloudflare Workers runtime. Keep the
fetch handler thin, fail closed, never log credentials or decoded personal claims, and cover every
header transformation and upstream-denial boundary with tests.
