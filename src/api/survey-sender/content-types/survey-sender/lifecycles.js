'use strict';

const { errors } = require('@strapi/utils');

const PHONE_RE = /^(\+|00)[0-9 ]{7,20}$/;

function validatePhone(value, fieldName) {
  if (value && !PHONE_RE.test(value.trim())) {
    throw new errors.ValidationError(
      `${fieldName}: must start with + or 00 followed by digits (spaces allowed), e.g. +352 621 123 456`
    );
  }
}

function validatePhoneFields(data) {
  validatePhone(data.whatsapp, 'whatsapp');
  validatePhone(data.callbackPhone, 'callbackPhone');
}

module.exports = {
  beforeCreate(event) {
    validatePhoneFields(event.params.data);
  },
  beforeUpdate(event) {
    validatePhoneFields(event.params.data);
  },
};
