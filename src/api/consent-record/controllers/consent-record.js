'use strict';

/**
 * consent-record controller
 *
 * Only `create` is exposed in practice — the frontend route handler
 * (`app/api/consent/route.ts`) is the sole authorised caller, using
 * STRAPI_API_TOKEN. Public role has no permissions on this resource.
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::consent-record.consent-record');
