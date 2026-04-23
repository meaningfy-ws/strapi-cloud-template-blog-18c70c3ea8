'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::survey-sender.survey-sender');
