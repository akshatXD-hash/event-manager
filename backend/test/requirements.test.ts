import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { Requirement } from "../src/models/requirement.js";

const app = createApp({ rateLimit: 1000 });
let mongo: MongoMemoryServer;
const common = {
  event: {
    name: "Winter celebration",
    type: "Corporate event",
    startDate: "2027-12-12",
    endDate: "2027-12-13",
    location: "Mumbai",
    venue: "Garden Hall",
  },
  budget: { min: 20000, max: 50000, currency: "INR" },
  notes: "An outdoor evening event.",
};
const samples = {
  planner: {
    ...common,
    category: "planner",
    details: { services: ["Full event planning"], guestCount: 200 },
  },
  performer: {
    ...common,
    category: "performer",
    details: {
      performerType: "Live band",
      performerCount: 4,
      durationMinutes: 90,
      equipment: "Provided at venue",
    },
  },
  crew: {
    ...common,
    category: "crew",
    details: {
      roles: [
        { role: "Photography", count: 2 },
        { role: "Hospitality", count: 4 },
      ],
      shiftHours: 8,
    },
  },
};
const post = (body: unknown, key = randomUUID()) =>
  request(app).post("/api/requirements").set("Idempotency-Key", key).send(body);

before(async () => {
  mongo = await MongoMemoryServer.create();
  mongoose.set("bufferCommands", false);
  await mongoose.connect(mongo.getUri(), { dbName: "requirements-test" });
  await Requirement.init();
});
after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

test("health reports a connected database", async () => {
  const response = await request(app).get("/api/health").expect(200);
  assert.equal(response.body.database, "connected");
});

for (const [category, payload] of Object.entries(samples)) {
  test(`saves a ${category} requirement using its Mongoose discriminator`, async () => {
    const response = await post(payload).expect(201);
    assert.equal(response.body.requirement.category, category);
    const saved = await Requirement.findById(
      response.body.requirement.id,
    ).lean();
    assert.ok(saved);
    assert.equal((saved as Record<string, unknown>).category, category);
    assert.deepEqual(
      (saved as Record<string, unknown>).details,
      payload.details,
    );
    assert.equal(saved.event?.name, payload.event.name);
    assert.equal(saved.event?.startDate, "2027-12-12");
    assert.equal(saved.requestId, undefined);
    assert.equal(saved.payloadHash, undefined);
  });
}

test("trims text and accepts a single-day event", async () => {
  const response = await post({
    ...samples.planner,
    event: {
      ...common.event,
      name: "  Birthday lunch  ",
      endDate: common.event.startDate,
    },
  }).expect(201);
  const saved = await Requirement.findById(response.body.requirement.id);
  assert.equal(saved?.event?.name, "Birthday lunch");
});

test("rejects missing event fields without writing a record", async () => {
  const beforeCount = await Requirement.countDocuments();
  const response = await post({ ...samples.planner, event: {} }).expect(422);
  assert.ok(
    response.body.errors.some(
      (error: { field: string }) => error.field === "event.name",
    ),
  );
  assert.equal(await Requirement.countDocuments(), beforeCount);
});

test("rejects an unsupported category and mismatched details", async () => {
  await post({ ...samples.planner, category: "caterer" }).expect(422);
  await post({ ...samples.planner, details: samples.performer.details }).expect(
    422,
  );
  await post({
    ...samples.planner,
    details: { ...samples.planner.details, performerCount: 4 },
  }).expect(422);
});

test("rejects invalid calendar dates and reversed date ranges", async () => {
  for (const [startDate, endDate] of [
    ["2027-02-30", "2027-03-02"],
    ["2027-12-15", "2027-12-12"],
    ["invalid", "invalid"],
  ]) {
    await post({
      ...samples.planner,
      event: { ...common.event, startDate, endDate },
    }).expect(422);
  }
});

test("rejects negative or reversed budgets", async () => {
  for (const budget of [
    { min: -1, max: 50, currency: "INR" },
    { min: 100, max: 50, currency: "INR" },
    { min: 0, max: 0, currency: "INR" },
  ])
    await post({ ...samples.planner, budget }).expect(422);
});

test("rejects missing services, fractional counts, and excessive durations", async () => {
  await post({
    ...samples.planner,
    details: { services: [], guestCount: 100 },
  }).expect(422);
  await post({
    ...samples.performer,
    details: { ...samples.performer.details, performerCount: 1.5 },
  }).expect(422);
  await post({
    ...samples.performer,
    details: { ...samples.performer.details, durationMinutes: 1441 },
  }).expect(422);
});

test("rejects empty, duplicate, or invalid crew roles", async () => {
  for (const roles of [
    [],
    [{ role: "Photography", count: 0 }],
    [
      { role: "Photography", count: 1 },
      { role: "Photography", count: 2 },
    ],
    [{ role: "Unknown", count: 1 }],
  ])
    await post({ ...samples.crew, details: { roles, shiftHours: 8 } }).expect(
      422,
    );
});

test("requires a submission key", async () => {
  await request(app)
    .post("/api/requirements")
    .send(samples.planner)
    .expect(400);
  await post(samples.planner, "invalid").expect(400);
});

test("concurrent retries create one record and return the same ID", async () => {
  const key = randomUUID();
  const count = await Requirement.countDocuments();
  const responses = await Promise.all([
    post(samples.performer, key),
    post(samples.performer, key),
    post(samples.performer, key),
  ]);
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [200, 200, 201],
  );
  assert.equal(
    new Set(responses.map((response) => response.body.requirement.id)).size,
    1,
  );
  assert.equal(await Requirement.countDocuments(), count + 1);
});

test("rejects a reused submission key with different details", async () => {
  const key = randomUUID();
  await post(samples.planner, key).expect(201);
  await post({ ...samples.planner, notes: "Changed" }, key).expect(409);
});

test("returns safe errors for malformed JSON and oversized bodies", async () => {
  await request(app)
    .post("/api/requirements")
    .set("Content-Type", "application/json")
    .send("{broken")
    .expect(400);
  await post({ ...samples.planner, notes: "x".repeat(25000) }).expect(413);
  await post({ ...samples.planner, notes: "x".repeat(2001) }).expect(422);
});

test("allows the frontend origin and preflights the submission header", async () => {
  const response = await request(app)
    .options("/api/requirements")
    .set("Origin", "http://localhost:3000")
    .set("Access-Control-Request-Method", "POST")
    .set("Access-Control-Request-Headers", "content-type,idempotency-key")
    .expect(204);
  assert.equal(
    response.headers["access-control-allow-origin"],
    "http://localhost:3000",
  );
  const other = await request(app)
    .options("/api/requirements")
    .set("Origin", "https://unrelated.example");
  assert.equal(other.headers["access-control-allow-origin"], undefined);
});

test("limits repeated submission attempts", async () => {
  const limited = createApp({ rateLimit: 1 });
  await request(limited).post("/api/requirements").send({}).expect(400);
  const response = await request(limited)
    .post("/api/requirements")
    .send({})
    .expect(429);
  assert.ok(response.body.message.includes("Too many"));
});

test("does not expose stored requirements through a public listing", async () => {
  await request(app).get("/api/requirements").expect(404);
});
