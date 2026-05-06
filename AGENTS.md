<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

when you're done with a chunk of work iterate on `bun run check:all`

A note on workspaces -- this repo is set up to handle workspaces -- ./scripts/initialize-workspace.sh is designed specifically to support running multiple instances of this repository on a single laptop. One of the biggest issues with this is port collision. The way we solve that here is by setting the ports in env vars but they're random. So, critically do not assume you know the port for the web server. All ports are generated and assigned on workspace initialization.

Use `bun get-dev-port` and `bun get-db-port` to get the ports

we use postgres
nextjs
