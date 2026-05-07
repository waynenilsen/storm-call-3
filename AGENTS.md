<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

when you're done with a chunk of work iterate on `bun run check:all`

A note on workspaces -- this repo is set up to handle workspaces -- ./scripts/initialize-workspace.sh is designed specifically to support running multiple instances of this repository on a single laptop. One of the biggest issues with this is port collision. The way we solve that here is by setting the ports in env vars but they're random. So, critically do not assume you know the port for the web server. All ports are generated and assigned on workspace initialization.

Use `bun get-dev-port` and `bun get-db-port` to get the ports

we use postgres
nextjs

if i say YOLOYOLO that means commit, push make the pr using gh cli and merge it to main don't ask me for permission.

when you write commit messages use conventional commits and make the commit messages extremely brutally detailed including business reasons for the changes when it makes sense

i own this file llm does not edit this file

we use bun test to test stuff it runs the official built in bun test harness it is fast and efficient

tests are alongside code not in a separate test folder

there is a ./test dir which holds test framework code

db tests must be parallelizable

you must never use uuid you must always use cuid

you must not add test as a script in package json bun test runs the tests it is a built in command and running commands with bun works as bun <command> so adding a test command is redundant and actually confusing because you end up in a situation where bun test runs the built in command but bun run test actually works and runs the script. not good.
