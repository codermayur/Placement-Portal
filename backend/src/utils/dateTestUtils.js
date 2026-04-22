/**
 * Date Logic Test & Debugging Utility
 * Run this to verify opportunity expiration logic is working correctly
 */

const { getTodayStart, normalizeDateToStartOfDay, getStatusFromLastDate } = require("./dateUtils");

console.log("\n========== DATE LOGIC VERIFICATION ==========\n");

// Test 1: Today's date should be ACTIVE
const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
console.log(`TEST 1: Past date (today - 1 day)`);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
const statusYesterday = getStatusFromLastDate(yesterday);
console.log(`  Input: ${yesterdayStr}`);
console.log(`  Expected: archived`);
console.log(`  Actual: ${statusYesterday}`);
console.log(`  Result: ${statusYesterday === "archived" ? "✓ PASS" : "✗ FAIL"}\n`);

// Test 2: Today should be ACTIVE
console.log(`TEST 2: Today's date`);
const statusToday = getStatusFromLastDate(today);
console.log(`  Input: ${todayStr}`);
console.log(`  Expected: active`);
console.log(`  Actual: ${statusToday}`);
console.log(`  Result: ${statusToday === "active" ? "✓ PASS" : "✗ FAIL"}\n`);

// Test 3: Tomorrow should be ACTIVE
console.log(`TEST 3: Future date (today + 1 day)`);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
const statusTomorrow = getStatusFromLastDate(tomorrow);
console.log(`  Input: ${tomorrowStr}`);
console.log(`  Expected: active`);
console.log(`  Actual: ${statusTomorrow}`);
console.log(`  Result: ${statusTomorrow === "active" ? "✓ PASS" : "✗ FAIL"}\n`);

// Test 4: Far future should be ACTIVE
console.log(`TEST 4: Far future date (today + 60 days)`);
const farFuture = new Date(today);
farFuture.setDate(farFuture.getDate() + 60);
const farFutureStr = `${farFuture.getFullYear()}-${String(farFuture.getMonth() + 1).padStart(2, "0")}-${String(farFuture.getDate()).padStart(2, "0")}`;
const statusFarFuture = getStatusFromLastDate(farFuture);
console.log(`  Input: ${farFutureStr}`);
console.log(`  Expected: active`);
console.log(`  Actual: ${statusFarFuture}`);
console.log(`  Result: ${statusFarFuture === "active" ? "✓ PASS" : "✗ FAIL"}\n`);

// Test 5: String parsing
console.log(`TEST 5: String format parsing (${todayStr})`);
const normalized = normalizeDateToStartOfDay(todayStr);
console.log(`  Input type: string`);
console.log(`  Normalized: ${normalized.toISOString().split("T")[0]}`);
console.log(`  Has time 00:00:00: ${normalized.getHours() === 0 && normalized.getMinutes() === 0 && normalized.getSeconds() === 0 ? "✓ PASS" : "✗ FAIL"}\n`);

// Test 6: Null/undefined handling
console.log(`TEST 6: Null/undefined handling`);
const statusNull = getStatusFromLastDate(null);
const statusUndef = getStatusFromLastDate(undefined);
console.log(`  null → active: ${statusNull === "active" ? "✓ PASS" : "✗ FAIL"}`);
console.log(`  undefined → active: ${statusUndef === "active" ? "✓ PASS" : "✗ FAIL"}\n`);

console.log("========== VERIFICATION COMPLETE ==========\n");
