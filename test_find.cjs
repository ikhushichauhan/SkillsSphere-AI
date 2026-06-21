require("dotenv").config({ path: "server/.env" });
const mongoose = require("mongoose");
const { encryptDeterministic } = require("./server/src/utils/encryption.js");

// --- Helpers ---
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (!condition) { console.error(`[FAIL] ${label}`); failed++; }
  else { console.log(`[PASS] ${label}`); passed++; }
}

function assertThrows(fn, label) {
  try { fn(); assert(false, label); }
  catch { assert(true, label); }
}

function normalizeEmail(email) {
  if (!email || typeof email !== "string") throw new Error("invalid email input");
  return email.toLowerCase().trim();
}

async function findByEncryptedEmail(collection, email) {
  const encrypted = encryptDeterministic(normalizeEmail(email));
  return collection.findOne({ email: encrypted });
}

async function runTests() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("[db] connected");

  const users = mongoose.connection.collection("users");

  // 1. Deterministic — same input = same ciphertext
  const enc1 = encryptDeterministic(normalizeEmail("testauth4@gmail.com"));
  const enc2 = encryptDeterministic(normalizeEmail("testauth4@gmail.com"));
  assert(enc1 === enc2, "deterministic: same input = same ciphertext");

  // 2. Different emails = different ciphertext
  const enc3 = encryptDeterministic(normalizeEmail("other@gmail.com"));
  assert(enc1 !== enc3, "deterministic: different input = different ciphertext");

  // 3. Case normalization
  const encLower = encryptDeterministic(normalizeEmail("TestAuth4@Gmail.com"));
  assert(encLower === enc1, "normalization: uppercase matches lowercase encrypted");

  // 4. Whitespace trimming
  const encTrimmed = encryptDeterministic(normalizeEmail("  testauth4@gmail.com  "));
  assert(encTrimmed === enc1, "normalization: whitespace trimmed before encrypt");

  // 5. Plaintext not in ciphertext
  assert(!enc1.includes("testauth4@gmail.com"), "plaintext not in ciphertext");

  // 6. Ciphertext is non-empty string
  assert(typeof enc1 === "string" && enc1.length > 0, "ciphertext is non-empty string");

  // 7. Bulk determinism — 10 calls same output
  const bulkResults = Array.from({ length: 10 }, () =>
    encryptDeterministic(normalizeEmail("testauth4@gmail.com"))
  );
  const allSame = bulkResults.every(r => r === enc1);
  assert(allSame, "bulk determinism: 10 calls all produce same ciphertext");

  // 8. Domain variation — same user different domain = different ciphertext
  const encGmail = encryptDeterministic(normalizeEmail("testauth4@gmail.com"));
  const encOutlook = encryptDeterministic(normalizeEmail("testauth4@outlook.com"));
  assert(encGmail !== encOutlook, "domain variation: same local part different domain differs");

  // 9. Subdomain variation
  const encSub = encryptDeterministic(normalizeEmail("testauth4@mail.gmail.com"));
  assert(encSub !== encGmail, "subdomain variation: differs from root domain");

  // 10. Query DB with encrypted email
  const rawUser = await findByEncryptedEmail(users, "testauth4@gmail.com");
  console.log(`[debug] user found in DB: ${!!rawUser}`);
  assert(rawUser !== null, "DB query: user found by encrypted email");

  // 11. Wrong email returns null
  const wrongUser = await findByEncryptedEmail(users, "nonexistent@gmail.com");
  assert(wrongUser === null, "DB query: wrong email returns null");

  // 12. Plaintext NOT findable in DB
  const plainUser = await users.findOne({ email: "testauth4@gmail.com" });
  assert(plainUser === null, "DB at-rest: plaintext email not stored");

  // 13. Case variant NOT findable with raw query
  const caseUser = await users.findOne({ email: "TestAuth4@Gmail.com" });
  assert(caseUser === null, "DB at-rest: mixed-case plaintext not stored");

  // 14. No collision between users
  const encA = encryptDeterministic(normalizeEmail("usera@gmail.com"));
  const encB = encryptDeterministic(normalizeEmail("userb@gmail.com"));
  assert(encA !== encB, "no collision: different users encrypt differently");

  // 15. 50-user no-collision stress test
  const emails = Array.from({ length: 50 }, (_, i) => `user${i}@gmail.com`);
  const encryptedEmails = emails.map(e => encryptDeterministic(normalizeEmail(e)));
  const uniqueCount = new Set(encryptedEmails).size;
  assert(uniqueCount === 50, `no collision: 50 unique users all encrypt differently (got ${uniqueCount} unique)`);

  // 16-19. Type safety via assertThrows
  assertThrows(() => normalizeEmail(""), "empty string throws");
  assertThrows(() => normalizeEmail(null), "null throws");
  assertThrows(() => normalizeEmail(12345), "number throws");
  assertThrows(() => normalizeEmail({}), "object throws");
  assertThrows(() => normalizeEmail([]), "array throws");
  assertThrows(() => normalizeEmail(undefined), "undefined throws");

  await mongoose.disconnect();

  console.log(`\n[done] ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTests().catch((err) => {
  console.error("[error]", err.message);
  process.exit(1);
});