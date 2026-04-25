'use strict';

/**
 * Seed the initial transport-type lookup records and grant Public role read
 * access to all transport collections + the geocode-suggest endpoint.
 * Safe to re-run — records are skipped if their slug already exists,
 * and permissions are skipped if already granted.
 *
 * Usage:
 *   npm run seed:transport-types
 */

const TRANSPORT_TYPE_UID = 'api::transport-type.transport-type';

const INITIAL_TYPES = [
  {
    label: 'Colete & pachete',
    slug: 'colete-pachete',
    description: 'Pachete mici și medii, sub 30 kg',
  },
  {
    label: 'Transport persoane',
    slug: 'transport-persoane',
    description: 'Locuri disponibile în mașină pe rută',
  },
  {
    label: 'Marfă voluminoasă',
    slug: 'marfa-voluminoasa',
    description: 'Mobilă, electrocasnice, mărfuri mari',
  },
  {
    label: 'Automobile',
    slug: 'automobile',
    description: 'Transport autoturisme pe platformă sau conduse',
  },
];

// Public read access for all transport collections + geocode suggest.
// Action IDs follow the Strapi convention: api::<uid>.<uid>.<action>
const PUBLIC_PERMISSIONS = {
  'transport-type': ['find', 'findOne'],
  'route': ['find', 'findOne', 'suggestCities'],
  'transporter': ['find', 'findOne'],
  'route-schedule': ['find', 'findOne'],
};

async function setPublicPermissions(strapi) {
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  if (!publicRole) {
    throw new Error('Public role not found — is users-permissions plugin installed?');
  }

  const toCreate = [];
  for (const [contentType, actions] of Object.entries(PUBLIC_PERMISSIONS)) {
    for (const action of actions) {
      const actionId = `api::${contentType}.${contentType}.${action}`;
      const existing = await strapi.query('plugin::users-permissions.permission').findOne({
        where: { action: actionId, role: publicRole.id },
      });
      if (!existing) {
        toCreate.push(
          strapi.query('plugin::users-permissions.permission').create({
            data: { action: actionId, role: publicRole.id },
          })
        );
        console.log(`  grant    ${actionId}`);
      } else {
        console.log(`  skip     ${actionId} (already granted)`);
      }
    }
  }

  await Promise.all(toCreate);
}

async function seedTransportTypes(strapi) {
  for (const entry of INITIAL_TYPES) {
    const existing = await strapi.documents(TRANSPORT_TYPE_UID).findFirst({
      filters: { slug: entry.slug },
    });

    if (existing) {
      console.log(`  skip     ${entry.slug} (already exists)`);
    } else {
      await strapi.documents(TRANSPORT_TYPE_UID).create({ data: entry });
      console.log(`  created  ${entry.slug}`);
    }
  }
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';

  try {
    console.log('Seeding transport types...');
    await seedTransportTypes(app);

    console.log('Configuring public permissions...');
    await setPublicPermissions(app);

    console.log('Done.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await app.destroy();
  }

  process.exit(process.exitCode || 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
