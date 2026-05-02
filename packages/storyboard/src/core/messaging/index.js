/**
 * Messaging Bus — Public API
 *
 * Re-exports the core bus API, schema utilities, and storage adapter.
 */

// Core bus
export {
  initBus,
  resetBus,
  getAdapter,
  publish,
  subscribe,
  subscribeAll,
  read,
  readMulti,
  registerEventNamespace,
} from './bus.js'

// Schema
export {
  generateId,
  validateEnvelope,
  createEnvelope,
  STATUS,
} from './schema.js'

// Storage
export { JsonlAdapter } from './storage/jsonl-adapter.js'

// Routes
export { createMessagingRoutes, closeAllSseConnections } from './routes.js'

// TOON
export { negotiateFormat, serializeResponse, parseRequestBody } from './toon.js'
