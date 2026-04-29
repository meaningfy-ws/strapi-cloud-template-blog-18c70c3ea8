'use strict';

const { errors } = require('@strapi/utils');

// Allows: +352 621 123 456, +37369123456, 0040721123456, 00352 621 123 456
const PHONE_RE = /^(\+|00)[0-9 ]{7,20}$/;

// Fallback used when strapi is unavailable (unit-test env).
const FALLBACK_CHANNELS = new Set(['phone', 'whatsapp', 'viber']);

async function loadValidChannelSlugs() {
  if (typeof strapi === 'undefined') return null;
  try {
    const records = await strapi
      .documents('api::contact-channel.contact-channel')
      .findMany({ fields: ['slug'] });
    return new Set(records.map((r) => r.slug));
  } catch {
    return null;
  }
}

async function validateContactChannels(contactChannels) {
  if (!contactChannels) return;

  if (!Array.isArray(contactChannels)) {
    throw new errors.ValidationError(
      'contactChannels: must be an array of { number, channels } objects'
    );
  }

  contactChannels.forEach((entry, index) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      throw new errors.ValidationError(
        `contactChannels[${index}]: must be an object with "number" and "channels"`
      );
    }

    const { number, channels } = entry;

    if (typeof number !== 'string' || !PHONE_RE.test(number.trim())) {
      throw new errors.ValidationError(
        `contactChannels[${index}].number: "${number}" is invalid — must start with + or 00 followed by digits (spaces allowed), e.g. +352 621 123 456`
      );
    }

    if (!Array.isArray(channels) || channels.length === 0) {
      throw new errors.ValidationError(
        `contactChannels[${index}].channels: must be a non-empty array of channel slugs`
      );
    }
  });

  const validSlugs = (await loadValidChannelSlugs()) ?? FALLBACK_CHANNELS;

  contactChannels.forEach((entry, index) => {
    entry.channels.forEach((ch, ci) => {
      if (!validSlugs.has(ch)) {
        throw new errors.ValidationError(
          `contactChannels[${index}].channels[${ci}]: "${ch}" is not a registered contact channel`
        );
      }
    });
  });
}

module.exports = {
  async beforeCreate(event) {
    await validateContactChannels(event.params.data.contactChannels);
  },
  async beforeUpdate(event) {
    await validateContactChannels(event.params.data.contactChannels);
  },
};
