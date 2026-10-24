import assert from "node:assert/strict";
import { test } from "node:test";
import type { RequirementInput } from "@event-manager/shared";
import { postRequirement, SubmissionError } from "../src/lib/api";

const payload: RequirementInput = {
  category: "planner",
  event: {
    name: "Team meetup",
    type: "Corporate event",
    startDate: "2026-12-12",
    endDate: "2026-12-12",
    location: "Mumbai",
    venue: "",
  },
  details: { services: ["Full event planning"], guestCount: 50 },
  budget: { min: 10000, max: 20000, currency: "INR" },
  notes: "",
};
const saved = {
  id: "saved-id",
  category: "planner",
  createdAt: "2026-10-24T00:00:00Z",
};

test("allows enough time for a sleeping backend and preserves the submission key", async (context) => {
  let timeout = 0;
  context.mock.method(AbortSignal, "timeout", (milliseconds: number) => {
    timeout = milliseconds;
    return new AbortController().signal;
  });
  context.mock.method(
    globalThis,
    "fetch",
    async (_url: string, options: RequestInit) => {
      assert.equal(
        new Headers(options.headers).get("Idempotency-Key"),
        "same-key",
      );
      assert.deepEqual(JSON.parse(options.body as string), payload);
      return Response.json({ requirement: saved }, { status: 201 });
    },
  );
  assert.deepEqual(await postRequirement(payload, "same-key"), saved);
  assert.equal(timeout, 90000);
});

test("reports a timeout separately from a network failure", async (context) => {
  const controller = new AbortController();
  context.mock.method(AbortSignal, "timeout", () => controller.signal);
  context.mock.method(globalThis, "fetch", async () => {
    controller.abort(new DOMException("Timed out", "TimeoutError"));
    throw controller.signal.reason;
  });
  await assert.rejects(
    postRequirement(payload, "same-key"),
    /taking longer than usual/,
  );
});

test("keeps a useful error when the connection fails", async (context) => {
  context.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(
    postRequirement(payload, "same-key"),
    /couldn't reach the server/,
  );
});

test("handles a hosting error page without claiming success", async (context) => {
  context.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response("<html>Service unavailable</html>", { status: 503 }),
  );
  await assert.rejects(
    postRequirement(payload, "same-key"),
    /temporarily unavailable/,
  );
});

test("preserves server validation errors", async (context) => {
  const errors = [
    { field: "budget.max", message: "Maximum must be at least the minimum" },
  ];
  context.mock.method(globalThis, "fetch", async () =>
    Response.json({ message: "Check your budget", errors }, { status: 422 }),
  );
  await assert.rejects(
    postRequirement(payload, "same-key"),
    (error: unknown) => {
      assert.ok(error instanceof SubmissionError);
      assert.deepEqual(error.fields, errors);
      return true;
    },
  );
});

test("accepts the original receipt when retrying an already-saved submission", async (context) => {
  context.mock.method(globalThis, "fetch", async () =>
    Response.json({ requirement: saved }, { status: 200 }),
  );
  assert.deepEqual(await postRequirement(payload, "same-key"), saved);
});
