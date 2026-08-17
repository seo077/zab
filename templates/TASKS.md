# TASKS — <NNN>-<slug>

<!--
  APPEND ONLY. When verification fails, add a NEW task and set the original back
  to `blocked` — never rewrite it. Overwriting history is how you lose the answer
  to "why did we do it this way?" (D-016).

  One task = one commit. A session can die at any moment, and commit boundaries
  are the only restore points that survive it.
-->

## T-001 <short imperative title>

- state:    todo | doing | done | blocked
- covers:   REQ-001
- depends:  —
- produces: |
    src/auth/session.ts
      export interface Session { id: string; userId: string; expiresAt: Date }
      export function createSession(userId: string): Promise<Session>
      export function readSession(id: string): Promise<Session | null>
- verify:   npm test -- session

<!--
  `produces` carries function signatures and paths, not prose. It is the ONLY
  thing a later task's subagent knows about this one: without it, the agent
  building T-002 has to guess what createSession() looks like, and it will
  invent something plausible and wrong (D-013).
-->

## T-002 <...>

- state:    todo
- covers:   REQ-002
- depends:  T-001
- produces: |
    <path>
      <signature>
- verify:   <command>
