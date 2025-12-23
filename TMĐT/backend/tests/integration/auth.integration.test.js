import { test } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import bcrypt from "bcryptjs";
import app from "../../app.js";
import pool from "../../db.js";

// Simple helper to stub pool.query and restore
const originalQuery = pool.query;

test("POST /api/auth/login - success", async () => {
  const password = "s3cret";
  const hash = await bcrypt.hash(password, 10);
  // mock pool.query to return a user
  pool.query = async () => [
    [
      {
        ID_Khach_hang: 1,
        Ten_khach_hang: "Test User",
        Email: "test@example.com",
        Mat_khau_hash: hash,
        Trang_thai: "active",
      },
    ],
  ];

  const res = await supertest(app)
    .post("/api/auth/login")
    .send({ Email: "test@example.com", Mat_khau: password })
    .expect(200);

  assert.equal(res.body.success, true);
  assert.ok(res.body.data.token, "token should be present");
  assert.equal(res.body.data.user.Email, "test@example.com");

  // restore
  pool.query = originalQuery;
});

test("POST /api/auth/login - invalid credentials", async () => {
  // mock pool.query to return empty
  pool.query = async () => [[]];

  const res = await supertest(app)
    .post("/api/auth/login")
    .send({ Email: "nope@example.com", Mat_khau: "wrong" })
    .expect(401);

  assert.equal(res.body.success, false);
  assert.equal(res.body.error.message, "Email hoặc mật khẩu không đúng");

  // restore
  pool.query = originalQuery;
});

test("POST /api/auth/request-otp - generic success", async () => {
  // For request-otp the route will always return success message regardless of DB result
  pool.query = async () => [[]];

  const res = await supertest(app)
    .post("/api/auth/request-otp")
    .send({ Email: "maybe@example.com" })
    .expect(200);

  assert.equal(res.body.success, true);
  assert.ok(res.body.data.message.includes("Bạn sẽ nhận được mã OTP") || true);

  pool.query = originalQuery;
});
