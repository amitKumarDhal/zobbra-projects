/**
 * Superseded by scripts/reset-dev-data.ts.
 *
 * This script used to delete every customer, quote and order with no environment
 * or database checks at all, so it could have wiped a non-local database. It now
 * delegates to the guarded reset (local DB + NODE_ENV=development +
 * DEV_RESET_CONFIRM=RESET_ZOBBRA_DEV required).
 */
import './reset-dev-data.js';
