'use strict';

const { errors } = require('@strapi/utils');

// Allows: +352 621 123 456, +37369123456, 0040721123456, 00352 621 123 456
const PHONE_RE = /^(\+|00)[0-9 ]{7,20}$/;

const MAX_NAME = 200;
const MAX_CITY = 120;
const MAX_CITIES = 10;
const MAX_CONSENT_VERSION = 64;
// 24h window: tolerates client/server clock skew and forms left open a long
// time before submit. Was 1h, which caused intermittent 400s on valid payloads.
// The not-in-the-future guard below is intentionally kept.
const CONSENT_BACKDATE_MS = 24 * 60 * 60 * 1000;

function validateWhatsapp(whatsapp) {
  if (whatsapp && !PHONE_RE.test(whatsapp.trim())) {
    throw new errors.ValidationError(
      'whatsapp: must start with + or 00 followed by digits (spaces allowed), e.g. +352 621 123 456'
    );
  }
}

function validateName(name) {
  if (name === undefined || name === null) return;
  if (typeof name !== 'string') {
    throw new errors.ValidationError('name: must be a string');
  }
  if (name.trim().length === 0 || name.length > MAX_NAME) {
    throw new errors.ValidationError(`name: must be 1..${MAX_NAME} chars`);
  }
}

function validateCities(cities) {
  if (cities === undefined || cities === null) return;
  if (!Array.isArray(cities)) {
    throw new errors.ValidationError('cities: must be a JSON array of strings');
  }
  if (cities.length < 1 || cities.length > MAX_CITIES) {
    throw new errors.ValidationError(
      `cities: must contain 1..${MAX_CITIES} entries`
    );
  }
  for (const c of cities) {
    if (typeof c !== 'string' || c.trim().length === 0 || c.length > MAX_CITY) {
      throw new errors.ValidationError(
        `cities: each entry must be a non-empty string ≤ ${MAX_CITY} chars`
      );
    }
  }
}

function validateConsent(data) {
  if (data.gdprConsent !== true) {
    throw new errors.ValidationError(
      'gdprConsent: must be true — explicit consent required'
    );
  }
  const at = data.gdprConsentAt ? new Date(data.gdprConsentAt) : null;
  if (!at || Number.isNaN(at.getTime())) {
    throw new errors.ValidationError('gdprConsentAt: must be a valid ISO datetime');
  }
  const now = Date.now();
  if (at.getTime() > now) {
    throw new errors.ValidationError('gdprConsentAt: cannot be in the future');
  }
  if (at.getTime() < now - CONSENT_BACKDATE_MS) {
    throw new errors.ValidationError('gdprConsentAt: too old (max 1 hour back)');
  }
  const v = data.gdprConsentVersion;
  if (typeof v !== 'string' || v.trim().length === 0 || v.length > MAX_CONSENT_VERSION) {
    throw new errors.ValidationError(
      `gdprConsentVersion: must be a non-empty string ≤ ${MAX_CONSENT_VERSION} chars`
    );
  }
}

function rejectConsentMutation(data) {
  if (
    'gdprConsent' in data ||
    'gdprConsentAt' in data ||
    'gdprConsentVersion' in data
  ) {
    throw new errors.ValidationError(
      'gdpr consent fields are immutable after create'
    );
  }
}

module.exports = {
  beforeCreate(event) {
    const { data } = event.params;
    validateName(data.name);
    validateWhatsapp(data.whatsapp);
    validateCities(data.cities);
    validateConsent(data);
  },
  beforeUpdate(event) {
    const { data } = event.params;
    validateName(data.name);
    validateWhatsapp(data.whatsapp);
    validateCities(data.cities);
    rejectConsentMutation(data);
  },
};
