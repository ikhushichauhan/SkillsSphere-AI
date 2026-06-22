import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { sanitizeString, sanitizeValue } from "../utils/logSanitizer.js";

describe("sanitizeString", () => {
  test("masks email addresses with [MASKED_EMAIL]", () => {
    const result = sanitizeString("Contact me at john.doe@example.com please");
    assert.equal(result, "Contact me at [MASKED_EMAIL] please");
  });

  test("masks multiple email addresses", () => {
    const result = sanitizeString(
      "Email alice@test.com or bob@company.org for details"
    );
    assert.equal(
      result,
      "Email [MASKED_EMAIL] or [MASKED_EMAIL] for details"
    );
  });

  test("masks phone numbers with [MASKED_PHONE]", () => {
    const result = sanitizeString("Call me at 9876543210");
    assert.equal(result, "Call me at [MASKED_PHONE]");
  });

  test("masks phone numbers with dashes", () => {
    const result = sanitizeString("Phone: 555-123-4567");
    assert.equal(result, "Phone: [MASKED_PHONE]");
  });

  test("masks phone numbers with international prefix", () => {
    const result = sanitizeString("Contact +1-555-123-4567");
    assert.equal(result, "Contact [MASKED_PHONE]");
  });

  test("returns non-string input unchanged", () => {
    assert.equal(sanitizeString(null), null);
    assert.equal(sanitizeString(undefined), undefined);
    assert.equal(sanitizeString(42), 42);
  });

  test("handles string with no PII", () => {
    const result = sanitizeString("Just a normal string without any PII");
    assert.equal(result, "Just a normal string without any PII");
  });
});

describe("sanitizeValue", () => {
  test("returns null and undefined unchanged", () => {
    assert.equal(sanitizeValue(null), null);
    assert.equal(sanitizeValue(undefined), undefined);
  });

  test("sanitizes a plain string", () => {
    const result = sanitizeValue("user@domain.com");
    assert.equal(result, "[MASKED_EMAIL]");
  });

  test("sanitizes an array of strings", () => {
    const result = sanitizeValue(["alice@test.com", "bob@company.org"]);
    assert.deepEqual(result, ["[MASKED_EMAIL]", "[MASKED_EMAIL]"]);
  });

  test("sanitizes nested objects recursively", () => {
    const input = {
      user: {
        email: "admin@test.com",
        phone: "555-123-4567",
      },
      role: "admin",
    };
    const result = sanitizeValue(input);
    // email and phone keys are in PII_KEYS so values are masked directly
    assert.equal(result.user.email, "[MASKED_PII]");
    assert.equal(result.user.phone, "[MASKED_PII]");
    assert.equal(result.role, "admin");
  });

  test("masks object keys containing PII keywords with [MASKED_PII]", () => {
    const input = { email: "secret@test.com", password: "supersecret123" };
    const result = sanitizeValue(input);
    assert.equal(result.email, "[MASKED_PII]");
    assert.equal(result.password, "[MASKED_PII]");
  });

  test("masks keys containing token keyword", () => {
    const input = { authToken: "abc123", secretToken: "xyz789" };
    const result = sanitizeValue(input);
    assert.equal(result.authToken, "[MASKED_PII]");
    assert.equal(result.secretToken, "[MASKED_PII]");
  });

  test("masks keys containing name keyword", () => {
    const input = { fullName: "John Doe", firstname: "John" };
    const result = sanitizeValue(input);
    assert.equal(result.fullName, "[MASKED_PII]");
    assert.equal(result.firstname, "[MASKED_PII]");
  });

  test("returns Error objects with sanitized message and stack", () => {
    const err = new Error("Email is invalid: user@test.com");
    const result = sanitizeValue(err);
    assert.equal(result instanceof Error, true);
    assert.equal(result.message, "Email is invalid: [MASKED_EMAIL]");
  });

  test("returns Date objects unchanged", () => {
    const date = new Date("2025-01-01");
    const result = sanitizeValue(date);
    assert.equal(result, date);
  });

  test("returns Buffer objects unchanged", () => {
    const buf = Buffer.from("hello");
    const result = sanitizeValue(buf);
    assert.equal(result, buf);
  });

  test("sanitizes arrays of objects", () => {
    const input = [
      { email: "alice@test.com" },
      { email: "bob@test.com" },
    ];
    const result = sanitizeValue(input);
    assert.equal(result[0].email, "[MASKED_PII]");
    assert.equal(result[1].email, "[MASKED_PII]");
  });

  test("handles deeply nested objects", () => {
    const input = {
      level1: {
        level2: {
          level3: {
            email: "deep@nest.com",
          },
        },
      },
    };
    const result = sanitizeValue(input);
    assert.equal(result.level1.level2.level3.email, "[MASKED_PII]");
  });

  test("case-insensitive key matching for PII keywords", () => {
    const input = { EMAIL: "a@b.com", Password: "secret", TOKEN: "tok123" };
    const result = sanitizeValue(input);
    assert.equal(result.EMAIL, "[MASKED_PII]");
    assert.equal(result.Password, "[MASKED_PII]");
    assert.equal(result.TOKEN, "[MASKED_PII]");
  });
});
