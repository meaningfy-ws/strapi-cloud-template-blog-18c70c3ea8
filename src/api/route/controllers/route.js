'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { fetchSuggestions } = require('../utils/geocode');

module.exports = createCoreController('api::route.route', () => ({
  async suggestCities(ctx) {
    const q = (ctx.query.q ?? '').trim();
    if (q.length < 2) {
      return ctx.send({ suggestions: [] });
    }

    try {
      const suggestions = await fetchSuggestions(q);
      ctx.send({ suggestions });
    } catch (err) {
      strapi.log.warn('[route/suggestCities] Geocode lookup failed:', err.message);
      ctx.send({ suggestions: [] });
    }
  },
}));
