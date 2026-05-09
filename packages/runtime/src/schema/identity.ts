import { z } from 'zod'

/**
 * A devDomain identifies a Storyboard repo on this machine.
 *
 * The literal default value `"storyboard"` is intentionally *not* allowed by
 * `acquire` (see schema/acquire.ts) — every checkout MUST set its own
 * `devDomain` in `storyboard.config.json`. This is the structural fix for H3
 * in the server-state RCA: two repos can never share a host space.
 *
 * Allowed: lowercase letters, digits, hyphens. Must start with a letter.
 * 1–32 chars. The runtime constructs the public host as `${devDomain}.localhost`.
 */
export const DevDomain = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[a-z][a-z0-9-]*$/, 'devDomain must match /^[a-z][a-z0-9-]*$/')
  .brand<'DevDomain'>()
export type DevDomain = z.infer<typeof DevDomain>

/**
 * A worktree name. `"main"` is reserved for the repo root.
 *
 * Names are URL-safe by construction so we never have to escape them when
 * building branch URLs (`/branch--<name>/...`).
 */
export const WorktreeName = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9._-]*$/i, 'worktree name must be URL-safe')
  .brand<'WorktreeName'>()
export type WorktreeName = z.infer<typeof WorktreeName>

/**
 * A TCP port the runtime has leased to a devserver. The runtime is the sole
 * authority for port allocation; clients never pick their own port.
 */
export const Port = z.number().int().min(1024).max(65535).brand<'Port'>()
export type Port = z.infer<typeof Port>

/**
 * The composite key `(devDomain, worktree)` uniquely identifies a devserver.
 *
 * The runtime guarantees at most one devserver per slot — illegal collisions
 * (e.g. two repos trying to claim `(storyboard, main)`) are rejected with
 * `409 CONFLICT` rather than silently overwriting routes.
 */
export const DevServerSlot = z.object({
  devDomain: DevDomain,
  worktree: WorktreeName,
})
export type DevServerSlot = z.infer<typeof DevServerSlot>

/**
 * Convert a slot to its canonical string key, used for map lookups and
 * logging. Format: `${devDomain}::${worktree}`.
 */
export function slotKey(slot: DevServerSlot): string {
  return `${slot.devDomain}::${slot.worktree}`
}
