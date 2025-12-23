import assert from "node:assert/strict";
import { test } from "node:test";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const SECRET = "test-secret";

test("jwt.sign includes jwtid claim when provided", () => {
  const jti = "test-jti-123";
  const token = jwt.sign({ id: 1 }, SECRET, { jwtid: jti, expiresIn: "1d" });
  const decoded = jwt.verify(token, SECRET);
  assert.equal(decoded.jti, jti);
  assert.ok(decoded.exp > decoded.iat);
});

// Validate raw token fallback hashing (used for older tokens without jti)
test("raw token fallback identifier hashing", () => {
  const token = jwt.sign({ id: 2 }, SECRET, { expiresIn: "1d" });
  // Simulate server-side raw token hashing
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  assert.equal(typeof hash, "string");
  assert.equal(hash.length, 64);
});
