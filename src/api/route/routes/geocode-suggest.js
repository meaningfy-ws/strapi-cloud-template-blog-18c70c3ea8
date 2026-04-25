'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/routes/geocode-suggest',
      handler: 'route.suggestCities',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
