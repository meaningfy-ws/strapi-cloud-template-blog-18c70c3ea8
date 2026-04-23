'use strict';

/**
 * waitlist-submission controller
 *
 * Public callers only need `create`; `find`/`findOne`/`update`/`delete` are
 * gated by Users & Permissions (see scripts/seed-landing-page.js and the
 * strapi-runbook). The default factory controller is sufficient — no custom
 * logic lives here.
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::waitlist-submission.waitlist-submission');
