import mongoose, { Schema } from "mongoose";
import {
  crewRoles,
  equipmentOptions,
  eventTypes,
  performerTypes,
  planningServices,
} from "@event-manager/shared";

const options = { _id: false };
const requirementSchema = new Schema(
  {
    event: {
      type: new Schema(
        {
          name: { type: String, required: true, trim: true, maxlength: 120 },
          type: { type: String, enum: eventTypes, required: true },
          startDate: { type: String, required: true },
          endDate: { type: String, required: true },
          location: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
          },
          venue: { type: String, trim: true, maxlength: 160, default: "" },
        },
        options,
      ),
      required: true,
    },
    budget: {
      type: new Schema(
        {
          min: { type: Number, required: true, min: 0 },
          max: { type: Number, required: true, min: 1 },
          currency: { type: String, enum: ["INR"], default: "INR" },
        },
        options,
      ),
      required: true,
    },
    notes: { type: String, maxlength: 2000, default: "" },
    requestId: { type: String, required: true, unique: true, select: false },
    payloadHash: { type: String, required: true, select: false },
  },
  {
    timestamps: true,
    discriminatorKey: "category",
    collection: "requirements",
  },
);

requirementSchema.index({ category: 1, createdAt: -1 });
export const Requirement = mongoose.model("Requirement", requirementSchema);

export const requirementModels = {
  planner: Requirement.discriminator(
    "planner",
    new Schema({
      details: {
        type: new Schema(
          {
            services: {
              type: [String],
              enum: planningServices,
              required: true,
            },
            guestCount: { type: Number, required: true, min: 1, max: 100000 },
          },
          options,
        ),
        required: true,
      },
    }),
  ),
  performer: Requirement.discriminator(
    "performer",
    new Schema({
      details: {
        type: new Schema(
          {
            performerType: {
              type: String,
              enum: performerTypes,
              required: true,
            },
            performerCount: { type: Number, required: true, min: 1, max: 500 },
            durationMinutes: {
              type: Number,
              required: true,
              min: 1,
              max: 1440,
            },
            equipment: { type: String, enum: equipmentOptions, required: true },
          },
          options,
        ),
        required: true,
      },
    }),
  ),
  crew: Requirement.discriminator(
    "crew",
    new Schema({
      details: {
        type: new Schema(
          {
            roles: {
              type: [
                new Schema(
                  {
                    role: { type: String, enum: crewRoles, required: true },
                    count: { type: Number, required: true, min: 1, max: 1000 },
                  },
                  options,
                ),
              ],
              required: true,
            },
            shiftHours: { type: Number, required: true, min: 1, max: 24 },
          },
          options,
        ),
        required: true,
      },
    }),
  ),
};
