'use strict';

/**
 * Single source of truth for which API actions the waitlist-submission
 * content-type exposes to callers.
 *
 * Context (frontend PR #16): the soft-dedupe pre-check runs an authenticated
 *   GET /api/waitlist-submissions?filters[email][$eqi]=…
 * BEFORE inserting, so the server-side caller needs BOTH `find` and `create`.
 *
 * PII guard: `find` exposes emails + locations. It must only ever be granted
 * to a trusted server identity (Bearer API token / Authenticated role) —
 * NEVER to the public role. Keep WAITLIST_PUBLIC_ACTIONS create-only.
 */

const UID = 'api::waitlist-submission.waitlist-submission';

const action = (name) => `${UID}.${name}`;

// Granted to the trusted server identity used by the frontend.
const WAITLIST_SERVER_ACTIONS = [action('create'), action('find')];

// The most an anonymous/public caller may ever have. Never add `find`.
const WAITLIST_PUBLIC_ACTIONS = [action('create')];

/**
 * Idempotency helper: given the actions a role already has and the desired
 * set, return only the ones still missing. Lets bootstrap re-run safely on
 * every start without creating duplicate permission rows.
 */
function missingActions(existingActions, desiredActions) {
  const have = new Set(existingActions);
  return desiredActions.filter((a) => !have.has(a));
}

module.exports = {
  UID,
  WAITLIST_SERVER_ACTIONS,
  WAITLIST_PUBLIC_ACTIONS,
  missingActions,
};
