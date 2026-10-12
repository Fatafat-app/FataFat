'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../src/config/env');
const { masterService, Cuisine, DietaryType, CancellationReason } = require('../src/modules/masters');
const Restaurant = require('../src/modules/restaurants/restaurant.model');
const MenuItem = require('../src/modules/menu/menuItem.model');
const FeeConfig = require('../src/modules/admin/feeConfig.model');

async function runTests() {
  console.log('🧪 Starting Master Data System Tests...');
  await mongoose.connect(env.db.uri);
  console.log('✓ Connected to MongoDB.\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Test Cuisine List (Public)
    console.log('[Test Suite 1: Public Read APIs]');
    const cuisines = await masterService.list('cuisines', {}, true);
    assert(Array.isArray(cuisines) && cuisines.length > 0, 'Public cuisines returned active items');
    assert(cuisines.every((c) => c.isActive === true), 'All returned public cuisines are active');

    // 2. Test Dietary Types List
    const dietaryTypes = await masterService.list('dietary-types', {}, true);
    assert(Array.isArray(dietaryTypes) && dietaryTypes.length >= 5, 'Public dietary types returned >= 5 items');
    assert(dietaryTypes.some((d) => d.code === 'VEG' && d.isVeg === true), 'VEG dietary type exists with isVeg=true');
    assert(dietaryTypes.some((d) => d.code === 'NON_VEG' && d.isVeg === false), 'NON_VEG dietary type exists with isVeg=false');

    // 3. Test Cancellation Reasons (Role Scoped)
    const customerReasons = await masterService.list('cancellation-reasons', { role: 'customer' }, true);
    assert(customerReasons.length > 0, 'Customer cancellation reasons returned');
    assert(customerReasons.every((r) => r.role === 'customer' || r.role === 'all'), 'All reasons scoped to customer or all');

    // 4. Test Code Uniqueness Constraint
    console.log('\n[Test Suite 2: Code Normalization & Uniqueness]');
    const testCode = 'TEST_CUISINE_' + Date.now();
    const created = await masterService.create('cuisines', {
      name: 'Test Cuisine',
      code: testCode,
      sortOrder: 99,
    });
    assert(created && created.code === testCode, 'Created unique test cuisine record');

    let duplicateCaught = false;
    try {
      await masterService.create('cuisines', {
        name: 'Duplicate Cuisine',
        code: testCode,
      });
    } catch (err) {
      duplicateCaught = err.code === 'CODE_ALREADY_EXISTS' || err.message.includes('already exists');
    }
    assert(duplicateCaught, 'Prevented creation of duplicate business code');

    // 5. Test Soft Status Toggle & Update
    console.log('\n[Test Suite 3: Admin Operations & Mutations]');
    const updated = await masterService.update('cuisines', created._id, {
      name: 'Test Cuisine Renamed',
      isActive: false,
    });
    assert(updated.name === 'Test Cuisine Renamed' && updated.isActive === false, 'Updated master display name & set isActive=false');

    const publicAfterDeactivate = await masterService.list('cuisines', {}, true);
    assert(!publicAfterDeactivate.some((c) => c.code === testCode), 'Deactivated master excluded from public list');

    // Clean up test record
    await masterService.delete('cuisines', created._id);
    assert(true, 'Cleaned up test master record');

    // 6. Test Restaurant cuisineIds & dual-sync
    console.log('\n[Test Suite 4: Referential Integrity & Dual-Sync]');
    const sampleRestaurant = await Restaurant.findOne();
    if (sampleRestaurant) {
      assert(Array.isArray(sampleRestaurant.cuisineIds) && sampleRestaurant.cuisineIds.length > 0, 'Restaurant has cuisineIds ObjectId references');
      assert(Array.isArray(sampleRestaurant.cuisines) && sampleRestaurant.cuisines.length > 0, 'Restaurant preserves cuisines string array for dual-read compatibility');
    }

    // 7. Test MenuItem dietaryTypeId
    const sampleItem = await MenuItem.findOne();
    if (sampleItem) {
      assert(Boolean(sampleItem.dietaryTypeId), 'MenuItem has dietaryTypeId ObjectId reference');
      assert(typeof sampleItem.isVeg === 'boolean', 'MenuItem preserves legacy isVeg boolean');
    }

    // 8. Test Dynamic FeeConfig Lookup
    console.log('\n[Test Suite 5: Operational Fee Configuration]');
    const feeCfg = await FeeConfig.findOne({ key: 'GLOBAL_FEES' });
    assert(Boolean(feeCfg), 'Global FeeConfig exists in database');
    assert(typeof feeCfg.baseDeliveryFee === 'number' && typeof feeCfg.packagingFee === 'number', 'FeeConfig contains valid numeric amounts');

    console.log('\n==============================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('==============================================\n');
  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
