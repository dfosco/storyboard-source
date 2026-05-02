/**
 * Messaging Bus — Public API
 *
 * Re-exports the core bus API, schema utilities, storage adapter,
 * presence registry, and delivery bridge.
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

// Presence
export {
  initPresence,
  rehydratePresence,
  joinPresence,
  getPresent,
  isPresent,
  getAllPresent,
  resetPresence,
  HEARTBEAT_INTERVAL,
  EXPIRY_TTL,
} from './presence.js'

// Delivery Bridge
export {
  initDeliveryBridge,
  bindWidget,
  unbindWidget,
  rebindWidget,
  terminalChannel,
  isBound,
  getBindings,
  resetDeliveryBridge,
} from './delivery.js'
