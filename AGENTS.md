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

when running tests use `bun test:parallel` not `bun test` this improves the speed on my laptop its not needed on ci but i have a big ass m4 128gb ram so its good for high dop

tests are alongside code not in a separate test folder

there is a ./test dir which holds test framework code

db tests must be parallelizable - the test parallelism strategy is very important and there are some rules

- we use postgres as you may or may not know at this point
- we use the same db and schema for all of the tests
- it is assumed that when bun test starts, the db is up and the migrations have run (some migrations may have some needed data that is ok)
- then- understand this - do not delete to clean up your stuff - ever - it slows down tests! this is bad we want our tests to be very fast
- the fastest test is like this - any resource you need to hang your stuff off should dangle from the root
- this means we cannot have global state, and that is ok
- so its like this, every user, every org, every record, is created with its dep chain
- this happens in a test framework
- it is ok and sometimes required

you must never use uuid you must always use cuid

you must not add test as a script in package json bun test runs the tests it is a built in command and running commands with bun works as bun <command> so adding a test command is redundant and actually confusing because you end up in a situation where bun test runs the built in command but bun run test actually works and runs the script. not good.

we use a service oriented architecture but it is quite straightforward

frontend -> trpc -> service layer -> db (prisma)

trpc must contain authorization authentication and data validation

- not unit tested unit tests happen elsewhere this is not the proper layer
- trpc should be a thin layer
- input validation is done at the trpc layer not in the service layer

service layer must contain business logic

- heavily unit tested
- even simple crud ops must flow through
- pass tx via parameter injection always optional
- no bare use of prisma touching other resources
- ideally 1 service layer file per resource - that is, as we define it in this repo, a model in prisma
- avoid joins prefer frontend to grab required assoc resources with filters and compose in frontend for performance
- list functions should always have filter and limit offset pagination built in
- filters should be based directly on the resource fields available
- whenever we want to filter by some field on an associated resource then we can join but the select should be selecting out just the fields from the resource OR we denormalize if we can figure it doesn't change often or at all.

-- regarding schema design --

occasionally denormalization may be required and thats ok for performance, prefer that over joins for data that do not change often, its worth the overhead of invalidation and update for the read performance especially in read heavy application

always use cuid

always maintain bookkeeping records

- created at
- updated at

be flexible, lean on nullable fields fairly often

lean on type infenence - mostly don't be explicit about return types - mostly lean on existing types from typegen from zod and/or prisma

hoist zod schemas and zod inferred types to a separate file whenever possible see ./lib/auth for example - this helps keep frontend and backend code separated

trpc layer must take out the tx and pass it down through the layers, this helps declutter the code base from opening txs all over the place

on any write trpc layer should be taking out the db transaction and passing it down for ease of extendability even if its just one record impacted or one stmt

tests do not need to take out transactions the test top level can pass down prisma
