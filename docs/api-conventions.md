# API conventions

Rules for every endpoint under `src/app/api`. The decision is recorded in
[ADR-0007](./adr/0007-route-handlers-and-zod-api.md). The helpers live in `src/server/api` and are
server-only.

## Writing an endpoint

```ts
// src/app/api/scales/route.ts (example)
import { z } from "zod";

import {
  apiHandler,
  paginated,
  paginationQuerySchema,
  parseSearchParams,
  toSkipTake,
} from "@/server/api";
import { requireUser } from "@/server/auth/require-user";
import { prisma } from "@/server/db";

const querySchema = paginationQuerySchema.extend({
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export const GET = apiHandler(async (request) => {
  const user = await requireUser();
  const query = parseSearchParams(request, querySchema);
  const where = {
    userId: user.id,
    ...(query.status && { status: query.status }),
  };

  const [items, total] = await Promise.all([
    prisma.userScale.findMany({ where, ...toSkipTake(query) }),
    prisma.userScale.count({ where }),
  ]);

  return paginated(items, query, total);
});
```

1. Export each handler through `apiHandler`.
2. Call `requireUser()` first in any endpoint that touches user data, and use `user.id` in every
   query (ownership checks). Never pass a possibly `undefined` id to Prisma, because it ignores
   filters whose value is `undefined`.
3. Validate all input with Zod: `parseJsonBody` for bodies, `parseSearchParams` for the query
   string, `parseWithSchema(schema, await context.params)` for route parameters.
4. Return `ok`, `created`, `noContent` or `paginated`. Throw `ApiError` for expected failures.

## Response shapes

| Case    | Status    | Body                                                                     |
| ------- | --------- | ------------------------------------------------------------------------ |
| Success | 200       | `{ "data": ... }`                                                        |
| Created | 201       | `{ "data": ... }`                                                        |
| Deleted | 204       | empty                                                                    |
| List    | 200       | `{ "data": [...], "pagination": { page, pageSize, total, totalPages } }` |
| Error   | 4xx / 5xx | `{ "error": { "code", "message", "fields"? } }`                          |

Invalid input:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input.",
    "fields": [
      { "path": "cleanBpm", "message": "Too small: expected number to be >=20" }
    ]
  }
}
```

`path` is dot-separated (`items.0.bpm`) and empty for the whole value. `fields` appears only on
`VALIDATION_ERROR`.

## Error codes

| Code               | Status | Use for                                              |
| ------------------ | ------ | ---------------------------------------------------- |
| `VALIDATION_ERROR` | 400    | Input fails its schema (thrown by the parse helpers) |
| `BAD_REQUEST`      | 400    | Malformed JSON or another unusable request           |
| `UNAUTHORIZED`     | 401    | No valid session                                     |
| `FORBIDDEN`        | 403    | Signed in but not allowed                            |
| `NOT_FOUND`        | 404    | Missing resource, or one the user does not own       |
| `CONFLICT`         | 409    | Duplicates, for example a scale tracked twice        |
| `INTERNAL_ERROR`   | 500    | Anything unexpected. The message is always generic   |

Return `404` rather than `403` for another user's data, so ids cannot be probed.

Unexpected errors are logged with their stack and answered with
`{ "error": { "code": "INTERNAL_ERROR", "message": "Internal server error." } }`. Never put
internal details in an `ApiError` message.

## Pagination

`paginationQuerySchema` accepts `page` (from 1, default 1) and `pageSize` (1 to 100, default 20).
Extend it for filters, apply `toSkipTake` to the query and answer with `paginated(items, query,
total)`. Always use a stable `orderBy` so pages do not shift.

## Logging

Import `logger` from `@/server/logger`. It writes one JSON object per line with `time`, `level`
and `message` plus your fields, for example `logger.info("Session created", { sessionId })`.
Use `logger.child({ ... })` to add shared fields. Errors passed as fields are serialized with their
stack. Output is silent under test. Do not log passwords, tokens or full request bodies.

## Testing

- Unit-test helpers and handlers with `// @vitest-environment node`. Call the exported handler with
  a `new Request(...)` and assert on status and JSON body.
- Integration tests for endpoints (E2-07 and E2-08) must cover validation errors, ownership and
  conflicts.
