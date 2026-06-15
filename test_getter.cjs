const { encrypt, decrypt } = require("./server/src/utils/encryption.js");
const mongoose = require("mongoose");
require("dotenv").config({ path: "server/.env" });

// --- Encryption helpers for schema ---
function encryptField(val) {
  if (!val || typeof val !== "string") return val;
  try {
    return encrypt(val);
  } catch (err) {
    console.error(`[encryption] failed to encrypt field:`, err.message);
    throw err;
  }
}

function decryptField(val) {
  if (!val || typeof val !== "string") return val;
  try {
    return decrypt(val);
  } catch (err) {
    console.error(`[encryption] failed to decrypt field:`, err.message);
    return val; // return raw on decrypt fail — don't crash read
  }
}

// --- Schema with real encrypt/decrypt ---
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      set: (val) => encryptField(val),
      get: (val) => decryptField(val),
    },
    email: {
      type: String,
      set: (val) => encryptField(val),
      get: (val) => decryptField(val),
    },
  },
  {
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

const TestUser = mongoose.model("TestUser", userSchema);

// --- Assertions ---
function assert(condition, label) {
  if (!condition) {
    console.error(`[FAIL] ${label}`);
    process.exit(1);
  }
  console.log(`[PASS] ${label}`);
}

async function runTests() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("[db] connected");

  // 1. Encrypt on save
  const u = new TestUser({ name: "Alice", email: "alice@example.com" });
  await u.save();

  // 2. Raw DB value should be encrypted (not plaintext)
  const raw = await TestUser.findById(u._id).lean();
  assert(raw.name !== "Alice", "name encrypted at rest");
  assert(raw.email !== "alice@example.com", "email encrypted at rest");
  console.log("[raw] encrypted name:", raw.name);
  console.log("[raw] encrypted email:", raw.email);

  // 3. Getter decrypts correctly
  const fromDb = await TestUser.findById(u._id);
  assert(fromDb.name === "Alice", "name decrypted via getter");
  assert(fromDb.email === "alice@example.com", "email decrypted via getter");

  // 4. toJSON decrypts
  const json = fromDb.toJSON();
  assert(json.name === "Alice", "name decrypted in toJSON");

  // 5. Update re-encrypts
  await TestUser.findByIdAndUpdate(u._id, { name: "Bob" });
  const updated = await TestUser.findById(u._id);
  assert(updated.name === "Bob", "updated name decrypts correctly");
  const updatedRaw = await TestUser.findById(u._id).lean();
  assert(updatedRaw.name !== "Bob", "updated name re-encrypted at rest");

  // 6. Null/undefined safe
  const u2 = new TestUser({ name: null });
  await u2.save();
  const nullUser = await TestUser.findById(u2._id);
  assert(nullUser.name === null || nullUser.name === undefined, "null name handled safely");

  // Cleanup
  await TestUser.deleteMany({});
  console.log("[cleanup] test docs removed");

  await mongoose.disconnect();
  console.log("[done] all tests passed");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("[error]", err.message);
  process.exit(1);
});