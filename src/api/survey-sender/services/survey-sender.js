'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::survey-sender.survey-sender');
