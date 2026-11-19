'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('tariffs', [
      { service_type: 'local', base_price: 17.90, price_per_kg: 3.40, price_per_package: 3.25, currency: 'BRL', is_demo: true, is_active: true, created_at: now, updated_at: now },
      { service_type: 'national', base_price: 29.90, price_per_kg: 4.60, price_per_package: 3.25, currency: 'BRL', is_demo: true, is_active: true, created_at: now, updated_at: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('tariffs', {
      service_type: 'local', base_price: 17.90, price_per_kg: 3.40, price_per_package: 3.25, is_demo: true
    });
    await queryInterface.bulkDelete('tariffs', {
      service_type: 'national', base_price: 29.90, price_per_kg: 4.60, price_per_package: 3.25, is_demo: true
    });
  }
};
