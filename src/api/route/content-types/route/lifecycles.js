'use strict';

const { buildGeoJson } = require('../../utils/geocode');

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    if (!data.citiesText) return;
    const geoJson = await buildGeoJson(data.citiesText);
    if (geoJson) data.geoJson = geoJson;
    else strapi.log.warn('[route/lifecycles] GeoJSON not set — fewer than 2 cities geocoded successfully.');
  },

  async beforeUpdate(event) {
    const { data } = event.params;
    if (!data.citiesText) return;
    const geoJson = await buildGeoJson(data.citiesText);
    if (geoJson) data.geoJson = geoJson;
    else strapi.log.warn('[route/lifecycles] GeoJSON not set — fewer than 2 cities geocoded successfully.');
  },
};
