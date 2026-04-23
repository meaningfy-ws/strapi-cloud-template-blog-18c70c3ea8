'use strict';

const { errors } = require('@strapi/utils');

// Allows: +352 621 123 456, +37369123456, 0040721123456, 00352 621 123 456
const PHONE_RE = /^(\+|00)[0-9 ]{7,20}$/;

function validatePhoneNumbers(phoneNumbers) {
  if (!phoneNumbers) return;

  if (!Array.isArray(phoneNumbers)) {
    throw new errors.ValidationError(
      'phoneNumbers: must be an array of phone number strings'
    );
  }

  phoneNumbers.forEach((number, index) => {
    if (typeof number !== 'string' || !PHONE_RE.test(number.trim())) {
      throw new errors.ValidationError(
        `phoneNumbers[${index}]: "${number}" is invalid — must start with + or 00 followed by digits (spaces allowed), e.g. +352 621 123 456`
      );
    }
  });
}

module.exports = {
  beforeCreate(event) {
    validatePhoneNumbers(event.params.data.phoneNumbers);
  },
  beforeUpdate(event) {
    validatePhoneNumbers(event.params.data.phoneNumbers);
  },
};
