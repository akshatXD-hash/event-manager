import { createHash } from "node:crypto";
import { Router } from "express";
import { requirementSchema } from "@event-manager/shared";
import { Requirement, requirementModels } from "../models/requirement.js";

export const requirementsRouter = Router();

requirementsRouter.post("/", async (req, res) => {
  const requestId = req.get("Idempotency-Key");
  if (
    !requestId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      requestId,
    )
  ) {
    res
      .status(400)
      .json({ message: "A valid UUID v4 Idempotency-Key header is required." });
    return;
  }

  const result = requirementSchema.safeParse(req.body);
  if (!result.success) {
    res
      .status(422)
      .json({
        message: "Please check the highlighted fields.",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    return;
  }

  const payloadHash = createHash("sha256")
    .update(JSON.stringify(result.data))
    .digest("hex");
  const model = requirementModels[result.data.category];
  try {
    const requirement = new model({ ...result.data, requestId, payloadHash });
    await requirement.save();
    res
      .status(201)
      .json({
        message: "Requirement posted successfully.",
        requirement: {
          id: requirement.id,
          category: result.data.category,
          createdAt: requirement.createdAt,
        },
      });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      const existing = await Requirement.findOne({ requestId }).select(
        "+payloadHash",
      );
      if (existing && existing.payloadHash === payloadHash) {
        res
          .status(200)
          .json({
            message: "Requirement already posted.",
            requirement: {
              id: existing.id,
              category: result.data.category,
              createdAt: existing.createdAt,
            },
          });
      } else {
        res
          .status(409)
          .json({
            message:
              "This submission key was used for different details. Start a new submission.",
          });
      }
      return;
    }
    throw error;
  }
});
