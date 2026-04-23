'use strict';

/**
 * waitlist-submission service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::waitlist-submission.waitlist-submission');
