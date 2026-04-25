'use strict';

const { errors } = require('@strapi/utils');

// Allows: +352 621 123 456, +37369123456, 0040721123456, 00352 621 123 456
const PHONE_RE = /^(\+|00)[0-9 ]{7,20}$/;

function validateWhatsapp(whatsapp) {
  if (whatsapp && !PHONE_RE.test(whatsapp.trim())) {
    throw new errors.ValidationError(
      'whatsapp: must start with + or 00 followed by digits (spaces allowed), e.g. +352 621 123 456'
    );
  }
}

module.exports = {
  beforeCreate(event) {
    validateWhatsapp(event.params.data.whatsapp);
  },
  beforeUpdate(event) {
    validateWhatsapp(event.params.data.whatsapp);
  },
};
