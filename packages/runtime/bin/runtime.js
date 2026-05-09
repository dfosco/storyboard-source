#!/usr/bin/env node
import { startDaemon } from '../dist/server/main.js'

startDaemon().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[storyboard-runtime] fatal:', err)
  process.exit(1)
})
